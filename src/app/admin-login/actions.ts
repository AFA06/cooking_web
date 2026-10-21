"use server";

import { redirect } from "next/navigation";
import { getT } from "@/i18n/server";
import { normalizeEmail } from "@/lib/auth-rules";
import { createSession } from "@/server/auth";
import { isAdminEntryKey } from "@/server/admin-entry";
import { checkSignIn } from "@/server/credentials";

export interface AdminLoginState {
  error?: string;
}

/** Signs an admin in. Works only with the secret page key, and only for admin accounts. */
export async function adminLogin(_: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const t = await getT();
  const wrong = { error: t("admLogin.wrong") };
  // The page is not the only way to reach an action, so the key is checked here too.
  if (!isAdminEntryKey(formData.get("key"))) return wrong;
  const email = normalizeEmail(String(formData.get("email") ?? "").slice(0, 254));
  const password = String(formData.get("password") ?? "").slice(0, 200);
  if (!email || !password) return wrong;

  const result = await checkSignIn("admin", { kind: "email", value: email }, password);
  if ("error" in result) {
    return result.error === "locked" ? { error: t("auth.err.locked", { time: t("time.min", { count: result.minutes }) }) } : wrong;
  }
  await createSession(result.user.id);
  redirect("/admin");
}
