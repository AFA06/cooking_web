import type { EditorInitial } from "@/components/dashboard/RecipeEditor";
import type { RecipeForEdit } from "@/server/recipe-write";

/** Maps stored recipe rows to the editor's string-based form state. */
export function toEditorInitial({ recipe: r, ingredients, steps }: RecipeForEdit): EditorInitial {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    coverUrl: r.coverUrl,
    galleryUrls: r.galleryUrls.join("\n"),
    servings: String(r.servings),
    prepTimeMinutes: String(r.prepTimeMinutes),
    cookTimeMinutes: String(r.cookTimeMinutes),
    difficulty: r.difficulty,
    isPremium: r.isPremium,
    priceAmount: r.priceAmount ? String(r.priceAmount) : "",
    tags: r.tags.join(", "),
    status: r.status,
    ingredients: ingredients.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
    steps: steps.map((s) => ({
      title: s.title,
      instruction: s.instruction,
      mediaUrl: s.mediaUrl ?? "",
      timerMinutes: s.timerSeconds ? String(Math.round(s.timerSeconds / 60)) : "",
      temperatureCelsius: s.temperatureCelsius ? String(s.temperatureCelsius) : "",
      tip: s.tip ?? "",
      ingredientPositions: s.ingredientPositions.join(", "),
    })),
  };
}
