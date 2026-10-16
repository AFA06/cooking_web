import "server-only";
import { randomInt } from "node:crypto";
import { and, desc, eq, gt, inArray, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { applyPromo, currentPrice, type PromoKind } from "@/lib/pricing";

/**
 * Sales and promo codes. Everything here is scoped to one creator: a creator can only touch their own
 * recipes and codes, and a code only ever works on recipes of the creator who made it.
 */

export const PROMO_CODE_PATTERN = /^[A-Z0-9]{4,20}$/;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizePromoCode(input: string): string {
  return input.trim().toUpperCase().replace(/[\s-]/g, "");
}

export function suggestPromoCode(prefix = ""): string {
  const head = normalizePromoCode(prefix).replace(/[^A-Z0-9]/g, "").slice(0, 8);
  let tail = "";
  for (let i = 0; i < 4; i++) tail += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `${head}${tail}`;
}

type PromoRow = typeof schema.promoCodes.$inferSelect;

/** A use is a paid order, or an open order that has not run out yet. Cancelled and expired orders give the use back. */
function usesSql() {
  return sql<number>`(select count(*) from purchases p where p.promo_code_id = "promo_codes"."id"
    and (p.status = 'paid' or (p.status = 'pending' and (p.expires_at is null or p.expires_at > now()))))`.mapWith(Number);
}

export interface PromoWithUses extends PromoRow {
  uses: number;
}

export function promoStatus(p: PromoWithUses, now = Date.now()): "live" | "paused" | "expired" | "usedUp" {
  if (!p.active) return "paused";
  if (p.expiresAt && p.expiresAt.getTime() <= now) return "expired";
  if (p.maxUses !== null && p.uses >= p.maxUses) return "usedUp";
  return "live";
}

export async function listPromos(creatorId: string): Promise<PromoWithUses[]> {
  return db
    .select({ ...schemaPromoColumns(), uses: usesSql() })
    .from(schema.promoCodes)
    .where(eq(schema.promoCodes.creatorId, creatorId))
    .orderBy(desc(schema.promoCodes.createdAt));
}

function schemaPromoColumns() {
  const p = schema.promoCodes;
  return { id: p.id, creatorId: p.creatorId, code: p.code, kind: p.kind, value: p.value, recipeIds: p.recipeIds, maxUses: p.maxUses, expiresAt: p.expiresAt, active: p.active, createdAt: p.createdAt };
}

export type PromoProblem = "promoInvalid" | "promoExpired" | "promoUsedUp" | "promoNotForRecipe";

/**
 * Finds a code that may be used on this recipe right now. `ignoreOrderId` leaves out the buyer's own open
 * order, so re-opening the same order does not count the code twice.
 */
export async function findUsablePromo(code: string, creatorId: string, recipeId: string, ignoreOrderId?: string): Promise<{ promo: PromoRow } | { problem: PromoProblem }> {
  const clean = normalizePromoCode(code);
  if (!PROMO_CODE_PATTERN.test(clean)) return { problem: "promoInvalid" };
  const [promo] = await db.select().from(schema.promoCodes).where(eq(schema.promoCodes.code, clean)).limit(1);
  // A code from another creator looks exactly like a code that does not exist.
  if (!promo || promo.creatorId !== creatorId || !promo.active) return { problem: "promoInvalid" };
  if (promo.expiresAt && promo.expiresAt.getTime() <= Date.now()) return { problem: "promoExpired" };
  if (promo.recipeIds.length > 0 && !promo.recipeIds.includes(recipeId)) return { problem: "promoNotForRecipe" };
  if (promo.maxUses !== null) {
    const [row] = await db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.purchases)
      .where(
        and(
          eq(schema.purchases.promoCodeId, promo.id),
          ignoreOrderId ? sql`${schema.purchases.id} <> ${ignoreOrderId}` : undefined,
          or(eq(schema.purchases.status, "paid"), and(eq(schema.purchases.status, "pending"), or(sql`${schema.purchases.expiresAt} is null`, gt(schema.purchases.expiresAt, new Date())))),
        ),
      );
    if ((row?.n ?? 0) >= promo.maxUses) return { problem: "promoUsedUp" };
  }
  return { promo };
}

export interface Quote {
  /** Normal price of the recipe. */
  list: number;
  /** Price after a running sale. */
  sale: number;
  /** What the buyer pays. */
  final: number;
  promo: PromoRow | null;
}

/** What a recipe costs right now, with an optional promo code applied on top of any sale. */
export function quote(recipe: { price: number; salePrice: number | null; saleEndsAt: Date | null }, promo: PromoRow | null): Quote {
  const now = currentPrice({ price: recipe.price, salePrice: recipe.salePrice, saleEndsAt: recipe.saleEndsAt })!;
  const final = promo ? applyPromo(now.price, promo.kind as PromoKind, promo.value) : now.price;
  return { list: recipe.price, sale: now.price, final, promo };
}

/* ───────────── creator actions ───────────── */

export async function ownPremiumRecipes(creatorId: string) {
  return db
    .select({ id: schema.recipes.id, title: schema.recipes.title, slug: schema.recipes.slug, coverUrl: schema.recipes.coverUrl, status: schema.recipes.status, price: schema.recipes.priceAmount, salePrice: schema.recipes.salePrice, saleEndsAt: schema.recipes.saleEndsAt })
    .from(schema.recipes)
    .where(and(eq(schema.recipes.creatorId, creatorId), eq(schema.recipes.isPremium, true)))
    .orderBy(desc(schema.recipes.updatedAt));
}

/** Starts or changes a sale on the creator's own recipe. Returns false if the recipe isn't theirs. */
export async function setSale(creatorId: string, recipeId: string, salePrice: number, endsAt: Date | null): Promise<boolean> {
  const rows = await db
    .update(schema.recipes)
    .set({ salePrice, saleEndsAt: endsAt })
    .where(and(eq(schema.recipes.id, recipeId), eq(schema.recipes.creatorId, creatorId), eq(schema.recipes.isPremium, true)))
    .returning({ id: schema.recipes.id });
  return !!rows[0];
}

export async function endSale(creatorId: string, recipeId: string): Promise<boolean> {
  const rows = await db
    .update(schema.recipes)
    .set({ salePrice: null, saleEndsAt: null })
    .where(and(eq(schema.recipes.id, recipeId), eq(schema.recipes.creatorId, creatorId)))
    .returning({ id: schema.recipes.id });
  return !!rows[0];
}

/** Keeps only recipe ids that belong to this creator, so a code can never reach someone else's recipe. */
export async function ownRecipeIds(creatorId: string, ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await db
    .select({ id: schema.recipes.id })
    .from(schema.recipes)
    .where(and(eq(schema.recipes.creatorId, creatorId), inArray(schema.recipes.id, ids)));
  return rows.map((r) => r.id);
}

export async function createPromo(values: Omit<typeof schema.promoCodes.$inferInsert, "id" | "createdAt" | "active">): Promise<"ok" | "taken"> {
  try {
    await db.insert(schema.promoCodes).values(values);
    return "ok";
  } catch {
    return "taken";
  }
}

export async function setPromoActive(creatorId: string, promoId: string, active: boolean): Promise<void> {
  await db.update(schema.promoCodes).set({ active }).where(and(eq(schema.promoCodes.id, promoId), eq(schema.promoCodes.creatorId, creatorId)));
}

export async function deletePromo(creatorId: string, promoId: string): Promise<void> {
  // Orders keep their price; their link to the code is cleared by the foreign key.
  await db.delete(schema.promoCodes).where(and(eq(schema.promoCodes.id, promoId), eq(schema.promoCodes.creatorId, creatorId)));
}
