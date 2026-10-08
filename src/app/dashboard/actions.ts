"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/server/auth";
import { getCurrentCreator } from "@/server/creator";
import { persistRecipe } from "@/server/recipe-write";
import { recipeInputSchema, slugify, type RecipeInput } from "@/lib/recipe-schema";

export interface ActionResult {
  error?: string;
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Ko‘rinadigan ismni kiriting").max(80),
  bio: z.string().trim().max(500).optional().default(""),
});

export async function becomeCreator(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Avval tizimga kiring." };
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const [existing] = await db.select({ id: schema.creators.id }).from(schema.creators).where(eq(schema.creators.userId, user.id)).limit(1);
  if (existing) redirect("/dashboard");

  const base = slugify(parsed.data.name) || "creator";
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const [taken] = await db.select({ id: schema.creators.id }).from(schema.creators).where(eq(schema.creators.slug, slug)).limit(1);
    if (!taken) break;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  await db.insert(schema.creators).values({ userId: user.id, slug, name: parsed.data.name, bio: parsed.data.bio || null });
  if (user.role === "user") await db.update(schema.users).set({ role: "creator" }).where(eq(schema.users.id, user.id));
  revalidatePath("/creators");
  redirect("/dashboard");
}

export async function saveRecipe(
  recipeId: string | null,
  input: RecipeInput,
  publish: boolean,
): Promise<{ error: string } | { id: string }> {
  const ctx = await getCurrentCreator();
  if (!ctx) return { error: "Retsept nashr etish uchun ijodkor profili kerak." };
  const parsed = recipeInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const result = await persistRecipe({
    recipeId,
    creatorId: ctx.creator.id,
    ownerOnly: true,
    data: parsed.data,
    publish,
  });
  if ("error" in result) return result;

  revalidatePath("/dashboard");
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${result.slug}`);
  return { id: result.id };
}

export async function setRecipeStatus(recipeId: string, status: "draft" | "published"): Promise<void> {
  const ctx = await getCurrentCreator();
  if (!ctx || !z.string().uuid().safeParse(recipeId).success) return;
  await db
    .update(schema.recipes)
    .set({ status, updatedAt: new Date(), ...(status === "published" ? { publishedAt: new Date() } : {}) })
    .where(and(eq(schema.recipes.id, recipeId), eq(schema.recipes.creatorId, ctx.creator.id)));
  revalidatePath("/dashboard");
  revalidatePath("/recipes");
}
