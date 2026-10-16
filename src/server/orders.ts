import "server-only";
import { randomInt } from "node:crypto";
import { and, desc, eq, gt, inArray, lt, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { normalizePhone } from "@/lib/profile";
import { clientKey } from "@/server/security";
import type { Locale } from "@/i18n/core";
import { currentPrice } from "@/lib/pricing";
import { findUsablePromo, quote, type PromoProblem, type Quote } from "@/server/promos";

/**
 * Orders for premium recipes paid through the creator's Telegram chat.
 * The order row is the only thing that unlocks a recipe: nothing typed in a chat is ever trusted.
 */

/** How long an unpaid order stays open. Generous, because the buyer has to find the card, pay and send a receipt. */
export const ORDER_TTL_HOURS = 72;
export const MAX_OPEN_ORDERS = 5;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newOrderCode(): string {
  let out = "";
  for (let i = 0; i < 6; i++) out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `DM-${out}`;
}

/** Accepts "dm-7k4q2p", "7K4Q2P" and the like; returns the canonical code or null. */
export function parseOrderCode(input: string): string | null {
  const raw = input.replace(/[\s-]/g, "").toUpperCase();
  const body = raw.startsWith("DM") && raw.length === 8 ? raw.slice(2) : raw;
  return new RegExp(`^[${CODE_ALPHABET}]{6}$`).test(body) ? `DM-${body}` : null;
}

export const TELEGRAM_PATTERN = /^[a-z][a-z0-9_]{4,31}$/;

export function normalizeTelegram(input: string): string {
  return input.trim().replace(/^(https?:\/\/)?(t\.me\/|telegram\.me\/)/i, "").replace(/^@/, "").toLowerCase();
}

type Status = "pending" | "paid" | "failed" | "refunded";

export async function logOrderEvent(purchaseId: string, actorId: string | null, action: string, note?: string) {
  const clientHash = await clientKey().catch(() => null);
  await db.insert(schema.purchaseEvents).values({ purchaseId, actorId, action, note: note ?? null, clientHash });
}

/** Closes unpaid orders whose time has run out. Cheap enough to call before reading orders. */
export async function expireOrders(where: ReturnType<typeof and> | undefined): Promise<void> {
  await db
    .update(schema.purchases)
    .set({ status: "failed" })
    .where(and(eq(schema.purchases.status, "pending"), eq(schema.purchases.provider, "telegram"), lt(schema.purchases.expiresAt, new Date()), where));
}

/* ───────────── message to the creator ───────────── */

const GREETING: Record<Locale, { hello: string; want: (title: string) => string; price: string; was: string; promo: string; steps: string; code: string; name: string; phone: string; minutes: string }> = {
  uz: { hello: "Assalomu alaykum!", want: (t) => `Men «${t}» retseptini sotib olmoqchiman.`, price: "Narxi", was: "avval", promo: "Promokod", steps: "Qadamlar", code: "Buyurtma", name: "Ism", phone: "Telefon", minutes: "daqiqa" },
  ru: { hello: "Здравствуйте!", want: (t) => `Хочу купить рецепт «${t}».`, price: "Цена", was: "было", promo: "Промокод", steps: "Шагов", code: "Заказ", name: "Имя", phone: "Телефон", minutes: "мин" },
  en: { hello: "Hello!", want: (t) => `I'd like to buy the recipe “${t}”.`, price: "Price", was: "was", promo: "Promo code", steps: "Steps", code: "Order", name: "Name", phone: "Phone", minutes: "min" },
  kz: { hello: "Сәлеметсіз бе!", want: (t) => `«${t}» рецептін сатып алғым келеді.`, price: "Бағасы", was: "бұрын", promo: "Промокод", steps: "Қадамдар", code: "Тапсырыс", name: "Аты", phone: "Телефон", minutes: "мин" },
};

export interface MessageInput {
  locale: Locale;
  title: string;
  priceText: string;
  /** The normal price, when the buyer pays less because of a sale or a code. */
  wasText?: string;
  promoCode?: string;
  stepCount: number;
  totalMinutes: number;
  code: string;
  buyerName?: string;
  buyerPhone?: string;
}

/** The text that is typed into the chat. Written in the creator's language so they can read it. */
export function buildOrderMessage(m: MessageInput): string {
  const g = GREETING[m.locale] ?? GREETING.uz;
  const lines = [g.hello, g.want(m.title), `${g.price}: ${m.priceText}${m.wasText ? ` (${g.was} ${m.wasText})` : ""}`];
  if (m.promoCode) lines.push(`${g.promo}: ${m.promoCode}`);
  lines.push(`${g.steps}: ${m.stepCount} · ${m.totalMinutes} ${g.minutes}`, `${g.code}: ${m.code}`);
  if (m.buyerName) lines.push(`${g.name}: ${m.buyerName}`);
  if (m.buyerPhone) lines.push(`${g.phone}: ${m.buyerPhone}`);
  return lines.join("\n");
}

export function telegramLink(username: string, message: string): string {
  return `https://t.me/${username}?text=${encodeURIComponent(message)}`;
}

/* ───────────── buyer side ───────────── */

export interface BuyerOrder {
  id: string;
  code: string;
  status: Status;
  recipeId: string;
  recipeSlug: string;
  recipeTitle: string;
  amount: number;
  currency: string;
  expiresAt: Date | null;
  createdAt: Date;
  creatorName: string;
  telegramUsername: string | null;
}

const buyerSelect = {
  id: schema.purchases.id,
  code: schema.purchases.orderCode,
  status: schema.purchases.status,
  recipeId: schema.purchases.recipeId,
  recipeSlug: schema.recipes.slug,
  recipeTitle: schema.recipes.title,
  amount: schema.purchases.amount,
  currency: schema.purchases.currency,
  expiresAt: schema.purchases.expiresAt,
  createdAt: schema.purchases.createdAt,
  creatorName: schema.creators.name,
  telegramUsername: schema.creators.telegramUsername,
};

/** The person's most recent Telegram order for a recipe, if any. */
export async function getOrderForRecipe(userId: string, recipeId: string): Promise<BuyerOrder | null> {
  await expireOrders(and(eq(schema.purchases.userId, userId), eq(schema.purchases.recipeId, recipeId)));
  const [row] = await db
    .select(buyerSelect)
    .from(schema.purchases)
    .innerJoin(schema.recipes, eq(schema.recipes.id, schema.purchases.recipeId))
    .innerJoin(schema.creators, eq(schema.creators.id, schema.recipes.creatorId))
    .where(and(eq(schema.purchases.userId, userId), eq(schema.purchases.recipeId, recipeId), eq(schema.purchases.provider, "telegram")))
    .orderBy(desc(schema.purchases.createdAt))
    .limit(1);
  return (row as BuyerOrder | undefined) ?? null;
}

export async function getOrderByCode(userId: string, code: string): Promise<BuyerOrder | null> {
  await expireOrders(eq(schema.purchases.userId, userId));
  const [row] = await db
    .select(buyerSelect)
    .from(schema.purchases)
    .innerJoin(schema.recipes, eq(schema.recipes.id, schema.purchases.recipeId))
    .innerJoin(schema.creators, eq(schema.creators.id, schema.recipes.creatorId))
    .where(and(eq(schema.purchases.userId, userId), eq(schema.purchases.orderCode, code)))
    .limit(1);
  return (row as BuyerOrder | undefined) ?? null;
}

export async function listMyOrders(userId: string): Promise<BuyerOrder[]> {
  await expireOrders(eq(schema.purchases.userId, userId));
  const rows = await db
    .select(buyerSelect)
    .from(schema.purchases)
    .innerJoin(schema.recipes, eq(schema.recipes.id, schema.purchases.recipeId))
    .innerJoin(schema.creators, eq(schema.creators.id, schema.recipes.creatorId))
    .where(and(eq(schema.purchases.userId, userId), eq(schema.purchases.provider, "telegram"), inArray(schema.purchases.status, ["pending", "paid"])))
    .orderBy(desc(schema.purchases.createdAt));
  return rows as BuyerOrder[];
}

export type CreateOrderResult =
  | { ok: true; code: string; link: string; free: false }
  | { ok: true; code: string; link: null; free: true }
  | { ok: false; error: "signIn" | "notFound" | "unavailable" | "own" | "owned" | "tooMany" | PromoProblem };

type Buyer = { id: string; name: string; phone: string | null };

async function loadOrderRecipe(recipeId: string) {
  const [recipe] = await db
    .select({
      id: schema.recipes.id,
      title: schema.recipes.title,
      price: schema.recipes.priceAmount,
      salePrice: schema.recipes.salePrice,
      saleEndsAt: schema.recipes.saleEndsAt,
      currency: schema.recipes.priceCurrency,
      premium: schema.recipes.isPremium,
      status: schema.recipes.status,
      prep: schema.recipes.prepTimeMinutes,
      cook: schema.recipes.cookTimeMinutes,
      creatorId: schema.creators.id,
      creatorUserId: schema.creators.userId,
      telegram: schema.creators.telegramUsername,
      creatorLocale: sql<string | null>`(select locale from users where users.id = ${schema.creators.userId})`,
      steps: sql<number>`(select count(*) from recipe_steps s where s.recipe_id = ${schema.recipes.id})`.mapWith(Number),
    })
    .from(schema.recipes)
    .innerJoin(schema.creators, eq(schema.creators.id, schema.recipes.creatorId))
    .where(eq(schema.recipes.id, recipeId))
    .limit(1);
  return recipe ?? null;
}

/** What this buyer would pay for the recipe right now, with an optional promo code. Used to preview before ordering. */
export async function previewOrderPrice(
  buyer: Buyer,
  recipeId: string,
  promoCode: string,
  priceText: (amount: number, currency: string) => string,
): Promise<{ ok: true; quote: Quote; currency: string; previewPlain: string; previewWithContact: string } | { ok: false; error: "notFound" | "unavailable" | PromoProblem }> {
  const userId = buyer.id;
  const recipe = await loadOrderRecipe(recipeId);
  if (!recipe || recipe.status !== "published" || !recipe.premium) return { ok: false, error: "notFound" };
  if (!recipe.price || recipe.price <= 0) return { ok: false, error: "unavailable" };
  const [mine] = await db
    .select({ id: schema.purchases.id })
    .from(schema.purchases)
    .where(and(eq(schema.purchases.userId, userId), eq(schema.purchases.recipeId, recipeId), eq(schema.purchases.status, "pending")))
    .limit(1);
  const found = await findUsablePromo(promoCode, recipe.creatorId, recipeId, mine?.id);
  if ("problem" in found) return { ok: false, error: found.problem };
  const q = quote({ price: recipe.price, salePrice: recipe.salePrice, saleEndsAt: recipe.saleEndsAt }, found.promo);
  const currency = recipe.currency ?? "UZS";
  const base = {
    locale: (["uz", "ru", "en", "kz"].includes(recipe.creatorLocale ?? "") ? recipe.creatorLocale : "uz") as Locale,
    title: recipe.title,
    priceText: priceText(q.final, currency),
    wasText: q.final < q.list ? priceText(q.list, currency) : undefined,
    promoCode: found.promo.code,
    stepCount: recipe.steps,
    totalMinutes: recipe.prep + recipe.cook,
    code: "DM-······",
  };
  return {
    ok: true,
    quote: q,
    currency,
    previewPlain: buildOrderMessage(base),
    previewWithContact: buildOrderMessage({ ...base, buyerName: buyer.name, buyerPhone: buyer.phone ?? undefined }),
  };
}

/**
 * Opens (or updates) the person's order for a recipe at today's price: a running sale, then an optional promo
 * code on top. A code that makes it free unlocks the recipe at once; otherwise the Telegram link comes back.
 */
export async function openOrder(
  user: Buyer,
  recipeId: string,
  options: { shareContact: boolean; promoCode?: string; priceText: (amount: number, currency: string) => string },
): Promise<CreateOrderResult> {
  const recipe = await loadOrderRecipe(recipeId);
  if (!recipe || recipe.status !== "published" || !recipe.premium) return { ok: false, error: "notFound" };
  if (!recipe.price || recipe.price <= 0) return { ok: false, error: "unavailable" };
  if (recipe.creatorUserId === user.id) return { ok: false, error: "own" };

  await expireOrders(eq(schema.purchases.userId, user.id));
  const open = await db
    .select({ id: schema.purchases.id, recipeId: schema.purchases.recipeId, status: schema.purchases.status, code: schema.purchases.orderCode })
    .from(schema.purchases)
    .where(and(eq(schema.purchases.userId, user.id), inArray(schema.purchases.status, ["pending", "paid"])));
  if (open.some((o) => o.recipeId === recipeId && o.status === "paid")) return { ok: false, error: "owned" };
  const existing = open.find((o) => o.recipeId === recipeId) ?? null;

  let promo = null;
  if (options.promoCode?.trim()) {
    const found = await findUsablePromo(options.promoCode, recipe.creatorId, recipeId, existing?.id);
    if ("problem" in found) return { ok: false, error: found.problem };
    promo = found.promo;
  }
  const q = quote({ price: recipe.price, salePrice: recipe.salePrice, saleEndsAt: recipe.saleEndsAt }, promo);
  const free = q.final === 0;
  // A paid order needs the creator's chat; a free one (100% code) does not.
  if (!free && !recipe.telegram) return { ok: false, error: "unavailable" };

  const currency = recipe.currency ?? "UZS";
  const priceFields = { amount: q.final, originalAmount: recipe.price, promoCodeId: promo?.id ?? null };
  const paidFields = free ? { status: "paid" as const, confirmedAt: new Date(), expiresAt: null } : {};
  let orderId: string | null = null;
  let code: string | null = null;

  if (existing) {
    // Re-opening keeps the same order and code, at today's price.
    await db.update(schema.purchases).set({ ...priceFields, ...paidFields }).where(eq(schema.purchases.id, existing.id));
    orderId = existing.id;
    code = existing.code;
  } else {
    if (open.length >= MAX_OPEN_ORDERS) return { ok: false, error: "tooMany" };
    for (let attempt = 0; attempt < 5 && !code; attempt++) {
      const candidate = newOrderCode();
      const inserted = await db
        .insert(schema.purchases)
        .values({
          userId: user.id,
          recipeId,
          creatorId: recipe.creatorId,
          currency,
          provider: "telegram",
          status: "pending",
          orderCode: candidate,
          expiresAt: new Date(Date.now() + ORDER_TTL_HOURS * 3_600_000),
          ...priceFields,
          ...paidFields,
        })
        .onConflictDoNothing()
        .returning({ id: schema.purchases.id });
      if (inserted[0]) {
        code = candidate;
        orderId = inserted[0].id;
        await logOrderEvent(orderId, user.id, "created");
      } else {
        // Either the code collided or a parallel tap already created this order; reuse that one.
        const [other] = await db
          .select({ id: schema.purchases.id, code: schema.purchases.orderCode })
          .from(schema.purchases)
          .where(and(eq(schema.purchases.userId, user.id), eq(schema.purchases.recipeId, recipeId), inArray(schema.purchases.status, ["pending", "paid"])))
          .limit(1);
        if (other?.code) {
          code = other.code;
          orderId = other.id;
        }
      }
    }
    if (!code || !orderId) return { ok: false, error: "unavailable" };
  }

  if (free) {
    await logOrderEvent(orderId!, user.id, "granted", `promo ${promo?.code ?? ""}`.trim());
    return { ok: true, code: code!, link: null, free: true };
  }

  const locale = (["uz", "ru", "en", "kz"].includes(recipe.creatorLocale ?? "") ? recipe.creatorLocale : "uz") as Locale;
  const message = buildOrderMessage({
    locale,
    title: recipe.title,
    priceText: options.priceText(q.final, currency),
    wasText: q.final < q.list ? options.priceText(q.list, currency) : undefined,
    promoCode: promo?.code,
    stepCount: recipe.steps,
    totalMinutes: recipe.prep + recipe.cook,
    code: code!,
    buyerName: options.shareContact ? user.name : undefined,
    buyerPhone: options.shareContact && user.phone ? user.phone : undefined,
  });
  await logOrderEvent(orderId!, user.id, "chat_opened", promo ? `promo ${promo.code}` : undefined);
  return { ok: true, code: code!, link: telegramLink(recipe.telegram!, message), free: false };
}

export async function cancelOrder(userId: string, code: string): Promise<boolean> {
  const rows = await db
    .update(schema.purchases)
    .set({ status: "failed" })
    .where(and(eq(schema.purchases.userId, userId), eq(schema.purchases.orderCode, code), eq(schema.purchases.status, "pending")))
    .returning({ id: schema.purchases.id });
  if (rows[0]) await logOrderEvent(rows[0].id, userId, "cancelled");
  return !!rows[0];
}

/* ───────────── creator side ───────────── */

export interface StudioOrder {
  id: string;
  code: string;
  status: Status;
  buyerName: string;
  buyerPhone: string | null;
  recipeTitle: string;
  amount: number;
  currency: string;
  createdAt: Date;
  confirmedAt: Date | null;
}

const studioSelect = {
  id: schema.purchases.id,
  code: schema.purchases.orderCode,
  status: schema.purchases.status,
  buyerName: schema.users.name,
  buyerPhone: schema.users.phone,
  recipeTitle: schema.recipes.title,
  amount: schema.purchases.amount,
  currency: schema.purchases.currency,
  createdAt: schema.purchases.createdAt,
  confirmedAt: schema.purchases.confirmedAt,
};

function studioQuery() {
  return db
    .select(studioSelect)
    .from(schema.purchases)
    .innerJoin(schema.users, eq(schema.users.id, schema.purchases.userId))
    .innerJoin(schema.recipes, eq(schema.recipes.id, schema.purchases.recipeId));
}

/** Only orders for this creator's own recipes ever come back from these functions. */
export async function listStudioOrders(creatorId: string): Promise<{ pending: StudioOrder[]; granted: StudioOrder[] }> {
  await expireOrders(eq(schema.purchases.creatorId, creatorId));
  const mine = and(eq(schema.purchases.creatorId, creatorId), eq(schema.purchases.provider, "telegram"));
  const [pending, granted] = await Promise.all([
    studioQuery().where(and(mine, eq(schema.purchases.status, "pending"))).orderBy(desc(schema.purchases.createdAt)).limit(100),
    studioQuery().where(and(mine, eq(schema.purchases.status, "paid"))).orderBy(desc(schema.purchases.confirmedAt)).limit(30),
  ]);
  return { pending: pending as StudioOrder[], granted: granted as StudioOrder[] };
}

/**
 * Finds one buyer. Needs an exact order code or a full phone number, and only looks inside this creator's
 * own orders, so there is no way to browse or enumerate people.
 */
export async function searchStudioOrders(creatorId: string, query: string): Promise<StudioOrder[]> {
  const code = parseOrderCode(query);
  const phone = code ? null : normalizePhone(query);
  if (!code && !phone) return [];
  await expireOrders(eq(schema.purchases.creatorId, creatorId));
  const match = code ? eq(schema.purchases.orderCode, code) : eq(schema.users.phone, phone!);
  const rows = await studioQuery()
    .where(and(eq(schema.purchases.creatorId, creatorId), eq(schema.purchases.provider, "telegram"), inArray(schema.purchases.status, ["pending", "paid"]), match))
    .orderBy(desc(schema.purchases.createdAt))
    .limit(10);
  return rows as StudioOrder[];
}

/**
 * Confirms payment. One atomic statement: it only succeeds for a still-pending order that belongs to this
 * creator, so a double click, a stale page or someone else's order id can never unlock anything.
 */
export async function grantOrder(creatorId: string, actorId: string, orderId: string): Promise<boolean> {
  const rows = await db
    .update(schema.purchases)
    .set({ status: "paid", confirmedBy: actorId, confirmedAt: new Date() })
    .where(and(eq(schema.purchases.id, orderId), eq(schema.purchases.creatorId, creatorId), eq(schema.purchases.status, "pending")))
    .returning({ id: schema.purchases.id });
  if (rows[0]) await logOrderEvent(orderId, actorId, "granted");
  return !!rows[0];
}

export async function rejectOrder(creatorId: string, actorId: string, orderId: string): Promise<boolean> {
  const rows = await db
    .update(schema.purchases)
    .set({ status: "failed" })
    .where(and(eq(schema.purchases.id, orderId), eq(schema.purchases.creatorId, creatorId), eq(schema.purchases.status, "pending")))
    .returning({ id: schema.purchases.id });
  if (rows[0]) await logOrderEvent(orderId, actorId, "rejected");
  return !!rows[0];
}

/** Takes access back (a mistaken grant, a chargeback). A reason is kept in the log. */
export async function revokeOrder(creatorId: string, actorId: string, orderId: string, reason: string): Promise<boolean> {
  const rows = await db
    .update(schema.purchases)
    .set({ status: "refunded" })
    .where(and(eq(schema.purchases.id, orderId), eq(schema.purchases.creatorId, creatorId), eq(schema.purchases.status, "paid")))
    .returning({ id: schema.purchases.id });
  if (rows[0]) await logOrderEvent(orderId, actorId, "revoked", reason);
  return !!rows[0];
}

export async function countPendingOrders(creatorId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.purchases)
    .where(and(eq(schema.purchases.creatorId, creatorId), eq(schema.purchases.status, "pending"), eq(schema.purchases.provider, "telegram"), or(sql`${schema.purchases.expiresAt} is null`, gt(schema.purchases.expiresAt, new Date()))));
  return row?.n ?? 0;
}

/* ───────────── recipe page ───────────── */

export interface CheckoutInfo {
  ready: boolean;
  previewPlain: string;
  previewWithContact: string;
}

/** What the recipe page needs to offer "Buy via Telegram": is the creator reachable, and what the message will say. */
export async function getCheckoutInfo(
  recipe: { title: string; price?: number; salePrice?: number; saleEndsAt?: string; currency?: string; stepCount: number; totalMinutes: number; creatorId: string },
  buyer: { name: string; phone: string | null } | null,
  priceText: (amount: number, currency: string) => string,
): Promise<CheckoutInfo> {
  const [row] = await db
    .select({
      telegram: schema.creators.telegramUsername,
      locale: sql<string | null>`(select locale from users where users.id = ${schema.creators.userId})`,
    })
    .from(schema.creators)
    .where(eq(schema.creators.id, recipe.creatorId))
    .limit(1);
  const ready = !!row?.telegram && !!recipe.price && recipe.price > 0;
  const locale = (["uz", "ru", "en", "kz"].includes(row?.locale ?? "") ? row?.locale : "uz") as Locale;
  const now = currentPrice(recipe);
  const base = {
    locale,
    title: recipe.title,
    priceText: priceText(now?.price ?? 0, recipe.currency ?? "UZS"),
    wasText: now?.original ? priceText(now.original, recipe.currency ?? "UZS") : undefined,
    stepCount: recipe.stepCount,
    totalMinutes: recipe.totalMinutes,
    code: "DM-······",
  };
  return {
    ready,
    previewPlain: buildOrderMessage(base),
    previewWithContact: buildOrderMessage({ ...base, buyerName: buyer?.name, buyerPhone: buyer?.phone ?? undefined }),
  };
}
