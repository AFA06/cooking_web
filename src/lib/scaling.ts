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

const APOSTROPHES = /[‘’ʻʼ`´]/g;

/** Other ways of writing the units this file knows, folded to the Latin Uzbek form (whole text must match). */
const UNIT_ALIASES: [RegExp, string][] = [
  [/^(g|gr|gramm?|г|гр|грамм?|граммов)$/, "g"],
  [/^(kg|kilo|kilogramm?|кг|килограмм\w*)$/, "kg"],
  [/^(ml|millilitr|мл|миллилитр\w*)$/, "ml"],
  [/^(l|lt|litr|л|литр\w*)$/, "l"],
  [/^(osh ?qoshiq|ст ?л|столов\w* ложк\w*)$/, "osh qoshiq"],
  [/^(choy ?qoshiq|ч ?л|чайн\w* ложк\w*)$/, "choy qoshiq"],
  [/^(stakan\w*|стакан\w*)$/, "stakan"],
  [/^(chimdim|щепотк\w*)$/, "chimdim"],
  [/^(hovuch\w*|горст\w*|пригоршн\w*)$/, "hovuch"],
  [/^(tomchi|капл\w*)$/, "tomchi"],
  [/^(ta|dona|шт|штук\w*)$/, "ta"],
  [/^(tish|зубчик\w*)$/, "tish"],
  [/^(bosh|головк\w*)$/, "bosh"],
  [/^(bog'|dasta|пучок|пучк\w*)$/, "bog'"],
];

/**
 * A unit as the rest of the code understands it. Cooks write the same thing many ways
 * (cho'mich, chumich, “to'la chomich”, половник, г., ст. л.); this folds them to one form.
 * Text it does not know is returned cleaned up but otherwise unchanged.
 */
export function canonicalUnit(unit: string): string {
  const text = unit.toLowerCase().replace(APOSTROPHES, "'").replace(/\./g, " ").replace(/\s+/g, " ").trim();
  // A ladle, however it is qualified ("to'la chomich", "chomich to'ldirib").
  if (/ch[ou]'?mich|половник|черпак|поварешк/.test(text)) return "chomich";
  return UNIT_ALIASES.find(([pattern]) => pattern.test(text))?.[1] ?? text;
}

const UNIT_KINDS: [RegExp, UnitKind][] = [
  [/^(g|gr|gramm?)$/, "mass"],
  [/^ml$/, "volume"],
  [/^(kg|l|litr)$/, "largeMetric"],
  // Measures a cook counts in halves and quarters: spoons, glasses, a ladle, a handful, a pinch.
  [/qoshiq|stakan|piyola|chimdim|chomich|hovuch|tutam|tomchi/, "spoon"],
];

function unitKind(unit: string): UnitKind {
  const normalized = canonicalUnit(unit);
  return UNIT_KINDS.find(([pattern]) => pattern.test(normalized))?.[1] ?? "count";
}

const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3 };

/** Amounts a cook says instead of writing: "yarim chomich" is half a ladle. */
const WORD_AMOUNTS: Record<string, number> = { yarim: 0.5, chorak: 0.25, "половина": 0.5, "полтора": 1.5, "четверть": 0.25 };
const NUMBER_WORDS: Record<string, number> = { bir: 1, ikki: 2, uch: 3, "to'rt": 4, besh: 5, olti: 6, yetti: 7, sakkiz: 8, "to'qqiz": 9, "o'n": 10 };

/**
 * Reads "2", "1.5", "1,5", "1/2", "1 1/2" or "1½", and the words "yarim" (half), "chorak" (quarter),
 * "bir yarim" (one and a half) and "ikki" (two). Returns null for anything else ("ta’bga ko‘ra").
 */
export function parseQuantity(text: string): number | null {
  const value = text.trim().replace(",", ".");
  if (value === "") return null;

  const word = value.toLowerCase().replace(APOSTROPHES, "'").replace(/\s+/g, " ");
  if (Object.hasOwn(WORD_AMOUNTS, word)) return WORD_AMOUNTS[word];
  if (Object.hasOwn(NUMBER_WORDS, word)) return NUMBER_WORDS[word];
  const wholeAndHalf = word.match(/^(\S+) yarim$/);
  if (wholeAndHalf && Object.hasOwn(NUMBER_WORDS, wholeAndHalf[1])) return NUMBER_WORDS[wholeAndHalf[1]] + 0.5;

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
      // Below one spoon a quarter is still measurable; above it, halves are precise enough.
      if (amount >= 1) return roundTo(amount, 0.5);
      return amount < 0.375 ? 0.25 : amount < 0.75 ? 0.5 : 1;
    case "count":
      return Math.max(0.5, roundTo(amount, 0.5));
  }
}

/** Amounts below one are written as words, the way a cook would say them. */
const WORD_BY_PART: Record<string, string> = { "0.25": "¼", "0.5": "½" };

function formatAmount(amount: number, kind: UnitKind): string {
  if (Number.isInteger(amount)) return amount.toLocaleString("ru-RU");
  if (kind === "spoon" || kind === "count") {
    const word = WORD_BY_PART[String(amount)];
    if (word) return word;
  }
  return amount.toFixed(2).replace(/0+$/, "").replace(".", ",");
}

/** Writes an amount the way the ingredient lists do, rounded to what the unit can measure. */
export function formatQuantity(amount: number, unit: string): string {
  const kind = unitKind(unit);
  return formatAmount(roundForKitchen(amount, kind), kind);
}

/**
 * Scales one ingredient quantity. Text that is not a number is returned unchanged,
 * and a factor of 1 always returns the creator's original text.
 */
export function scaleQuantity(quantity: string, unit: string, factor: number): string {
  if (factor === 1) return quantity;
  const amount = parseQuantity(quantity);
  if (amount === null) return quantity;
  return formatQuantity(amount * factor, unit);
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
