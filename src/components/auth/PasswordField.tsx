"use client";

import * as React from "react";
import { useT } from "@/i18n/client";

export const authInputClass =
  "mt-1.5 h-14 w-full rounded-xl border border-amber-300 bg-amber-100 px-4 text-lg text-amber-950 transition-colors placeholder:text-amber-500 focus:border-amber-950 focus:outline-none";

interface Props {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  minLength?: number;
  hint?: string;
}

/** A password input with a show/hide eye. */
export function PasswordField({ id, name, label, autoComplete, minLength, hint }: Props) {
  const t = useT();
  const [shown, setShown] = React.useState(false);
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-amber-950">{label}</label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          className={`${authInputClass} pr-14`}
        />
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? t("auth.hidePw") : t("auth.showPw")}
          aria-pressed={shown}
          className="absolute right-3 top-1.5 flex h-11 w-11 items-center justify-center rounded-lg text-amber-700 hover:text-amber-950 focus-visible:outline-2 focus-visible:outline-amber-950"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {shown && <path d="M3 3l18 18" />}
          </svg>
        </button>
      </div>
      {hint && <p className="mt-1.5 text-sm text-amber-600">{hint}</p>}
    </div>
  );
}
