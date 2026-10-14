"use server";

import { and, eq, inArray, notExists } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { PLATFORM_CONFIG } from "@/lib/constants";
import { clampServings, parseQuantity, scaleQuantity } from "@/lib/scaling";
import { getLocale, getT } from "@/i18n/server";
import { getCurrentUser } from "@/server/auth";
import { getRecipeById } from "@/server/recipes";

type Result = { ok: true } | { error: string };

const uuid = z.string().uuid();
const SIGN_IN = "err.shoppingSignIn";

const items = schema.shoppingItems;
const listed = schema.shoppingRecipes;

/** Puts a recipe's ingredients on the list for the given servings. Adding it again replaces its lines. */
export async function addToShoppingList(recipeId: string, servings: number): Promise<Result> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t(SIGN_IN) };
  const recipe = uuid.safeParse(recipeId).success ? await getRecipeById(recipeId) : undefined;
  if (!recipe || recipe.ingredients.length === 0) return { error: t("err.recipeNotFound") };

  const locale = await getLocale();
  const chosen = clampServings(servings, recipe.servings);
  const factor = chosen / recipe.servings;
  const ofRecipe = and(eq(items.userId, user.id), eq(items.recipeId, recipe.id));

  await db.batch([
    db.delete(items).where(ofRecipe),
    db
      .insert(listed)
      .values({ userId: user.id, recipeId: recipe.id, servings: chosen })
      .onConflictDoUpdate({ target: [listed.userId, listed.recipeId], set: { servings: chosen } }),
    db.insert(items).values(
      recipe.ingredients.map((ingredient) => {
        const amount = parseQuantity(ingredient.quantity);
        return {
          userId: user.id,
          recipeId: recipe.id,
          position: ingredient.order,
          name: ingredient.name,
          quantity: scaleQuantity(ingredient.quantity, ingredient.unit, factor, locale),
          amount: amount === null ? null : amount * factor,
          unit: ingredient.unit,
        };
      }),
    ),
  ]);

  revalidatePath(PLATFORM_CONFIG.urls.shopping);
  return { ok: true };
}

export async function removeFromShoppingList(recipeId: string): Promise<Result> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t(SIGN_IN) };
  if (!uuid.safeParse(recipeId).success) return { error: t("err.recipeNotFound") };

  await db.batch([
    db.delete(items).where(and(eq(items.userId, user.id), eq(items.recipeId, recipeId))),
    db.delete(listed).where(and(eq(listed.userId, user.id), eq(listed.recipeId, recipeId))),
  ]);
  revalidatePath(PLATFORM_CONFIG.urls.shopping);
  return { ok: true };
}

/** Marks lines as bought or not bought. Only the person's own rows are touched. */
export async function setShoppingChecked(ids: string[], checked: boolean): Promise<Result> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t(SIGN_IN) };
  const parsed = z.array(uuid).min(1).max(500).safeParse(ids);
  if (!parsed.success) return { error: t("err.badRequest") };

  await db.update(items).set({ checked }).where(and(eq(items.userId, user.id), inArray(items.id, parsed.data)));
  revalidatePath(PLATFORM_CONFIG.urls.shopping);
  return { ok: true };
}

/**
 * Removes what has been bought, or everything, on the whole list or only for the given recipes.
 * Recipes left with nothing to buy leave the list too.
 */
export async function clearShoppingList(scope: "bought" | "all", recipeIds?: string[]): Promise<Result> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t(SIGN_IN) };
  const only = recipeIds === undefined ? undefined : z.array(uuid).min(1).max(100).safeParse(recipeIds);
  if (only && !only.success) return { error: t("err.badRequest") };

  const conditions = [eq(items.userId, user.id)];
  if (only?.success) conditions.push(inArray(items.recipeId, only.data));
  if (scope === "bought") conditions.push(eq(items.checked, true));
  await db.delete(items).where(and(...conditions));
  await db.delete(listed).where(
    and(
      eq(listed.userId, user.id),
      notExists(db.select({ id: items.id }).from(items).where(and(eq(items.userId, listed.userId), eq(items.recipeId, listed.recipeId)))),
    ),
  );
  revalidatePath(PLATFORM_CONFIG.urls.shopping);
  return { ok: true };
}
