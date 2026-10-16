import type { RecipeCategory } from "@/lib/categories";
import type { RecipeListItem } from "@/types/recipe";

/** Filter values are language-neutral keys; their labels come from the dictionary (filter.*, difficulty.*). */
export const ALL = "all";
export const DIFFICULTIES = [ALL, "easy", "medium", "hard"] as const;
export const PRICE_FILTERS = [ALL, "free", "premium"] as const;
export const TIME_FILTERS = [
  { key: ALL, max: null },
  { key: "30", max: 30 },
  { key: "60", max: 60 },
  { key: "120", max: 120 },
] as const;

export interface RecipeFilters {
  query: string;
  difficulty: string;
  price: string;
  /** One of the TIME_FILTERS keys. */
  time: string;
  /** Empty means every category. */
  categories: RecipeCategory[];
}

export const EMPTY_FILTERS: RecipeFilters = { query: "", difficulty: ALL, price: ALL, time: ALL, categories: [] };

export function filterRecipes(recipes: RecipeListItem[], f: RecipeFilters): RecipeListItem[] {
  const q = f.query.trim().toLowerCase();
  const maxMinutes = TIME_FILTERS.find((t) => t.key === f.time)?.max ?? null;
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
    if (f.categories.length > 0 && !f.categories.includes(r.category)) return false;
    if (f.difficulty !== ALL && r.difficulty !== f.difficulty) return false;
    if (f.price === "free" && r.isPremium) return false;
    if (f.price === "premium" && !r.isPremium) return false;
    if (maxMinutes !== null && r.prepTimeMinutes + r.cookTimeMinutes > maxMinutes) return false;
    return true;
  });
}

export const SORTS = [
  { key: "newest", label: "sort.newest" },
  { key: "quickest", label: "sort.quickest" },
  { key: "mostCooked", label: "sort.mostCooked" },
] as const;

export type SortKey = (typeof SORTS)[number]["key"];

export function sortRecipes(recipes: RecipeListItem[], sort: SortKey): RecipeListItem[] {
  const total = (r: RecipeListItem) => r.prepTimeMinutes + r.cookTimeMinutes;
  const sorted = [...recipes];
  if (sort === "quickest") sorted.sort((a, b) => total(a) - total(b));
  else if (sort === "mostCooked") sorted.sort((a, b) => b.cookedCount - a.cookedCount);
  else sorted.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return sorted;
}
