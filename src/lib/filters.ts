import type { Recipe } from "@/types/recipe";

export const ALL = "Barchasi";
export const CUISINES = [ALL, "O‘zbek", "Xorazm"] as const;
export const DIFFICULTIES = [ALL, "Oson", "O‘rtacha", "Murakkab"] as const;
export const PRICE_FILTERS = [ALL, "Bepul", "Premium"] as const;

export const DIFFICULTY_BY_LABEL: Record<string, Recipe["difficulty"]> = {
  Oson: "easy",
  "O‘rtacha": "medium",
  Murakkab: "hard",
};
