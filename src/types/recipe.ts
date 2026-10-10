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
  mediaUrl?: string;
  mediaType?: "image" | "video";
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
  currency?: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  media: RecipeMedia[];
  tags: string[];
  publishedAt: string;
  /** Completed guided-cooking sessions. */
  cookedCount: number;
  /** Average of cook reviews; `count` is 0 when nobody has rated it yet. */
  rating: { average: number; count: number };
}

export interface RecipeCardProps {
  recipe: Recipe;
  variant?: "default" | "featured" | "compact";
}