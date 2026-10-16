"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getT } from "@/i18n/server";
import { formatPrice } from "@/lib/format";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser } from "@/server/creator";
import { cancelOrder, grantOrder, openOrder, previewOrderPrice, rejectOrder, revokeOrder, searchStudioOrders, type StudioOrder } from "@/server/orders";
import { WINDOW, allow } from "@/server/rate-limit";
import { keyedHash } from "@/server/security";

const uuid = z.string().uuid();

export type StartOrderResult = { ok: true; code: string; link: string | null; free: boolean } | { ok: false; error: string };

/** Buyer: opens the order and returns the Telegram link. The message is built on the server from the order, never from the browser. */
export async function startTelegramOrder(recipeId: string, shareContact: boolean, promoCode = ""): Promise<StartOrderResult> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t("order.err.signIn") };
  if (!uuid.safeParse(recipeId).success) return { ok: false, error: t("order.err.unavailable") };
  if (!(await allow("order", keyedHash("user", user.id), 20, WINDOW.hour))) return { ok: false, error: t("auth.a.tooMany") };

  const result = await openOrder(user, recipeId, { shareContact, promoCode: String(promoCode).slice(0, 40), priceText: (amount, currency) => formatPrice(amount, currency, t) });
  if (!result.ok) return { ok: false, error: t(`order.err.${result.error}`) };
  revalidatePath("/account/orders");
  if (result.free) revalidatePath("/recipes", "layout");
  return result;
}

export type PromoCheck =
  | { ok: true; code: string; finalText: string; listText: string; free: boolean; previewPlain: string; previewWithContact: string }
  | { ok: false; error: string };

/** Buyer: checks a promo code for a recipe and shows the new price before anything is ordered. */
export async function checkPromoCode(recipeId: string, code: string): Promise<PromoCheck> {
  const t = await getT();
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t("order.err.signIn") };
  if (!uuid.safeParse(recipeId).success) return { ok: false, error: t("order.err.unavailable") };
  // Throttled per person, so codes cannot be guessed by trying many.
  if (!(await allow("promo-check", keyedHash("user", user.id), 15, WINDOW.hour))) return { ok: false, error: t("auth.a.tooMany") };
  const r = await previewOrderPrice(user, recipeId, String(code).slice(0, 40), (amount, currency) => formatPrice(amount, currency, t));
  if (!r.ok) return { ok: false, error: t(`order.err.${r.error}`) };
  return {
    ok: true,
    code: r.quote.promo?.code ?? "",
    finalText: formatPrice(r.quote.final, r.currency, t),
    listText: formatPrice(r.quote.list, r.currency, t),
    free: r.quote.final === 0,
    previewPlain: r.previewPlain,
    previewWithContact: r.previewWithContact,
  };
}

export async function cancelMyOrder(code: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || typeof code !== "string" || code.length > 20) return;
  await cancelOrder(user.id, code);
  revalidatePath("/account/orders");
  revalidatePath("/recipes", "layout");
}

async function requireCreator() {
  const user = await getCurrentUser();
  if (!user) return null;
  const creator = await getCreatorForUser(user.id);
  return creator ? { user, creator } : null;
}

export interface FoundOrder extends Omit<StudioOrder, "createdAt" | "confirmedAt"> {
  createdAt: string;
  confirmedAt: string | null;
}

/** Creator: find one buyer by exact order code or full phone number, among their own orders only. */
export async function searchOrders(query: string): Promise<{ items: FoundOrder[]; error?: string }> {
  const t = await getT();
  const ctx = await requireCreator();
  if (!ctx) return { items: [], error: t("order.err.signIn") };
  const q = String(query ?? "").trim().slice(0, 40);
  if (!(await allow("order-search", keyedHash("user", ctx.user.id), 20, WINDOW.minute))) return { items: [], error: t("auth.a.tooMany") };
  const items = await searchStudioOrders(ctx.creator.id, q);
  return { items: items.map((o) => ({ ...o, createdAt: o.createdAt.toISOString(), confirmedAt: o.confirmedAt?.toISOString() ?? null })) };
}

export type DecisionResult = { ok: true } | { ok: false; error: string };

export async function decideOrder(orderId: string, decision: "grant" | "reject", note?: string): Promise<DecisionResult> {
  void note;
  const t = await getT();
  const ctx = await requireCreator();
  if (!ctx || !uuid.safeParse(orderId).success) return { ok: false, error: t("order.err.signIn") };
  if (!(await allow("order-decide", keyedHash("user", ctx.user.id), 60, WINDOW.hour))) return { ok: false, error: t("auth.a.tooMany") };
  const done = decision === "grant" ? await grantOrder(ctx.creator.id, ctx.user.id, orderId) : await rejectOrder(ctx.creator.id, ctx.user.id, orderId);
  revalidatePath("/dashboard/orders");
  return done ? { ok: true } : { ok: false, error: t("order.err.stale") };
}

export async function revokeAccess(orderId: string, reason: string): Promise<DecisionResult> {
  const t = await getT();
  const ctx = await requireCreator();
  const clean = String(reason ?? "").trim().slice(0, 200);
  if (!ctx || !uuid.safeParse(orderId).success) return { ok: false, error: t("order.err.signIn") };
  if (clean.length < 3) return { ok: false, error: t("order.err.reason") };
  const done = await revokeOrder(ctx.creator.id, ctx.user.id, orderId, clean);
  revalidatePath("/dashboard/orders");
  return done ? { ok: true } : { ok: false, error: t("order.err.stale") };
}
