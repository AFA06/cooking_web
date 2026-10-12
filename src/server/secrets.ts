import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { CurrentUser } from "@/server/auth";

export interface RecipeSecrets {
  /** The recipe has insider notes at all (so a locked teaser can be shown). */
  exists: boolean;
  /** The notes themselves — only filled in for people allowed to read them. */
  notes: string | null;
  /** Reading as the recipe's author or an admin rather than as a buyer. */
  asOwner: boolean;
}

/**
 * Insider notes are read here and nowhere else, and are never part of the public recipe object,
 * so they cannot leak into a page for someone who has not bought the recipe.
 * Allowed: the recipe's own creator, an admin, or someone with a paid purchase.
 */
export async function getRecipeSecrets(recipeId: string, creatorId: string, user: CurrentUser | null, ownCreatorId: string | null): Promise<RecipeSecrets> {
  const [row] = await db.select({ notes: schema.recipes.secretNotes, premium: schema.recipes.isPremium }).from(schema.recipes).where(eq(schema.recipes.id, recipeId)).limit(1);
  const notes = row?.premium ? row.notes?.trim() || null : null;
  if (!notes) return { exists: false, notes: null, asOwner: false };

  const asOwner = !!user && (user.role === "admin" || ownCreatorId === creatorId);
  let bought = false;
  if (user && !asOwner) {
    const [purchase] = await db
      .select({ id: schema.purchases.id })
      .from(schema.purchases)
      .where(and(eq(schema.purchases.userId, user.id), eq(schema.purchases.recipeId, recipeId), eq(schema.purchases.status, "paid")))
      .limit(1);
    bought = !!purchase;
  }
  return { exists: true, notes: asOwner || bought ? notes : null, asOwner };
}
