import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getRecipesByIds } from "@/server/recipes";
import type { Recipe } from "@/types/recipe";

export async function isRecipeSaved(userId: string, recipeId: string): Promise<boolean> {
  const [row] = await db
    .select({ r: schema.savedRecipes.recipeId })
    .from(schema.savedRecipes)
    .where(and(eq(schema.savedRecipes.userId, userId), eq(schema.savedRecipes.recipeId, recipeId)))
    .limit(1);
  return !!row;
}

export async function getSavedRecipes(userId: string): Promise<Recipe[]> {
  const rows = await db
    .select({ id: schema.savedRecipes.recipeId })
    .from(schema.savedRecipes)
    .where(eq(schema.savedRecipes.userId, userId))
    .orderBy(desc(schema.savedRecipes.createdAt));
  const recipes = await getRecipesByIds(rows.map((r) => r.id));
  const order = new Map(rows.map((r, i) => [r.id, i]));
  return recipes.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
}

export interface HistoryEntry {
  id: string;
  status: "in_progress" | "completed" | "abandoned";
  startedAt: Date;
  completedAt: Date | null;
  recipeSlug: string;
  recipeTitle: string;
}

export async function getCookingHistory(userId: string, limit = 20): Promise<HistoryEntry[]> {
  return db
    .select({
      id: schema.cookingSessions.id,
      status: schema.cookingSessions.status,
      startedAt: schema.cookingSessions.startedAt,
      completedAt: schema.cookingSessions.completedAt,
      recipeSlug: schema.recipes.slug,
      recipeTitle: schema.recipes.title,
    })
    .from(schema.cookingSessions)
    .innerJoin(schema.recipes, eq(schema.cookingSessions.recipeId, schema.recipes.id))
    .where(eq(schema.cookingSessions.userId, userId))
    .orderBy(desc(schema.cookingSessions.startedAt))
    .limit(limit);
}
