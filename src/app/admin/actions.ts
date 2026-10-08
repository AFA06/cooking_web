"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/server/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Forbidden");
  return user;
}

const id = z.string().uuid();

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/recipes");
  revalidatePath("/creators");
  revalidatePath("/");
}

export async function setCreatorFlag(creatorId: string, flag: "isFoundingCreator" | "isFeatured", value: boolean) {
  await requireAdmin();
  if (!id.safeParse(creatorId).success) return;
  await db.update(schema.creators).set({ [flag]: value }).where(eq(schema.creators.id, creatorId));
  refresh();
}

export async function setRecipeFeatured(recipeId: string, value: boolean) {
  await requireAdmin();
  if (!id.safeParse(recipeId).success) return;
  await db.update(schema.recipes).set({ isFeatured: value }).where(eq(schema.recipes.id, recipeId));
  refresh();
}

export async function setRecipeStatusAsAdmin(recipeId: string, status: "draft" | "published") {
  await requireAdmin();
  if (!id.safeParse(recipeId).success) return;
  await db
    .update(schema.recipes)
    .set({ status, updatedAt: new Date(), ...(status === "published" ? { publishedAt: new Date() } : {}) })
    .where(eq(schema.recipes.id, recipeId));
  refresh();
}
