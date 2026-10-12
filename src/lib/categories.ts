/** Dish categories a recipe belongs to, in the order they are listed everywhere. Keys match the `recipe_category` DB enum; labels are message keys. */
export const RECIPE_CATEGORIES = [
  { key: "soup", label: "cat.soup" },
  { key: "main", label: "cat.main" },
  { key: "salad", label: "cat.salad" },
  { key: "bakery", label: "cat.bakery" },
  { key: "dessert", label: "cat.dessert" },
  { key: "drink", label: "cat.drink" },
] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number]["key"];

export const CATEGORY_KEYS = RECIPE_CATEGORIES.map((c) => c.key) as [RecipeCategory, ...RecipeCategory[]];

export const CATEGORY_LABEL = Object.fromEntries(RECIPE_CATEGORIES.map((c) => [c.key, c.label])) as Record<RecipeCategory, string>;

/** Reads a comma-separated `?category=` value, dropping anything unknown. */
export function parseCategories(value: string | undefined): RecipeCategory[] {
  const wanted = new Set(value?.split(","));
  return CATEGORY_KEYS.filter((key) => wanted.has(key));
}
