/** Rules for the fields a person can edit on their own profile. Shared by the form and the server. */
export const USERNAME_PATTERN = /^[a-z][a-z0-9_]{2,23}$/;

/** Names that would be confused with parts of the site. */
const RESERVED = new Set(["admin", "administrator", "damda", "support", "moderator", "root", "system", "null", "undefined"]);

export function normalizeUsername(input: string): string {
  return input.trim().replace(/^@/, "").toLowerCase();
}

export function isUsernameAllowed(username: string): boolean {
  return USERNAME_PATTERN.test(username) && !RESERVED.has(username);
}

/**
 * Accepts a phone number typed with spaces, dashes or brackets and returns it as +digits.
 * A nine-digit number is read as an Uzbek one. Returns null when it cannot be a phone number.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  if (!/^\+?\d+$/.test(digits)) return null;
  const bare = digits.replace(/^\+/, "");
  const full = bare.length === 9 ? `998${bare}` : bare;
  return full.length >= 10 && full.length <= 15 ? `+${full}` : null;
}

export function formatPhone(phone: string): string {
  const match = /^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  return match ? `+998 ${match[1]} ${match[2]} ${match[3]} ${match[4]}` : phone;
}
