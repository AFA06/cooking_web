"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { useT } from "@/i18n/client";
import { COUNTRIES, countryByIso, formatLocal, localDigits, stripDialCode, type Country } from "@/lib/phone";

interface Props {
  id: string;
  /** Name of the hidden field that carries the full international number. */
  name: string;
  label: string;
  hint?: string;
  /** Local digits only, without the dialing code. */
  value: string;
  onChange: (digits: string) => void;
  country?: string;
  onCountryChange?: (iso: string) => void;
  /** Off where only Uzbek numbers make sense (SMS-only flows). */
  selectable?: boolean;
}

/**
 * Phone number with a fixed dialing code: the person picks a country (Uzbekistan by default) and types only
 * their own number. The submitted value is the full international number, which the server checks again.
 */
export function PhoneField({ id, name, label, hint, value, onChange, country = "UZ", onCountryChange, selectable = true }: Props) {
  const t = useT();
  const c: Country = countryByIso(country);

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-amber-950">{label}</label>
      <div className="mt-1.5 flex h-14 overflow-hidden rounded-xl border border-amber-300 bg-amber-100 transition-colors focus-within:border-amber-950">
        <div className="relative flex shrink-0 items-center gap-1.5 border-r border-amber-300 pl-3.5 pr-2.5 text-lg font-medium text-amber-900">
          <span aria-hidden="true">{c.flag}</span>
          <span>+{c.dial}</span>
          {selectable && (
            <>
              <ChevronDown className="h-4 w-4 text-amber-600" aria-hidden="true" />
              <select
                aria-label={t("auth.country")}
                value={c.iso}
                onChange={(e) => {
                  onCountryChange?.(e.target.value);
                  onChange(localDigits(value, countryByIso(e.target.value)));
                }}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                {COUNTRIES.map((k) => (
                  <option key={k.iso} value={k.iso}>{`${k.flag} ${t(`country.${k.iso}`)} +${k.dial}`}</option>
                ))}
              </select>
            </>
          )}
        </div>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required
          placeholder={c.example}
          aria-describedby={hint ? `${id}-hint` : undefined}
          value={formatLocal(value, c)}
          onChange={(e) => onChange(localDigits(e.target.value, c))}
          onPaste={(e) => {
            e.preventDefault();
            onChange(localDigits(stripDialCode(e.clipboardData.getData("text"), c), c));
          }}
          className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-lg text-amber-950 placeholder:text-amber-500 focus:outline-none"
        />
      </div>
      <input type="hidden" name={name} value={value ? `+${c.dial}${value}` : ""} />
      <input type="hidden" name={`${name}Country`} value={c.iso} />
      {hint && <p id={`${id}-hint`} className="mt-1.5 text-sm text-amber-600">{hint}</p>}
    </div>
  );
}
