import "server-only";
import { and, avg, count, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  userName: string;
  /** Present when the cook attached a photo of the result. */
  photoId: string | null;
  recipeTitle: string;
  recipeSlug: string;
}

export interface RatingSummary {
  average: number;
  count: number;
  /** How many reviews gave 1, 2, 3, 4 and 5 stars, in that order. */
  distribution: [number, number, number, number, number];
}

const reviewSelection = {
  id: schema.reviews.id,
  rating: schema.reviews.rating,
  comment: schema.reviews.comment,
  createdAt: schema.reviews.createdAt,
  userName: schema.users.name,
  photoId: schema.reviewPhotos.id,
  recipeTitle: schema.recipes.title,
  recipeSlug: schema.recipes.slug,
};

function selectReviews() {
  return db
    .select(reviewSelection)
    .from(schema.reviews)
    .innerJoin(schema.users, eq(schema.reviews.userId, schema.users.id))
    .innerJoin(schema.recipes, eq(schema.reviews.recipeId, schema.recipes.id))
    .leftJoin(schema.reviewPhotos, eq(schema.reviewPhotos.reviewId, schema.reviews.id));
}

export async function getRecipeReviews(recipeId: string, limit = 20): Promise<Review[]> {
  return selectReviews().where(eq(schema.reviews.recipeId, recipeId)).orderBy(desc(schema.reviews.createdAt)).limit(limit);
}

export async function getCreatorReviews(creatorId: string, limit = 6): Promise<Review[]> {
  return selectReviews()
    .where(and(eq(schema.recipes.creatorId, creatorId), eq(schema.recipes.status, "published")))
    .orderBy(desc(schema.reviews.createdAt))
    .limit(limit);
}

function summarize(rows: { rating: number; n: number }[]): RatingSummary {
  const distribution: RatingSummary["distribution"] = [0, 0, 0, 0, 0];
  for (const row of rows) distribution[row.rating - 1] = row.n;
  const total = distribution.reduce((sum, n) => sum + n, 0);
  const points = distribution.reduce((sum, n, i) => sum + n * (i + 1), 0);
  return { average: total === 0 ? 0 : points / total, count: total, distribution };
}

export async function getRecipeRating(recipeId: string): Promise<RatingSummary> {
  const rows = await db
    .select({ rating: schema.reviews.rating, n: count() })
    .from(schema.reviews)
    .where(eq(schema.reviews.recipeId, recipeId))
    .groupBy(schema.reviews.rating);
  return summarize(rows);
}

export interface CreatorSummary {
  rating: RatingSummary;
  /** Guided-cooking sessions finished across all of the creator's recipes. */
  cooked: number;
  publishedRecipes: number;
}

export async function getCreatorSummary(creatorId: string): Promise<CreatorSummary> {
  const ownRecipe = and(eq(schema.recipes.creatorId, creatorId), eq(schema.recipes.status, "published"));
  const [ratingRows, [cooked], [recipes]] = await Promise.all([
    db
      .select({ rating: schema.reviews.rating, n: count() })
      .from(schema.reviews)
      .innerJoin(schema.recipes, eq(schema.reviews.recipeId, schema.recipes.id))
      .where(ownRecipe)
      .groupBy(schema.reviews.rating),
    db
      .select({ n: count() })
      .from(schema.cookingSessions)
      .innerJoin(schema.recipes, eq(schema.cookingSessions.recipeId, schema.recipes.id))
      .where(and(ownRecipe, eq(schema.cookingSessions.status, "completed"))),
    db.select({ n: count() }).from(schema.recipes).where(ownRecipe),
  ]);
  return { rating: summarize(ratingRows), cooked: cooked.n, publishedRecipes: recipes.n };
}

export interface ReviewEligibility {
  /** True once the person has finished cooking this recipe and is not its creator. */
  canReview: boolean;
  existing: { rating: number; comment: string; photoId: string | null } | null;
}

export async function getReviewEligibility(userId: string, recipeId: string): Promise<ReviewEligibility> {
  const [[cooked], [own], [existing]] = await Promise.all([
    db
      .select({ id: schema.cookingSessions.id })
      .from(schema.cookingSessions)
      .where(and(eq(schema.cookingSessions.userId, userId), eq(schema.cookingSessions.recipeId, recipeId), eq(schema.cookingSessions.status, "completed")))
      .limit(1),
    db
      .select({ id: schema.recipes.id })
      .from(schema.recipes)
      .innerJoin(schema.creators, eq(schema.recipes.creatorId, schema.creators.id))
      .where(and(eq(schema.recipes.id, recipeId), eq(schema.creators.userId, userId)))
      .limit(1),
    db
      .select({ rating: schema.reviews.rating, comment: schema.reviews.comment, photoId: schema.reviewPhotos.id })
      .from(schema.reviews)
      .leftJoin(schema.reviewPhotos, eq(schema.reviewPhotos.reviewId, schema.reviews.id))
      .where(and(eq(schema.reviews.userId, userId), eq(schema.reviews.recipeId, recipeId)))
      .limit(1),
  ]);
  return { canReview: !!cooked && !own, existing: existing ?? null };
}

/** Average rating and review count per recipe, for lists. */
export async function getRatingsForRecipes(recipeIds: string[]): Promise<Map<string, { average: number; count: number }>> {
  if (recipeIds.length === 0) return new Map();
  const rows = await db
    .select({ recipeId: schema.reviews.recipeId, average: avg(schema.reviews.rating).mapWith(Number), n: count() })
    .from(schema.reviews)
    .where(inArray(schema.reviews.recipeId, recipeIds))
    .groupBy(schema.reviews.recipeId);
  return new Map(rows.map((r) => [r.recipeId, { average: r.average, count: r.n }]));
}
