import type { Recipe } from "@/types/recipe";

export const ALL = "Barchasi";
export const DIFFICULTIES = [ALL, "Oson", "O‘rtacha", "Murakkab"] as const;
export const PRICE_FILTERS = [ALL, "Bepul", "Premium"] as const;
export const TIME_FILTERS = [
  { label: ALL, max: null },
  { label: "30 daqiqagacha", max: 30 },
  { label: "1 soatgacha", max: 60 },
  { label: "2 soatgacha", max: 120 },
] as const;

export const DIFFICULTY_BY_LABEL: Record<string, Recipe["difficulty"]> = {
  Oson: "easy",
  "O‘rtacha": "medium",
  Murakkab: "hard",
};

export interface RecipeFilters {
  query: string;
  difficulty: string;
  price: string;
  time: string;
}

export const EMPTY_FILTERS: RecipeFilters = { query: "", difficulty: ALL, price: ALL, time: ALL };

export function filterRecipes(recipes: Recipe[], f: RecipeFilters): Recipe[] {
  const q = f.query.trim().toLowerCase();
  const maxMinutes = TIME_FILTERS.find((t) => t.label === f.time)?.max ?? null;
  return recipes.filter((r) => {
    if (
      q &&
      !(
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.creator.name.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q))
      )
    ) {
      return false;
    }
    if (f.difficulty !== ALL && r.difficulty !== DIFFICULTY_BY_LABEL[f.difficulty]) return false;
    if (f.price === "Bepul" && r.isPremium) return false;
    if (f.price === "Premium" && !r.isPremium) return false;
    if (maxMinutes !== null && r.prepTimeMinutes + r.cookTimeMinutes > maxMinutes) return false;
    return true;
  });
}
