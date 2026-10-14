"use client";

import * as React from "react";
import { authInputClass } from "@/components/auth/PasswordField";

/** Shows nine local digits as "90 123 45 67". */
export function formatLocalPhone(digits: string): string {
  const d = digits.slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}

/** What people paste or type may start with +998, 998 or 8; only the nine local digits are kept. */
export function toLocalDigits(input: string): string {
  const digits = input.replace(/\D/g, "");
  return (digits.startsWith("998") ? digits.slice(3) : digits).slice(0, 9);
}

interface Props {
  id: string;
  name: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (digits: string) => void;
}

/**
 * Uzbek mobile number with a fixed +998 prefix. The visible field is formatted for reading; the
 * submitted value is the full international number, which the server validates again.
 */
export function PhoneField({ id, name, label, hint, value, onChange }: Props) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-amber-950">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1.5 flex h-14 items-center text-lg font-medium text-amber-800" aria-hidden="true">
          +998
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required
          placeholder="90 123 45 67"
          aria-describedby={hint ? `${id}-hint` : undefined}
          value={formatLocalPhone(value)}
          onChange={(e) => onChange(toLocalDigits(e.target.value))}
          className={`${authInputClass} pl-[4.5rem]`}
        />
      </div>
      <input type="hidden" name={name} value={value ? `+998${value}` : ""} />
      {hint && <p id={`${id}-hint`} className="mt-1.5 text-sm text-amber-600">{hint}</p>}
    </div>
  );
}
