export type ContentStatus =
  | "idea"
  | "draft"
  | "review"
  | "approved"
  | "scheduled"
  | "published"
  | "rejected";

export interface LeadResearchOutput {
  business: string;
  industry: string;
  location: string;
  website: string;
  public_contacts: string[];
  evidence: string[];
  audit_status: "completed" | "could_not_verify" | "not_run";
  opportunity: "strong" | "investigate" | "insufficient_evidence" | "none";
  confidence: number;
  unknowns: string[];
}

export interface ContentOutput {
  source_event: string;
  topic: string;
  angle: string;
  hook: string;
  linkedin: string;
  x_post: string;
  instagram_caption: string;
  carousel_slides: string[];
  reel_script: string;
  cta: string;
  evidence_sources: string[];
  status: ContentStatus;
}

export interface MeetingOutput {
  participants: string[];
  problems: string[];
  requirements: string[];
  objections: string[];
  commitments: string[];
  next_actions: string[];
  deadlines: string[];
}

export type OutputValidation = { valid: true } | { valid: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(record: Record<string, unknown>, key: string, errors: string[]): string {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) errors.push(`${key} must be a non-empty string`);
  return typeof value === "string" ? value : "";
}

function stringArray(record: Record<string, unknown>, key: string, errors: string[]): string[] {
  const value = record[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    errors.push(`${key} must be an array of strings`);
    return [];
  }
  return value as string[];
}

export function validateContentOutput(value: unknown): OutputValidation {
  if (!isRecord(value)) return { valid: false, errors: ["content output must be an object"] };
  const errors: string[] = [];
  for (const key of ["source_event", "topic", "angle", "hook", "linkedin", "x_post", "instagram_caption", "reel_script", "cta"]) {
    requiredString(value, key, errors);
  }
  stringArray(value, "carousel_slides", errors);
  stringArray(value, "evidence_sources", errors);
  if (!["idea", "draft", "review", "approved", "scheduled", "published", "rejected"].includes(String(value.status))) {
    errors.push("status is not a valid content status");
  }
  return errors.length ? { valid: false, errors } : { valid: true };
}

export function validateLeadResearchOutput(value: unknown): OutputValidation {
  if (!isRecord(value)) return { valid: false, errors: ["lead research output must be an object"] };
  const errors: string[] = [];
  for (const key of ["business", "industry", "location", "website"]) requiredString(value, key, errors);
  stringArray(value, "public_contacts", errors);
  stringArray(value, "evidence", errors);
  stringArray(value, "unknowns", errors);
  if (!["completed", "could_not_verify", "not_run"].includes(String(value.audit_status))) errors.push("audit_status is invalid");
  if (!["strong", "investigate", "insufficient_evidence", "none"].includes(String(value.opportunity))) errors.push("opportunity is invalid");
  if (typeof value.confidence !== "number" || value.confidence < 0 || value.confidence > 1) errors.push("confidence must be a number from 0 to 1");
  return errors.length ? { valid: false, errors } : { valid: true };
}

export function validateMeetingOutput(value: unknown): OutputValidation {
  if (!isRecord(value)) return { valid: false, errors: ["meeting output must be an object"] };
  const errors: string[] = [];
  for (const key of ["participants", "problems", "requirements", "objections", "commitments", "next_actions", "deadlines"]) stringArray(value, key, errors);
  return errors.length ? { valid: false, errors } : { valid: true };
}

/** Parse a model response without allowing prose or malformed JSON downstream. */
export function parseStructuredOutput<T>(raw: string, validate: (value: unknown) => OutputValidation): T {
  const candidate = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    throw new Error("AI output was not valid JSON");
  }
  const result = validate(parsed);
  if (!result.valid) throw new Error(`AI output failed validation: ${result.errors.join("; ")}`);
  return parsed as T;
}
