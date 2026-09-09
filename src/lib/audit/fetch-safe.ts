import dns from "dns";
import { URL } from "url";

// Shared SSRF-safe fetching for the audit pipeline.
// Single source of truth: the audit API route and the crawler both import
// from here so every fetch (including crawler-discovered pages) passes the
// same string + DNS-resolution checks, on every redirect hop.

export const REDIRECT_MAX_HOPS = 5;

// Max response size for fetched pages: 2MB
export const MAX_AUDIT_RESPONSE_BYTES = 2 * 1024 * 1024;

export function isPrivateIpAddress(ip: string): boolean {
  // IPv4 private/reserved ranges + IPv6 loopback/ULA/link-local + metadata
  const parts = ip.split(".");
  if (parts.length === 4) {
    const a = parseInt(parts[0], 10);
    const b = parseInt(parts[1], 10);
    if (a === 0) return true;                                  // 0.0.0.0/8
    if (a === 10) return true;                                 // 10/8
    if (a === 127) return true;                                // loopback
    if (a === 169 && b === 254) return true;                   // link-local incl. metadata
    if (a === 172 && b >= 16 && b <= 31) return true;          // 172.16/12
    if (a === 192 && b === 168) return true;                   // 192.168/16
    if (a === 100 && b >= 64 && b <= 127) return true;         // CGNAT 100.64/10
    if (a === 198 && (b === 18 || b === 19)) return true;      // benchmarking
    if (a >= 224) return true;                                 // multicast + reserved
    return false;
  }
  const low = ip.toLowerCase();
  if (low === "::1" || low === "::") return true;              // loopback / unspecified
  if (low.startsWith("fc") || low.startsWith("fd")) return true; // ULA fc00::/7
  if (low.startsWith("fe8") || low.startsWith("fe9") || low.startsWith("fea") || low.startsWith("feb")) return true; // link-local fe80::/10
  if (low.startsWith("ff")) return true;                       // multicast
  return false;
}

export function isInternalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (host === "localhost" || host === "metadata.google.internal" || host.endsWith(".internal") || host.endsWith(".local") || host.endsWith(".lan")) {
    return true;
  }
  return false;
}

// SSRF protection: validate URLs before fetching.
// String-level checks only : DNS resolution happens in isSafeUrlResolved().
export function isSafeUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (isInternalHostname(hostname)) return false;
    // Literal IP literals
    if (hostname.includes(":")) {
      if (isPrivateIpAddress(hostname)) return false;
    } else if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      if (isPrivateIpAddress(hostname)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Full check: string rules + DNS resolution, rejecting any hostname that
// resolves (even partially) to a private/reserved address. Guards against
// DNS-rebinding where a hostname alternates between public and internal IPs.
export async function isSafeUrlResolved(urlStr: string): Promise<boolean> {
  if (!isSafeUrl(urlStr)) return false;
  let hostname: string;
  try {
    const url = new URL(urlStr);
    hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  } catch {
    return false;
  }
  if (isPrivateIpAddress(hostname)) return false; // literal private IP already handled, but be safe
  try {
    const { address } = await dns.promises.lookup(hostname, { verbatim: true });
    if (isPrivateIpAddress(address)) return false;
  } catch {
    return false; // unresolvable or DNS failure -> do not fetch
  }
  return true;
}

// Fetch with bounded redirects where EVERY hop is SSRF-validated before it is
// followed (a safe first hop must not be allowed to redirect to an internal
// address). Returns the final Response or null when a hop is unsafe.
export async function fetchSafe(urlStr: string, headers: Record<string, string>, timeoutMs: number): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let current = urlStr;
  try {
    for (let hop = 0; hop <= REDIRECT_MAX_HOPS; hop++) {
      if (!(await isSafeUrlResolved(current))) return null;
      const response = await fetch(current, {
        signal: controller.signal,
        redirect: "manual",
        headers,
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) return null;
        current = new URL(location, current).toString();
        continue;
      }
      return response;
    }
    return null; // too many redirects
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export const AUDIT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
