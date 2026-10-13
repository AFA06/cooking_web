import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { fileIdFromUrl } from "@/lib/media";
import { slugify, type RecipeData } from "@/lib/recipe-schema";
import { attachStepMedia, checkStepMedia, type Actor } from "@/server/media";
import { getStorage, type ObjectStorage } from "@/server/storage";

interface PersistOptions {
  recipeId: string | null;
  /** Owner for a new recipe. For updates, restricts the write to this creator when `ownerOnly` is set. */
  creatorId: string | null;
  ownerOnly: boolean;
  data: RecipeData;
  publish: boolean;
  /** The signed-in person saving. Files they uploaded can be put on the recipe's steps. */
  actor: Actor;
  /** Where removed files are deleted from; the configured storage unless a test passes its own. */
  storage?: ObjectStorage | null;
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
export async function persistRecipe(o: PersistOptions): Promise<{ error: string } | { id: string; slug: string; stepIds: string[] }> {
  const d = o.data;
  // Uploaded files the steps name, checked before anything is written.
  const wanted = d.steps.flatMap((s, step) =>
    ([["image", s.mediaUrl], ["video", s.videoUrl]] as const).flatMap(([kind, url]) => {
      const assetId = fileIdFromUrl(url);
      return assetId ? [{ step, kind, assetId }] : [];
    }),
  );
  if (!(await checkStepMedia(o.actor, o.recipeId, wanted))) return { error: "err.mediaInvalid" };
  const fields = {
    title: d.title,
    description: d.description,
    coverUrl: d.coverUrl,
    coverAlt: d.title,
    galleryUrls: d.galleryUrls,
    videoUrl: d.videoUrl || null,
    // Insider notes only make sense on a paid recipe; a free one never keeps them.
    secretNotes: d.isPremium && d.secretNotes ? d.secretNotes : null,
    servings: d.servings,
    prepTimeMinutes: d.prepTimeMinutes,
    cookTimeMinutes: d.cookTimeMinutes,
    difficulty: d.difficulty,
    category: d.category,
    calories: d.calories,
    proteinGrams: d.proteinGrams,
    fatGrams: d.fatGrams,
    carbGrams: d.carbGrams,
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
    if (!existing) return { error: "err.recipeNotFound" };
    await db
      .update(schema.recipes)
      .set({ ...fields, publishedAt: o.publish ? (existing.publishedAt ?? new Date()) : existing.publishedAt })
      .where(eq(schema.recipes.id, existing.id));
    ({ id, slug } = existing);
  } else {
    if (!o.creatorId) return { error: "err.noCreator" };
    slug = await uniqueSlug(d.title);
    const [row] = await db
      .insert(schema.recipes)
      .values({ ...fields, slug, creatorId: o.creatorId, publishedAt: o.publish ? new Date() : null })
      .returning({ id: schema.recipes.id });
    id = row.id;
  }

  // Ingredients are replaced as a unit. Steps keep their ids, so a step's photo and clip stay with it
  // however the steps are edited or reordered; only an id that is really this recipe's is believed.
  await db.delete(schema.recipeIngredients).where(eq(schema.recipeIngredients.recipeId, id));
  await db.insert(schema.recipeIngredients).values(
    d.ingredients.map((i, n) => ({ recipeId: id, position: n + 1, name: i.name, quantity: i.quantity, unit: i.unit })),
  );

  const existing = await db.select({ id: schema.recipeSteps.id }).from(schema.recipeSteps).where(eq(schema.recipeSteps.recipeId, id));
  const known = new Set(existing.map((s) => s.id));
  const rows = d.steps.map((s, n) => {
    const keeps = s.id !== undefined && known.delete(s.id);
    return {
      id: keeps ? s.id : undefined,
      values: {
        recipeId: id,
        position: n + 1,
        title: s.title,
        instruction: s.instruction,
        isFree: s.isFree,
        mediaUrl: s.mediaUrl || null,
        videoUrl: s.videoUrl || null,
        timerSeconds: s.timerMinutes > 0 ? s.timerMinutes * 60 : null,
        temperatureCelsius: s.temperatureCelsius > 0 ? s.temperatureCelsius : null,
        tip: s.tip || null,
        ingredientPositions: s.ingredientPositions.filter((p) => p <= d.ingredients.length),
      },
    };
  });
  // Whatever is left in `known` was removed in the editor.
  if (known.size > 0) await db.delete(schema.recipeSteps).where(inArray(schema.recipeSteps.id, [...known]));
  const fresh = rows.filter((r) => !r.id);
  const created = fresh.length > 0 ? await db.insert(schema.recipeSteps).values(fresh.map((r) => r.values)).returning({ id: schema.recipeSteps.id }) : [];
  fresh.forEach((r, n) => (r.id = created[n].id));
  const [first, ...rest] = rows.filter((r) => !fresh.includes(r)).map((r) => db.update(schema.recipeSteps).set(r.values).where(eq(schema.recipeSteps.id, r.id!)));
  if (first) await db.batch([first, ...rest]);
  const stepIds = rows.map((r) => r.id!);

  await attachStepMedia(
    o.storage === undefined ? getStorage() : o.storage,
    id,
    wanted.map((w) => ({ stepId: stepIds[w.step], kind: w.kind, assetId: w.assetId })),
  );
  return { id, slug, stepIds };
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
