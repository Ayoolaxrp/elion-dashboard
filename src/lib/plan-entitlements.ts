/**
 * ELION N/A Plan → Entitlement → Automation Template mapping.
 *
 * Single source of truth for what each paid plan includes. Mirrors the
 * canonical pricing model in src/lib/pricing.ts (Starter/Growth/Scale)
 * and the feature catalog + workflow templates in Supabase.
 *
 * A client's plan_name (or the plan id) resolves to:
 * - feature_keys → client_entitlements rows (what they purchased)
 * - template_slugs → client_automations instances (what gets built)
 */
export interface PlanEntitlements {
 id: string;
 name: string;
 feature_keys: string[];
 template_slugs: string[];
}

// Feature catalog keys seeded by migration 003 (features table).
export const PLAN_FEATURES: Record<string, string[]> = {
 starter: [
 "lead_capture",
 "lead_response",
 "whatsapp_integration",
 "email_integration",
 "internal_notifications",
 "lead_dashboard",
 ],
 growth: [
 "lead_capture",
 "lead_qualification",
 "lead_response",
 "lead_routing",
 "follow_up_initial",
 "follow_up_sequence",
 "booking_scheduling",
 "booking_confirmation",
 "booking_reminders",
 "whatsapp_integration",
 "email_integration",
 "internal_notifications",
 "crm_sync",
 "reporting",
 "lead_dashboard",
 ],
 scale: [
 "lead_capture",
 "lead_qualification",
 "lead_response",
 "lead_routing",
 "follow_up_initial",
 "follow_up_sequence",
 "lead_recovery",
 "re_engagement",
 "booking_scheduling",
 "booking_confirmation",
 "booking_reminders",
 "booking_rescheduling",
 "whatsapp_integration",
 "email_integration",
 "internal_notifications",
 "crm_sync",
 "task_creation",
 "reporting",
 "lead_dashboard",
 ],
};

// Template slugs created for each plan (must exist in workflow_templates).
export const PLAN_TEMPLATES: Record<string, string[]> = {
 starter: ["lead_response"],
 growth: ["lead_response", "follow_up", "booking"],
 scale: ["lead_response", "follow_up", "booking", "revenue_recovery", "operations"],
};

// Template slug → feature keys that grant entitlement to provision it.
// Features use catalog categories (leads/follow_up/booking/...) while
// templates use their own category (lead_response/revenue_recovery/...),
// so entitlement checks must map through the template slug, not match
// category names directly.
export const TEMPLATE_FEATURE_KEYS: Record<string, string[]> = {
 lead_response: ["lead_response", "lead_capture", "lead_qualification"],
 follow_up: ["follow_up_initial", "follow_up_sequence"],
 booking: ["booking_scheduling", "booking_confirmation", "booking_reminders"],
 revenue_recovery: ["lead_recovery", "re_engagement"],
 operations: ["task_creation", "crm_sync", "reporting"],
};

export function resolvePlan(plan: string | undefined | null): PlanEntitlements | null {
 if (!plan) return null;
 const p = plan.trim().toLowerCase();
 const id = p === "starter" || p === "growth" || p === "scale" ? p : null;
 if (!id) return null;
 return {
 id,
 name: id.charAt(0).toUpperCase() + id.slice(1),
 feature_keys: PLAN_FEATURES[id],
 template_slugs: PLAN_TEMPLATES[id],
 };
}
