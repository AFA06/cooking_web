"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LegalConsent } from "@/components/legal/LegalConsent";
import { PasswordField, authInputClass } from "@/components/auth/PasswordField";
import { PhoneField } from "@/components/auth/PhoneField";
import { useT } from "@/i18n/client";
import { SMS_COUNTRY } from "@/lib/phone";
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
  // Controlled, because React clears an uncontrolled form after a failed submit and people would retype everything.
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [country, setCountry] = React.useState("UZ");
  const [withEmail, setWithEmail] = React.useState(false);
  const suffix = next ? `?next=${encodeURIComponent(next)}` : "";
  // Codes go by SMS to Uzbek numbers only; everyone else confirms with an email code, so email is required for them.
  const smsCountry = country === SMS_COUNTRY;

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <input type="hidden" name="next" value={next} />
      {notice && <p role="status" className="rounded-xl bg-sage-500/15 px-4 py-3 text-sm font-medium text-sage-700">{notice}</p>}
      {isSignup && (
        // Bot trap: invisible to people and to screen readers, tempting to scripts.
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Contact
            <input type="text" name="hp_contact" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>
      )}
      {isSignup && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="text-sm font-medium text-amber-950">{t("auth.firstName")}</label>
            <input id="firstName" name="firstName" type="text" autoComplete="given-name" required maxLength={40} value={firstName} onChange={(e) => setFirstName(e.target.value)} className={authInputClass} />
          </div>
          <div>
            <label htmlFor="lastName" className="text-sm font-medium text-amber-950">{t("auth.lastName")}</label>
            <input id="lastName" name="lastName" type="text" autoComplete="family-name" required maxLength={40} value={lastName} onChange={(e) => setLastName(e.target.value)} className={authInputClass} />
          </div>
        </div>
      )}

      {!isSignup && withEmail ? (
        <div>
          <label htmlFor="identifier" className="text-sm font-medium text-amber-950">{t("auth.email")}</label>
          <input id="identifier" name="identifier" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@mail.com" className={authInputClass} />
        </div>
      ) : (
        <PhoneField
          id="phone"
          name={isSignup ? "phone" : "identifier"}
          label={t("settings.phone")}
          hint={isSignup ? (smsCountry ? t("auth.phoneHint") : t("auth.phoneHintIntl")) : undefined}
          value={phone}
          onChange={setPhone}
          country={country}
          onCountryChange={setCountry}
        />
      )}
      {!isSignup && (
        <button type="button" onClick={() => setWithEmail((v) => !v)} className="-mt-2 text-sm font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800">
          {withEmail ? t("auth.usePhone") : t("auth.useEmail")}
        </button>
      )}

      {isSignup && (
        <div>
          <label htmlFor="email" className="text-sm font-medium text-amber-950">
            {t("auth.email")}
            {smsCountry && <span className="font-normal text-amber-600"> · {t("auth.optional")}</span>}
          </label>
          <input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required={!smsCountry} maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@mail.com" className={authInputClass} />
          <p className="mt-1.5 text-sm text-amber-600">{smsCountry ? t("auth.emailHintOptional") : t("auth.emailHintCode")}</p>
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
    </form>
  );
}
