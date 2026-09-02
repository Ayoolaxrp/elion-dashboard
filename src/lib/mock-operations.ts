export interface AdminAutomation {
  id: string;
  client_id: string;
  client_name: string;
  company_name: string;
  template_id: string;
  template_name: string;
  template_version: string;
  status: "pending" | "configuring" | "provisioning" | "testing" | "ready" | "live" | "paused" | "failed";
  health: "healthy" | "degraded" | "needs_attention" | "offline";
  configuration: Record<string, string | number | boolean>;
  integrations: { name: string; status: "connected" | "disconnected" | "needs_attention" }[];
  created_at: string;
  activated_at: string | null;
  last_execution: string | null;
  error: string | null;
}

export interface ExecutionLog {
  id: string;
  client_id: string;
  client_name: string;
  automation_id: string;
  automation_name: string;
  trigger: string;
  status: "success" | "failed" | "skipped";
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  error: string | null;
  details: string;
}

export interface ProvisioningRecord {
  id: string;
  client_id: string;
  client_name: string;
  company_name: string;
  automation_name: string;
  template_version: string;
  status: "not_started" | "waiting_client" | "waiting_credentials" | "provisioning" | "testing" | "failed" | "ready" | "live";
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  retry_count: number;
  created_at: string;
}

// ============================================================
// 5 CLIENT AUTOMATIONS ACROSS ALL STATUSES
// ============================================================

export const adminAutomations: AdminAutomation[] = [
  // Client A - ABC Properties - ALL LIVE
  {
    id: "aa_001", client_id: "client_001", client_name: "Adebayo Okonkwo", company_name: "ABC Properties",
    template_id: "tpl_001", template_name: "Lead Response System", template_version: "v2.1",
    status: "live", health: "healthy",
    configuration: { business_hours: "9am-6pm WAT", response_channel: "whatsapp", greeting: "Thank you for contacting ABC Properties" },
    integrations: [{ name: "WhatsApp Business", status: "connected" }, { name: "Email (SMTP)", status: "connected" }],
    created_at: "2026-08-28T10:00:00Z", activated_at: "2026-09-01T10:00:00Z", last_execution: "2026-09-02T14:23:00Z", error: null,
  },
  {
    id: "aa_002", client_id: "client_001", client_name: "Adebayo Okonkwo", company_name: "ABC Properties",
    template_id: "tpl_002", template_name: "Follow-Up Sequence", template_version: "v1.3",
    status: "live", health: "healthy",
    configuration: { follow_up_1: "4 hours", follow_up_2: "24 hours", follow_up_3: "72 hours", stop_on_response: true },
    integrations: [{ name: "WhatsApp Business", status: "connected" }],
    created_at: "2026-08-28T10:00:00Z", activated_at: "2026-09-01T10:00:00Z", last_execution: "2026-09-02T11:45:00Z", error: null,
  },
  {
    id: "aa_003", client_id: "client_001", client_name: "Adebayo Okonkwo", company_name: "ABC Properties",
    template_id: "tpl_003", template_name: "Booking Automation", template_version: "v1.1",
    status: "live", health: "healthy",
    configuration: { calendar: "google", duration: "30 minutes", buffer: "15 minutes", timezone: "Africa/Lagos" },
    integrations: [{ name: "Google Calendar", status: "connected" }],
    created_at: "2026-08-28T10:00:00Z", activated_at: "2026-09-01T10:00:00Z", last_execution: "2026-09-02T09:15:00Z", error: null,
  },

  // Client B - Fresh Ventures - TESTING
  {
    id: "aa_004", client_id: "client_002", client_name: "Ngozi Adeyemi", company_name: "Fresh Ventures",
    template_id: "tpl_001", template_name: "Lead Response System", template_version: "v2.1",
    status: "testing", health: "needs_attention",
    configuration: { business_hours: "8am-8pm WAT", response_channel: "both", greeting: "Welcome to Fresh Ventures" },
    integrations: [{ name: "WhatsApp Business", status: "connected" }, { name: "Email (SMTP)", status: "needs_attention" }],
    created_at: "2026-09-02T10:00:00Z", activated_at: null, last_execution: null, error: null,
  },
  {
    id: "aa_005", client_id: "client_002", client_name: "Ngozi Adeyemi", company_name: "Fresh Ventures",
    template_id: "tpl_002", template_name: "Follow-Up Sequence", template_version: "v1.3",
    status: "pending", health: "offline",
    configuration: {},
    integrations: [],
    created_at: "2026-09-02T10:00:00Z", activated_at: null, last_execution: null, error: null,
  },

  // Client C - Chidi & Sons - WAITING FOR CREDENTIALS
  {
    id: "aa_006", client_id: "client_003", client_name: "Chidi Nwosu", company_name: "Chidi & Sons",
    template_id: "tpl_001", template_name: "Lead Response System", template_version: "v2.1",
    status: "configuring", health: "offline",
    configuration: { business_hours: "9am-5pm WAT" },
    integrations: [{ name: "WhatsApp Business", status: "disconnected" }],
    created_at: "2026-09-01T08:00:00Z", activated_at: null, last_execution: null, error: null,
  },

  // Client D - Dewdrops Hotel - FAILED
  {
    id: "aa_007", client_id: "client_004", client_name: "Fatima Bello", company_name: "Dewdrops Hotel",
    template_id: "tpl_003", template_name: "Booking Automation", template_version: "v1.1",
    status: "failed", health: "offline",
    configuration: { calendar: "google", duration: "45 minutes" },
    integrations: [{ name: "Google Calendar", status: "disconnected" }],
    created_at: "2026-08-28T12:00:00Z", activated_at: null, last_execution: null,
    error: "Google Calendar OAuth token expired. Reconnect required.",
  },

  // Client E - Wellness Clinic - PAUSED
  {
    id: "aa_008", client_id: "client_005", client_name: "Dr. Amara Obi", company_name: "Wellness Clinic",
    template_id: "tpl_005", template_name: "Operations Automation", template_version: "v1.0",
    status: "paused", health: "degraded",
    configuration: { notification_channel: "slack", task_creation: true },
    integrations: [{ name: "Slack", status: "connected" }],
    created_at: "2026-08-20T10:00:00Z", activated_at: "2026-08-25T10:00:00Z", last_execution: "2026-09-01T16:00:00Z", error: null,
  },
];

// ============================================================
// EXECUTION LOGS
// ============================================================

export const executionLogs: ExecutionLog[] = [
  { id: "el_001", client_id: "client_001", client_name: "ABC Properties", automation_id: "aa_001", automation_name: "Lead Response", trigger: "New lead via funnel", status: "success", started_at: "2026-09-02T14:23:00Z", completed_at: "2026-09-02T14:23:02Z", duration_ms: 2100, error: null, details: "Lead captured, qualified (score 82), WhatsApp response sent" },
  { id: "el_002", client_id: "client_001", client_name: "ABC Properties", automation_id: "aa_002", automation_name: "Follow-Up", trigger: "Lead unresponsive (4h)", status: "success", started_at: "2026-09-02T11:45:00Z", completed_at: "2026-09-02T11:45:01Z", duration_ms: 1200, error: null, details: "Follow-up 1 sent to Chioma Okafor via WhatsApp" },
  { id: "el_003", client_id: "client_001", client_name: "ABC Properties", automation_id: "aa_003", automation_name: "Booking", trigger: "Lead requested viewing", status: "success", started_at: "2026-09-02T09:15:00Z", completed_at: "2026-09-02T09:15:03Z", duration_ms: 3400, error: null, details: "Viewing booked for Sep 3, 2:00 PM WAT" },
  { id: "el_004", client_id: "client_001", client_name: "ABC Properties", automation_id: "aa_001", automation_name: "Lead Response", trigger: "New lead via WhatsApp", status: "success", started_at: "2026-09-02T10:05:00Z", completed_at: "2026-09-02T10:05:01Z", duration_ms: 1800, error: null, details: "Lead captured, qualified (score 71), email response sent" },
  { id: "el_005", client_id: "client_001", client_name: "ABC Properties", automation_id: "aa_001", automation_name: "Lead Response", trigger: "New lead via website", status: "failed", started_at: "2026-09-01T16:30:00Z", completed_at: "2026-09-01T16:30:01Z", duration_ms: 900, error: "WhatsApp API rate limit exceeded", details: "Lead captured but response delivery failed" },
  { id: "el_006", client_id: "client_002", client_name: "Fresh Ventures", automation_id: "aa_004", automation_name: "Lead Response", trigger: "Test execution", status: "success", started_at: "2026-09-02T15:00:00Z", completed_at: "2026-09-02T15:00:02Z", duration_ms: 2300, error: null, details: "Test lead processed successfully" },
  { id: "el_007", client_id: "client_005", client_name: "Wellness Clinic", automation_id: "aa_008", automation_name: "Operations", trigger: "New lead notification", status: "success", started_at: "2026-09-01T16:00:00Z", completed_at: "2026-09-01T16:00:01Z", duration_ms: 800, error: null, details: "Slack notification sent to #leads channel" },
];

// ============================================================
// PROVISIONING RECORDS
// ============================================================

export const provisioningRecords: ProvisioningRecord[] = [
  { id: "pr_001", client_id: "client_001", client_name: "Adebayo Okonkwo", company_name: "ABC Properties", automation_name: "Lead Response System", template_version: "v2.1", status: "live", started_at: "2026-08-28T10:00:00Z", completed_at: "2026-09-01T10:00:00Z", error: null, retry_count: 0, created_at: "2026-08-28T10:00:00Z" },
  { id: "pr_002", client_id: "client_001", client_name: "Adebayo Okonkwo", company_name: "ABC Properties", automation_name: "Follow-Up Sequence", template_version: "v1.3", status: "live", started_at: "2026-08-28T10:00:00Z", completed_at: "2026-09-01T10:00:00Z", error: null, retry_count: 0, created_at: "2026-08-28T10:00:00Z" },
  { id: "pr_003", client_id: "client_001", client_name: "Adebayo Okonkwo", company_name: "ABC Properties", automation_name: "Booking Automation", template_version: "v1.1", status: "live", started_at: "2026-08-28T10:00:00Z", completed_at: "2026-09-01T10:00:00Z", error: null, retry_count: 0, created_at: "2026-08-28T10:00:00Z" },
  { id: "pr_004", client_id: "client_002", client_name: "Ngozi Adeyemi", company_name: "Fresh Ventures", automation_name: "Lead Response System", template_version: "v2.1", status: "testing", started_at: "2026-09-02T12:00:00Z", completed_at: null, error: null, retry_count: 0, created_at: "2026-09-02T10:00:00Z" },
  { id: "pr_005", client_id: "client_003", client_name: "Chidi Nwosu", company_name: "Chidi & Sons", automation_name: "Lead Response System", template_version: "v2.1", status: "waiting_credentials", started_at: null, completed_at: null, error: null, retry_count: 0, created_at: "2026-09-01T08:00:00Z" },
  { id: "pr_006", client_id: "client_004", client_name: "Fatima Bello", company_name: "Dewdrops Hotel", automation_name: "Booking Automation", template_version: "v1.1", status: "failed", started_at: "2026-08-29T10:00:00Z", completed_at: "2026-08-29T10:00:05Z", error: "Google Calendar OAuth token expired", retry_count: 1, created_at: "2026-08-28T12:00:00Z" },
  { id: "pr_007", client_id: "client_005", client_name: "Dr. Amara Obi", company_name: "Wellness Clinic", automation_name: "Operations Automation", template_version: "v1.0", status: "live", started_at: "2026-08-22T10:00:00Z", completed_at: "2026-08-25T10:00:00Z", error: null, retry_count: 0, created_at: "2026-08-20T10:00:00Z" },
];

// Client E - Wellness Clinic (additional mock client)
export const clientE = {
  id: "client_005",
  organization: { id: "org_005", name: "Wellness Clinic", industry: "Healthcare", website: null },
  contact_name: "Dr. Amara Obi",
  email: "amara@wellnessclinic.ng",
  phone: "+2348077778888",
  lifecycle_status: "live" as const,
};
