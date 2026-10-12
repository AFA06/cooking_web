"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { changeEmail, changePassword, updateProfile, type AccountState } from "@/app/account/actions";
import { useT } from "@/i18n/client";

const field =
  "mt-1.5 h-14 w-full rounded-xl border border-amber-300 bg-amber-100 px-4 text-lg text-amber-950 transition-colors placeholder:text-amber-500 focus:border-amber-950 focus:outline-none";
const label = "text-sm font-medium text-amber-950";
const hint = "mt-1.5 text-sm text-amber-600";

/** Field values live in state so an error message never clears what was typed. */
function useFields<T extends Record<string, string>>(initial: T) {
  const [values, setValues] = React.useState(initial);
  const bind = (name: keyof T & string) => ({
    name,
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [name]: e.target.value })),
  });
  return { bind, reset: () => setValues(initial) };
}

function Result({ state }: { state: AccountState }) {
  if (state.error) return <p role="alert" className="text-sm font-medium text-red-700">{state.error}</p>;
  if (state.ok) return <p role="status" className="text-sm font-medium text-sage-700">{state.ok}</p>;
  return null;
}

function Footer({ state, pending, children }: { state: AccountState; pending: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-4 pt-1">
      <Button type="submit" size="lg" className="rounded-full" loading={pending}>{children}</Button>
      <Result state={state} />
    </div>
  );
}

export function ProfileForm({ initial }: { initial: { name: string; username: string; phone: string } }) {
  const t = useT();
  const [state, action, pending] = React.useActionState<AccountState, FormData>(updateProfile, {});
  const { bind } = useFields(initial);
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="name" className={label}>{t("auth.name")}</label>
        <input id="name" {...bind("name")} required minLength={2} maxLength={80} autoComplete="name" className={field} />
      </div>
      <div>
        <label htmlFor="username" className={label}>{t("settings.username")}</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 mt-[0.2rem] -translate-y-1/2 text-lg text-amber-500" aria-hidden="true">@</span>
          <input
            id="username"
            {...bind("username")}
            maxLength={24}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="oshpaz_ali"
            className={`${field} pl-9`}
          />
        </div>
        <p className={hint}>{t("settings.usernameNote")}</p>
      </div>
      <div>
        <label htmlFor="phone" className={label}>{t("settings.phone")}</label>
        <input id="phone" {...bind("phone")} type="tel" inputMode="tel" maxLength={30} autoComplete="tel" placeholder="+998 90 123 45 67" className={field} />
        <p className={hint}>{t("settings.phoneNote")}</p>
      </div>
      <Footer state={state} pending={pending}>{t("common.save")}</Footer>
    </form>
  );
}

export function EmailForm({ email }: { email: string }) {
  const t = useT();
  const [state, action, pending] = React.useActionState<AccountState, FormData>(changeEmail, {});
  const { bind, reset } = useFields({ email: "", currentPassword: "" });
  React.useEffect(() => {
    if (state.ok) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form action={action} className="space-y-5">
      <p className="text-amber-900">
        {t("settings.currentEmail")} <span className="font-semibold text-amber-950">{email}</span>
      </p>
      <div>
        <label htmlFor="email" className={label}>{t("settings.newEmail")}</label>
        <input id="email" {...bind("email")} type="email" required maxLength={254} autoComplete="email" className={field} />
      </div>
      <div>
        <label htmlFor="email-password" className={label}>{t("settings.currentPw")}</label>
        <input id="email-password" {...bind("currentPassword")} type="password" required maxLength={72} autoComplete="current-password" className={field} />
        <p className={hint}>{t("settings.emailPwNote")}</p>
      </div>
      <Footer state={state} pending={pending}>{t("settings.updateEmail")}</Footer>
    </form>
  );
}

export function PasswordForm() {
  const t = useT();
  const [state, action, pending] = React.useActionState<AccountState, FormData>(changePassword, {});
  const { bind, reset } = useFields({ currentPassword: "", newPassword: "", confirmPassword: "" });
  React.useEffect(() => {
    if (state.ok) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="current-password" className={label}>{t("settings.currentPw")}</label>
        <input id="current-password" {...bind("currentPassword")} type="password" required maxLength={72} autoComplete="current-password" className={field} />
      </div>
      <div>
        <label htmlFor="new-password" className={label}>{t("settings.newPw")}</label>
        <input id="new-password" {...bind("newPassword")} type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={field} />
        <p className={hint}>{t("auth.min8")}</p>
      </div>
      <div>
        <label htmlFor="confirm-password" className={label}>{t("settings.repeatPw")}</label>
        <input id="confirm-password" {...bind("confirmPassword")} type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={field} />
      </div>
      <Footer state={state} pending={pending}>{t("settings.updatePw")}</Footer>
    </form>
  );
}
