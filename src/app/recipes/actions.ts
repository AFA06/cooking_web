"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/server/auth";
import { getReviewEligibility } from "@/server/reviews";

const uuid = z.string().uuid();

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

/** Largest accepted photo after the browser has resized it (about 600 KB of image data). */
const MAX_PHOTO_BASE64_LENGTH = 800_000;

const reviewSchema = z.object({
  recipeId: uuid,
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000, "err.reviewLong"),
  photo: z
    .object({
      mime: z.enum(["image/jpeg", "image/webp", "image/png"]),
      data: z.string().regex(/^[A-Za-z0-9+/]+=*$/).max(MAX_PHOTO_BASE64_LENGTH, "err.photoBig"),
    })
    .nullable(),
});

export type ReviewInput = z.input<typeof reviewSchema>;

/** Creates or updates the signed-in cook's review. Only people who finished cooking the recipe may review it. */
export async function submitReview(input: ReviewInput): Promise<{ ok: true } | { error: string }> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t("err.rateSignIn") };
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) };
  const { recipeId, rating, comment, photo } = parsed.data;

  const eligibility = await getReviewEligibility(user.id, recipeId);
  if (!eligibility.canReview) return { error: t("err.rateCookFirst") };

  const [review] = await db
    .insert(schema.reviews)
    .values({ recipeId, userId: user.id, rating, comment })
    .onConflictDoUpdate({ target: [schema.reviews.recipeId, schema.reviews.userId], set: { rating, comment, updatedAt: new Date() } })
    .returning({ id: schema.reviews.id });

  if (photo) {
    // A new row (and id) per upload, so cached copies of the old photo are never shown.
    await db.delete(schema.reviewPhotos).where(eq(schema.reviewPhotos.reviewId, review.id));
    await db.insert(schema.reviewPhotos).values({ reviewId: review.id, mime: photo.mime, data: photo.data });
  }

  const [recipe] = await db
    .select({ slug: schema.recipes.slug, creatorSlug: schema.creators.slug })
    .from(schema.recipes)
    .innerJoin(schema.creators, eq(schema.recipes.creatorId, schema.creators.id))
    .where(eq(schema.recipes.id, recipeId))
    .limit(1);
  if (recipe) {
    revalidatePath(`/recipes/${recipe.slug}`);
    revalidatePath(`/creators/${recipe.creatorSlug}`);
  }
  return { ok: true };
}
