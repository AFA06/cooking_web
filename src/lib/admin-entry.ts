/**
 * The admin sign-in page lives at a secret address, /<ADMIN_LOGIN_PATH>, so it cannot be found by guessing.
 * The value is kept in the environment, never in the code. Without a valid one the admin page does not exist.
 * Imported by next.config.ts (for the rewrite) as well as the server, so it stays free of server-only code.
 */
const PATTERN = /^[A-Za-z0-9_-]{20,64}$/;

/** The secret path segment, or null when it is missing or too weak to stay secret. */
export function adminLoginPath(): string | null {
  const value = process.env.ADMIN_LOGIN_PATH?.trim() ?? "";
  return PATTERN.test(value) ? value : null;
}

/** Where the rewrite sends the secret address. The page there checks the key again. */
export const ADMIN_LOGIN_ROUTE = "/admin-login";
