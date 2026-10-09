import "server-only";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { cleanSocialLinks } from "@/lib/social";
import { getRatingsForRecipes } from "@/server/reviews";
import type { Recipe, RecipeCreator } from "@/types/recipe";

type RecipeRow = typeof schema.recipes.$inferSelect;
type CreatorRow = typeof schema.creators.$inferSelect;

function toCreator(c: CreatorRow): RecipeCreator {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    avatarUrl: c.avatarUrl ?? undefined,
    bio: c.bio ?? undefined,
    isFoundingCreator: c.isFoundingCreator,
    socialLinks: cleanSocialLinks(c.socialLinks),
  };
}

function toRecipe(
  r: RecipeRow,
  creator: CreatorRow,
  ingredients: (typeof schema.recipeIngredients.$inferSelect)[],
  steps: (typeof schema.recipeSteps.$inferSelect)[],
  cookedCount: number,
  rating: Recipe["rating"],
): Recipe {
  const ingredientByPosition = new Map(ingredients.map((i) => [i.position, i.id]));
  const cover = { id: `${r.id}-cover`, type: "image" as const, url: r.coverUrl, alt: r.coverAlt ?? r.title, order: 1 };
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    coverMedia: cover,
    creator: toCreator(creator),
    servings: r.servings,
    prepTimeMinutes: r.prepTimeMinutes,
    cookTimeMinutes: r.cookTimeMinutes,
    difficulty: r.difficulty,
    isPremium: r.isPremium,
    price: r.priceAmount ?? undefined,
    currency: r.priceCurrency ?? undefined,
    ingredients: ingredients
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit, notes: i.notes ?? undefined, order: i.position })),
    steps: steps
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        id: s.id,
        order: s.position,
        title: s.title,
        instruction: s.instruction,
        mediaUrl: s.mediaUrl ?? undefined,
        mediaType: s.mediaUrl ? ("image" as const) : undefined,
        timerSeconds: s.timerSeconds ?? undefined,
        temperatureCelsius: s.temperatureCelsius ?? undefined,
        tip: s.tip ?? undefined,
        ingredientIds: s.ingredientPositions.map((p) => ingredientByPosition.get(p)).filter((x): x is string => !!x),
      })),
    media: [cover, ...r.galleryUrls.map((url, i) => ({ id: `${r.id}-gallery-${i}`, type: "image" as const, url, alt: r.title, order: i + 2 }))],
    tags: r.tags,
    publishedAt: (r.publishedAt ?? r.createdAt).toISOString(),
    cookedCount,
    rating,
  };
}

async function hydrate(rows: { recipe: RecipeRow; creator: CreatorRow }[]): Promise<Recipe[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.recipe.id);
  const [ingredients, steps, cooked, ratings] = await Promise.all([
    db.select().from(schema.recipeIngredients).where(inArray(schema.recipeIngredients.recipeId, ids)),
    db.select().from(schema.recipeSteps).where(inArray(schema.recipeSteps.recipeId, ids)),
    db
      .select({ recipeId: schema.cookingSessions.recipeId, n: count() })
      .from(schema.cookingSessions)
      .where(and(inArray(schema.cookingSessions.recipeId, ids), eq(schema.cookingSessions.status, "completed")))
      .groupBy(schema.cookingSessions.recipeId),
    getRatingsForRecipes(ids),
  ]);
  const cookedByRecipe = new Map(cooked.map((c) => [c.recipeId, c.n]));
  return rows.map(({ recipe, creator }) =>
    toRecipe(
      recipe,
      creator,
      ingredients.filter((i) => i.recipeId === recipe.id),
      steps.filter((s) => s.recipeId === recipe.id),
      cookedByRecipe.get(recipe.id) ?? 0,
      ratings.get(recipe.id) ?? { average: 0, count: 0 },
    ),
  );
}

const published = eq(schema.recipes.status, "published");

function selectRecipes() {
  return db
    .select({ recipe: schema.recipes, creator: schema.creators })
    .from(schema.recipes)
    .innerJoin(schema.creators, eq(schema.recipes.creatorId, schema.creators.id));
}

export async function listPublishedRecipes(): Promise<Recipe[]> {
  return hydrate(await selectRecipes().where(published).orderBy(desc(schema.recipes.publishedAt)));
}

export async function getFeaturedRecipes(limit = 6): Promise<Recipe[]> {
  return hydrate(
    await selectRecipes()
      .where(and(published, eq(schema.recipes.isFeatured, true)))
      .orderBy(desc(schema.recipes.publishedAt))
      .limit(limit),
  );
}

export async function getRecipeBySlug(slug: string): Promise<Recipe | undefined> {
  const rows = await selectRecipes().where(and(published, eq(schema.recipes.slug, slug))).limit(1);
  return (await hydrate(rows))[0];
}

export async function getRecipeById(id: string): Promise<Recipe | undefined> {
  const rows = await selectRecipes().where(and(published, eq(schema.recipes.id, id))).limit(1);
  return (await hydrate(rows))[0];
}

export async function getRecipesByIds(ids: string[]): Promise<Recipe[]> {
  if (ids.length === 0) return [];
  return hydrate(await selectRecipes().where(and(published, inArray(schema.recipes.id, ids))));
}

export async function getRecipesByCreator(creatorSlug: string): Promise<Recipe[]> {
  return hydrate(
    await selectRecipes().where(and(published, eq(schema.creators.slug, creatorSlug))).orderBy(desc(schema.recipes.publishedAt)),
  );
}

export async function listCreators(): Promise<(RecipeCreator & { recipeCount: number })[]> {
  const rows = await db
    .select({
      creator: schema.creators,
      recipeCount: sql<number>`count(${schema.recipes.id}) filter (where ${schema.recipes.status} = 'published')`.mapWith(Number),
    })
    .from(schema.creators)
    .leftJoin(schema.recipes, eq(schema.recipes.creatorId, schema.creators.id))
    .groupBy(schema.creators.id)
    .orderBy(asc(schema.creators.name));
  return rows.map((r) => ({ ...toCreator(r.creator), recipeCount: r.recipeCount }));
}

export async function getCreatorBySlug(slug: string): Promise<RecipeCreator | undefined> {
  const [row] = await db.select().from(schema.creators).where(eq(schema.creators.slug, slug)).limit(1);
  return row ? toCreator(row) : undefined;
}
