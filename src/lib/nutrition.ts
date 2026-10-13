/**
 * Estimates what one serving of a recipe contains, from its ingredient list.
 * Pure functions with no UI or database dependencies. The result is a starting point for
 * the author to check: free-text ingredients are matched by keyword against the table below,
 * and anything that cannot be weighed is reported back instead of being guessed.
 */
import { normalizeText } from "@/lib/kitchen-words";
import { canonicalUnit, parseQuantity } from "@/lib/scaling";
import type { RecipeNutrition } from "@/types/recipe";

interface Food {
  /** Uzbek (Latin) words to look for inside the ingredient name; the longest hit across all foods wins. */
  names: string[];
  /** Match `names` as whole words only: for short words that also sit inside other words. */
  exactNames?: boolean;
  /** The same food in Russian, Kazakh and English, see ALIASES. Filled in from that table. */
  aliases?: string[];
  /** A spice or a vegetable depending on the amount ("pepper"): a pinch or a few grams is a spice and is not counted. */
  seasoningIfSmall?: boolean;
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
  { names: ["un"], exactNames: true, per100: [364, 10.3, 1.1, 76], glass: 130, spoon: 20 },
  { names: ["kraxmal"], per100: [330, 0.3, 0, 80], spoon: 20 },
  { names: ["makaron", "lag'mon", "ugra", "spagetti", "vermishel"], per100: [337, 10.4, 1.1, 69.7] },
  { names: ["qatlamali xamir", "tayyor xamir"], per100: [340, 6, 18.5, 39.5] },
  { names: ["xamir"], per100: [250, 7, 2, 50] },
  { names: ["non"], exactNames: true, per100: [250, 8, 1, 50], piece: 250 },
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
  // Plain "pepper": the spice in a pinch, the vegetable when it is counted in pieces or weighed in bulk.
  { names: [], aliases: ["перец", "перцы", "перца", "бұрыш", "pepper"], per100: [27, 1.3, 0, 5.3], piece: 150, seasoningIfSmall: true },
];

/** Seasonings, liquids and the like that add nothing worth counting, in Russian, Kazakh and English. */
const NEGLIGIBLE_ALIASES = [
  // Russian
  "соль", "=вода", "=воды", "=воду", "=водой", "специ", "приправ", "уксус", "=сода", "=соды", "дрожж", "=чай", "=чая", "ванил", "кориц",
  "шафран", "лавров", "=лавр", "зира", "кумин", "куркум", "паприк", "=лед", "=льда", "кориандр", "мускат", "разрыхлител", "гвоздик",
  "черный перец", "молотый перец", "перец горошком", "чёрный перец",
  // Kazakh
  "тұз", "=су", "=суы", "дәмдеуіш", "сірке", "ашытқы", "=шай", "даршын", "запыран", "заппыран", "зире", "зере", "куркума", "паприка", "мұз", 
  "қара бұрыш",
  // English
  "salt", "=water", "spice", "seasoning", "vinegar", "baking soda", "baking powder", "=soda", "yeast", "=tea", "vanilla", "cinnamon", "saffron",
  "bay leaf", "bay leaves", "cumin", "turmeric", "paprika", "=ice", "coriander", "nutmeg", "cloves", "cardamom",
  "black pepper", "ground pepper",
];

/**
 * The same foods as above in Russian, Kazakh (Cyrillic) and English, keyed by the first Uzbek name.
 * A word is a stem matched at the start of a word ("морков" finds морковь, моркови, морковка);
 * "=word" must be the whole word; a longer hit beats a shorter one ("куриная грудка" over "курин").
 */
const ALIASES: Record<string, string[]> = {
  guruch: ["рис", "күріш", "rice"],
  un: ["мук", "=ұн", "=ұны", "flour"],
  kraxmal: ["крахмал", "starch", "cornstarch"],
  makaron: ["макарон", "спагетти", "вермишел", "лапш", "лагман", "кеспе", "pasta", "noodle", "spaghetti", "vermicelli", "macaroni"],
  "qatlamali xamir": ["слоеное тесто", "слоен", "puff pastry", "қатпарлы қамыр", "готовое тесто", "ready dough"],
  xamir: ["тест", "dough", "қамыр"],
  non: ["хлеб", "лаваш", "=нан", "bread", "batard"],
  "no'xat": ["=нут", "=нута", "=нуту", "=нутом", "ноқат", "chickpea", "garbanzo"],
  mosh: ["=маш", "=маша", "мәш", "mung"],
  loviya: ["фасол", "лобия", "лобио", "bean"],
  "qo'y go'shti": ["баранин", "қой еті", "қой ет", "lamb", "mutton"],
  "mol go'shti": ["говядин", "телятин", "сиыр еті", "сиыр ет", "бұзау", "beef", "veal"],
  "tovuq filesi": ["куриное филе", "куриная грудк", "филе курицы", "тауық филесі", "тауық төсі", "chicken breast", "chicken fillet", "chicken filet"],
  tovuq: ["куриц", "курин", "цыпл", "тауық", "chicken", "poultry"],
  qiyma: ["фарш", "қиыма", "minced", "mince", "ground beef", "ground lamb", "ground meat", "ground chicken"],
  "go'sht": ["мяс", "=ет", "=еті", "meat"],
  baliq: ["рыб", "балық", "fish", "salmon", "tuna"],
  dumba: ["курдюк", "бараний жир", "құйрық", "tail fat", "lamb fat", "fat tail"],
  "tuxum sarig'i": ["желток", "сарысы", "yolk"],
  "tuxum oqi": ["яичный белок", "белок", "ақуыз", "egg white"],
  tuxum: ["яйц", "яиц", "яичн", "жұмыртқ", "egg"],
  sut: ["молок", "сүт", "milk"],
  qatiq: ["кефир", "йогурт", "простокваш", "катык", "қатық", "айран", "ayran", "yogurt", "yoghurt", "kefir", "buttermilk"],
  qaymoq: ["сметан", "сливк", "қаймақ", "sour cream", "cream"],
  suzma: ["творог", "сүзбе", "cottage cheese", "quark"],
  pishloq: ["=сыр", "=сыра", "=сыру", "=сыром", "=сыры", "брынз", "ірімшік", "cheese"],
  "saryog'": ["сливочн", "сары май", "топлен", "butter", "ghee"],
  "yog'": ["масло", "растительн", "подсолнечн", "оливков", "өсімдік май", "=май", "=майы", "oil"],
  sabzi: ["морков", "сәбіз", "carrot"],
  piyoz: ["=лук", "=лука", "=луку", "=луком", "луковиц", "репчат", "пияз", "onion"],
  sarimsoq: ["чесн", "сарымсақ", "garlic"],
  kartoshka: ["картофел", "картошк", "картоп", "potato"],
  "tomat pastasi": ["томатная паста", "томатной пасты", "паста томатная", "томатн", "томат паст", "қызанақ паст", "tomato paste", "tomato puree", "tomato purée"],
  pomidor: ["помидор", "томат", "қызанақ", "tomato"],
  bodring: ["огур", "қияр", "cucumber"],
  "achchiq qalampir": ["острый перец", "острого перца", "перец острый", "перец остр", "перец чили", "жгучий перец", "чили", "халапеньо", "ащы бұрыш", "chili", "chilli", "chile", "hot pepper", "jalapeno"],
  qalampir: ["болгар", "сладкий перец", "сладкого перца", "перец сладк", "тәтті бұрыш", "bell pepper", "sweet pepper", "capsicum"],
  karam: ["капуст", "орамжапырақ", "cabbage"],
  baqlajon: ["баклажан", "баялды", "eggplant", "aubergine"],
  oshqovoq: ["тыкв", "кабачк", "кабачок", "цуккини", "асқабақ", "pumpkin", "squash", "zucchini", "courgette"],
  "sholg'om": ["=репа", "=репы", "=репу", "шалқан", "turnip"],
  lavlagi: ["свекл", "қызылша", "beet"],
  turp: ["редис", "редьк", "шалғам", "radish", "daikon"],
  "ko'k piyoz": ["зелен", "жасыл пияз", "укроп", "кинза", "петрушк", "базилик", "мят", "жалбыз", "райхан", "=көк", "dill", "cilantro", "parsley", "basil", "mint", "herbs", "greens", "green onion", "spring onion", "scallion", "coriander leaves"],
  shakar: ["сахар", "қант", "sugar"],
  asal: ["=мед", "=меда", "=меду", "=медом", "=бал", "=балы", "honey"],
  shokolad: ["шоколад", "chocolate"],
  kakao: ["какао", "cocoa", "cacao"],
  mayiz: ["изюм", "мейіз", "raisin", "sultana"],
  "yong'oq": ["орех", "орешк", "грецк", "арахис", "миндал", "фисташк", "фундук", "кешью", "жаңғақ", "бадам", "пісте", "walnut", "almond", "pistachio", "peanut butter", "peanut", "hazelnut", "cashew", "=nuts", "=nut"],
  olma: ["яблок", "алма", "apple"],
  limon: ["лимон", "лайм", "lemon", "lime"],
  banan: ["банан", "banana"],
  qulupnay: ["клубник", "малин", "вишн", "черешн", "құлпынай", "таңқурай", "шие", "strawberr", "raspberr", "cherr", "blueberr", "berry", "berries"],
};
FOODS.forEach((food) => {
  if (food.names[0] && ALIASES[food.names[0]]) food.aliases = [...(food.aliases ?? []), ...ALIASES[food.names[0]]];
});

/** Alias keys that name no food: a typo there silently loses a whole language for that food. For the tests. */
export const unmatchedAliasKeys = () => Object.keys(ALIASES).filter((key) => !FOODS.some((food) => food.names[0] === key));

const normalize = normalizeText;

const tokensOf = (text: string) => text.split(/[^\p{L}\p{N}']+/u).filter(Boolean);
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** One alias against a normalized name: "=word" is a whole word, anything else is the start of a word. */
function matchesAlias(text: string, alias: string): boolean {
  if (alias.startsWith("=")) return tokensOf(text).includes(alias.slice(1));
  return new RegExp(`(^|[^\\p{L}])${escapeRegex(alias)}`, "u").test(text);
}

const aliasLength = (alias: string) => alias.replace(/^=/, "").length;

/** A broth is made from meat, not meat: "chicken broth" is water with a little flavour whatever it is made of. */
const BROTH = ["бульон", "сорпа", "отвар", "broth", "stock", "bouillon"];

function findFood(name: string): Food | "negligible" | null {
  const text = normalize(name);
  if (BROTH.some((word) => matchesAlias(text, word))) return "negligible";
  let best: { food: Food | "negligible"; length: number } | null = null;
  const consider = (food: Food | "negligible", length: number) => {
    if (!best || length > best.length) best = { food, length };
  };
  NEGLIGIBLE.forEach((word) => text.includes(word) && consider("negligible", word.length));
  NEGLIGIBLE_ALIASES.forEach((alias) => matchesAlias(text, alias) && consider("negligible", aliasLength(alias)));
  for (const food of FOODS) {
    for (const word of food.names) {
      if (food.exactNames ? matchesAlias(text, `=${word}`) : text.includes(word)) consider(food, word.length);
    }
    for (const alias of food.aliases ?? []) if (matchesAlias(text, alias)) consider(food, aliasLength(alias));
  }
  return (best as { food: Food | "negligible" } | null)?.food ?? null;
}

/** What a ladle (chomich) holds. Kitchen ladles vary a lot; this is the usual home one and is only a starting estimate. */
const LADLE_ML = 150;
/** What one handful (hovuch) of a dry or leafy food weighs. */
const HANDFUL_G = 30;

/** Weight of an amount of a food in grams, or null when the unit cannot be weighed for it. */
function toGrams(food: Food, amount: number, unitText: string): number | null {
  const unit = canonicalUnit(unitText);
  const has = (pattern: RegExp) => pattern.test(unit);
  const liquid = food.density !== undefined;

  if (has(/^lb$/)) return amount * 453.6;
  if (has(/^oz$/)) return amount * 28.35;
  if (has(/^kg\b/)) return amount * 1000;
  if (has(/^(g|gr|gramm?)\b/)) return amount;
  if (has(/^ml\b/)) return liquid ? amount * food.density! : null;
  if (has(/^(l|litr)\b/)) return liquid ? amount * 1000 * food.density! : null;
  if (has(/stakan|piyola/)) return food.glass !== undefined ? amount * food.glass : liquid ? amount * 200 * food.density! : null;
  if (has(/^chomich$/)) return liquid ? amount * LADLE_ML * food.density! : food.glass !== undefined ? (amount * food.glass * LADLE_ML) / 200 : null;
  if (has(/^hovuch$/)) return liquid ? null : amount * HANDFUL_G;
  if (has(/^tutam$/)) return amount * 2;
  if (has(/^tomchi$/)) return amount * 0.05;
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
    // A pinch or a few grams of plain "pepper" is a spice, not a vegetable.
    if (food?.seasoningIfSmall && (grams === null || grams <= 10)) continue;
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
