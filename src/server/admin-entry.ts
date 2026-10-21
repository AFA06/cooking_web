import "server-only";
import { adminLoginPath } from "@/lib/admin-entry";
import { safeEqual } from "@/server/security";

/** True only for the secret admin sign-in key, compared in constant time. */
export function isAdminEntryKey(key: unknown): boolean {
  const expected = adminLoginPath();
  return !!expected && typeof key === "string" && safeEqual(key, expected);
}
