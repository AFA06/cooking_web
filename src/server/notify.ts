import "server-only";
import type { TFunction } from "@/i18n/core";
import { PLATFORM_CONFIG } from "@/lib/constants";
import { WINDOW, allow } from "@/server/rate-limit";

/** Thrown when no delivery provider is connected (or the daily cost guard is hit). Never shown verbatim to people. */
export class DeliveryUnavailable extends Error {}

const BRAND = PLATFORM_CONFIG.name;
const SMS_DAILY_LIMIT = Number(process.env.SMS_DAILY_LIMIT ?? 1000);

/**
 * SMS delivery. No provider is connected yet: set SMS_PROVIDER once one is chosen and add its case below.
 * Without one, codes are printed to the server console in development only. In production the send
 * fails closed, so a code can never end up in a production log.
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
    // case "eskiz": return sendViaEskiz(to, text);
    // case "playmobile": return sendViaPlaymobile(to, text);
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
