import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { slugify, type RecipeData } from "@/lib/recipe-schema";

interface PersistOptions {
  recipeId: string | null;
  /** Owner for a new recipe. For updates, restricts the write to this creator when `ownerOnly` is set. */
  creatorId: string | null;
  ownerOnly: boolean;
  data: RecipeData;
  publish: boolean;
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "retsept";
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const [taken] = await db.select({ id: schema.recipes.id }).from(schema.recipes).where(eq(schema.recipes.slug, slug)).limit(1);
    if (!taken) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return slug;
}

/** Creates or updates a recipe together with its ingredients and steps. */
export async function persistRecipe(o: PersistOptions): Promise<{ error: string } | { id: string; slug: string }> {
  const d = o.data;
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
    status: o.publish ? ("published" as const) : ("draft" as const),
    updatedAt: new Date(),
  };

  let id: string;
  let slug: string;
  if (o.recipeId) {
    const [existing] = await db
      .select({ id: schema.recipes.id, slug: schema.recipes.slug, publishedAt: schema.recipes.publishedAt })
      .from(schema.recipes)
      .where(
        o.ownerOnly && o.creatorId
          ? and(eq(schema.recipes.id, o.recipeId), eq(schema.recipes.creatorId, o.creatorId))
          : eq(schema.recipes.id, o.recipeId),
      )
      .limit(1);
    if (!existing) return { error: "Retsept topilmadi." };
    await db
      .update(schema.recipes)
      .set({ ...fields, publishedAt: o.publish ? (existing.publishedAt ?? new Date()) : existing.publishedAt })
      .where(eq(schema.recipes.id, existing.id));
    ({ id, slug } = existing);
  } else {
    if (!o.creatorId) return { error: "Ijodkor tanlanmagan." };
    slug = await uniqueSlug(d.title);
    const [row] = await db
      .insert(schema.recipes)
      .values({ ...fields, slug, creatorId: o.creatorId, publishedAt: o.publish ? new Date() : null })
      .returning({ id: schema.recipes.id });
    id = row.id;
  }

  // Ingredients and steps are replaced as a unit.
  await db.delete(schema.recipeIngredients).where(eq(schema.recipeIngredients.recipeId, id));
  await db.delete(schema.recipeSteps).where(eq(schema.recipeSteps.recipeId, id));
  await db.insert(schema.recipeIngredients).values(
    d.ingredients.map((i, n) => ({ recipeId: id, position: n + 1, name: i.name, quantity: i.quantity, unit: i.unit })),
  );
  await db.insert(schema.recipeSteps).values(
    d.steps.map((s, n) => ({
      recipeId: id,
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
  return { id, slug };
}

export async function loadRecipeForEdit(recipeId: string, creatorId?: string) {
  const [recipe] = await db
    .select()
    .from(schema.recipes)
    .where(creatorId ? and(eq(schema.recipes.id, recipeId), eq(schema.recipes.creatorId, creatorId)) : eq(schema.recipes.id, recipeId))
    .limit(1);
  if (!recipe) return null;
  const [ingredients, steps] = await Promise.all([
    db.select().from(schema.recipeIngredients).where(eq(schema.recipeIngredients.recipeId, recipeId)),
    db.select().from(schema.recipeSteps).where(eq(schema.recipeSteps.recipeId, recipeId)),
  ]);
  return {
    recipe,
    ingredients: ingredients.sort((a, b) => a.position - b.position),
    steps: steps.sort((a, b) => a.position - b.position),
  };
}

export type RecipeForEdit = NonNullable<Awaited<ReturnType<typeof loadRecipeForEdit>>>;
