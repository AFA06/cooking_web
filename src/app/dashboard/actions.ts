"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { getT } from "@/i18n/server";
import { getCurrentCreator } from "@/server/creator";
import { persistRecipe } from "@/server/recipe-write";
import { recipeInputSchema, type RecipeInput } from "@/lib/recipe-schema";
import { cleanSocialLinks } from "@/lib/social";
import { TELEGRAM_PATTERN, normalizeTelegram } from "@/server/orders";

export async function saveRecipe(
  recipeId: string | null,
  input: RecipeInput,
  publish: boolean,
): Promise<{ error: string } | { id: string; stepIds: string[] }> {
  const t = await getT();
  const ctx = await getCurrentCreator();
  if (!ctx) return { error: t("err.needCreator") };
  const parsed = recipeInputSchema.safeParse(input);
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) };
  const result = await persistRecipe({
    recipeId,
    creatorId: ctx.creator.id,
    ownerOnly: true,
    data: parsed.data,
    publish,
    actor: ctx.user,
  });
  if ("error" in result) return { error: t(result.error) };

  revalidatePath("/dashboard");
  revalidatePath("/recipes");
  revalidateTag("recipes", { expire: 0 });
  revalidatePath(`/recipes/${result.slug}`);
  return { id: result.id, stepIds: result.stepIds };
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
  revalidateTag("recipes", { expire: 0 });
}

export interface ActionResult {
  error?: string;
}

const creatorProfileSchema = z.object({
  name: z.string().trim().min(2, "err.nameShort").max(80),
  bio: z.string().trim().max(500, "err.bioLong"),
  avatarUrl: z
    .string()
    .trim()
    .max(1000)
    .refine((v) => v === "" || /^https?:\/\//i.test(v), "err.imgUrl"),
  // Buyers of premium recipes are sent to this Telegram chat, so it is what turns the Buy button on.
  telegramUsername: z
    .string()
    .transform(normalizeTelegram)
    .refine((v) => v === "" || TELEGRAM_PATTERN.test(v), "adm.err.telegram"),
});

/** Saves the creator's public profile: name, bio, photo and social accounts. */
export async function updateCreatorProfile(input: { name: string; bio: string; avatarUrl: string; telegramUsername: string; socialLinks: Record<string, string> }): Promise<ActionResult & { ok?: true }> {
  const t = await getT();
  const ctx = await getCurrentCreator();
  if (!ctx) return { error: t("err.creatorMissing") };
  const parsed = creatorProfileSchema.safeParse(input);
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) };

  const socialLinks = cleanSocialLinks(input.socialLinks);
  const rejected = Object.keys(input.socialLinks).filter((key) => input.socialLinks[key].trim() !== "" && !(key in socialLinks));
  if (rejected.length > 0) return { error: t("err.socialBad") };

  await db
    .update(schema.creators)
    .set({ name: parsed.data.name, bio: parsed.data.bio || null, avatarUrl: parsed.data.avatarUrl || null, telegramUsername: parsed.data.telegramUsername || null, socialLinks })
    .where(eq(schema.creators.id, ctx.creator.id));
  revalidatePath(`/creators/${ctx.creator.slug}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
