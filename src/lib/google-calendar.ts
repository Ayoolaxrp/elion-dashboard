// Google Calendar + Google Meet : server-side integration (REST, no client deps).
// Tokens live ONLY in booking_settings.google_tokens and are never sent to the browser.
// Nothing here ever fabricates an event or a Meet link: functions return real API results
// or throw, and callers must surface the failure truthfully.

const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expiry_at: number; // epoch ms
  calendar_id?: string; // primary calendar id of the connected account
  account_email?: string;
}

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri(reqOrigin?: string): string {
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_SITE_URL || reqOrigin || "https://elion.com.ng"}/api/bookings/oauth/callback`
  );
}

// ---------------------------------------------------------------
// Persistence : booking_settings.<google_tokens[:client_id]>
// The key without a client_id is ELION's own calendar (strategy
// calls on /landing/book). A client_id-scoped key is the calendar of
// one client's Booking Automation : each client's automation gets its
// own Google Calendar connection (reusable template, per-client
// credentials). Tokens are only ever read/written server-side.
// ---------------------------------------------------------------
import { createServerClient } from "@supabase/ssr";

function settingsClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export function tokenKey(clientId?: string | null): string {
  return clientId ? `google_tokens:${clientId}` : "google_tokens";
}

export async function getStoredTokens(clientId?: string | null): Promise<GoogleTokens | null> {
  const sb = settingsClient();
  const { data } = await sb
    .from("booking_settings")
    .select("value")
    .eq("key", tokenKey(clientId))
    .maybeSingle();
  if (!data?.value) return null;
  const t = data.value as GoogleTokens;
  if (!t?.refresh_token) return null;
  return t;
}

export async function storeTokens(tokens: GoogleTokens, clientId?: string | null) {
  const sb = settingsClient();
  await sb.from("booking_settings").upsert(
    { key: tokenKey(clientId), value: { ...tokens, client_id: clientId || null }, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
}

export async function clearTokens(clientId?: string | null) {
  const sb = settingsClient();
  await sb.from("booking_settings").delete().eq("key", tokenKey(clientId));
}

/** Keys of all connected calendars (ELION + per-client) without exposing token values. */
export async function listConnectedCalendarKeys(): Promise<string[]> {
  const sb = settingsClient();
  const { data } = await sb.from("booking_settings").select("key").like("key", "google_tokens%");
  return (data || []).map((r: { key: string }) => r.key);
}

// ---------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------
export function authUrl(state: string, reqOrigin?: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(reqOrigin),
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ---------------------------------------------------------------
// OAuth state signing , the state carries the client_id for per-client
// connections. It is signed (HMAC-SHA256) so a callback with a tampered
// state cannot misattribute tokens to another client's scope.
// ---------------------------------------------------------------
import { createHmac, timingSafeEqual } from "crypto";

function stateSecret(): string {
  return (
    process.env.OAUTH_STATE_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "elion-state-signing"
  );
}

export function signOAuthState(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", stateSecret()).update(body).digest("hex");
  return `${body}.${sig}`;
}

/** Verify an OAuth state string. Returns the payload when valid, null otherwise. */
export function verifyOAuthState(state: string | null): { t?: number; clientId?: string | null } | null {
  if (!state) return null;
  const dot = state.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  const expected = createHmac("sha256", stateSecret()).update(body).digest("hex");
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    // State expires after 10 minutes.
    if (payload?.t && Date.now() - Number(payload.t) > 10 * 60 * 1000) return null;
    return { t: payload?.t, clientId: payload?.clientId ?? null };
  } catch {
    return null;
  }
}

export async function exchangeCode(code: string, reqOrigin?: string): Promise<GoogleTokens> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(reqOrigin),
      grant_type: "authorization_code",
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error_description || body?.error || "Google OAuth exchange failed");
  const t: GoogleTokens = {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    expiry_at: Date.now() + (body.expires_in || 3600) * 1000,
  };
  await attachAccountInfo(t);
  return t;
}

async function refreshTokens(t: GoogleTokens): Promise<GoogleTokens> {
  if (!t.refresh_token) throw new Error("No refresh token available");
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: t.refresh_token,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error_description || body?.error || "Google token refresh failed");
  const next: GoogleTokens = {
    ...t,
    access_token: body.access_token,
    expiry_at: Date.now() + (body.expires_in || 3600) * 1000,
  };
  return next;
}

export async function attachAccountInfo(t: GoogleTokens, clientId?: string | null) {
  try {
    const cal = await rawAuthedRequest<{ id: string }>(t, "GET", "/users/me/calendarList/primary");
    if (cal?.id) {
      t.calendar_id = cal.id;
    }
    const list = await rawAuthedRequest<{ items?: Array<{ id: string }> }>(t, "GET", "/users/me/calendarList");
    t.account_email = list?.items?.find((i) => i.id === t.calendar_id)?.id || undefined;
  } catch {
    // Non-fatal: token still usable; calendar id resolved lazily on demand.
  }
  void clientId;
}

/** Raw authenticated call with an explicit token set (no refresh loop). */
async function rawAuthedRequest<T>(
  tokens: GoogleTokens,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${CALENDAR_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Google Calendar API ${res.status}: ${errBody.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------
// Authenticated request (handles refresh + retry once).
// clientId selects whose calendar (ELION global vs a client's Booking
// Automation) : tokens are looked up and stored under the same scope.
// ---------------------------------------------------------------
async function authedRequest<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  clientId?: string | null
): Promise<T> {
  let tokens = await getStoredTokens(clientId);
  if (!tokens) throw new Error("Google Calendar is not connected");

  const doFetch = async (accessToken: string) => {
    return fetch(`${CALENDAR_API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let res = await doFetch(tokens.access_token);
  if (res.status === 401) {
    tokens = await refreshTokens(tokens);
    await storeTokens(tokens, clientId);
    res = await doFetch(tokens.access_token);
  }
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Google Calendar API ${res.status}: ${errBody.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------
// Calendar operations
// ---------------------------------------------------------------
export async function getPrimaryCalendarId(clientId?: string | null): Promise<string> {
  const tokens = await getStoredTokens(clientId);
  if (!tokens) throw new Error("Google Calendar is not connected");
  if (tokens.calendar_id) return tokens.calendar_id;
  const primary = await authedRequest<{ id: string }>("GET", "/users/me/calendarList/primary", undefined, clientId);
  const id = primary?.id;
  if (!id) throw new Error("Could not resolve primary calendar");
  tokens.calendar_id = id;
  await storeTokens(tokens, clientId);
  return id;
}

export async function freeBusy(
  calendarId: string,
  timeMin: Date,
  timeMax: Date,
  timeZone: string,
  clientId?: string | null
): Promise<Array<{ start: string; end: string }>> {
  const res = await authedRequest<{ calendars: Record<string, { busy?: Array<{ start: string; end: string }> }> }>(
    "POST",
    "/freeBusy",
    {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone,
      items: [{ id: calendarId }],
    },
    clientId
  );
  return res.calendars?.[calendarId]?.busy || [];
}

export interface CalendarEventInput {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  timeZone: string;
  attendeeEmail?: string;
  attendeeName?: string;
}

export interface CalendarEventResult {
  eventId: string;
  hangoutLink?: string;
  htmlLink?: string;
}

export async function createEventWithMeet(
  calendarId: string,
  input: CalendarEventInput,
  clientId?: string | null
): Promise<CalendarEventResult> {
  const res = await authedRequest<{
    id: string;
    hangoutLink?: string;
    htmlLink?: string;
  }>(
    "POST",
    `/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`,
    {
      summary: input.summary,
      description: input.description || "",
      start: { dateTime: input.start.toISOString(), timeZone: input.timeZone },
      end: { dateTime: input.end.toISOString(), timeZone: input.timeZone },
      attendees: input.attendeeEmail ? [{ email: input.attendeeEmail, displayName: input.attendeeName }] : [],
      conferenceData: {
        createRequest: {
          requestId: `elion_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
    clientId
  );
  return { eventId: res.id, hangoutLink: res.hangoutLink, htmlLink: res.htmlLink };
}

export async function deleteEvent(calendarId: string, eventId: string, clientId?: string | null) {
  await authedRequest(
    "DELETE",
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    undefined,
    clientId
  );
}

export async function moveEvent(
  calendarId: string,
  eventId: string,
  start: Date,
  end: Date,
  timeZone: string,
  clientId?: string | null
): Promise<{ htmlLink?: string }> {
  return authedRequest(
    "PATCH",
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      start: { dateTime: start.toISOString(), timeZone },
      end: { dateTime: end.toISOString(), timeZone },
    },
    clientId
  );
}
