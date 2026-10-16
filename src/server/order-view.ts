import "server-only";
import type { OrderView } from "@/components/order/TelegramCheckout";
import type { Locale, TFunction } from "@/i18n/core";
import { formatDate, formatPrice } from "@/lib/format";
import type { BuyerOrder } from "@/server/orders";

/** Turns a stored order into the plain, already-translated object the order components render. */
export function toOrderView(order: BuyerOrder, t: TFunction, locale: Locale): OrderView {
  return {
    code: order.code ?? "",
    status: order.status,
    recipeSlug: order.recipeSlug,
    recipeTitle: order.recipeTitle,
    amountText: formatPrice(order.amount, order.currency, t),
    creatorName: order.creatorName,
    telegramUsername: order.telegramUsername,
    expiresText: order.status === "pending" && order.expiresAt ? formatDate(order.expiresAt, locale) : null,
  };
}
