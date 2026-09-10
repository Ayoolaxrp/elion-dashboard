// Channel-specific contact permission model (Phase 4 of the commercial
// engine). Replaces the scalar leads.contact_permission with per-channel
// status so a single contact can be e.g. email=opted_in, whatsapp=unknown,
// sms=opted_out, phone=public_business_contact at the same time.
//
// HARD RULE: a scraped / publicly visible WhatsApp number is NEVER opted_in
// by itself. It can be "public_business_contact" at most, and that still
// does not authorize marketing automation on the channel.

export const CONSENT_CHANNELS = ["email", "whatsapp", "sms", "phone"] as const;
export type ConsentChannel = (typeof CONSENT_CHANNELS)[number];

export const CONSENT_STATUSES = [
  "unknown",
  "public_business_contact",
  "opted_in",
  "opted_out",
  "do_not_contact",
] as const;
export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

/** Per-channel permission map: channel -> status. Missing channels = unknown. */
export type ChannelPermissions = Partial<Record<ConsentChannel, ConsentStatus>>;

export interface ChannelPermissionRow {
  channel: ConsentChannel;
  status: ConsentStatus;
  consent_source: string | null;
  updated_at: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Normalize arbitrary DB/API input into a safe ChannelPermissions map. */
export function normalizePermissions(
  rows: ChannelPermissionRow[] | null | undefined,
  fallbackScalar?: string | null
): ChannelPermissions {
  const out: ChannelPermissions = {};
  if (Array.isArray(rows)) {
    for (const r of rows) {
      if (CONSENT_CHANNELS.includes(r.channel) && CONSENT_STATUSES.includes(r.status)) {
        out[r.channel] = r.status;
      }
    }
  }
  // Backward-compatible fallback for the old scalar field when the
  // normalized table has no rows yet (e.g. a lead created before 028).
  const hasAny = CONSENT_CHANNELS.some((c) => out[c]);
  if (!hasAny && fallbackScalar) {
    const s = fallbackScalar;
    if (s === "do_not_contact" || s === "opted_out") {
      for (const c of CONSENT_CHANNELS) out[c] = s;
    } else if (s === "opted_in_email") {
      out.email = "opted_in";
    } else if (s === "opted_in_whatsapp") {
      out.whatsapp = "opted_in";
    } else if (s === "public_business_contact") {
      for (const c of CONSENT_CHANNELS) out[c] = "public_business_contact";
    }
  }
  return out;
}

/**
 * Whether a specific channel may be used for outreach.
 * - do_not_contact / opted_out on the channel -> blocked
 * - opted_in -> allowed
 * - public_business_contact -> allowed only for legitimate business
 *   contact (cold business outreach is permitted for B2B public business
 *   contact under applicable law), but NEVER for automated marketing.
 * - unknown -> blocked by default for whatsapp; for other channels ELION
 *   treats unknown as "ask first" (blocked unless explicitly enabled).
 */
export function channelAllowed(
  perms: ChannelPermissions,
  channel: ConsentChannel
): boolean {
  const status = perms[channel] || "unknown";
  if (status === "opted_in") return true;
  if (status === "public_business_contact") return true;
  return false;
}

/** Global do-not-contact check: only do_not_contact is global (spec: a
 *  per-channel opted_out must NOT block a separately lawful channel, but a
 *  do_not_contact overrides everything). */
export function isGloballyBlocked(perms: ChannelPermissions): boolean {
  return CONSENT_CHANNELS.some((c) => perms[c] === "do_not_contact");
}

/** Allowed / blocked channel lists for the NBA payload. */
export function allowedAndBlocked(perms: ChannelPermissions): {
  allowedChannels: ConsentChannel[];
  blockedChannels: ConsentChannel[];
} {
  const allowed = CONSENT_CHANNELS.filter((c) => channelAllowed(perms, c));
  const blocked = CONSENT_CHANNELS.filter((c) => !channelAllowed(perms, c));
  return { allowedChannels: allowed, blockedChannels: blocked };
}