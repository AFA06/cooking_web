import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Plus } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { ActionForm } from "@/components/admin/ActionForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { CreatorFields } from "@/components/admin/CreatorFields";
import { RecipeTable } from "@/components/admin/RecipeTable";
import { Avatar, EmptyState, PageHeader, Panel, StatTile } from "@/components/admin/ui";
import { formatNumber, formatShortDate } from "@/lib/format";
import { getCreatorAdmin, listRecipesAdmin, requireAdminPage } from "@/server/admin";
import { deleteCreator, updateCreator } from "../../actions";

export const metadata: Metadata = { title: "Ijodkor" };

export default async function AdminCreatorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const creator = await getCreatorAdmin(id);
  if (!creator) notFound();
  const { items: recipes } = await listRecipesAdmin({ creatorId: id });
  const completion = creator.cooks > 0 ? Math.round((creator.completions / creator.cooks) * 100) : 0;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/creators", label: "Ijodkorlar" }}
        title={creator.name}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Avatar name={creator.name} src={creator.avatarUrl} size={28} />
            <span>{formatShortDate(creator.createdAt)} dan beri</span>
            {creator.userId ? (
              <Link href={`/admin/users/${creator.userId}`} className="text-amber-700 hover:underline">{creator.userEmail}</Link>
            ) : (
              <span>Hisobga ulanmagan</span>
            )}
          </span>
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/creators/${creator.slug}`}><ExternalLink className="h-4 w-4" aria-hidden="true" />Ommaviy sahifa</Link>
            </Button>
            <Button asChild>
              <Link href={`/admin/recipes/new?creatorId=${creator.id}`}><Plus className="h-4 w-4" aria-hidden="true" />Retsept qo‘shish</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Retseptlar" value={`${creator.published}`} suffix={`/ ${creator.recipes}`} hint="nashr etilgan / jami" />
        <StatTile label="Ko‘rishlar" value={formatNumber(creator.views)} hint="butun davr" />
        <StatTile label="Saqlashlar" value={formatNumber(creator.saves)} hint="butun davr" />
        <StatTile label="Tugatish darajasi" value={String(completion)} suffix="%" hint={`${formatNumber(creator.completions)} / ${formatNumber(creator.cooks)} pishirish`} />
      </div>

      <Panel className="mt-6" title="Retseptlar" description="Bu ijodkor nomidan nashr etilgan va qoralama retseptlar" flush>
        {recipes.length === 0 ? (
          <EmptyState title="Hali retseptlar yo‘q" text="Bu ijodkor nomidan birinchi retseptni qo‘shing." />
        ) : (
          <RecipeTable recipes={recipes} showCreator={false} />
        )}
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Panel title="Ma’lumotlar" description="Ommaviy profilda ko‘rinadigan ma’lumotlar">
          <ActionForm action={updateCreator.bind(null, creator.id)} submitLabel="O‘zgarishlarni saqlash">
            <CreatorFields values={creator} />
          </ActionForm>
        </Panel>

        <Panel title="Xavfli hudud" className="self-start">
          <ConfirmButton
            action={deleteCreator.bind(null, creator.id)}
            label="Ijodkorni o‘chirish"
            warning={`“${creator.name}” profili va uning ${creator.recipes} ta retsepti butunlay o‘chiriladi. Bu amalni ortga qaytarib bo‘lmaydi. Ulangan foydalanuvchi hisobi saqlanib qoladi.`}
          />
        </Panel>
      </div>
    </>
  );
}
