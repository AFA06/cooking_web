import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getRecipesByIds } from "@/server/recipes";
import type { Recipe } from "@/types/recipe";

export interface CookbookSummary {
  id: string;
  name: string;
  recipeCount: number;
  /** Covers of the most recently added recipes, newest first, for the card. */
  coverUrls: string[];
}

const publishedRecipe = eq(schema.recipes.status, "published");

export async function getCookbooks(userId: string): Promise<CookbookSummary[]> {
  const [books, entries] = await Promise.all([
    db.select({ id: schema.cookbooks.id, name: schema.cookbooks.name }).from(schema.cookbooks).where(eq(schema.cookbooks.userId, userId)).orderBy(asc(schema.cookbooks.createdAt)),
    db
      .select({ cookbookId: schema.cookbookRecipes.cookbookId, coverUrl: schema.recipes.coverUrl })
      .from(schema.cookbookRecipes)
      .innerJoin(schema.cookbooks, eq(schema.cookbookRecipes.cookbookId, schema.cookbooks.id))
      .innerJoin(schema.recipes, eq(schema.cookbookRecipes.recipeId, schema.recipes.id))
      .where(and(eq(schema.cookbooks.userId, userId), publishedRecipe))
      .orderBy(desc(schema.cookbookRecipes.createdAt)),
  ]);
  return books.map((book) => {
    const covers = entries.filter((entry) => entry.cookbookId === book.id).map((entry) => entry.coverUrl);
    return { ...book, recipeCount: covers.length, coverUrls: covers.slice(0, 3) };
  });
}

/** One of the person's own cookbooks with its recipes, newest first. Undefined when it is not theirs. */
export async function getCookbook(userId: string, cookbookId: string): Promise<{ id: string; name: string; recipes: Recipe[] } | undefined> {
  const [book] = await db
    .select({ id: schema.cookbooks.id, name: schema.cookbooks.name })
    .from(schema.cookbooks)
    .where(and(eq(schema.cookbooks.id, cookbookId), eq(schema.cookbooks.userId, userId)))
    .limit(1);
  if (!book) return undefined;

  const rows = await db
    .select({ id: schema.cookbookRecipes.recipeId })
    .from(schema.cookbookRecipes)
    .where(eq(schema.cookbookRecipes.cookbookId, book.id))
    .orderBy(desc(schema.cookbookRecipes.createdAt));
  const order = new Map(rows.map((row, i) => [row.id, i]));
  const recipes = (await getRecipesByIds(rows.map((row) => row.id))).sort((a, b) => order.get(a.id)! - order.get(b.id)!);
  return { ...book, recipes };
}

export interface SaveOptions {
  /** In the general "Saqlanganlar" list. */
  saved: boolean;
  cookbooks: { id: string; name: string; has: boolean }[];
}

/** Where one recipe is currently kept, for the save dialog. */
export async function getSaveOptions(userId: string, recipeId: string): Promise<SaveOptions> {
  const [[saved], books, memberships] = await Promise.all([
    db
      .select({ recipeId: schema.savedRecipes.recipeId })
      .from(schema.savedRecipes)
      .where(and(eq(schema.savedRecipes.userId, userId), eq(schema.savedRecipes.recipeId, recipeId)))
      .limit(1),
    db.select({ id: schema.cookbooks.id, name: schema.cookbooks.name }).from(schema.cookbooks).where(eq(schema.cookbooks.userId, userId)).orderBy(asc(schema.cookbooks.createdAt)),
    db
      .select({ cookbookId: schema.cookbookRecipes.cookbookId })
      .from(schema.cookbookRecipes)
      .innerJoin(schema.cookbooks, eq(schema.cookbookRecipes.cookbookId, schema.cookbooks.id))
      .where(and(eq(schema.cookbooks.userId, userId), eq(schema.cookbookRecipes.recipeId, recipeId))),
  ]);
  const containing = new Set(memberships.map((m) => m.cookbookId));
  return { saved: !!saved, cookbooks: books.map((book) => ({ ...book, has: containing.has(book.id) })) };
}
