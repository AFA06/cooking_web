import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RecipeTable } from "@/components/admin/RecipeTable";
import { EmptyState, PageHeader, Pagination, Panel, SearchForm, SegmentedLinks } from "@/components/admin/ui";
import { withQuery } from "@/lib/admin-stats";
import { PAGE_SIZE, listRecipesAdmin, parsePage, requireAdminPage } from "@/server/admin";

export const metadata: Metadata = { title: "Retseptlar" };

const STATUS = [
  { value: "all", label: "Barchasi" },
  { value: "published", label: "Nashr etilgan" },
  { value: "draft", label: "Qoralama" },
];
const TYPE = [
  { value: "all", label: "Barchasi" },
  { value: "free", label: "Bepul" },
  { value: "premium", label: "Premium" },
];

export default async function AdminRecipesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; type?: string; page?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const status = STATUS.some((s) => s.value === sp.status) ? sp.status! : "all";
  const type = TYPE.some((t) => t.value === sp.type) ? sp.type! : "all";
  const page = parsePage(sp.page);
  const { items, total } = await listRecipesAdmin({ q, status, type, page });
  const href = (over: Record<string, string | number | undefined>) => withQuery("/admin/recipes", { q, status, type, ...over });

  return (
    <>
      <PageHeader
        eyebrow="Boshqaruv"
        title="Retseptlar"
        description="Barcha retseptlar: nashr holati, tavsiya va natijalar."
        actions={
          <Button asChild>
            <Link href="/admin/recipes/new"><Plus className="h-4 w-4" aria-hidden="true" />Yangi retsept</Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchForm action="/admin/recipes" defaultValue={q} placeholder="Retsept yoki ijodkor bo‘yicha qidirish" hidden={{ status: status === "all" ? undefined : status, type: type === "all" ? undefined : type }} />
        <SegmentedLinks label="Holati" items={STATUS.map((s) => ({ href: href({ status: s.value, page: undefined }), label: s.label, active: s.value === status }))} />
        <SegmentedLinks label="Turi" items={TYPE.map((t) => ({ href: href({ type: t.value, page: undefined }), label: t.label, active: t.value === type }))} />
      </div>

      <Panel flush>
        {items.length === 0 ? (
          <EmptyState title="Retseptlar topilmadi" text="Qidiruv yoki filtrlarni o‘zgartirib ko‘ring." />
        ) : (
          <RecipeTable recipes={items} />
        )}
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} hrefFor={(n) => href({ page: n === 1 ? undefined : n })} />
      </Panel>
      <p className="mt-3 text-xs text-amber-600">Pishirishlar ustuni: boshlangan (tugatilgan). Yulduzcha — bosh sahifadagi tanlangan retseptlar.</p>
    </>
  );
}
