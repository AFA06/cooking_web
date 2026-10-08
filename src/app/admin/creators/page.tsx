import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar, EmptyState, PageHeader, Panel, SearchForm, StatusPill, table } from "@/components/admin/ui";
import { formatNumber, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listCreatorsAdmin, requireAdminPage } from "@/server/admin";

export const metadata: Metadata = { title: "Ijodkorlar" };

export default async function AdminCreatorsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdminPage();
  const q = (await searchParams).q?.trim() || undefined;
  const creators = await listCreatorsAdmin(q);

  return (
    <>
      <PageHeader
        eyebrow="Boshqaruv"
        title="Ijodkorlar"
        description="Blogerlar, ularning ma’lumotlari va natijalari."
        actions={
          <Button asChild>
            <Link href="/admin/creators/new"><Plus className="h-4 w-4" aria-hidden="true" />Yangi ijodkor</Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchForm action="/admin/creators" defaultValue={q} placeholder="Ism, manzil yoki email bo‘yicha qidirish" />
        <p className="text-sm text-amber-600">{formatNumber(creators.length)} ta ijodkor</p>
      </div>

      <Panel flush>
        {creators.length === 0 ? (
          <EmptyState title={q ? "Hech narsa topilmadi" : "Hali ijodkorlar yo‘q"} text={q ? "Qidiruv so‘zini o‘zgartirib ko‘ring." : "Birinchi ijodkorni qo‘shing."} />
        ) : (
          <div className={table.wrap}>
            <table className={table.root}>
              <thead>
                <tr>
                  <th className={table.th}>Ijodkor</th>
                  <th className={table.th}>Belgilar</th>
                  <th className={cn(table.th, table.thNum)}>Retseptlar</th>
                  <th className={cn(table.th, table.thNum)}>Ko‘rishlar</th>
                  <th className={cn(table.th, table.thNum)}>Saqlashlar</th>
                  <th className={cn(table.th, table.thNum)}>Pishirishlar</th>
                  <th className={table.th}>Qo‘shilgan</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((c) => (
                  <tr key={c.id} className={table.tr}>
                    <td className={table.td}>
                      <Link href={`/admin/creators/${c.id}`} className="group flex items-center gap-3">
                        <Avatar name={c.name} src={c.avatarUrl} />
                        <span className="min-w-0">
                          <span className="block font-medium group-hover:text-amber-700 group-hover:underline">{c.name}</span>
                          <span className="block truncate text-xs text-amber-600">{c.userEmail ?? "Hisobga ulanmagan"}</span>
                        </span>
                      </Link>
                    </td>
                    <td className={table.td}>
                      <span className="flex flex-wrap gap-1.5">
                        {c.isFoundingCreator && <StatusPill tone="accent">Asoschi</StatusPill>}
                        {c.isFeatured && <StatusPill tone="good">Tavsiya</StatusPill>}
                        {!c.isFoundingCreator && !c.isFeatured && <span className="text-amber-500">—</span>}
                      </span>
                    </td>
                    <td className={cn(table.td, table.tdNum)}>{c.published} / {c.recipes}</td>
                    <td className={cn(table.td, table.tdNum)}>{formatNumber(c.views)}</td>
                    <td className={cn(table.td, table.tdNum)}>{formatNumber(c.saves)}</td>
                    <td className={cn(table.td, table.tdNum)}>{formatNumber(c.cooks)}</td>
                    <td className={cn(table.td, "whitespace-nowrap text-amber-600")}>{formatShortDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <p className="mt-3 text-xs text-amber-600">Retseptlar ustuni: nashr etilgan / jami.</p>
    </>
  );
}
