// Input validation and sanitization utilities

export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { valid: false, error: "Email is required" };
  if (trimmed.length > 254) return { valid: false, error: "Email is too long" };
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(trimmed)) return { valid: false, error: "Invalid email format" };
  const parts = trimmed.split("@");
  if (parts.length !== 2) return { valid: false, error: "Invalid email format" };
  const domain = parts[1];
  if (!domain.includes(".")) return { valid: false, error: "Invalid email domain" };
  const tld = domain.split(".").pop();
  if (!tld || tld.length < 2) return { valid: false, error: "Invalid email domain" };
  return { valid: true };
}

export function validatePhone(phone: string): { valid: boolean; error?: string; normalized?: string } {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  if (!cleaned) return { valid: false, error: "Phone number is required" };
  if (!/^\+?[0-9]+$/.test(cleaned)) return { valid: false, error: "Phone number can only contain digits, +, spaces, and dashes" };
  let normalized = cleaned;
  if (normalized.startsWith("0") && normalized.length === 11) {
    normalized = "+234" + normalized.substring(1);
  } else if (!normalized.startsWith("+")) {
    normalized = "+" + normalized;
  }
  if (normalized.length < 10 || normalized.length > 15) return { valid: false, error: "Phone number must be 10-15 digits" };
  return { valid: true, normalized };
}

export function validateName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, error: "Name is required" };
  if (trimmed.length < 2) return { valid: false, error: "Name must be at least 2 characters" };
  if (trimmed.length > 100) return { valid: false, error: "Name is too long" };
  if (/[<>{}]/.test(trimmed)) return { valid: false, error: "Name contains invalid characters" };
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) return { valid: false, error: "Password is required" };
  if (password.length < 6) return { valid: false, error: "Password must be at least 6 characters" };
  if (password.length > 128) return { valid: false, error: "Password is too long" };
  return { valid: true };
}

export function validateRequired(value: string, fieldName: string): { valid: boolean; error?: string } {
  if (!value || !value.trim()) return { valid: false, error: `${fieldName} is required` };
  return { valid: true };
}

export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url) return { valid: true }; // Optional
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (!["http:", "https:"].includes(parsed.protocol)) return { valid: false, error: "URL must use http or https" };
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

export function validateMessage(message: string): { valid: boolean; error?: string } {
  const trimmed = message.trim();
  if (!trimmed) return { valid: false, error: "Message is required" };
  if (trimmed.length < 10) return { valid: false, error: "Message must be at least 10 characters" };
  if (trimmed.length > 5000) return { valid: false, error: "Message is too long (max 5000 characters)" };
  return { valid: true };
}

export interface ValidationError {
  field: string;
  message: string;
}
