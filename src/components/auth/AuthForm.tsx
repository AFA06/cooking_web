"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LegalConsent } from "@/components/legal/LegalConsent";
import { PasswordField, authInputClass } from "@/components/auth/PasswordField";
import type { AuthState } from "@/app/auth/actions";

interface Props {
  mode: "login" | "signup";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  next: string;
  notice?: string;
}

export function AuthForm({ mode, action, next, notice }: Props) {
  const [state, formAction, pending] = React.useActionState(action, {});
  const isSignup = mode === "signup";
  const suffix = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={next} />
      {notice && <p role="status" className="rounded-xl bg-sage-500/15 px-4 py-3 text-sm font-medium text-sage-700">{notice}</p>}
      {isSignup && (
        <div>
          <label htmlFor="name" className="text-sm font-medium text-amber-950">Ism</label>
          <input id="name" name="name" type="text" autoComplete="name" required maxLength={80} className={authInputClass} />
        </div>
      )}
      {isSignup ? (
        <div>
          <label htmlFor="phone" className="text-sm font-medium text-amber-950">Telefon raqami</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="+998 90 123 45 67" className={authInputClass} />
          <p className="mt-1.5 text-sm text-amber-600">Raqamingizga SMS orqali tasdiqlash kodi yuboramiz.</p>
        </div>
      ) : (
        <div>
          <label htmlFor="identifier" className="text-sm font-medium text-amber-950">Telefon raqami yoki email</label>
          <input id="identifier" name="identifier" type="text" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={254} placeholder="+998 90 123 45 67" className={authInputClass} />
        </div>
      )}
      <PasswordField
        id="password"
        name="password"
        label="Parol"
        autoComplete={isSignup ? "new-password" : "current-password"}
        minLength={isSignup ? 8 : undefined}
        hint={isSignup ? "Kamida 8 ta belgi." : undefined}
      />
      {!isSignup && (
        <p className="-mt-2 text-sm">
          <Link href={`/auth/forgot${suffix}`} className="font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800">
            Parolni unutdingizmi?
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
        {isSignup ? "Kod yuborish" : "Kirish"}
      </Button>
      <p className="text-sm text-amber-900">
        {isSignup ? "Hisobingiz bormi? " : "Yangimisiz? "}
        <Link href={`${isSignup ? "/auth/login" : "/auth/signup"}${suffix}`} className="font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800">
          {isSignup ? "Kirish" : "Hisob yaratish"}
        </Link>
      </p>
    </form>
  );
}
