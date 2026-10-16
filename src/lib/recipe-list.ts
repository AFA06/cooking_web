import type { Recipe, RecipeListItem } from "@/types/recipe";

/**
 * Strips a recipe down to what cards and list filters need. An allowlist on purpose: a field added to Recipe
 * later stays on the server until someone decides a card needs it. See RecipeListItem for why.
 */
export function toListItem(r: Recipe): RecipeListItem {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    coverMedia: r.coverMedia,
    creator: { id: r.creator.id, name: r.creator.name, slug: r.creator.slug, avatarUrl: r.creator.avatarUrl, isFoundingCreator: r.creator.isFoundingCreator, socialLinks: {} },
    servings: r.servings,
    prepTimeMinutes: r.prepTimeMinutes,
    cookTimeMinutes: r.cookTimeMinutes,
    difficulty: r.difficulty,
    category: r.category,
    nutrition: r.nutrition,
    isPremium: r.isPremium,
    price: r.price,
    salePrice: r.salePrice,
    saleEndsAt: r.saleEndsAt,
    currency: r.currency,
    ingredients: r.ingredients.map((i) => ({ name: i.name })),
    videoUrl: r.videoUrl,
    tags: r.tags,
    publishedAt: r.publishedAt,
    cookedCount: r.cookedCount,
    rating: r.rating,
  };
}
