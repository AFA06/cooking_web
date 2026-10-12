"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LegalConsent } from "@/components/legal/LegalConsent";
import { PasswordField, authInputClass } from "@/components/auth/PasswordField";
import { useT } from "@/i18n/client";
import type { AuthState } from "@/app/auth/actions";

interface Props {
  mode: "login" | "signup";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  next: string;
  notice?: string;
}

export function AuthForm({ mode, action, next, notice }: Props) {
  const t = useT();
  const [state, formAction, pending] = React.useActionState(action, {});
  const isSignup = mode === "signup";
  const suffix = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={next} />
      {notice && <p role="status" className="rounded-xl bg-sage-500/15 px-4 py-3 text-sm font-medium text-sage-700">{notice}</p>}
      {isSignup && (
        <div>
          <label htmlFor="name" className="text-sm font-medium text-amber-950">{t("auth.name")}</label>
          <input id="name" name="name" type="text" autoComplete="name" required maxLength={80} className={authInputClass} />
        </div>
      )}
      {isSignup ? (
        <div>
          <label htmlFor="phone" className="text-sm font-medium text-amber-950">{t("settings.phone")}</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="+998 90 123 45 67" className={authInputClass} />
          <p className="mt-1.5 text-sm text-amber-600">{t("auth.phoneHint")}</p>
        </div>
      ) : (
        <div>
          <label htmlFor="identifier" className="text-sm font-medium text-amber-950">{t("auth.identifier")}</label>
          <input id="identifier" name="identifier" type="text" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={254} placeholder="+998 90 123 45 67" className={authInputClass} />
        </div>
      )}
      <PasswordField
        id="password"
        name="password"
        label={t("auth.password")}
        autoComplete={isSignup ? "new-password" : "current-password"}
        minLength={isSignup ? 8 : undefined}
        hint={isSignup ? t("auth.min8") : undefined}
      />
      {!isSignup && (
        <p className="-mt-2 text-sm">
          <Link href={`/auth/forgot${suffix}`} className="font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800">
            {t("auth.forgot")}
          </Link>
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      {isSignup && <LegalConsent />}
      <Button type="submit" size="xl" className="w-full rounded-full" loading={pending}>
        {isSignup ? t("auth.sendCode") : t("nav.login")}
      </Button>
      <p className="text-sm text-amber-900">
        {isSignup ? `${t("auth.haveAccount")} ` : `${t("auth.newHere")} `}
        <Link href={`${isSignup ? "/auth/login" : "/auth/signup"}${suffix}`} className="font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800">
          {isSignup ? t("nav.login") : t("auth.createAccount")}
        </Link>
      </p>
    </form>
  );
}
