import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RangeTabs } from "@/components/admin/RangeTabs";
import { TimeSeriesChart } from "@/components/admin/TimeSeriesChart";
import { EmptyState, PageHeader, Panel, StatTile, StatusPill, table } from "@/components/admin/ui";
import { getLocale, getT } from "@/i18n/server";
import { formatNumber, formatPrice, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PLATFORM_CONFIG } from "@/lib/constants";
import { RANGE_LABEL } from "@/lib/admin-stats";
import { parseRange } from "@/server/admin";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser } from "@/server/creator";
import { commissionRate, compareStudioPeriods, getRecipePerformance, getStudioSeries, getStudioTotals, listStudioPurchases } from "@/server/studio";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("studio.nav.sales"), robots: { index: false } };
}

const STATUS = {
  paid: { label: "adm.ps.paid", tone: "good" },
  pending: { label: "adm.ps.pending", tone: "neutral" },
  failed: { label: "adm.ps.failed", tone: "warn" },
  refunded: { label: "adm.ps.refunded", tone: "warn" },
} as const;

export default async function StudioSalesPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const [user, t, locale, sp] = await Promise.all([getCurrentUser(), getT(), getLocale(), searchParams]);
  if (!user) redirect("/auth/login?next=/dashboard/sales");
  const creator = await getCreatorForUser(user.id);
  if (!creator) notFound();

  const range = parseRange(sp.range);
  const [series, totals, perRecipe, purchases] = await Promise.all([
    getStudioSeries(creator.id, range * 2),
    getStudioTotals(creator.id),
    getRecipePerformance(creator.id, null),
    listStudioPurchases(creator.id),
  ]);
  const p = compareStudioPeriods(series, range);
  const rate = commissionRate(creator.isFoundingCreator);
  const net = Math.round(totals.revenue * (1 - rate));
  const premium = perRecipe.filter((r) => r.isPremium);
  const money = (n: number) => formatPrice(n, PLATFORM_CONFIG.pricing.currency, t);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow={t("adm.finance")} title={t("studio.sales.title")} description={t("studio.sales.desc")} actions={<RangeTabs base="/dashboard/sales" range={range} />} />

      <p className="mb-6 rounded-2xl bg-amber-100 px-5 py-3 text-sm text-amber-900">{t("studio.sales.paymentsNote")}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label={t("studio.net")} value={money(net)} hint={rate === 0 ? t("studio.keepAll") : t("studio.commission", { pct: Math.round(rate * 100) })} />
        <StatTile label={t("studio.gross")} value={money(totals.revenue)} hint={t("adm.allTimeShort")} />
        <StatTile label={t("studio.orders")} value={formatNumber(totals.orders)} current={p.total("sales")} previous={p.previousTotal("sales")} series={p.values("sales")} />
        <StatTile
          label={t("studio.buyers")}
          value={formatNumber(totals.buyers)}
          hint={totals.orders > 0 ? `${t("studio.avgOrder")}: ${money(Math.round(totals.revenue / totals.orders))}` : undefined}
        />
      </div>

      <Panel className="mt-6" title={t("studio.revenueOverTime")} description={t("adm.lastRange", { range: t(RANGE_LABEL[range]) })}>
        <TimeSeriesChart data={p.points("revenue")} label={t("studio.gross")} height={240} />
      </Panel>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title={t("studio.salesByRecipe")} flush>
          {premium.length === 0 ? (
            <EmptyState title={t("studio.noSales")} text={t("studio.sales.premiumHint")} action={<Link href="/dashboard/recipes/new" className="font-medium text-amber-700 underline">{t("dash.newRecipe")}</Link>} />
          ) : (
            <div className={table.wrap}>
              <table className={cn(table.root, "min-w-[28rem]")}>
                <thead>
                  <tr>
                    <th className={table.th}>{t("dash.col.recipe")}</th>
                    <th className={cn(table.th, table.thNum)}>{t("studio.price")}</th>
                    <th className={cn(table.th, table.thNum)}>{t("studio.sold")}</th>
                    <th className={cn(table.th, table.thNum)}>{t("studio.gross")}</th>
                  </tr>
                </thead>
                <tbody>
                  {premium
                    .slice()
                    .sort((a, b) => b.sold - a.sold)
                    .map((r) => (
                      <tr key={r.id} className={table.tr}>
                        <td className={table.td}>
                          <Link href={`/dashboard/recipes/${r.id}`} className="font-medium hover:text-amber-700 hover:underline">{r.title}</Link>
                        </td>
                        <td className={cn(table.td, table.tdNum)}>{r.priceAmount ? money(r.priceAmount) : "—"}</td>
                        <td className={cn(table.td, table.tdNum)}>{formatNumber(r.sold)}</td>
                        <td className={cn(table.td, table.tdNum, "font-medium")}>{money(r.revenue)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title={t("studio.recentBuyers")} flush>
          {purchases.length === 0 ? (
            <EmptyState title={t("studio.noSales")} text={t("studio.noSalesText")} />
          ) : (
            <ul className="divide-y divide-amber-100">
              {purchases.map((purchase) => (
                <li key={purchase.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 font-serif font-semibold text-amber-900" aria-hidden="true">
                    {purchase.buyer.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-amber-950">{purchase.buyer}</span>
                    <span className="block truncate text-xs text-amber-600">
                      {purchase.recipeTitle} · {formatShortDate(purchase.createdAt, locale)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-amber-950">{formatPrice(purchase.amount, purchase.currency, t)}</span>
                  <StatusPill tone={STATUS[purchase.status].tone}>{t(STATUS[purchase.status].label)}</StatusPill>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
