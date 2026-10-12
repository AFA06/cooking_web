/**
 * Shopping-list arithmetic. Pure functions with no UI or database dependencies:
 * the same product needed by several recipes becomes one line with the amounts added up.
 */
import { formatQuantity } from "@/lib/scaling";

export interface ShoppingRow {
  id: string;
  recipeId: string;
  name: string;
  quantity: string;
  amount: number | null;
  unit: string;
  checked: boolean;
}

export interface ShoppingLine {
  key: string;
  name: string;
  /** Amount ready to show, e.g. "1,5" with unit "kg". */
  quantity: string;
  unit: string;
  checked: boolean;
  /** The stored rows behind this line; ticking the line ticks them all. */
  ids: string[];
  recipeIds: string[];
}

const normalize = (text: string) => text.toLowerCase().replace(/[‘’ʻʼ`´]/g, "'").replace(/\s+/g, " ").trim();

/** Kilograms and litres are counted in grams and millilitres, so "1 kg" and "500 g" add up. */
const TO_BASE: Record<string, { unit: string; factor: number }> = {
  kg: { unit: "g", factor: 1000 },
  l: { unit: "ml", factor: 1000 },
  litr: { unit: "ml", factor: 1000 },
  gr: { unit: "g", factor: 1 },
  gramm: { unit: "g", factor: 1 },
};
const LARGE_UNIT: Record<string, string> = { g: "kg", ml: "l" };

function present(total: number, unit: string): { quantity: string; unit: string } {
  const large = LARGE_UNIT[unit];
  if (large && total >= 1000) return { quantity: formatQuantity(total / 1000, large), unit: large };
  return { quantity: formatQuantity(total, unit), unit };
}

/**
 * Groups rows into the lines a shopper reads. Rows are merged when they name the same product in
 * the same unit and have the same bought state, so something already bought is never re-opened
 * by a recipe added later. Amounts that are not numbers only merge with identical text.
 */
export function mergeShoppingRows(rows: ShoppingRow[]): ShoppingLine[] {
  const groups = new Map<string, { rows: ShoppingRow[]; unit: string; total: number | null }>();

  for (const row of rows) {
    const base = TO_BASE[normalize(row.unit)];
    const unit = base?.unit ?? row.unit.trim();
    const amount = row.amount === null ? null : row.amount * (base?.factor ?? 1);
    const key = [normalize(row.name), normalize(unit), amount === null ? `text:${normalize(row.quantity)}` : "number", row.checked].join("|");

    const group = groups.get(key);
    if (!group) groups.set(key, { rows: [row], unit, total: amount });
    else {
      group.rows.push(row);
      if (group.total !== null && amount !== null) group.total += amount;
    }
  }

  return [...groups.entries()].map(([key, { rows: members, unit, total }]) => ({
    key,
    name: members[0].name,
    ...(total === null ? { quantity: members[0].quantity, unit } : present(total, unit)),
    checked: members[0].checked,
    ids: members.map((row) => row.id),
    recipeIds: [...new Set(members.map((row) => row.recipeId))],
  }));
}
