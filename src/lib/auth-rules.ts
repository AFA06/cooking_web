/** Rules shared by the sign-in forms and the server. Nothing here touches secrets, so it is safe in the browser. */
import { parseInternational } from "@/lib/phone";

/** Uzbek mobile numbers only: +998 followed by nine digits. Returns +998XXXXXXXXX or null. */
export function normalizeUzPhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  if (!/^\+?\d+$/.test(digits)) return null;
  const bare = digits.replace(/^\+/, "");
  const full = bare.length === 9 ? `998${bare}` : bare;
  return /^998[1-9]\d{8}$/.test(full) ? `+${full}` : null;
}

export function maskPhone(phone: string): string {
  const m = /^\+998(\d{2})\d{3}(\d{2})(\d{2})$/.exec(phone);
  if (m) return `+998 ${m[1]} *** ${m[2]} ${m[3]}`;
  return /^\+\d{8,15}$/.test(phone) ? `${phone.slice(0, phone.length - 6)}***${phone.slice(-2)}` : "***";
}

export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 1)}${"*".repeat(Math.max(2, Math.min(local.length - 1, 6)))}@${domain}`;
}

export function normalizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : null;
}

export type Identifier = { kind: "phone"; value: string } | { kind: "email"; value: string };

/** A sign-in or recovery identifier is either a phone number or an email. */
export function parseIdentifier(input: string): Identifier | null {
  const raw = input.trim();
  if (raw.includes("@")) {
    const email = normalizeEmail(raw);
    return email ? { kind: "email", value: email } : null;
  }
  const parsed = parseInternational(raw);
  return parsed ? { kind: "phone", value: parsed.phone } : null;
}

const COMMON_PASSWORDS = new Set([
  "12345678", "123456789", "1234567890", "password", "password1", "qwerty123", "qwertyuiop", "11111111",
  "00000000", "87654321", "iloveyou", "12341234", "asdfghjk", "1q2w3e4r", "qazwsxedc", "abcd1234",
  "parol123", "parol1234", "salom123", "uzbekistan", "tashkent", "damda123",
]);

/** Returns a message KEY (translate with t) when the password is unacceptable, otherwise null. bcrypt only reads the first 72 bytes. */
export function checkPassword(password: string, phone?: string | null): string | null {
  if (password.length < 8) return "auth.err.pwShort";
  if (new TextEncoder().encode(password).length > 72) return "pw.long";
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower) || /^(.)\1+$/.test(password)) return "pw.common";
  if (/^\d+$/.test(password)) {
    const asc = "01234567890123456789";
    const desc = "98765432109876543210";
    if (asc.includes(password) || desc.includes(password)) return "pw.common";
  }
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 9 && password.replace(/\D/g, "").includes(digits.slice(-9))) {
      return "pw.phone";
    }
  }
  return null;
}

export const CODE_LENGTH = 6;
export const RESEND_COOLDOWN_SECONDS = 60;
