import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";

/** Has this person paid for the recipe? The one place a purchase is checked. */
export async function hasPurchased(userId: string, recipeId: string): Promise<boolean> {
  const [purchase] = await db
    .select({ id: schema.purchases.id })
    .from(schema.purchases)
    .where(and(eq(schema.purchases.userId, userId), eq(schema.purchases.recipeId, recipeId), eq(schema.purchases.status, "paid")))
    .limit(1);
  return !!purchase;
}

/** Can this person read every step of the recipe? Its own creator, an admin, or someone with a paid purchase. */
export async function hasFullAccess(user: { id: string; role: string } | null, recipe: { id: string; isPremium: boolean }, ownCreatorId: string | null, recipeCreatorId: string): Promise<boolean> {
  if (!recipe.isPremium) return true;
  if (!user) return false;
  if (user.role === "admin" || ownCreatorId === recipeCreatorId) return true;
  return hasPurchased(user.id, recipe.id);
}
