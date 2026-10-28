/** Price rules shared by the server and the browser. One place decides what a premium recipe costs right now. */

export interface PriceInput {
  price?: number | null;
  salePrice?: number | null;
  /** ISO string or Date; empty means the sale runs until the creator stops it. */
  saleEndsAt?: string | Date | null;
}

export interface CurrentPrice {
  /** What the buyer pays now. */
  price: number;
  /** The normal price, only when a sale is on. */
  original: number | null;
  /** When the sale ends, only for a time-limited sale. */
  endsAt: Date | null;
  /** Whole percent saved, only when a sale is on. */
  percentOff: number | null;
}

export function saleIsActive(p: PriceInput, now = Date.now()): boolean {
  if (p.price == null || p.salePrice == null || p.salePrice >= p.price || p.salePrice < 0) return false;
  return !p.saleEndsAt || new Date(p.saleEndsAt).getTime() > now;
}

export function currentPrice(p: PriceInput, now = Date.now()): CurrentPrice | null {
  if (p.price == null) return null;
  if (!saleIsActive(p, now)) return { price: p.price, original: null, endsAt: null, percentOff: null };
  return {
    price: p.salePrice!,
    original: p.price,
    endsAt: p.saleEndsAt ? new Date(p.saleEndsAt) : null,
    percentOff: Math.round((1 - p.salePrice! / p.price) * 100),
  };
}

export type PromoKind = "percent" | "amount" | "free";

/** Price after a promo code, never below zero. Rounded to whole so'm. */
export function applyPromo(price: number, kind: PromoKind, value: number): number {
  if (kind === "free") return 0;
  if (kind === "percent") return Math.max(0, Math.round(price * (1 - Math.min(Math.max(value, 0), 100) / 100)));
  return Math.max(0, price - Math.max(value, 0));
}
