import type { Metadata } from "next";
import { EmptyState, PageHeader, Pagination, Panel, StatTile, StatusPill, table } from "@/components/admin/ui";
import { getLocale, getT } from "@/i18n/server";
import { formatNumber, formatPrice, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PAGE_SIZE, getPlatformTotals, listPurchasesAdmin, parsePage, requireAdminPage } from "@/server/admin";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("adm.nav.purchases") };
}

const STATUS = {
  paid: { label: "adm.ps.paid", tone: "good" },
  pending: { label: "adm.ps.pending", tone: "neutral" },
  failed: { label: "adm.ps.failed", tone: "warn" },
  refunded: { label: "adm.ps.refunded", tone: "warn" },
} as const;

export default async function AdminPurchasesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const [, t, locale] = await Promise.all([requireAdminPage(), getT(), getLocale()]);
  const page = parsePage((await searchParams).page);
  const [{ items, total }, totals] = await Promise.all([listPurchasesAdmin(page), getPlatformTotals()]);

  return (
    <>
      <PageHeader eyebrow={t("adm.finance")} title={t("adm.nav.purchases")} description={t("adm.purchasesDesc")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label={t("adm.revenueTile")} value={formatPrice(totals.revenue, "UZS", t)} hint={t("adm.paidHint")} />
        <StatTile label={t("adm.paidPurchases")} value={formatNumber(totals.paidPurchases)} />
        <StatTile label={t("adm.premiumRecipes")} value={formatNumber(totals.premium)} hint={t("adm.readyForSale")} />
      </div>

      <Panel className="mt-6" title={t("adm.purchaseHistory")} flush>
        {items.length === 0 ? (
          <EmptyState title={t("adm.noPurchases")} text={t("adm.noPurchasesText")} />
        ) : (
          <div className={table.wrap}>
            <table className={table.root}>
              <thead>
                <tr>
                  <th className={table.th}>{t("adm.date")}</th>
                  <th className={table.th}>{t("adm.buyer")}</th>
                  <th className={table.th}>{t("dash.col.recipe")}</th>
                  <th className={table.th}>{t("role.creator")}</th>
                  <th className={cn(table.th, table.thNum)}>{t("adm.amount")}</th>
                  <th className={table.th}>{t("dash.col.status")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className={table.tr}>
                    <td className={cn(table.td, "whitespace-nowrap text-amber-600")}>{formatShortDate(p.createdAt, locale)}</td>
                    <td className={cn(table.td, "break-all")}>{p.userEmail}</td>
                    <td className={table.td}>{p.recipeTitle}</td>
                    <td className={table.td}>{p.creatorName}</td>
                    <td className={cn(table.td, table.tdNum, "font-medium")}>{formatPrice(p.amount, p.currency, t)}</td>
                    <td className={table.td}><StatusPill tone={STATUS[p.status].tone}>{t(STATUS[p.status].label)}</StatusPill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} hrefFor={(n) => (n === 1 ? "/admin/purchases" : `/admin/purchases?page=${n}`)} />
      </Panel>
    </>
  );
}
