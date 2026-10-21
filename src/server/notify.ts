import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import type { TFunction } from "@/i18n/core";
import { PLATFORM_CONFIG } from "@/lib/constants";
import { WINDOW, allow } from "@/server/rate-limit";

/** Thrown when no email sender is set up (or the daily cost guard is hit). Never shown verbatim to people. */
export class DeliveryUnavailable extends Error {}

const BRAND = PLATFORM_CONFIG.name;
const EMAIL_DAILY_LIMIT = Number(process.env.EMAIL_DAILY_LIMIT ?? 400);

export type CodePurpose = "password_reset" | "email_change";

let transport: Transporter | null = null;

/**
 * Any SMTP sender works (a Gmail account with an app password, Resend, Brevo…). SMTP_PORT 465 means TLS from
 * the start; other ports upgrade with STARTTLS.
 */
function smtp(): Transporter {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) throw new DeliveryUnavailable("SMTP_HOST, SMTP_USER and SMTP_PASSWORD must be set");
  const port = Number(process.env.SMTP_PORT ?? 465);
  transport ??= nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass }, connectionTimeout: 10_000, socketTimeout: 15_000 });
  return transport;
}

/**
 * Sends an email through the sender named in EMAIL_PROVIDER. Without one, emails are printed to the server
 * console in development only. In production the send fails closed, so a code can never end up in a log.
 */
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER;
  if (!provider) {
    if (process.env.NODE_ENV === "production") throw new DeliveryUnavailable("Email provider is not configured");
    console.info(`[email:dev] to ${to} | ${subject}\n${text}`);
    return;
  }
  if (provider !== "smtp") throw new DeliveryUnavailable(`Unknown EMAIL_PROVIDER "${provider}"`);
  // Cost guard: a bot hammering the forms must not burn through the sender's daily quota.
  if (!(await allow("email-global", "all", EMAIL_DAILY_LIMIT, WINDOW.day))) throw new DeliveryUnavailable("Daily email limit reached");
  const from = process.env.EMAIL_FROM || `${BRAND} <${process.env.SMTP_USER}>`;
  await smtp().sendMail({ from, to, subject, text });
}

/** Codes are written in the language the person is using the site in (`t` comes from their request). */
export async function deliverCode(to: string, code: string, purpose: CodePurpose, minutes: number, t: TFunction) {
  const label = t(`email.label.${purpose}`);
  await sendEmail(to, `${BRAND}: ${label}`, t("email.body", { label, code, minutes }));
}
