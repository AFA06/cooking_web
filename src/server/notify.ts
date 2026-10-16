import "server-only";
import type { TFunction } from "@/i18n/core";
import { PLATFORM_CONFIG } from "@/lib/constants";
import { WINDOW, allow } from "@/server/rate-limit";

/** Thrown when no delivery provider is connected (or the daily cost guard is hit). Never shown verbatim to people. */
export class DeliveryUnavailable extends Error {}

const BRAND = PLATFORM_CONFIG.name;
const SMS_DAILY_LIMIT = Number(process.env.SMS_DAILY_LIMIT ?? 1000);

const ESKIZ_API = "https://notify.eskiz.uz/api";
const ESKIZ_TIMEOUT_MS = 8000;

/** Eskiz logins last 30 days; the token is kept per server instance and renewed on demand. */
let eskizToken: string | null = null;

async function eskizLogin(): Promise<string> {
  const email = process.env.ESKIZ_EMAIL;
  const password = process.env.ESKIZ_PASSWORD;
  if (!email || !password) throw new DeliveryUnavailable("ESKIZ_EMAIL / ESKIZ_PASSWORD are not set");
  const res = await fetch(`${ESKIZ_API}/auth/login`, {
    method: "POST",
    body: new URLSearchParams({ email, password }),
    signal: AbortSignal.timeout(ESKIZ_TIMEOUT_MS),
  });
  const token = res.ok ? ((await res.json()) as { data?: { token?: string } }).data?.token : undefined;
  if (!token) throw new DeliveryUnavailable(`Eskiz login failed (${res.status})`);
  return (eskizToken = token);
}

async function sendViaEskiz(to: string, text: string): Promise<void> {
  const body = () =>
    new URLSearchParams({
      mobile_phone: to.replace(/^\+/, ""),
      message: text,
      from: process.env.ESKIZ_FROM || "4546",
    });
  const post = async (token: string) =>
    fetch(`${ESKIZ_API}/message/sms/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: body(),
      signal: AbortSignal.timeout(ESKIZ_TIMEOUT_MS),
    });

  let res = await post(eskizToken ?? (await eskizLogin()));
  if (res.status === 401) res = await post(await eskizLogin()); // expired token: log in once more
  // Only the status goes into the error: the message holds a one-time code and the number is personal data.
  if (!res.ok) throw new DeliveryUnavailable(`Eskiz send failed (${res.status})`);
}

/**
 * SMS delivery through the provider named in SMS_PROVIDER. Without one, codes are printed to the server
 * console in development only. In production the send fails closed, so a code can never end up in a
 * production log.
 */
export async function sendSms(to: string, text: string): Promise<void> {
  // Cost guard: a bot hammering signup must not be able to drain the SMS balance.
  if (!(await allow("sms-global", "all", SMS_DAILY_LIMIT, WINDOW.day))) throw new DeliveryUnavailable("Daily SMS limit reached");

  const provider = process.env.SMS_PROVIDER;
  if (!provider) {
    if (process.env.NODE_ENV === "production") throw new DeliveryUnavailable("SMS provider is not configured");
    console.info(`[sms:dev] to ${to}: ${text}`);
    return;
  }
  switch (provider) {
    case "eskiz":
      return sendViaEskiz(to, text);
    default:
      throw new DeliveryUnavailable(`Unknown SMS_PROVIDER "${provider}"`);
  }
}

/** Email delivery, with the same fail-closed behaviour. Set EMAIL_PROVIDER once a sender is chosen. */
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER;
  if (!provider) {
    if (process.env.NODE_ENV === "production") throw new DeliveryUnavailable("Email provider is not configured");
    console.info(`[email:dev] to ${to} | ${subject}\n${text}`);
    return;
  }
  switch (provider) {
    default:
      throw new DeliveryUnavailable(`Unknown EMAIL_PROVIDER "${provider}"`);
  }
}

export type CodePurpose = "signup" | "password_reset" | "email_change" | "phone_change";

/** Codes are written in the language the person is using the site in (`t` comes from their request). */
export async function deliverCode(channel: "sms" | "email", to: string, code: string, purpose: CodePurpose, minutes: number, t: TFunction) {
  if (channel === "sms") {
    await sendSms(to, t(`sms.${purpose}`, { brand: BRAND, code }));
  } else {
    const label = t(`email.label.${purpose}`);
    await sendEmail(to, `${BRAND}: ${label}`, t("email.body", { label, code, minutes }));
  }
}

/** Sent instead of a code when someone signs up with a number that already has an account. */
export async function sendAccountExistsNotice(phone: string, t: TFunction) {
  await sendSms(phone, t("sms.exists", { brand: BRAND }));
}

/** The email version of the notice, for sign-ups confirmed by email. */
export async function sendAccountExistsEmail(email: string, t: TFunction) {
  await sendEmail(email, `${BRAND}: ${t("email.existsSubject")}`, t("email.existsBody", { brand: BRAND }));
}
