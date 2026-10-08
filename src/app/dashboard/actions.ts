"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/server/auth";
import { getCurrentCreator } from "@/server/creator";
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
  const d = parsed.data;

  const fields = {
    title: d.title,
    description: d.description,
    coverUrl: d.coverUrl,
    coverAlt: d.title,
    servings: d.servings,
    prepTimeMinutes: d.prepTimeMinutes,
    cookTimeMinutes: d.cookTimeMinutes,
    difficulty: d.difficulty,
    isPremium: d.isPremium,
    priceAmount: d.isPremium ? d.priceAmount : null,
    priceCurrency: d.isPremium ? "UZS" : null,
    tags: d.tags,
    updatedAt: new Date(),
  };

  let id = recipeId;
  if (id) {
    const [owned] = await db
      .select({ id: schema.recipes.id, publishedAt: schema.recipes.publishedAt })
      .from(schema.recipes)
      .where(and(eq(schema.recipes.id, id), eq(schema.recipes.creatorId, ctx.creator.id)))
      .limit(1);
    if (!owned) return { error: "Retsept topilmadi." };
    await db
      .update(schema.recipes)
      .set({ ...fields, status: publish ? "published" : "draft", publishedAt: publish ? (owned.publishedAt ?? new Date()) : owned.publishedAt })
      .where(eq(schema.recipes.id, id));
  } else {
    const base = slugify(d.title) || "recipe";
    let slug = base;
    for (let i = 0; i < 5; i++) {
      const [taken] = await db.select({ id: schema.recipes.id }).from(schema.recipes).where(eq(schema.recipes.slug, slug)).limit(1);
      if (!taken) break;
      slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    }
    const [row] = await db
      .insert(schema.recipes)
      .values({ ...fields, slug, creatorId: ctx.creator.id, status: publish ? "published" : "draft", publishedAt: publish ? new Date() : null })
      .returning({ id: schema.recipes.id });
    id = row.id;
  }

  // Ingredients and steps are replaced as a unit.
  await db.delete(schema.recipeIngredients).where(eq(schema.recipeIngredients.recipeId, id));
  await db.delete(schema.recipeSteps).where(eq(schema.recipeSteps.recipeId, id));
  await db.insert(schema.recipeIngredients).values(
    d.ingredients.map((i, n) => ({ recipeId: id!, position: n + 1, name: i.name, quantity: i.quantity, unit: i.unit })),
  );
  await db.insert(schema.recipeSteps).values(
    d.steps.map((s, n) => ({
      recipeId: id!,
      position: n + 1,
      title: s.title,
      instruction: s.instruction,
      mediaUrl: s.mediaUrl || null,
      timerSeconds: s.timerMinutes > 0 ? s.timerMinutes * 60 : null,
      temperatureCelsius: s.temperatureCelsius > 0 ? s.temperatureCelsius : null,
      tip: s.tip || null,
      ingredientPositions: s.ingredientPositions.filter((p) => p <= d.ingredients.length),
    })),
  );

  revalidatePath("/dashboard");
  revalidatePath("/recipes");
  return { id };
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
