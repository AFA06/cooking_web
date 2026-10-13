import assert from "node:assert/strict";
import { estimateNutrition, unmatchedAliasKeys } from "../src/lib/nutrition";
import { canonicalUnit, parseQuantity, scaleQuantity } from "../src/lib/scaling";
import { mergeShoppingRows, type ShoppingRow } from "../src/lib/shopping";

/** Ingredient units and amounts: how cooks write them, how they scale and how they are weighed. Run with: npm run test:units */
const ok = (text: string) => console.log("  ✓", text);
const cal = (name: string, quantity: string, unit: string) => estimateNutrition([{ name, quantity, unit }], 1);

// ── amounts written as words ──
assert.equal(parseQuantity("yarim"), 0.5);
assert.equal(parseQuantity("Yarim"), 0.5);
assert.equal(parseQuantity("chorak"), 0.25);
assert.equal(parseQuantity("bir yarim"), 1.5);
assert.equal(parseQuantity("ikki yarim"), 2.5);
assert.equal(parseQuantity("uch"), 3);
assert.equal(parseQuantity("to‘rt"), 4);
assert.equal(parseQuantity("1,5"), 1.5);
assert.equal(parseQuantity("1 1/2"), 1.5);
assert.equal(parseQuantity("ta’bga ko‘ra"), null);
assert.equal(parseQuantity("2 kg"), null);
assert.equal(parseQuantity("constructor"), null);
ok("amounts: yarim, chorak, bir yarim, ikki, plus the numeric forms; free text and “2 kg” stay text");

// ── the ladle, however it is written ──
for (const unit of ["chomich", "Chomich", "cho'mich", "cho‘mich", "chumich", "to'la chomich", "to‘ldirib chomich", "chomich (to'la)", "половник", "Черпак"]) {
  assert.equal(canonicalUnit(unit), "chomich", unit);
}
ok("a ladle is recognised in every spelling, with or without “to'la”, and in Russian");

// ── scaling by servings ──
assert.equal(scaleQuantity("yarim", "chomich", 2), "1");
assert.equal(scaleQuantity("yarim", "chomich", 0.5), "¼");
assert.equal(scaleQuantity("2", "chomich", 1.5), "3");
assert.equal(scaleQuantity("1", "chomich", 1.5), "1,5");
assert.equal(scaleQuantity("bir yarim", "chomich", 2), "3");
assert.equal(scaleQuantity("yarim", "chomich", 1), "yarim");
assert.equal(scaleQuantity("1", "hovuch", 3), "3");
assert.equal(scaleQuantity("1", "tutam", 1.5), "1,5");
ok("a ladle, handful and pinch scale in halves and quarters; the author's own text shows at the original servings");

assert.equal(scaleQuantity("250", "g", 1.3), "330");
assert.equal(scaleQuantity("250", "г", 1.3), "330");
assert.equal(scaleQuantity("1", "кг", 1.5), "1,5");
assert.equal(scaleQuantity("1", "ст. л.", 2), "2");
assert.equal(scaleQuantity("1", "ч. л.", 1.5), "1,5");
assert.equal(scaleQuantity("3", "шт", 2), "6");
assert.equal(scaleQuantity("ta'bga ko'ra", "", 2), "ta'bga ko'ra");
ok("Cyrillic units round like the Latin ones (г = g, кг = kg, ст. л. = osh qoshiq); text amounts are untouched");

// ── weighing for calories ──
const milk2 = cal("Sut", "2", "chomich").perServing!; // 2 × 150 ml × 1.03 = 309 g of 60 kcal/100 g
assert.ok(Math.abs(milk2.calories - 185) <= 1, `2 ladles of milk, got ${milk2.calories}`);
assert.equal(cal("Sut", "yarim", "chomich").perServing!.calories, 46);
assert.equal(cal("Sut", "200", "мл").perServing!.calories, 124);
assert.equal(cal("Sut", "1", "to'la chomich").perServing!.calories, cal("Sut", "1", "chomich").perServing!.calories);
assert.ok(cal("Yog'", "2", "chomich").perServing!.calories > 2000);
assert.deepEqual(cal("Guruch", "1", "chomich").perServing && "ok", "ok");
assert.ok(cal("Sabzi", "1", "hovuch").perServing!.calories >= 10);
assert.deepEqual(cal("Sut", "1", "hovuch"), { perServing: null, skipped: ["Sut"] });
assert.deepEqual(cal("Tuz", "1", "tutam"), { perServing: null, skipped: [] });
assert.deepEqual(cal("Go'sht", "1", "chomich"), { perServing: null, skipped: ["Go'sht"] });
ok("calories: a ladle of a liquid is 150 ml, “yarim” counts as half, a handful of a liquid or a ladle of meat is reported as skipped");


// ══ Russian, Kazakh and English: the same logic in the writer's own language ══
const kcal = (name: string, quantity: string, unit: string) => cal(name, quantity, unit).perServing?.calories ?? null;
const same = (cases: [string, string, string, number | null][], label: string) => {
  for (const [name, quantity, unit, expected] of cases) assert.equal(kcal(name, quantity, unit), expected, `${name} · ${quantity} ${unit}`);
  ok(label);
};

assert.deepEqual(unmatchedAliasKeys(), []);

// amounts in words
for (const [text, value] of [
  ["пол", 0.5], ["половина", 0.5], ["полтора", 1.5], ["полторы", 1.5], ["четверть", 0.25], ["два с половиной", 2.5], ["три", 3],
  ["жарты", 0.5], ["ширек", 0.25], ["бір жарым", 1.5], ["екі", 2], ["үш жарым", 3.5],
  ["half", 0.5], ["quarter", 0.25], ["one and a half", 1.5], ["two and a half", 2.5], ["three", 3], ["⅛", 0.125],
] as const) assert.equal(parseQuantity(text), value, text);
for (const text of ["по вкусу", "to taste", "дәміне қарай", "ta'bga ko'ra", "a pinch", "несколько"]) assert.equal(parseQuantity(text), null, text);
ok("amounts in words: пол, полтора, два с половиной, жарты, бір жарым, half, one and a half; “to taste” stays text");

// units
const units: [string, string][] = [
  ["ст. л.", "osh qoshiq"], ["Столовая ложка", "osh qoshiq"], ["ас қасық", "osh qoshiq"], ["tbsp", "osh qoshiq"], ["Tablespoons", "osh qoshiq"],
  ["ч. л.", "choy qoshiq"], ["чайная ложка", "choy qoshiq"], ["шай қасық", "choy qoshiq"], ["tsp", "choy qoshiq"], ["teaspoon", "choy qoshiq"],
  ["стакан", "stakan"], ["стақан", "stakan"], ["cup", "stakan"], ["Cups", "stakan"], ["чашка", "stakan"],
  ["кг", "kg"], ["келі", "kg"], ["kilograms", "kg"], ["мл", "ml"], ["milliliters", "ml"], ["л", "l"], ["литр", "l"], ["litres", "l"],
  ["г", "g"], ["грамм", "g"], ["grams", "g"], ["щепотка", "chimdim"], ["pinch", "chimdim"], ["шымшым", "chimdim"],
  ["горсть", "hovuch"], ["handful", "hovuch"], ["уыс", "hovuch"], ["капля", "tomchi"], ["drops", "tomchi"], ["тамшы", "tomchi"],
  ["шт", "ta"], ["штуки", "ta"], ["pcs", "ta"], ["pieces", "ta"], ["дана", "ta"], ["тал", "ta"],
  ["зубчик", "tish"], ["cloves", "tish"], ["тіс", "tish"], ["головка", "bosh"], ["head", "bosh"], ["пучок", "bog'"], ["bunch", "bog'"], ["бума", "bog'"],
  ["ложка", "ложка"], ["tbs spoon", "tbs spoon"],
];
for (const [written, canonical] of units) assert.equal(canonicalUnit(written), canonical, written);
for (const written of ["ladle", "Ladle", "ожау", "половник", "половника", "черпак"]) assert.equal(canonicalUnit(written), "chomich", written);
ok("units in Russian, Kazakh and English fold to the same unit (ст. л. = ас қасық = tbsp, ожау = половник = ladle = chomich)");

// scaling, with the number written the way the language writes it
assert.equal(scaleQuantity("2", "половника", 1.5, "ru"), "3");
assert.equal(scaleQuantity("1", "щепотка", 1.5, "ru"), "1,5");
assert.equal(scaleQuantity("полтора", "ст. л.", 2, "ru"), "3");
assert.equal(scaleQuantity("пол", "стакана", 2, "ru"), "1");
assert.equal(scaleQuantity("жарты", "стақан", 0.5, "kz"), "¼");
assert.equal(scaleQuantity("1", "ожау", 3, "kz"), "3");
assert.equal(scaleQuantity("1", "tbsp", 1.5, "en"), "1.5");
assert.equal(scaleQuantity("1", "tbsp", 1.5, "ru"), "1,5");
assert.equal(scaleQuantity("1", "cup", 2, "en"), "2");
assert.equal(scaleQuantity("half", "cup", 0.5, "en"), "¼");
assert.equal(scaleQuantity("1", "l", 1.5, "en"), "1.5");
assert.equal(scaleQuantity("1", "л", 1.5, "ru"), "1,5");
assert.equal(scaleQuantity("500", "g", 3, "en"), "1,500");
assert.equal(scaleQuantity("500", "г", 3, "ru"), (1500).toLocaleString("ru-RU"));
assert.equal(scaleQuantity("8", "oz", 1.5, "en"), "12");
assert.equal(scaleQuantity("по вкусу", "", 2, "ru"), "по вкусу");
assert.equal(scaleQuantity("to taste", "", 2, "en"), "to taste");
ok("scaling works in every language, and numbers are written 1.5 in English and 1,5 in Uzbek, Russian and Kazakh");

// calories: ingredient names and units in each language
same(
  [
    ["Рис", "200", "г", 688], ["Морковь", "2", "шт", 70], ["Куриная грудка", "300", "г", 339], ["Мука", "1", "стакан", 473], ["Яйцо", "2", "шт", 173],
    ["Молоко", "1", "стакан", 124], ["Растительное масло", "2", "ст. л.", 252], ["Сливочное масло", "50", "г", 374], ["Мёд", "1", "ст. л.", 82],
    ["Сметана", "2", "ст. л.", 82], ["Зелёный лук", "1", "пучок", 20], ["Перец болгарский", "2", "шт", 81], ["Перец", "2", "шт", 81],
  ],
  "Russian names and units are counted (рис, морковь, куриная грудка, мука, яйцо, молоко, масло, мёд, сметана…)",
);
same(
  [
    ["Күріш", "1", "стақан", 619], ["Сәбіз", "1", "дана", 35], ["Қой еті", "200", "г", 460], ["Жұмыртқа", "3", "дана", 259], ["Сары май", "1", "ас қасық", 112],
    ["Өсімдік майы", "2", "ожау", 2481], ["Сүт", "1", "кесе", 124], ["Картоп", "2", "дана", 185],
  ],
  "Kazakh names and units are counted (күріш, сәбіз, қой еті, жұмыртқа, сары май, өсімдік майы, сүт, картоп…)",
);
same(
  [
    ["Rice", "1", "cup", 619], ["Carrots", "2", "pcs", 70], ["Chicken breast", "300", "g", 339], ["Olive oil", "2", "tbsp", 252], ["Butter", "1", "tbsp", 112],
    ["Eggs", "2", "", 173], ["Eggplant", "1", "pcs", 60], ["Flour", "1", "cup", 473], ["Milk", "1", "cup", 124], ["Bell pepper", "1", "pcs", 41],
    ["Garlic", "3", "cloves", 22], ["Peanut butter", "2", "tbsp", 196], ["Honey", "1", "tbsp", 82], ["Sour cream", "2", "tbsp", 82],
    ["Cream cheese", "100", "g", 350], ["Tuna", "100", "g", 120],
  ],
  "English names and units are counted (rice, carrots, chicken breast, olive oil, eggs, eggplant ≠ egg, peanut butter ≠ butter…)",
);

// things that add nothing, or cannot be weighed
for (const [name, quantity, unit] of [
  ["Соль", "1", "ч. л."], ["Вода", "500", "мл"], ["Куриный бульон", "500", "мл"], ["Перец", "1", "щепотка"], ["Чёрный перец", "1", "ч. л."], ["Лавровый лист", "2", "шт"],
  ["Тұз", "1", "шай қасық"], ["Су", "1", "л"], ["Қара бұрыш", "1", "г"], ["Бұрыш", "1", "шымшым"],
  ["Salt", "1", "tsp"], ["Water", "2", "cups"], ["Black pepper", "1", "tsp"], ["Pepper", "1", "pinch"], ["Chicken broth", "2", "cups"], ["Nutmeg", "1", "tsp"], ["Bay leaves", "2", "pcs"],
] as const) assert.deepEqual(cal(name, quantity, unit), { perServing: null, skipped: [] }, `${name} is not counted`);
assert.deepEqual(cal("Pineapple", "1", "pcs"), { perServing: null, skipped: ["Pineapple"] });
assert.deepEqual(cal("Майонез", "2", "ст. л."), { perServing: null, skipped: ["Майонез"] });
ok("salt, water, broth, bay leaf and a pinch of pepper are left out in every language; unknown foods are reported, not guessed");

// the shopping list adds up amounts written in different spellings
const row = (id: string, name: string, quantity: string, unit: string): ShoppingRow => {
  const amount = parseQuantity(quantity);
  return { id, recipeId: "r", name, quantity, amount, unit, checked: false };
};
const russian = mergeShoppingRows([row("1", "Мука", "500", "г"), row("2", "Мука", "1", "кг"), row("3", "Яйца", "2", "шт"), row("4", "Яйца", "3", "штуки")], "ru");
assert.deepEqual(russian.map((l) => [l.name, l.quantity, l.unit, l.ids.length]), [["Мука", "1,5", "кг", 2], ["Яйца", "5", "шт", 2]]);
const english = mergeShoppingRows([row("1", "Flour", "500", "g"), row("2", "Flour", "1", "kilograms"), row("3", "Oil", "2", "tbsp"), row("4", "Oil", "1", "tablespoon")], "en");
assert.deepEqual(english.map((l) => [l.name, l.quantity, l.unit, l.ids.length]), [["Flour", "1.5", "kilograms", 2], ["Oil", "3", "tbsp", 2]]);
const mixed = mergeShoppingRows([row("1", "Salt", "ta'bga ko'ra", ""), row("2", "Salt", "to taste", "")], "en");
assert.equal(mixed.length, 2);
ok("shopping list: 500 г + 1 кг = 1,5 кг; 2 шт + 3 штуки = 5 шт; 500 g + 1 kilograms = 1.5; “to taste” never merges into a number");

console.log("\nAll unit checks passed.");
