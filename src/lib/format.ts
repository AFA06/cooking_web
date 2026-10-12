import { LOCALE_INFO, type Locale, type TFunction } from "@/i18n/core";

export function formatMinutes(minutes: number, t: TFunction): string {
  if (minutes <= 0) return "—";
  if (minutes < 60) return t("time.min", { count: minutes });
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? t("time.hoursMin", { hours, mins }) : t("time.hours", { count: hours });
}

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatPrice(amount: number, currency: string, t: TFunction): string {
  const unit = currency === "UZS" ? t("unit.som") : currency;
  return `${amount.toLocaleString("ru-RU")} ${unit}`;
}

export function toIsoDuration(minutes: number): string {
  return `PT${Math.max(0, Math.round(minutes))}M`;
}

export const DIFFICULTY_KEY = { easy: "difficulty.easy", medium: "difficulty.medium", hard: "difficulty.hard" } as const;

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_INFO[locale].intl, { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** Accepts a Date, an ISO string or a Postgres timestamp string. */
export function toDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  const iso = value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00");
  return new Date(iso);
}

/** "8 Oct" for a YYYY-MM-DD day key. */
export function formatDayKey(day: string, locale: Locale): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Intl.DateTimeFormat(LOCALE_INFO[locale].intl, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatShortDate(value: Date | string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_INFO[locale].intl, { day: "numeric", month: "short", year: "numeric" }).format(toDate(value));
}

export function formatNumber(n: number): string {
  return n.toLocaleString("ru-RU");
}

export function formatRelative(value: Date | string | null, t: TFunction, locale: Locale): string {
  if (!value) return "—";
  const minutes = Math.round((Date.now() - toDate(value).getTime()) / 60000);
  if (minutes < 1) return t("time.justNow");
  if (minutes < 60) return t("time.minAgo", { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t("time.hoursAgo", { count: hours });
  const days = Math.round(hours / 24);
  if (days < 30) return t("time.daysAgo", { count: days });
  return formatShortDate(value, locale);
}
