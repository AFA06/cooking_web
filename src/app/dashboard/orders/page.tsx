import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { OrdersDesk, type DeskOrder } from "@/components/studio/OrdersDesk";
import { getLocale, getT } from "@/i18n/server";
import { formatDate, formatPrice } from "@/lib/format";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser } from "@/server/creator";
import { listStudioOrders, type StudioOrder } from "@/server/orders";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("studio.nav.orders"), robots: { index: false } };
}

export const dynamic = "force-dynamic";

export default async function StudioOrdersPage() {
  const [user, t, locale] = await Promise.all([getCurrentUser(), getT(), getLocale()]);
  if (!user) redirect("/auth/login?next=/dashboard/orders");
  const creator = await getCreatorForUser(user.id);
  if (!creator) redirect("/creators/join");

  const { pending, granted } = await listStudioOrders(creator.id);
  const toDesk = (o: StudioOrder): DeskOrder => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    confirmedAt: o.confirmedAt?.toISOString() ?? null,
    amountText: formatPrice(o.amount, o.currency, t),
    whenText: formatDate(o.status === "paid" && o.confirmedAt ? o.confirmedAt : o.createdAt, locale),
  });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow={t("adm.finance")} title={t("studio.nav.orders")} description={t("studio.ord.desc")} />
      {creator.telegramUsername ? (
        <p className="mb-6 rounded-2xl bg-amber-100 px-5 py-3 text-sm text-amber-900">{t("studio.ord.telegram", { name: creator.telegramUsername })}</p>
      ) : (
        <p role="alert" className="mb-6 rounded-2xl bg-clay-100 px-5 py-3 text-sm text-amber-950">{t("studio.ord.noTelegram")}</p>
      )}
      <OrdersDesk pending={pending.map(toDesk)} granted={granted.map(toDesk)} />
    </div>
  );
}
