import "server-only";
import type { TFunction } from "@/i18n/core";
import { PLATFORM_CONFIG } from "@/lib/constants";
import { WINDOW, allow } from "@/server/rate-limit";

/** Thrown when no delivery provider is connected (or the daily cost guard is hit). Never shown verbatim to people. */
export class DeliveryUnavailable extends Error {}

const BRAND = PLATFORM_CONFIG.name;
const SMS_DAILY_LIMIT = Number(process.env.SMS_DAILY_LIMIT ?? 1000);

const DEVSMS_API = "https://devsms.uz/api/v1/sms";
const DEVSMS_TIMEOUT_MS = 8000;

/**
 * Operators only deliver texts that match a moderated template, so codes go out through DevSMS' pre-approved
 * "universal OTP" templates instead of our own wording.
 */
const OTP_TEMPLATE: Record<CodePurpose, 1 | 2 | 3> = { signup: 3, password_reset: 2, email_change: 1, phone_change: 1 };

async function sendDevsmsOtp(to: string, code: string, purpose: CodePurpose): Promise<void> {
  const key = process.env.DEVSMS_API_KEY;
  if (!key) throw new DeliveryUnavailable("DEVSMS_API_KEY is not set");
  const res = await fetch(DEVSMS_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      phone: to.replace(/^\+/, ""),
      otp: { template_type: OTP_TEMPLATE[purpose], service_name: process.env.DEVSMS_SERVICE_NAME || BRAND, code },
    }),
    signal: AbortSignal.timeout(DEVSMS_TIMEOUT_MS),
  });
  if (res.ok) return;
  // Only the status and error code go into the error: the request holds a one-time code and a personal number.
  const body = (await res.json().catch(() => null)) as { error_code?: string } | null;
  throw new DeliveryUnavailable(`DevSMS send failed (${res.status} ${body?.error_code ?? "unknown"})`);
}

/** Cost guard: a bot hammering signup must not be able to drain the SMS balance. */
async function withinSmsBudget() {
  return allow("sms-global", "all", SMS_DAILY_LIMIT, WINDOW.day);
}

/**
 * Sends a one-time code by SMS through the provider named in SMS_PROVIDER. Without one, codes are printed
 * to the server console in development only. In production the send fails closed, so a code can never end
 * up in a production log.
 */
async function sendSmsCode(to: string, code: string, purpose: CodePurpose, t: TFunction): Promise<void> {
  if (!(await withinSmsBudget())) throw new DeliveryUnavailable("Daily SMS limit reached");
  const provider = process.env.SMS_PROVIDER;
  if (!provider) {
    if (process.env.NODE_ENV === "production") throw new DeliveryUnavailable("SMS provider is not configured");
    console.info(`[sms:dev] to ${to}: ${t(`sms.${purpose}`, { brand: BRAND, code })}`);
    return;
  }
  switch (provider) {
    case "devsms":
      return sendDevsmsOtp(to, code, purpose);
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
    await sendSmsCode(to, code, purpose, t);
  } else {
    const label = t(`email.label.${purpose}`);
    await sendEmail(to, `${BRAND}: ${label}`, t("email.body", { label, code, minutes }));
  }
}

/**
 * Sent instead of a code when someone signs up with a number that already has an account. Free text needs
 * its own moderated template at DevSMS, which we don't have, so with a real provider nothing is sent: the
 * sign-up screens still look the same, the owner of the number just gets no code.
 */
export async function sendAccountExistsNotice(phone: string, t: TFunction) {
  if (process.env.SMS_PROVIDER) return;
  if (process.env.NODE_ENV === "production") throw new DeliveryUnavailable("SMS provider is not configured");
  console.info(`[sms:dev] to ${phone}: ${t("sms.exists", { brand: BRAND })}`);
}

/** The email version of the notice, for sign-ups confirmed by email. */
export async function sendAccountExistsEmail(email: string, t: TFunction) {
  await sendEmail(email, `${BRAND}: ${t("email.existsSubject")}`, t("email.existsBody", { brand: BRAND }));
}
