import "server-only";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Identifier } from "@/lib/auth-rules";
import { WINDOW, clear, lockedForMinutes, record } from "@/server/rate-limit";
import { clientKey, keyedHash } from "@/server/security";

type User = typeof schema.users.$inferSelect;

/**
 * Where the sign-in happens. Admins sign in only on the hidden admin page and everyone else only on the
 * public one, so the public form never confirms that an admin account exists.
 */
export type SignInArea = "site" | "admin";

export type SignInResult = { user: User } | { error: "wrong" | "blocked" } | { error: "locked"; minutes: number };

// Compared against when the account is unknown, so response time does not reveal whether it exists.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5bQ7O8ZIOTbN0vJj5X9i1x4zV5g3a2K";

/** Wrong passwords allowed per account and per address before the lock, and how long it lasts. */
const LIMITS: Record<SignInArea, { perAccount: number; perAddress: number }> = {
  site: { perAccount: 4, perAddress: 15 },
  admin: { perAccount: 4, perAddress: 6 },
};
const LOCK_WINDOW = WINDOW.hour;

const allowedIn = (area: SignInArea, role: User["role"]) => (area === "admin" ? role === "admin" : role !== "admin");

/**
 * Checks an identifier and password for one sign-in area. Failures are counted per account and per address,
 * for known and unknown accounts alike, so a lock tells an attacker nothing about which accounts exist. While
 * locked the password is not even checked. An account from the other area is answered like a wrong password.
 */
export async function checkSignIn(area: SignInArea, ident: Identifier, password: string): Promise<SignInResult> {
  const { perAccount, perAddress } = LIMITS[area];
  const ip = await clientKey();
  const idKey = keyedHash("ident", ident.value);
  const [accountKind, addressKind] = area === "admin" ? ["admin-login-fail", "admin-login-fail-ip"] : ["login-fail", "login-fail-ip"];

  const minutes = Math.max(
    await lockedForMinutes(accountKind, idKey, perAccount, LOCK_WINDOW),
    await lockedForMinutes(addressKind, ip, perAddress, LOCK_WINDOW),
  );
  if (minutes > 0) return { error: "locked", minutes };

  const [user] = await db
    .select()
    .from(schema.users)
    .where(ident.kind === "phone" ? eq(schema.users.phone, ident.value) : eq(schema.users.email, ident.value))
    .limit(1);
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !allowedIn(area, user.role)) {
    await Promise.all([record(accountKind, idKey), record(addressKind, ip)]);
    return { error: "wrong" };
  }

  await clear(accountKind, idKey);
  // Only after the right password, so a block tells a stranger nothing about which accounts exist.
  if (user.blockedAt) return { error: "blocked" };
  return { user };
}
