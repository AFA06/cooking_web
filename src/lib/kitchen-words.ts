/**
 * What cooks write in the ingredient fields, in the languages the site speaks: Uzbek (Latin),
 * Russian, Kazakh (Cyrillic) and English. Pure data. lib/scaling.ts and lib/nutrition.ts read it,
 * so a creator can write in their own language and amounts, servings and calories still work.
 *
 * Everything here is compared after `normalizeText`: lowercase, ё = е, one kind of apostrophe.
 */

/** Lowercase, ё → е, every kind of apostrophe → ', one space between words. */
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/ё/g, "е").replace(/[‘’ʻʼ`´]/g, "'").replace(/\s+/g, " ").trim();
}

/**
 * Other spellings of the units the code knows, folded to one canonical form (the whole text must
 * match). The canonical forms: g, kg, ml, l, lb, oz, osh qoshiq, choy qoshiq, stakan, piyola,
 * chimdim, tutam, hovuch, tomchi, ta, tish, bosh, bog'. A ladle is "chomich", see LADLE.
 * Written against normalized text: dots are already spaces, so "ст. л." is "ст л".
 */
export const UNIT_ALIASES: [RegExp, string][] = [
  [/^(g|gr|gm|gms|gramm?s?|г|гр|грамм\S*)$/, "g"],
  [/^(kg|kgs|kilo|kilos|kilogramm?s?|кг|кило|килограмм\S*|келі)$/, "kg"],
  [/^(ml|mls|millilit(er|re)s?|мл|миллилитр\S*)$/, "ml"],
  [/^(l|lt|lit(er|re|r)s?|л|литр\S*)$/, "l"],
  [/^(lb|lbs|pounds?)$/, "lb"],
  [/^(oz|ounces?)$/, "oz"],
  [/^(osh ?qoshiq|oshqoshiq|osh q|tbsp|tbs|tablespoons?|table spoons?|ст ?л|ст ?ложк\S*|столов\S* ложк\S*|ас ?қасық\S*|ас ?қ)$/, "osh qoshiq"],
  [/^(choy ?qoshiq|choyqoshiq|choy q|tsp|teaspoons?|tea spoons?|ч ?л|ч ?ложк\S*|чайн\S* ложк\S*|шай ?қасық\S*|шай ?қ)$/, "choy qoshiq"],
  [/^(stakan\S*|стакан\S*|стақан\S*|glass(es)?|cups?|чашк\S*)$/, "stakan"],
  [/^(piyola\S*|кесе\S*|пиал\S*|bowls?|мис\S*)$/, "piyola"],
  [/^(chimdim|щепотк\S*|щепоть|pinch(es)?|dash(es)?|шымшым\S*)$/, "chimdim"],
  [/^(tutam\S*)$/, "tutam"],
  [/^(hovuch\S*|горсть|горсти|горсточк\S*|пригоршн\S*|handfuls?|уыс\S*)$/, "hovuch"],
  [/^(tomchi\S*|капл\S*|drops?|тамшы\S*)$/, "tomchi"],
  [/^(ta|dona|pcs?|pieces?|whole|шт|штук\S*|тал|дана)$/, "ta"],
  [/^(tish|cloves?|зубчик\S*|зубок|тіс\S*)$/, "tish"],
  [/^(bosh|heads?|головк\S*|голов\S*|бас)$/, "bosh"],
  [/^(bog'?|dasta|bunch(es)?|пучок|пучк\S*|бума)$/, "bog'"],
];

/** A ladle, however it is written or qualified ("to'la chomich", "chomich to'ldirib", половник, ожау, ladle). */
export const LADLE = /ch[ou]'?mich|половник|черпак|поварешк|ожау|ladle/;

/** Whole words that are an amount by themselves. */
export const WORD_AMOUNTS: Record<string, number> = {
  // half
  yarim: 0.5, yarmi: 0.5, жарты: 0.5, половина: 0.5, пол: 0.5, half: 0.5,
  // quarter, third
  chorak: 0.25, ширек: 0.25, четверть: 0.25, quarter: 0.25, треть: 1 / 3,
  // one and a half
  полтора: 1.5, полторы: 1.5,
};

export const NUMBER_WORDS: Record<string, number> = {
  // Uzbek
  bir: 1, ikki: 2, uch: 3, "to'rt": 4, besh: 5, olti: 6, yetti: 7, sakkiz: 8, "to'qqiz": 9, "o'n": 10,
  // Russian
  один: 1, одна: 1, одно: 1, два: 2, две: 2, три: 3, четыре: 4, пять: 5, шесть: 6, семь: 7, восемь: 8, девять: 9, десять: 10,
  // Kazakh
  бір: 1, екі: 2, үш: 3, төрт: 4, бес: 5, алты: 6, жеті: 7, сегіз: 8, тоғыз: 9, он: 10,
  // English
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

/** "<number> and a half": bir yarim, бір жарым, два с половиной, two and a half. */
export const AND_A_HALF = /^(\S+) (yarim|жарым|с половиной|and a half|and half)$/;

/** Unit names the editor suggests, in the writer's own language. */
export const UNIT_SUGGESTIONS = {
  uz: ["g", "kg", "ml", "l", "osh qoshiq", "choy qoshiq", "stakan", "chomich", "hovuch", "tutam", "chimdim", "ta", "bosh", "tish", "bog'"],
  ru: ["г", "кг", "мл", "л", "ст. л.", "ч. л.", "стакан", "половник", "горсть", "щепотка", "шт", "зубчик", "головка", "пучок"],
  kz: ["г", "кг", "мл", "л", "ас қасық", "шай қасық", "стақан", "ожау", "уыс", "шымшым", "дана", "тіс", "бас", "бума"],
  en: ["g", "kg", "ml", "l", "tbsp", "tsp", "cup", "ladle", "handful", "pinch", "pcs", "clove", "bunch", "oz", "lb"],
} as const;
