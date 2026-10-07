export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  locale: "uz" | "ru" | "en";
  isCreator: boolean;
  createdAt: string;
  savedRecipeIds: string[];
  cookingHistoryIds: string[];
}

export interface Creator extends User {
  isCreator: true;
  slug: string;
  bio: string;
  isFoundingCreator: boolean;
  commissionRate: number;
  recipeCount: number;
  totalViews: number;
  totalEarnings: number;
}

export interface AdminUser extends User {
  role: "admin";
}