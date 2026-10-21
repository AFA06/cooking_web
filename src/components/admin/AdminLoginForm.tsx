"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { PasswordField, authInputClass } from "@/components/auth/PasswordField";
import { adminLogin, type AdminLoginState } from "@/app/admin-login/actions";
import { useT } from "@/i18n/client";

export function AdminLoginForm({ entryKey }: { entryKey: string }) {
  const t = useT();
  const [state, action, pending] = React.useActionState<AdminLoginState, FormData>(adminLogin, {});
  // Controlled, so a failed attempt does not clear the email.
  const [email, setEmail] = React.useState("");
  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="key" value={entryKey} />
      <div>
        <label htmlFor="email" className="text-sm font-medium text-amber-950">{t("auth.email")}</label>
        <input id="email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} className={authInputClass} />
      </div>
      <PasswordField id="password" name="password" label={t("auth.password")} autoComplete="current-password" />
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <Button type="submit" size="xl" className="w-full rounded-full" loading={pending}>{t("nav.login")}</Button>
    </form>
  );
}
