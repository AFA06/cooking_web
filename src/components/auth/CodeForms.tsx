"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { PasswordField, authInputClass } from "@/components/auth/PasswordField";
import { CODE_LENGTH, RESEND_COOLDOWN_SECONDS } from "@/lib/auth-rules";
import { useT } from "@/i18n/client";
import type { AuthState } from "@/app/auth/actions";

type Action = (state: AuthState, formData: FormData) => Promise<AuthState>;

function CodeField() {
  const t = useT();
  return (
    <div>
      <label htmlFor="code" className="text-sm font-medium text-amber-950">{t("auth.codeLabel")}</label>
      <input
        id="code"
        name="code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern={`\\d{${CODE_LENGTH}}`}
        maxLength={CODE_LENGTH}
        required
        autoFocus
        placeholder="••••••"
        className={`${authInputClass} text-center font-mono text-2xl tracking-[0.5em]`}
      />
    </div>
  );
}

function Message({ state }: { state: AuthState }) {
  if (state.error) return <p role="alert" className="text-sm font-medium text-red-700">{state.error}</p>;
  if (state.ok) return <p role="status" className="text-sm font-medium text-sage-700">{state.ok}</p>;
  return null;
}

/** "Resend" with a countdown. The server enforces the same cooldown, so this is only for clarity. */
export function ResendButton({
  action,
  challengeId,
  via,
  label,
  secondsLeft = RESEND_COOLDOWN_SECONDS,
}: {
  action: Action;
  challengeId: string;
  via?: "sms";
  label: string;
  secondsLeft?: number;
}) {
  const t = useT();
  const [left, setLeft] = React.useState(secondsLeft);
  const [state, formAction, pending] = React.useActionState<AuthState, FormData>(async (prev, formData) => {
    const result = await action(prev, formData);
    if (result.ok) setLeft(RESEND_COOLDOWN_SECONDS);
    return result;
  }, {});
  React.useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  return (
    <form action={formAction} className="flex flex-col items-start gap-1.5">
      <input type="hidden" name="challengeId" value={challengeId} />
      {via && <input type="hidden" name="via" value={via} />}
      <button
        type="submit"
        disabled={pending || left > 0}
        className="text-sm font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
      >
        {left > 0 ? t("auth.wait", { label, seconds: left }) : label}
      </button>
      <Message state={state} />
    </form>
  );
}

export function VerifyCodeForm({ action, challengeId, next }: { action: Action; challengeId: string; next: string }) {
  const t = useT();
  const [state, formAction, pending] = React.useActionState(action, {});
  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="challengeId" value={challengeId} />
      <input type="hidden" name="next" value={next} />
      <CodeField />
      {state.error && <p role="alert" className="text-sm font-medium text-red-700">{state.error}</p>}
      <Button type="submit" size="xl" className="w-full rounded-full" loading={pending}>{t("auth.confirm")}</Button>
    </form>
  );
}

export function ForgotForm({ action }: { action: Action }) {
  const t = useT();
  const [state, formAction, pending] = React.useActionState(action, {});
  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label htmlFor="identifier" className="text-sm font-medium text-amber-950">{t("auth.identifier")}</label>
        <input id="identifier" name="identifier" type="text" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={254} placeholder="+998 90 123 45 67" className={authInputClass} />
      </div>
      {state.error && <p role="alert" className="text-sm font-medium text-red-700">{state.error}</p>}
      <Button type="submit" size="xl" className="w-full rounded-full" loading={pending}>{t("auth.sendCode")}</Button>
    </form>
  );
}

export function ResetPasswordForm({ action, challengeId }: { action: Action; challengeId: string }) {
  const t = useT();
  const [state, formAction, pending] = React.useActionState(action, {});
  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="challengeId" value={challengeId} />
      <CodeField />
      <PasswordField id="newPassword" name="newPassword" label={t("settings.newPw")} autoComplete="new-password" minLength={8} hint={t("auth.min8")} />
      <PasswordField id="confirmPassword" name="confirmPassword" label={t("settings.repeatPw")} autoComplete="new-password" minLength={8} />
      {state.error && <p role="alert" className="text-sm font-medium text-red-700">{state.error}</p>}
      <Button type="submit" size="xl" className="w-full rounded-full" loading={pending}>{t("settings.updatePw")}</Button>
    </form>
  );
}
