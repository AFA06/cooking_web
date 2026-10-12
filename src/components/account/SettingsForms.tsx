"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import {
  changePassword,
  confirmEmailChange,
  confirmPhoneChange,
  startEmailChange,
  startPhoneChange,
  updateProfile,
  type AccountState,
} from "@/app/account/actions";

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
  const [state, action, pending] = React.useActionState<AccountState, FormData>(updateProfile, {});
  const { bind } = useFields(initial);
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="name" className={label}>Ism</label>
        <input id="name" {...bind("name")} required minLength={2} maxLength={80} autoComplete="name" className={field} />
      </div>
      <div>
        <label htmlFor="username" className={label}>Foydalanuvchi nomi</label>
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
        <p className={hint}>Ixtiyoriy. 3–24 ta belgi: lotin harflari, raqamlar va “_”.</p>
      </div>
      <Footer state={state} pending={pending}>Saqlash</Footer>
    </form>
  );
}

interface ContactProps {
  /** Current value, or null when none is set yet. */
  current: string | null;
  verified: boolean;
}

/**
 * Changing a phone number or email is two steps: password and new value, then the code sent to the
 * new value. Until the code is entered nothing changes, so a typo or a stranger's address can never be saved.
 */
function ContactForm({
  kind,
  current,
  verified,
  start,
  confirm,
}: ContactProps & {
  kind: "phone" | "email";
  start: (state: AccountState, formData: FormData) => Promise<AccountState>;
  confirm: (state: AccountState, formData: FormData) => Promise<AccountState>;
}) {
  const isPhone = kind === "phone";
  const [startState, startAction, starting] = React.useActionState<AccountState, FormData>(start, {});
  const [confirmState, confirmAction, confirming] = React.useActionState<AccountState, FormData>(confirm, {});
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
      <p className="text-amber-900">
        {isPhone ? "Hozirgi raqam: " : "Hozirgi email: "}
        <span className="font-semibold text-amber-950">{current ?? "kiritilmagan"}</span>
        {current && !verified && <span className="ml-2 text-sm text-red-700">tasdiqlanmagan</span>}
      </p>

      {waitingForCode ? (
        <form action={confirmAction} className="space-y-5">
          <input type="hidden" name="challengeId" value={challengeId} />
          <input type="hidden" name="sentTo" value={sentTo ?? ""} />
          <div>
            <label htmlFor={`${kind}-code`} className={label}>Tasdiqlash kodi</label>
            <input
              id={`${kind}-code`}
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
            <p className={hint}>
              <span className="font-semibold text-amber-950">{sentTo}</span> manziliga yuborilgan 6 xonali kodni kiriting.
            </p>
          </div>
          <Footer state={codeState} pending={confirming}>Tasdiqlash</Footer>
        </form>
      ) : (
        <form action={startAction} className="space-y-5">
          <div>
            <label htmlFor={`${kind}-value`} className={label}>{isPhone ? "Yangi telefon raqami" : "Yangi email"}</label>
            <input
              id={`${kind}-value`}
              {...bind("value")}
              type={isPhone ? "tel" : "email"}
              inputMode={isPhone ? "tel" : "email"}
              required
              maxLength={254}
              autoComplete={isPhone ? "tel" : "email"}
              placeholder={isPhone ? "+998 90 123 45 67" : undefined}
              className={field}
            />
          </div>
          <div>
            <label htmlFor={`${kind}-password`} className={label}>Joriy parol</label>
            <input id={`${kind}-password`} {...bind("currentPassword")} type="password" required maxLength={72} autoComplete="current-password" className={field} />
            <p className={hint}>
              {isPhone ? "Yangi raqamga SMS orqali kod yuboramiz." : "Yangi emailga kod yuboramiz."} Kod kiritilmaguncha hech narsa o‘zgarmaydi.
            </p>
          </div>
          <Footer state={startState} pending={starting}>Kod yuborish</Footer>
        </form>
      )}
      {waitingForCode && (
        <button type="button" onClick={() => setDismissed(challengeId ?? null)} className="text-sm font-semibold text-amber-700 underline underline-offset-4 hover:text-amber-800">
          Boshqa {isPhone ? "raqam" : "email"} kiritish
        </button>
      )}
    </div>
  );
}

export function PhoneForm(props: ContactProps) {
  return <ContactForm kind="phone" start={startPhoneChange} confirm={confirmPhoneChange} {...props} />;
}

export function EmailForm(props: ContactProps) {
  return <ContactForm kind="email" start={startEmailChange} confirm={confirmEmailChange} {...props} />;
}

export function PasswordForm() {
  const [state, action, pending] = React.useActionState<AccountState, FormData>(changePassword, {});
  const { bind, reset } = useFields({ currentPassword: "", newPassword: "", confirmPassword: "" });
  React.useEffect(() => {
    if (state.ok) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="current-password" className={label}>Joriy parol</label>
        <input id="current-password" {...bind("currentPassword")} type="password" required maxLength={72} autoComplete="current-password" className={field} />
      </div>
      <div>
        <label htmlFor="new-password" className={label}>Yangi parol</label>
        <input id="new-password" {...bind("newPassword")} type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={field} />
        <p className={hint}>Kamida 8 ta belgi.</p>
      </div>
      <div>
        <label htmlFor="confirm-password" className={label}>Yangi parolni takrorlang</label>
        <input id="confirm-password" {...bind("confirmPassword")} type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={field} />
      </div>
      <Footer state={state} pending={pending}>Parolni yangilash</Footer>
    </form>
  );
}
