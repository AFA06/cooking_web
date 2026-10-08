import type { Metadata } from "next";
import { EmptyState, PageHeader, Pagination, Panel, StatTile, StatusPill, table } from "@/components/admin/ui";
import { formatNumber, formatPrice, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PAGE_SIZE, getPlatformTotals, listPurchasesAdmin, parsePage, requireAdminPage } from "@/server/admin";

export const metadata: Metadata = { title: "Xaridlar" };

const STATUS = {
  paid: { label: "To‘langan", tone: "good" },
  pending: { label: "Kutilmoqda", tone: "neutral" },
  failed: { label: "Xato", tone: "warn" },
  refunded: { label: "Qaytarilgan", tone: "warn" },
} as const;

export default async function AdminPurchasesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdminPage();
  const page = parsePage((await searchParams).page);
  const [{ items, total }, totals] = await Promise.all([listPurchasesAdmin(page), getPlatformTotals()]);

  return (
    <>
      <PageHeader eyebrow="Moliya" title="Xaridlar" description="Premium retseptlar bo‘yicha to‘lovlar." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Daromad" value={formatPrice(totals.revenue, "UZS")} hint="to‘langan xaridlar" />
        <StatTile label="To‘langan xaridlar" value={formatNumber(totals.paidPurchases)} />
        <StatTile label="Premium retseptlar" value={formatNumber(totals.premium)} hint="sotuvga tayyor" />
      </div>

      <Panel className="mt-6" title="Xaridlar tarixi" flush>
        {items.length === 0 ? (
          <EmptyState title="Hali xaridlar yo‘q" text="To‘lov tizimi (Payme yoki Click) ulangach, xaridlar shu yerda ko‘rinadi." />
        ) : (
          <div className={table.wrap}>
            <table className={table.root}>
              <thead>
                <tr>
                  <th className={table.th}>Sana</th>
                  <th className={table.th}>Xaridor</th>
                  <th className={table.th}>Retsept</th>
                  <th className={table.th}>Ijodkor</th>
                  <th className={cn(table.th, table.thNum)}>Summa</th>
                  <th className={table.th}>Holati</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className={table.tr}>
                    <td className={cn(table.td, "whitespace-nowrap text-amber-600")}>{formatShortDate(p.createdAt)}</td>
                    <td className={cn(table.td, "break-all")}>{p.userEmail}</td>
                    <td className={table.td}>{p.recipeTitle}</td>
                    <td className={table.td}>{p.creatorName}</td>
                    <td className={cn(table.td, table.tdNum, "font-medium")}>{formatPrice(p.amount, p.currency)}</td>
                    <td className={table.td}><StatusPill tone={STATUS[p.status].tone}>{STATUS[p.status].label}</StatusPill></td>
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
