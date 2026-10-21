"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import {
  changePassword,
  changePhone,
  confirmEmailChange,
  startEmailChange,
  updateProfile,
  type AccountState,
} from "@/app/account/actions";
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

export function ProfileForm({ initial }: { initial: { name: string; username: string } }) {
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
      <Footer state={state} pending={pending}>{t("common.save")}</Footer>
    </form>
  );
}

interface ContactProps {
  /** Current value, or null when none is set yet. */
  current: string | null;
}

function Current({ text, value, note }: { text: string; value: string | null; note?: string }) {
  const t = useT();
  return (
    <p className="text-amber-900">
      {text} <span className="font-semibold text-amber-950">{value ?? t("settings.notSet")}</span>
      {note && <span className="ml-2 text-sm text-red-700">{note}</span>}
    </p>
  );
}

/** One step for now: the new number and the current password. Numbers are not confirmed by SMS. */
export function PhoneForm({ current }: ContactProps) {
  const t = useT();
  const [state, action, pending] = React.useActionState<AccountState, FormData>(changePhone, {});
  const { bind } = useFields({ value: "", currentPassword: "" });
  if (state.ok) return <p role="status" className="text-sm font-medium text-sage-700">{state.ok}</p>;
  return (
    <div className="space-y-5">
      <Current text={t("settings.currentNumber")} value={current} />
      <form action={action} className="space-y-5">
        <div>
          <label htmlFor="phone-value" className={label}>{t("settings.newPhone")}</label>
          <input id="phone-value" {...bind("value")} type="tel" inputMode="tel" required maxLength={40} autoComplete="tel" placeholder="+998 90 123 45 67" className={field} />
        </div>
        <div>
          <label htmlFor="phone-password" className={label}>{t("settings.currentPw")}</label>
          <input id="phone-password" {...bind("currentPassword")} type="password" required maxLength={72} autoComplete="current-password" className={field} />
        </div>
        <Footer state={state} pending={pending}>{t("settings.updatePhone")}</Footer>
      </form>
    </div>
  );
}

/**
 * Changing the email is two steps: password and new address, then the code sent to that address. Until the
 * code is entered nothing changes, so a typo or a stranger's address can never be saved.
 */
export function EmailForm({ current, verified }: ContactProps & { verified: boolean }) {
  const t = useT();
  const [startState, startAction, starting] = React.useActionState<AccountState, FormData>(startEmailChange, {});
  const [confirmState, confirmAction, confirming] = React.useActionState<AccountState, FormData>(confirmEmailChange, {});
  const { bind } = useFields({ value: "", currentPassword: "" });
  const [dismissed, setDismissed] = React.useState<string | null>(null);

  const done = confirmState.ok;
  const challengeId = startState.challengeId;
  const sentTo = startState.sentTo;
  const waitingForCode = !!challengeId && challengeId !== dismissed && !done;
  // An old failed attempt must not show its error on a freshly sent code.
  const codeState = confirmState.challengeId === challengeId ? confirmState : {};

  if (done) return <p role="status" className="text-sm font-medium text-sage-700">{done}</p>;

  return (
    <div className="space-y-5">
      <Current text={t("settings.currentEmail")} value={current} note={current && !verified ? t("settings.notVerified") : undefined} />

      {waitingForCode ? (
        <form action={confirmAction} className="space-y-5">
          <input type="hidden" name="challengeId" value={challengeId} />
          <input type="hidden" name="sentTo" value={sentTo ?? ""} />
          <div>
            <label htmlFor="email-code" className={label}>{t("auth.codeLabel")}</label>
            <input
              id="email-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              placeholder="••••••"
              className={`${field} text-center font-mono text-2xl tracking-[0.5em]`}
            />
            <p className={hint}>{t("settings.sentTo", { to: sentTo ?? "" })}</p>
          </div>
          <Footer state={codeState} pending={confirming}>{t("auth.confirm")}</Footer>
        </form>
      ) : (
        <form action={startAction} className="space-y-5">
          <div>
            <label htmlFor="email-value" className={label}>{t("settings.newEmail")}</label>
            <input id="email-value" {...bind("value")} type="email" inputMode="email" required maxLength={254} autoComplete="email" className={field} />
          </div>
          <div>
            <label htmlFor="email-password" className={label}>{t("settings.currentPw")}</label>
            <input id="email-password" {...bind("currentPassword")} type="password" required maxLength={72} autoComplete="current-password" className={field} />
            <p className={hint}>
              {t("settings.sendNoteEmail")} {t("settings.nothingChanges")}
            </p>
          </div>
          <Footer state={startState} pending={starting}>{t("auth.sendCode")}</Footer>
        </form>
      )}
      {waitingForCode && (
        <button type="button" onClick={() => setDismissed(challengeId ?? null)} className="text-sm font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800">
          {t("settings.otherEmail")}
        </button>
      )}
    </div>
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
