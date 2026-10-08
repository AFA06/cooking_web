import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { EMPTY_RECIPE, RecipeEditor } from "@/components/dashboard/RecipeEditor";
import { Avatar, EmptyState, PageHeader, Panel } from "@/components/admin/ui";
import { getCreatorAdmin, listCreatorsAdmin, requireAdminPage } from "@/server/admin";
import { adminSaveRecipe } from "../../actions";

export const metadata: Metadata = { title: "Yangi retsept" };

export default async function AdminNewRecipePage({ searchParams }: { searchParams: Promise<{ creatorId?: string }> }) {
  await requireAdminPage();
  const { creatorId } = await searchParams;
  const creator = creatorId && z.string().uuid().safeParse(creatorId).success ? await getCreatorAdmin(creatorId) : null;

  if (!creator) {
    const creators = await listCreatorsAdmin();
    return (
      <>
        <PageHeader back={{ href: "/admin/recipes", label: "Retseptlar" }} title="Yangi retsept" description="Avval retsept qaysi ijodkor nomidan nashr etilishini tanlang." />
        <Panel title="Ijodkorni tanlang" flush>
          {creators.length === 0 ? (
            <EmptyState title="Hali ijodkorlar yo‘q" text="Retsept qo‘shish uchun avval ijodkor yarating." action={<Link href="/admin/creators/new" className="font-medium text-amber-700 underline">Ijodkor yaratish</Link>} />
          ) : (
            <ul className="divide-y divide-amber-100">
              {creators.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/recipes/new?creatorId=${c.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-amber-50/60 sm:px-6">
                    <Avatar name={c.name} src={c.avatarUrl} />
                    <span className="flex-1 font-medium text-amber-950">{c.name}</span>
                    <span className="text-sm text-amber-600">{c.recipes} ta retsept</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader
        back={{ href: `/admin/creators/${creator.id}`, label: creator.name }}
        title="Yangi retsept"
        description={`“${creator.name}” nomidan nashr etiladi.`}
      />
      <Panel className="max-w-4xl">
        <RecipeEditor initial={EMPTY_RECIPE} save={adminSaveRecipe.bind(null, creator.id)} basePath="/admin/recipes" />
      </Panel>
    </>
  );
}
