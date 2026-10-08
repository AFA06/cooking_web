import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { RecipeEditor } from "@/components/dashboard/RecipeEditor";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { PageHeader, Panel, StatTile, StatusPill } from "@/components/admin/ui";
import { formatNumber, formatRelative } from "@/lib/format";
import { toEditorInitial } from "@/lib/recipe-editor";
import { getRecipeStat, requireAdminPage } from "@/server/admin";
import { loadRecipeForEdit } from "@/server/recipe-write";
import { adminSaveRecipe, deleteRecipe, setRecipeFeatured } from "../../actions";

export const metadata: Metadata = { title: "Retseptni tahrirlash" };

export default async function AdminRecipePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const data = await loadRecipeForEdit(id);
  if (!data) notFound();
  const { recipe } = data;
  const stat = await getRecipeStat(id);
  const published = recipe.status === "published";

  return (
    <>
      <PageHeader
        back={{ href: "/admin/recipes", label: "Retseptlar" }}
        title={recipe.title}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusPill tone={published ? "good" : "neutral"}>{published ? "Nashr etilgan" : "Qoralama"}</StatusPill>
            {stat && <Link href={`/admin/creators/${stat.creatorId}`} className="text-amber-700 hover:underline">{stat.creator}</Link>}
            <span>Yangilangan: {formatRelative(recipe.updatedAt)}</span>
          </span>
        }
        actions={
          <>
            <form action={setRecipeFeatured.bind(null, recipe.id, !recipe.isFeatured)}>
              <Button type="submit" variant="outline" aria-pressed={recipe.isFeatured}>
                {recipe.isFeatured ? "Tavsiyadan olib tashlash" : "Tavsiya qilish"}
              </Button>
            </form>
            {published && (
              <Button variant="outline" asChild>
                <Link href={`/recipes/${recipe.slug}`}><ExternalLink className="h-4 w-4" aria-hidden="true" />Saytda ko‘rish</Link>
              </Button>
            )}
          </>
        }
      />

      {stat && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Ko‘rishlar" value={formatNumber(stat.views)} hint="butun davr" />
          <StatTile label="Saqlashlar" value={formatNumber(stat.saves)} hint="butun davr" />
          <StatTile label="Pishirish boshlangan" value={formatNumber(stat.cooks)} hint="butun davr" />
          <StatTile label="Tugatilgan" value={formatNumber(stat.completions)} hint={stat.cooks > 0 ? `${Math.round((stat.completions / stat.cooks) * 100)}% tugatish` : "hali ma’lumot yo‘q"} />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Panel title="Retsept mazmuni">
          <RecipeEditor initial={toEditorInitial(data)} save={adminSaveRecipe.bind(null, null)} basePath="/admin/recipes" />
        </Panel>
        <div className="min-w-0">
          <Panel title="Xavfli hudud">
            <ConfirmButton
              action={deleteRecipe.bind(null, recipe.id)}
              label="Retseptni o‘chirish"
              warning={`“${recipe.title}” retsepti, uning saqlashlari va pishirish tarixi butunlay o‘chiriladi. Bu amalni ortga qaytarib bo‘lmaydi.`}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
