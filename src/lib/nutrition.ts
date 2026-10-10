/**
 * Estimates what one serving of a recipe contains, from its ingredient list.
 * Pure functions with no UI or database dependencies. The result is a starting point for
 * the author to check: free-text ingredients are matched by keyword against the table below,
 * and anything that cannot be weighed is reported back instead of being guessed.
 */
import { parseQuantity } from "@/lib/scaling";
import type { RecipeNutrition } from "@/types/recipe";

interface Food {
  /** Lowercase words to look for in the ingredient name; the longest hit across all foods wins. */
  names: string[];
  /** Per 100 g of the raw product: kcal, protein, fat, carbohydrate. */
  per100: [calories: number, protein: number, fat: number, carbs: number];
  /** Grams in one piece ("2 ta sabzi"). */
  piece?: number;
  /** Grams in a 200 ml glass. Without it, liquids weigh 200 g and dry goods are not converted. */
  glass?: number;
  /** Grams in a level tablespoon; a teaspoon is a third of it. */
  spoon?: number;
  /** Grams in a head (garlic, cabbage) or a bunch (herbs). */
  head?: number;
  bunch?: number;
  /** Grams per millilitre, for foods measured by volume. */
  density?: number;
}

const HERB = { per100: [40, 3, 0.5, 6], bunch: 50, spoon: 4 } satisfies Omit<Food, "names">;
/** Seasonings and water add nothing worth counting, in whatever unit they are given. */
const NEGLIGIBLE = ["tuz", "suv", "zira", "murch", "ziravor", "lavr", "sirka", "soda", "xamirturush", "choy", "vanilin", "dolchin", "zarchava", "zafaron", "kashnich urug", "paprika", "muz"];

const FOODS: Food[] = [
  { names: ["guruch"], per100: [344, 6.7, 0.7, 78.9], glass: 180, spoon: 20 },
  { names: ["un"], per100: [364, 10.3, 1.1, 76], glass: 130, spoon: 20 },
  { names: ["kraxmal"], per100: [330, 0.3, 0, 80], spoon: 20 },
  { names: ["makaron", "lag'mon", "ugra", "spagetti", "vermishel"], per100: [337, 10.4, 1.1, 69.7] },
  { names: ["qatlamali xamir", "tayyor xamir"], per100: [340, 6, 18.5, 39.5] },
  { names: ["xamir"], per100: [250, 7, 2, 50] },
  { names: ["non"], per100: [250, 8, 1, 50], piece: 250 },
  { names: ["no'xat"], per100: [309, 20, 4.3, 46], glass: 200 },
  { names: ["mosh"], per100: [300, 23.5, 2, 46], glass: 200 },
  { names: ["loviya"], per100: [298, 21, 2, 47], glass: 200 },

  { names: ["qo'y go'shti"], per100: [230, 17, 18, 0] },
  { names: ["mol go'shti"], per100: [187, 18.9, 12.4, 0] },
  { names: ["tovuq filesi", "tovuq ko'kragi"], per100: [113, 23.6, 1.9, 0.4] },
  { names: ["tovuq"], per100: [190, 18, 13, 0] },
  { names: ["qiyma"], per100: [260, 17, 21, 0] },
  { names: ["go'sht"], per100: [200, 18, 14, 0] },
  { names: ["baliq"], per100: [120, 19, 5, 0] },
  { names: ["dumba"], per100: [897, 0, 99, 0] },

  { names: ["tuxum sarig'i"], per100: [352, 16.2, 31.2, 1], piece: 18 },
  { names: ["tuxum oqi"], per100: [44, 11, 0, 0], piece: 33 },
  { names: ["tuxum"], per100: [157, 12.7, 10.9, 0.7], piece: 55 },
  { names: ["sut"], per100: [60, 3, 3.2, 4.7], density: 1.03 },
  { names: ["qatiq", "kefir", "yogurt"], per100: [59, 2.9, 3.2, 4], density: 1.03, spoon: 18 },
  { names: ["qaymoq", "smetana"], per100: [206, 2.8, 20, 3.2], density: 1, spoon: 20 },
  { names: ["suzma", "tvorog"], per100: [160, 16.7, 9, 2], spoon: 20 },
  { names: ["pishloq"], per100: [350, 25, 27, 0] },
  { names: ["saryog'", "sariyog'"], per100: [748, 0.5, 82.5, 0.8], spoon: 15 },
  { names: ["yog'"], per100: [899, 0, 99.9, 0], density: 0.92, spoon: 14 },

  { names: ["sabzi"], per100: [35, 1.3, 0.1, 6.9], piece: 100 },
  { names: ["piyoz"], per100: [41, 1.4, 0, 8.2], piece: 100 },
  { names: ["sarimsoq"], per100: [149, 6.5, 0.5, 30], piece: 5, head: 40 },
  { names: ["kartoshka"], per100: [77, 2, 0.4, 16.3], piece: 120 },
  { names: ["tomat pastasi"], per100: [102, 4.8, 0, 19], spoon: 20 },
  { names: ["pomidor"], per100: [20, 0.6, 0.2, 4.2], piece: 120 },
  { names: ["bodring"], per100: [15, 0.8, 0.1, 2.8], piece: 100 },
  { names: ["achchiq qalampir"], per100: [40, 2, 0.2, 7.5], piece: 15 },
  { names: ["qalampir"], per100: [27, 1.3, 0, 5.3], piece: 150 },
  { names: ["karam"], per100: [27, 1.8, 0.1, 4.7], head: 1200 },
  { names: ["baqlajon"], per100: [24, 1.2, 0.1, 4.5], piece: 250 },
  { names: ["oshqovoq", "qovoq"], per100: [22, 1, 0.1, 4.4] },
  { names: ["sholg'om"], per100: [32, 1.5, 0.1, 6.2], piece: 150 },
  { names: ["lavlagi"], per100: [42, 1.5, 0.1, 8.8], piece: 200 },
  { names: ["turp", "rediska"], per100: [20, 1.2, 0.1, 3.4], piece: 20 },
  { names: ["ko'k piyoz", "shivit", "ukrop", "kinza", "kashnich", "petrushka", "rayhon", "ko'kat", "jambil", "yalpiz"], ...HERB },

  { names: ["shakar", "qand"], per100: [399, 0, 0, 99.8], glass: 180, spoon: 20 },
  { names: ["asal"], per100: [328, 0.8, 0, 80], spoon: 25 },
  { names: ["shokolad"], per100: [546, 5, 35, 53] },
  { names: ["kakao"], per100: [289, 24, 15, 10], spoon: 12 },
  { names: ["mayiz"], per100: [264, 2.9, 0.6, 66], glass: 150, spoon: 15 },
  { names: ["yong'oq", "bodom", "pista"], per100: [654, 15, 65, 7], glass: 130, spoon: 15 },
  { names: ["olma"], per100: [47, 0.4, 0.4, 9.8], piece: 150 },
  { names: ["limon"], per100: [34, 0.9, 0.1, 3], piece: 100 },
  { names: ["banan"], per100: [96, 1.5, 0.5, 21], piece: 120 },
  { names: ["qulupnay", "malina", "olcha", "gilos"], per100: [45, 0.8, 0.4, 9], glass: 150 },
];

/** Every way Uzbek text writes the ‘ and ’ marks becomes a plain apostrophe. */
const normalize = (text: string) => text.toLowerCase().replace(/[‘’ʻʼ`´]/g, "'").trim();

function findFood(name: string): Food | "negligible" | null {
  const text = normalize(name);
  let best: { food: Food | "negligible"; length: number } | null = null;
  const consider = (food: Food | "negligible", word: string) => {
    if (text.includes(word) && (!best || word.length > best.length)) best = { food, length: word.length };
  };
  NEGLIGIBLE.forEach((word) => consider("negligible", word));
  FOODS.forEach((food) => food.names.forEach((word) => consider(food, word)));
  return (best as { food: Food | "negligible" } | null)?.food ?? null;
}

/** Weight of an amount of a food in grams, or null when the unit cannot be weighed for it. */
function toGrams(food: Food, amount: number, unitText: string): number | null {
  const unit = normalize(unitText);
  const has = (pattern: RegExp) => pattern.test(unit);
  const liquid = food.density !== undefined;

  if (has(/^kg\b/)) return amount * 1000;
  if (has(/^(g|gr|gramm?)\b/)) return amount;
  if (has(/^ml\b/)) return liquid ? amount * food.density! : null;
  if (has(/^(l|litr)\b/)) return liquid ? amount * 1000 * food.density! : null;
  if (has(/stakan|piyola/)) return food.glass !== undefined ? amount * food.glass : liquid ? amount * 200 * food.density! : null;
  if (has(/osh qoshiq/)) return food.spoon !== undefined ? amount * food.spoon : null;
  if (has(/choy qoshiq/)) return food.spoon !== undefined ? (amount * food.spoon) / 3 : null;
  if (has(/chimdim/)) return amount;
  if (has(/bosh/)) return food.head !== undefined ? amount * food.head : null;
  if (has(/bog'|dasta/)) return food.bunch !== undefined ? amount * food.bunch : null;
  if (unit === "" || has(/^(ta|dona|tish|bo'lak)\b/)) {
    if (food.piece === undefined) return null;
    const size = has(/katta/) ? 1.4 : has(/kichik|mayda/) ? 0.7 : 1;
    return amount * food.piece * size;
  }
  return null;
}

export interface NutritionEstimate {
  /** One serving, rounded to whole numbers. Null when nothing could be counted. */
  perServing: RecipeNutrition | null;
  /** Names of the ingredients that were left out of the sum. */
  skipped: string[];
}

/** Sums the whole dish from its ingredients and divides it by the number of servings. */
export function estimateNutrition(ingredients: { name: string; quantity: string; unit: string }[], servings: number): NutritionEstimate {
  const total = [0, 0, 0, 0];
  const skipped: string[] = [];
  let counted = 0;

  for (const ingredient of ingredients) {
    if (ingredient.name.trim() === "") continue;
    const food = findFood(ingredient.name);
    if (food === "negligible") continue;
    const amount = parseQuantity(ingredient.quantity);
    const grams = food && amount !== null ? toGrams(food, amount, ingredient.unit) : null;
    if (!food || grams === null) {
      skipped.push(ingredient.name.trim());
      continue;
    }
    food.per100.forEach((value, i) => (total[i] += (value * grams) / 100));
    counted += 1;
  }

  if (counted === 0 || !Number.isFinite(servings) || servings < 1) return { perServing: null, skipped };
  const [calories, proteinGrams, fatGrams, carbGrams] = total.map((value) => Math.round(value / servings));
  return { perServing: { calories, proteinGrams, fatGrams, carbGrams }, skipped };
}
