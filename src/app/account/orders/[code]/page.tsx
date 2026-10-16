import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { OrderStatus } from "@/components/order/TelegramCheckout";
import { SiteShell } from "@/components/layout/SiteShell";
import { getLocale, getT } from "@/i18n/server";
import { getCurrentUser } from "@/server/auth";
import { getOrderByCode, parseOrderCode } from "@/server/orders";
import { toOrderView } from "@/server/order-view";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("order.status.pending"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ code: string }> }) {
  const [{ code: raw }, t, locale, user] = await Promise.all([params, getT(), getLocale(), getCurrentUser()]);
  if (!user) redirect(`/auth/login?next=/account/orders/${encodeURIComponent(raw)}`);
  const code = parseOrderCode(decodeURIComponent(raw));
  if (!code) notFound();
  // Only the buyer's own orders are ever looked up, so another person's code simply isn't found.
  const order = await getOrderByCode(user.id, code);
  if (!order) notFound();

  return (
    <SiteShell>
      <Container size="sm" className="py-12 sm:py-16">
        <Link href={`/recipes/${order.recipeSlug}`} className="mb-6 inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-950">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {order.recipeTitle}
        </Link>
        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-100 p-7 text-amber-950 sm:p-10">
          <OrderStatus order={toOrderView(order, t, locale)} />
        </div>
      </Container>
    </SiteShell>
  );
}
