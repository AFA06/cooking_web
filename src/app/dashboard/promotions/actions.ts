"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getT } from "@/i18n/server";
import { getCurrentCreator } from "@/server/creator";
import { PROMO_CODE_PATTERN, createPromo, deletePromo, endSale, normalizePromoCode, ownPremiumRecipes, ownRecipeIds, setPromoActive, setSale, suggestPromoCode } from "@/server/promos";

export interface PromoFormState {
  error?: string;
  ok?: string;
}

const uuid = z.string().uuid();

function refresh() {
  revalidatePath("/dashboard/promotions");
  revalidatePath("/recipes", "layout");
  revalidatePath("/");
  revalidateTag("recipes", { expire: 0 });
}

/** "5" + "hours" → a time 5 hours from now. Empty → no end. Bounded so a typo can't run for years. */
function endFrom(amount: FormDataEntryValue | null, unit: FormDataEntryValue | null): Date | null | "bad" {
  const raw = String(amount ?? "").trim();
  if (raw === "") return null;
  const n = Number(raw);
  const hours = unit === "days" ? n * 24 : n;
  if (!Number.isInteger(n) || n < 1 || hours > 90 * 24) return "bad";
  return new Date(Date.now() + hours * 3_600_000);
}

/** Starts or changes a sale price on one of the creator's premium recipes. */
export async function saveSale(recipeId: string, _: PromoFormState, formData: FormData): Promise<PromoFormState> {
  const t = await getT();
  const ctx = await getCurrentCreator();
  if (!ctx || !uuid.safeParse(recipeId).success) return { error: t("err.creatorMissing") };
  const recipe = (await ownPremiumRecipes(ctx.creator.id)).find((r) => r.id === recipeId);
  if (!recipe || !recipe.price) return { error: t("promo.err.noPrice") };
  const salePrice = Number(String(formData.get("salePrice") ?? "").replace(/\s/g, ""));
  if (!Number.isInteger(salePrice) || salePrice < 0 || salePrice >= recipe.price) return { error: t("promo.err.salePrice") };
  const ends = endFrom(formData.get("duration"), formData.get("unit"));
  if (ends === "bad") return { error: t("promo.err.duration") };
  await setSale(ctx.creator.id, recipeId, salePrice, ends);
  refresh();
  return { ok: t("promo.saleOn") };
}

export async function stopSale(recipeId: string): Promise<void> {
  const ctx = await getCurrentCreator();
  if (!ctx || !uuid.safeParse(recipeId).success) return;
  await endSale(ctx.creator.id, recipeId);
  refresh();
}

/** Creates a promo code for the creator's own recipes. */
export async function savePromoCode(_: PromoFormState, formData: FormData): Promise<PromoFormState> {
  const t = await getT();
  const ctx = await getCurrentCreator();
  if (!ctx) return { error: t("err.creatorMissing") };

  const typed = normalizePromoCode(String(formData.get("code") ?? ""));
  const code = typed || suggestPromoCode(ctx.creator.name.replace(/[^a-zA-Z]/g, "").slice(0, 6));
  if (!PROMO_CODE_PATTERN.test(code)) return { error: t("promo.err.code") };

  const kind = String(formData.get("kind"));
  if (kind !== "percent" && kind !== "amount" && kind !== "free") return { error: t("promo.err.kind") };
  const value = kind === "free" ? 100 : Number(String(formData.get("value") ?? "").replace(/\s/g, ""));
  if (kind === "percent" && (!Number.isInteger(value) || value < 1 || value > 99)) return { error: t("promo.err.percent") };
  if (kind === "amount" && (!Number.isInteger(value) || value < 1 || value > 100_000_000)) return { error: t("promo.err.amount") };

  const chosen = formData.getAll("recipeIds").map(String).filter((id) => uuid.safeParse(id).success);
  const scope = String(formData.get("scope"));
  const recipeIds = scope === "chosen" ? await ownRecipeIds(ctx.creator.id, chosen) : [];
  if (scope === "chosen" && recipeIds.length === 0) return { error: t("promo.err.recipes") };

  const maxRaw = String(formData.get("maxUses") ?? "").trim();
  const maxUses = maxRaw === "" ? null : Number(maxRaw);
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 100_000)) return { error: t("promo.err.maxUses") };
  const expiresAt = endFrom(formData.get("duration"), formData.get("unit"));
  if (expiresAt === "bad") return { error: t("promo.err.duration") };

  const result = await createPromo({ creatorId: ctx.creator.id, code, kind, value, recipeIds, maxUses, expiresAt });
  if (result === "taken") return { error: t("promo.err.taken") };
  revalidatePath("/dashboard/promotions");
  return { ok: t("promo.created", { code }) };
}

export async function togglePromo(promoId: string, active: boolean): Promise<void> {
  const ctx = await getCurrentCreator();
  if (!ctx || !uuid.safeParse(promoId).success) return;
  await setPromoActive(ctx.creator.id, promoId, active);
  revalidatePath("/dashboard/promotions");
}

export async function removePromo(promoId: string): Promise<void> {
  const ctx = await getCurrentCreator();
  if (!ctx || !uuid.safeParse(promoId).success) return;
  await deletePromo(ctx.creator.id, promoId);
  revalidatePath("/dashboard/promotions");
}
