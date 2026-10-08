export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "—";
  if (minutes < 60) return `${minutes} daq.`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} soat ${mins} daq.` : `${hours} soat`;
}

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatPrice(amount: number, currency: string): string {
  const unit = currency === "UZS" ? "so‘m" : currency;
  return `${amount.toLocaleString("ru-RU")} ${unit}`;
}

export function toIsoDuration(minutes: number): string {
  return `PT${Math.max(0, Math.round(minutes))}M`;
}

export const DIFFICULTY_LABEL = { easy: "Oson", medium: "O‘rtacha", hard: "Murakkab" } as const;

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("uz-UZ", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];

/** Accepts a Date, an ISO string or a Postgres timestamp string. */
export function toDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  const iso = value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00");
  return new Date(iso);
}

/** "8-okt" for a YYYY-MM-DD day key. */
export function formatDayKey(day: string): string {
  const [, m, d] = day.split("-").map(Number);
  return `${d}-${MONTHS[m - 1]}`;
}

export function formatShortDate(value: Date | string): string {
  const d = toDate(value);
  return `${d.getDate()}-${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("ru-RU");
}

export function formatRelative(value: Date | string | null): string {
  if (!value) return "—";
  const minutes = Math.round((Date.now() - toDate(value).getTime()) / 60000);
  if (minutes < 1) return "hozirgina";
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} kun oldin`;
  return formatShortDate(value);
}
