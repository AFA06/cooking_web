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
  "mt-1 w-full h-12 px-3 border border-amber-300 bg-white text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-600";

export function AuthForm({ mode, action, next }: Props) {
  const [state, formAction, pending] = React.useActionState(action, {});
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
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          required
          minLength={isSignup ? 8 : undefined}
          className={inputClass}
        />
        {isSignup && <p className="mt-1 text-xs text-amber-700">Kamida 8 ta belgi.</p>}
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {isSignup ? "Hisob yaratish" : "Kirish"}
      </Button>
      <p className="text-sm text-amber-800">
        {isSignup ? "Hisobingiz bormi? " : "Yangimisiz? "}
        <Link href={`${isSignup ? "/auth/login" : "/auth/signup"}${suffix}`} className="font-medium underline underline-offset-2">
          {isSignup ? "Kirish" : "Hisob yaratish"}
        </Link>
      </p>
    </form>
  );
}
