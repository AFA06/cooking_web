"use server";

import { and, count, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/server/auth";
import { getSaveOptions, type SaveOptions } from "@/server/cookbooks";

type Result<T = object> = ({ ok: true } & T) | { error: string };

const uuid = z.string().uuid();
const cookbookName = z.string().trim().min(1, "err.bookName").max(60, "err.bookNameLong");
const MAX_COOKBOOKS = 50;
const SIGN_IN = "err.signIn";

const books = schema.cookbooks;
const entries = schema.cookbookRecipes;

/** The person's own cookbook, or undefined: every write goes through this check. */
async function ownCookbook(userId: string, cookbookId: string) {
  if (!uuid.safeParse(cookbookId).success) return undefined;
  const [book] = await db.select({ id: books.id }).from(books).where(and(eq(books.id, cookbookId), eq(books.userId, userId))).limit(1);
  return book;
}

async function nameTaken(userId: string, name: string, exceptId?: string): Promise<boolean> {
  const rows = await db.select({ id: books.id }).from(books).where(and(eq(books.userId, userId), sql`lower(${books.name}) = ${name.toLowerCase()}`));
  return rows.some((row) => row.id !== exceptId);
}

export async function loadSaveOptions(recipeId: string): Promise<Result<{ options: SaveOptions }>> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t(SIGN_IN) };
  if (!uuid.safeParse(recipeId).success) return { error: t("err.recipeNotFound") };
  return { ok: true, options: await getSaveOptions(user.id, recipeId) };
}

/** Puts a recipe into, or takes it out of, the general saved list ("saved") or one cookbook (its id). */
export async function setRecipeKept(recipeId: string, place: string, kept: boolean): Promise<Result> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t(SIGN_IN) };
  if (!uuid.safeParse(recipeId).success) return { error: t("err.recipeNotFound") };

  if (place === "saved") {
    const saved = schema.savedRecipes;
    if (kept) await db.insert(saved).values({ userId: user.id, recipeId }).onConflictDoNothing();
    else await db.delete(saved).where(and(eq(saved.userId, user.id), eq(saved.recipeId, recipeId)));
  } else {
    const book = await ownCookbook(user.id, place);
    if (!book) return { error: t("err.bookNotFound") };
    if (kept) await db.insert(entries).values({ cookbookId: book.id, recipeId }).onConflictDoNothing();
    else await db.delete(entries).where(and(eq(entries.cookbookId, book.id), eq(entries.recipeId, recipeId)));
  }
  revalidatePath("/account", "layout");
  return { ok: true };
}

/** Creates a cookbook; with a recipe id, that recipe goes straight into it. */
export async function createCookbook(name: string, recipeId: string | null): Promise<Result<{ id: string; name: string }>> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t(SIGN_IN) };
  const parsed = cookbookName.safeParse(name);
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) };
  if (recipeId !== null && !uuid.safeParse(recipeId).success) return { error: t("err.recipeNotFound") };

  const [{ n }] = await db.select({ n: count() }).from(books).where(eq(books.userId, user.id));
  if (n >= MAX_COOKBOOKS) return { error: t("err.maxBooks", { max: MAX_COOKBOOKS }) };
  if (await nameTaken(user.id, parsed.data)) return { error: t("err.bookExists") };

  const [book] = await db.insert(books).values({ userId: user.id, name: parsed.data }).returning({ id: books.id, name: books.name });
  if (recipeId) await db.insert(entries).values({ cookbookId: book.id, recipeId }).onConflictDoNothing();
  revalidatePath("/account", "layout");
  return { ok: true, ...book };
}

export async function renameCookbook(cookbookId: string, name: string): Promise<Result> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t(SIGN_IN) };
  const parsed = cookbookName.safeParse(name);
  if (!parsed.success) return { error: t(parsed.error.issues[0].message) };
  const book = await ownCookbook(user.id, cookbookId);
  if (!book) return { error: t("err.bookNotFound") };
  if (await nameTaken(user.id, parsed.data, book.id)) return { error: t("err.bookExists") };

  await db.update(books).set({ name: parsed.data }).where(eq(books.id, book.id));
  revalidatePath("/account", "layout");
  return { ok: true };
}

/** Deletes the cookbook only; the recipes themselves and the general saved list are untouched. */
export async function deleteCookbook(cookbookId: string): Promise<Result> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { error: t(SIGN_IN) };
  const book = await ownCookbook(user.id, cookbookId);
  if (!book) return { error: t("err.bookNotFound") };

  await db.delete(books).where(eq(books.id, book.id));
  revalidatePath("/account", "layout");
  return { ok: true };
}
