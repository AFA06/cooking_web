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
