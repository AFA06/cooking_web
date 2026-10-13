import assert from "node:assert/strict";
import { estimateNutrition } from "../src/lib/nutrition";
import { canonicalUnit, parseQuantity, scaleQuantity } from "../src/lib/scaling";

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

console.log("\nAll unit checks passed.");
