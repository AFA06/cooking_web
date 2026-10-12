"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { AuthState } from "@/app/auth/actions";

interface Props {
  mode: "login" | "signup";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  next: string;
}

const inputClass =
  "mt-1.5 h-14 w-full rounded-xl border border-amber-300 bg-amber-100 px-4 text-lg text-amber-950 transition-colors placeholder:text-amber-500 focus:border-amber-950 focus:outline-none";

export function AuthForm({ mode, action, next }: Props) {
  const [state, formAction, pending] = React.useActionState(action, {});
  const [showPassword, setShowPassword] = React.useState(false);
  const isSignup = mode === "signup";
  const suffix = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={next} />
      {isSignup && (
        <div>
          <label htmlFor="name" className="text-sm font-medium text-amber-950">Ism</label>
          <input id="name" name="name" type="text" autoComplete="name" required className={inputClass} />
        </div>
      )}
      <div>
        <label htmlFor="email" className="text-sm font-medium text-amber-950">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-amber-950">Parol</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={isSignup ? 8 : undefined}
            className={`${inputClass} pr-14`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Parolni yashirish" : "Parolni ko‘rsatish"}
            aria-pressed={showPassword}
            className="absolute right-3 top-1.5 flex h-11 w-11 items-center justify-center rounded-lg text-amber-700 hover:text-amber-950 focus-visible:outline-2 focus-visible:outline-amber-950"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {showPassword && <path d="M3 3l18 18" />}
            </svg>
          </button>
        </div>
        {isSignup && <p className="mt-1.5 text-sm text-amber-600">Kamida 8 ta belgi.</p>}
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      <Button type="submit" size="xl" className="w-full rounded-full" loading={pending}>
        {isSignup ? "Hisob yaratish" : "Kirish"}
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
