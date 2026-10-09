/**
 * Serving-size scaling. Pure functions with no UI or database dependencies, so the
 * same rules can run on the web, in the future mobile app, and on the server.
 */

export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 24;

export function clampServings(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, Math.round(value)));
}

type UnitKind = "mass" | "volume" | "largeMetric" | "spoon" | "count";

const UNIT_KINDS: [RegExp, UnitKind][] = [
  [/^(g|gr|gramm?)$/, "mass"],
  [/^ml$/, "volume"],
  [/^(kg|l|litr)$/, "largeMetric"],
  [/qoshiq|stakan|piyola|chimdim/, "spoon"],
];

function unitKind(unit: string): UnitKind {
  const normalized = unit.trim().toLowerCase();
  return UNIT_KINDS.find(([pattern]) => pattern.test(normalized))?.[1] ?? "count";
}

const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3 };

/** Reads "2", "1.5", "1,5", "1/2", "1 1/2" or "1½". Returns null for anything else ("ta’bga ko‘ra"). */
export function parseQuantity(text: string): number | null {
  const value = text.trim().replace(",", ".");
  if (value === "") return null;

  const glyph = value.match(/^(\d+)?\s*([½¼¾⅓⅔])$/);
  if (glyph) return Number(glyph[1] ?? 0) + FRACTIONS[glyph[2]];

  const mixed = value.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed && Number(mixed[3]) !== 0) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);

  const fraction = value.match(/^(\d+)\/(\d+)$/);
  if (fraction && Number(fraction[2]) !== 0) return Number(fraction[1]) / Number(fraction[2]);

  return /^\d+(\.\d+)?$/.test(value) ? Number(value) : null;
}

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

/** Rounds to an amount a cook can actually measure with the given unit. */
function roundForKitchen(amount: number, kind: UnitKind): number {
  switch (kind) {
    case "mass":
    case "volume":
      if (amount >= 1000) return roundTo(amount, 50);
      if (amount >= 250) return roundTo(amount, 10);
      if (amount >= 20) return roundTo(amount, 5);
      return Math.max(1, Math.round(amount));
    case "largeMetric":
      return Math.max(0.05, roundTo(amount, 0.05));
    case "spoon":
      return Math.max(0.25, roundTo(amount, 0.25));
    case "count":
      return Math.max(0.5, roundTo(amount, 0.5));
  }
}

const GLYPH_BY_PART: Record<string, string> = { "0.25": "¼", "0.5": "½", "0.75": "¾" };

function formatAmount(amount: number, kind: UnitKind): string {
  const whole = Math.floor(amount + 1e-9);
  const part = Number((amount - whole).toFixed(2));
  if (part === 0) return whole.toLocaleString("ru-RU");
  if (kind === "spoon" || kind === "count") {
    const glyph = GLYPH_BY_PART[String(part)];
    if (glyph) return whole === 0 ? glyph : `${whole}${glyph}`;
  }
  return amount.toFixed(2).replace(/0+$/, "").replace(".", ",");
}

/**
 * Scales one ingredient quantity. Text that is not a number is returned unchanged,
 * and a factor of 1 always returns the creator's original text.
 */
export function scaleQuantity(quantity: string, unit: string, factor: number): string {
  if (factor === 1) return quantity;
  const amount = parseQuantity(quantity);
  if (amount === null) return quantity;
  const kind = unitKind(unit);
  return formatAmount(roundForKitchen(amount * factor, kind), kind);
}

const roundMinutes = (minutes: number) => (minutes <= 0 ? 0 : Math.max(5, roundTo(minutes, 5)));

/**
 * Estimates times for a different number of servings.
 * Preparation grows with the amount of food, but not one-for-one: setting up and cleaning
 * do not double. Cooking barely changes — a bigger pot simmers for about as long — so it
 * moves by at most a quarter in either direction.
 */
export function scaleTimes(prepMinutes: number, cookMinutes: number, factor: number): { prep: number; cook: number; total: number } {
  if (factor === 1) return { prep: prepMinutes, cook: cookMinutes, total: prepMinutes + cookMinutes };
  const prep = roundMinutes(prepMinutes * (0.4 + 0.6 * factor));
  const cookFactor = Math.min(1.25, Math.max(0.75, 1 + 0.12 * (factor - 1)));
  const cook = roundMinutes(cookMinutes * cookFactor);
  return { prep, cook, total: prep + cook };
}
