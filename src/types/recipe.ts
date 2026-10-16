import type { RecipeCategory } from "@/lib/categories";
import type { SocialLinks } from "@/lib/social";

export interface RecipeIngredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  notes?: string;
  order: number;
}

export interface RecipeStep {
  id: string;
  order: number;
  title: string;
  instruction: string;
  /** On a premium recipe, whether this step is open to everyone; the creator decides step by step. */
  isFree: boolean;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  /** A clip showing this step: an upload or a link, see lib/video. Shown next to the step photo, never as its cover. */
  videoUrl?: string;
  timerSeconds?: number;
  temperatureCelsius?: number;
  tip?: string;
  ingredientIds?: string[];
}

export interface RecipeMedia {
  id: string;
  type: "image" | "video";
  url: string;
  alt?: string;
  order: number;
}

export interface RecipeCreator {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string;
  bio?: string;
  isFoundingCreator: boolean;
  socialLinks: SocialLinks;
}

/** Energy and macronutrients of one serving. */
export interface RecipeNutrition {
  calories: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
}

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverMedia: RecipeMedia;
  creator: RecipeCreator;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  category: RecipeCategory;
  /** Missing when the author has not filled it in. */
  nutrition?: RecipeNutrition;
  isPremium: boolean;
  price?: number;
  /** A lower price for a while; see lib/pricing for when it applies. */
  salePrice?: number;
  /** ISO time the sale ends; missing when it runs until the creator stops it. */
  saleEndsAt?: string;
  currency?: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  media: RecipeMedia[];
  /** Link to a YouTube/Vimeo page or a direct video file. */
  videoUrl?: string;
  tags: string[];
  publishedAt: string;
  /** Completed guided-cooking sessions. */
  cookedCount: number;
  /** Average of cook reviews; `count` is 0 when nobody has rated it yet. */
  rating: { average: number; count: number };
}

/**
 * What recipe lists and cards get in the browser: no steps, photos or quantities. Steps must never ride along,
 * because a premium recipe's locked steps would then be readable in the page source. `steps?: never` makes
 * passing a full Recipe a type error, so every list goes through `toListItem`.
 */
export type RecipeListItem = Omit<Recipe, "steps" | "media" | "ingredients"> & {
  /** Names only, for the search box. */
  ingredients: Pick<RecipeIngredient, "name">[];
  steps?: never;
  media?: never;
};

export interface RecipeCardProps {
  recipe: Recipe;
  variant?: "default" | "featured" | "compact";
}