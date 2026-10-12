import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { ShoppingRow } from "@/lib/shopping";

export interface ShoppingRecipe {
  id: string;
  slug: string;
  title: string;
  coverUrl: string;
  servings: number;
}

export interface ShoppingList {
  recipes: ShoppingRecipe[];
  rows: ShoppingRow[];
}

export async function getShoppingList(userId: string): Promise<ShoppingList> {
  const [recipes, rows] = await Promise.all([
    db
      .select({ id: schema.recipes.id, slug: schema.recipes.slug, title: schema.recipes.title, coverUrl: schema.recipes.coverUrl, servings: schema.shoppingRecipes.servings })
      .from(schema.shoppingRecipes)
      .innerJoin(schema.recipes, eq(schema.shoppingRecipes.recipeId, schema.recipes.id))
      .where(eq(schema.shoppingRecipes.userId, userId))
      .orderBy(asc(schema.shoppingRecipes.createdAt)),
    db
      .select({
        id: schema.shoppingItems.id,
        recipeId: schema.shoppingItems.recipeId,
        name: schema.shoppingItems.name,
        quantity: schema.shoppingItems.quantity,
        amount: schema.shoppingItems.amount,
        unit: schema.shoppingItems.unit,
        checked: schema.shoppingItems.checked,
      })
      .from(schema.shoppingItems)
      .innerJoin(schema.shoppingRecipes, and(eq(schema.shoppingRecipes.userId, schema.shoppingItems.userId), eq(schema.shoppingRecipes.recipeId, schema.shoppingItems.recipeId)))
      .where(eq(schema.shoppingItems.userId, userId))
      .orderBy(asc(schema.shoppingRecipes.createdAt), asc(schema.shoppingItems.position)),
  ]);
  return { recipes, rows };
}

/** Servings this recipe is on the person's shopping list for, or null when it is not on it. */
export async function getShoppingServings(userId: string, recipeId: string): Promise<number | null> {
  const [row] = await db
    .select({ servings: schema.shoppingRecipes.servings })
    .from(schema.shoppingRecipes)
    .where(and(eq(schema.shoppingRecipes.userId, userId), eq(schema.shoppingRecipes.recipeId, recipeId)))
    .limit(1);
  return row?.servings ?? null;
}
