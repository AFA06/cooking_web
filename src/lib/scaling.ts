/**
 * Serving-size scaling. Pure functions with no UI or database dependencies, so the
 * same rules can run on the web, in the future mobile app, and on the server.
 */

import { AND_A_HALF, LADLE, NUMBER_WORDS, UNIT_ALIASES, WORD_AMOUNTS, normalizeText } from "@/lib/kitchen-words";

export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 24;

export function clampServings(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, Math.round(value)));
}

type UnitKind = "mass" | "volume" | "largeMetric" | "spoon" | "count";

/**
 * A unit as the rest of the code understands it. Cooks write the same thing many ways
 * (cho'mich, to'la chomich, половник, ожау, ladle, г., ст. л., tbsp); this folds them to one form.
 * Text it does not know is returned cleaned up but otherwise unchanged.
 */
export function canonicalUnit(unit: string): string {
  const text = normalizeText(unit.replace(/\./g, " "));
  if (LADLE.test(text)) return "chomich";
  return UNIT_ALIASES.find(([pattern]) => pattern.test(text))?.[1] ?? text;
}

const UNIT_KINDS: [RegExp, UnitKind][] = [
  [/^(g|gr|gramm?)$/, "mass"],
  [/^ml$/, "volume"],
  [/^(kg|l|litr|lb|oz)$/, "largeMetric"],
  // Measures a cook counts in halves and quarters: spoons, glasses, a ladle, a handful, a pinch.
  [/qoshiq|stakan|piyola|chimdim|chomich|hovuch|tutam|tomchi/, "spoon"],
];

function unitKind(unit: string): UnitKind {
  const normalized = canonicalUnit(unit);
  return UNIT_KINDS.find(([pattern]) => pattern.test(normalized))?.[1] ?? "count";
}

const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875 };

/**
 * Reads "2", "1.5", "1,5", "1/2", "1 1/2" or "1½", and amounts said in words in any of the site's
 * languages: yarim / жарты / пол / half, chorak / четверть / quarter, bir yarim / бір жарым /
 * два с половиной / one and a half, ikki / два / екі / two. Returns null for anything else
 * ("ta’bga ko‘ra", "по вкусу", "to taste").
 */
export function parseQuantity(text: string): number | null {
  const value = text.trim().replace(",", ".");
  if (value === "") return null;

  const word = normalizeText(value);
  if (Object.hasOwn(WORD_AMOUNTS, word)) return WORD_AMOUNTS[word];
  if (Object.hasOwn(NUMBER_WORDS, word)) return NUMBER_WORDS[word];
  const wholeAndHalf = word.match(AND_A_HALF);
  if (wholeAndHalf && Object.hasOwn(NUMBER_WORDS, wholeAndHalf[1])) return NUMBER_WORDS[wholeAndHalf[1]] + 0.5;

  const glyph = value.match(/^(\d+)?\s*([½¼¾⅓⅔⅛⅜⅝⅞])$/);
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
      // Below one spoon a quarter is still measurable; above it, halves are precise enough.
      if (amount >= 1) return roundTo(amount, 0.5);
      return amount < 0.375 ? 0.25 : amount < 0.75 ? 0.5 : 1;
    case "count":
      return Math.max(0.5, roundTo(amount, 0.5));
  }
}

/** Amounts below one are written as words, the way a cook would say them. */
const WORD_BY_PART: Record<string, string> = { "0.25": "¼", "0.5": "½" };

/** English writes 1,250 and 1.5; Uzbek, Russian and Kazakh write 1 250 and 1,5. */
function formatAmount(amount: number, kind: UnitKind, locale: string): string {
  const english = locale === "en";
  if (Number.isInteger(amount)) return amount.toLocaleString(english ? "en-US" : "ru-RU");
  if (kind === "spoon" || kind === "count") {
    const word = WORD_BY_PART[String(amount)];
    if (word) return word;
  }
  const text = amount.toFixed(2).replace(/0+$/, "");
  return english ? text : text.replace(".", ",");
}

/** Writes an amount the way the ingredient lists do, rounded to what the unit can measure. */
export function formatQuantity(amount: number, unit: string, locale = "uz"): string {
  const kind = unitKind(unit);
  return formatAmount(roundForKitchen(amount, kind), kind, locale);
}

/**
 * Scales one ingredient quantity. Text that is not a number is returned unchanged,
 * and a factor of 1 always returns the creator's original text.
 */
export function scaleQuantity(quantity: string, unit: string, factor: number, locale = "uz"): string {
  if (factor === 1) return quantity;
  const amount = parseQuantity(quantity);
  if (amount === null) return quantity;
  return formatQuantity(amount * factor, unit, locale);
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
