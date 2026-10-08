"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/server/auth";

const uuid = z.string().uuid();

export async function toggleSaveRecipe(recipeId: string, slug: string): Promise<{ saved: boolean } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Retseptni saqlash uchun tizimga kiring." };
  if (!uuid.safeParse(recipeId).success) return { error: "Noto‘g‘ri retsept." };

  const where = and(eq(schema.savedRecipes.userId, user.id), eq(schema.savedRecipes.recipeId, recipeId));
  const [existing] = await db.select({ r: schema.savedRecipes.recipeId }).from(schema.savedRecipes).where(where).limit(1);
  if (existing) await db.delete(schema.savedRecipes).where(where);
  else await db.insert(schema.savedRecipes).values({ userId: user.id, recipeId });

  revalidatePath(`/recipes/${slug}`);
  revalidatePath("/account");
  return { saved: !existing };
}

export async function startCookingSession(recipeId: string): Promise<{ sessionId: string } | null> {
  const user = await getCurrentUser();
  if (!user || !uuid.safeParse(recipeId).success) return null;
  const [row] = await db
    .insert(schema.cookingSessions)
    .values({ userId: user.id, recipeId })
    .returning({ id: schema.cookingSessions.id });
  return { sessionId: row.id };
}

export async function finishCookingSession(sessionId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !uuid.safeParse(sessionId).success) return;
  await db
    .update(schema.cookingSessions)
    .set({ status: "completed", completedAt: new Date() })
    .where(and(eq(schema.cookingSessions.id, sessionId), eq(schema.cookingSessions.userId, user.id)));
  revalidatePath("/account");
}
