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
}

export interface RecipeCardProps {
  recipe: Recipe;
  variant?: "default" | "featured" | "compact";
}