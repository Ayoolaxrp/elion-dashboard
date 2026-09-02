export interface AutomationTemplate {
  id: string;
  name: string;
  category: "lead_capture" | "follow_up" | "booking" | "recovery" | "operations";
  description: string;
  version: string;
  required_config: ConfigField[];
  required_integrations: string[];
  required_credentials: string[];
  status: "active" | "deprecated" | "draft";
  clients_using: number;
}

export interface ConfigField {
  key: string;
  label: string;
  type: "text" | "select" | "boolean" | "number" | "json";
  required: boolean;
  description: string;
  options?: string[];
  default?: string | number | boolean;
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: "tpl_001",
    name: "Lead Response System",
    category: "lead_capture",
    description: "Automatically captures incoming leads, qualifies them, and sends an initial response across configured channels.",
    version: "v2.1",
    required_config: [
      { key: "business_hours", label: "Business Hours", type: "text", required: true, description: "When the business is available (e.g., 9am-6pm WAT)" },
      { key: "response_channel", label: "Response Channel", type: "select", required: true, description: "Primary channel for lead responses", options: ["whatsapp", "email", "both"] },
      { key: "greeting", label: "Greeting Message", type: "text", required: true, description: "First message sent to new leads" },
      { key: "qualification_score_threshold", label: "Qualification Threshold", type: "number", required: false, description: "Minimum score to qualify a lead", default: 70 },
      { key: "escalation_enabled", label: "Enable Escalation", type: "boolean", required: false, description: "Escalate unqualified leads to human", default: true },
    ],
    required_integrations: ["WhatsApp Business", "Email (SMTP)"],
    required_credentials: ["whatsapp_access_token", "smtp_credentials"],
    status: "active",
    clients_using: 3,
  },
  {
    id: "tpl_002",
    name: "Follow-Up Sequence",
    category: "follow_up",
    description: "Sends automated follow-up messages to leads who have not responded, with configurable timing and stop conditions.",
    version: "v1.3",
    required_config: [
      { key: "follow_up_1_delay", label: "First Follow-Up", type: "select", required: true, description: "Time before first follow-up", options: ["2 hours", "4 hours", "8 hours", "24 hours"] },
      { key: "follow_up_2_delay", label: "Second Follow-Up", type: "select", required: true, description: "Time before second follow-up", options: ["24 hours", "48 hours", "72 hours"] },
      { key: "follow_up_3_delay", label: "Third Follow-Up", type: "select", required: false, description: "Time before third follow-up", options: ["72 hours", "7 days", "14 days"] },
      { key: "max_follow_ups", label: "Maximum Follow-Ups", type: "number", required: true, description: "Maximum number of follow-up attempts", default: 3 },
      { key: "stop_on_response", label: "Stop on Response", type: "boolean", required: true, description: "Stop sequence when lead responds", default: true },
      { key: "channel", label: "Channel", type: "select", required: true, description: "Channel for follow-up messages", options: ["whatsapp", "email", "both"] },
    ],
    required_integrations: ["WhatsApp Business", "Email (SMTP)"],
    required_credentials: ["whatsapp_access_token"],
    status: "active",
    clients_using: 2,
  },
  {
    id: "tpl_003",
    name: "Booking Automation",
    category: "booking",
    description: "Handles appointment scheduling by offering available slots, confirming bookings, and sending reminders.",
    version: "v1.1",
    required_config: [
      { key: "calendar", label: "Calendar Provider", type: "select", required: true, description: "Which calendar to check availability against", options: ["google", "outlook", "custom"] },
      { key: "duration", label: "Appointment Duration", type: "select", required: true, description: "Default appointment length", options: ["15 minutes", "30 minutes", "45 minutes", "60 minutes"] },
      { key: "buffer", label: "Buffer Time", type: "select", required: false, description: "Time between appointments", options: ["0 minutes", "15 minutes", "30 minutes"] },
      { key: "timezone", label: "Timezone", type: "text", required: true, description: "Business timezone", default: "Africa/Lagos" },
      { key: "working_hours_start", label: "Working Hours Start", type: "text", required: true, description: "Earliest bookable time", default: "09:00" },
      { key: "working_hours_end", label: "Working Hours End", type: "text", required: true, description: "Latest bookable time", default: "17:00" },
      { key: "reminder_enabled", label: "Send Reminders", type: "boolean", required: false, description: "Send reminder before appointment", default: true },
    ],
    required_integrations: ["Google Calendar"],
    required_credentials: ["google_calendar_oauth"],
    status: "active",
    clients_using: 2,
  },
  {
    id: "tpl_004",
    name: "Revenue Recovery",
    category: "recovery",
    description: "Identifies dormant leads and customers, then triggers re-engagement campaigns to recover lost opportunities.",
    version: "v1.0",
    required_config: [
      { key: "dormancy_period", label: "Dormancy Period", type: "select", required: true, description: "How long before a lead is considered dormant", options: ["7 days", "14 days", "30 days", "60 days"] },
      { key: "recovery_channel", label: "Channel", type: "select", required: true, description: "Channel for recovery messages", options: ["whatsapp", "email", "both"] },
      { key: "max_recovery_attempts", label: "Max Attempts", type: "number", required: true, description: "Maximum recovery attempts", default: 3 },
      { key: "recovery_message", label: "Recovery Message", type: "text", required: true, description: "Message sent to dormant leads" },
    ],
    required_integrations: ["WhatsApp Business", "Email (SMTP)"],
    required_credentials: ["whatsapp_access_token", "smtp_credentials"],
    status: "active",
    clients_using: 0,
  },
  {
    id: "tpl_005",
    name: "Operations Automation",
    category: "operations",
    description: "Automates repetitive internal tasks like lead routing, notifications, task creation, and data synchronisation.",
    version: "v1.0",
    required_config: [
      { key: "routing_rules", label: "Lead Routing Rules", type: "json", required: true, description: "Rules for assigning leads to team members" },
      { key: "notification_channel", label: "Notification Channel", type: "select", required: true, description: "Where internal notifications are sent", options: ["slack", "email", "whatsapp"] },
      { key: "task_creation", label: "Auto-Create Tasks", type: "boolean", required: false, description: "Automatically create tasks for team", default: true },
    ],
    required_integrations: ["Slack"],
    required_credentials: ["slack_webhook"],
    status: "active",
    clients_using: 0,
  },
];

export function getTemplate(id: string): AutomationTemplate | undefined {
  return AUTOMATION_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: AutomationTemplate["category"]): AutomationTemplate[] {
  return AUTOMATION_TEMPLATES.filter(t => t.category === category);
}
