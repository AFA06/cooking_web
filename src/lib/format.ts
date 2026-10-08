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
