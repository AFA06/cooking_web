import Link from "next/link";
import { Star } from "lucide-react";
import { StatusPill, table } from "@/components/admin/ui";
import { formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RecipeStat } from "@/server/admin";
import { setRecipeFeatured, setRecipeStatusAsAdmin } from "@/app/admin/actions";

const quickBtn = "inline-flex min-h-9 items-center rounded-md border border-amber-200 px-2.5 text-xs font-medium text-amber-950 hover:bg-amber-100";

export function RecipeTable({ recipes, showCreator = true }: { recipes: RecipeStat[]; showCreator?: boolean }) {
  return (
    <div className={table.wrap}>
      <table className={table.root}>
        <thead>
          <tr>
            <th className={table.th}>Retsept</th>
            {showCreator && <th className={table.th}>Ijodkor</th>}
            <th className={table.th}>Holati</th>
            <th className={cn(table.th, table.thNum)}>Ko‘rishlar</th>
            <th className={cn(table.th, table.thNum)}>Saqlashlar</th>
            <th className={cn(table.th, table.thNum)}>Pishirishlar</th>
            <th className={table.th}><span className="sr-only">Amallar</span></th>
          </tr>
        </thead>
        <tbody>
          {recipes.map((r) => {
            const published = r.status === "published";
            return (
              <tr key={r.id} className={table.tr}>
                <td className={cn(table.td, "min-w-[14rem] max-w-xs")}>
                  <Link href={`/admin/recipes/${r.id}`} className="font-medium break-words hover:text-amber-700 hover:underline">{r.title}</Link>
                  <span className="mt-0.5 block text-xs text-amber-600">
                    {r.isPremium ? `Premium · ${r.priceAmount ? formatPrice(r.priceAmount, "UZS") : "narxsiz"}` : "Bepul"}
                  </span>
                </td>
                {showCreator && (
                  <td className={table.td}>
                    <Link href={`/admin/creators/${r.creatorId}`} className="text-amber-900 hover:underline">{r.creator}</Link>
                  </td>
                )}
                <td className={table.td}><StatusPill tone={published ? "good" : "neutral"}>{published ? "Nashr etilgan" : "Qoralama"}</StatusPill></td>
                <td className={cn(table.td, table.tdNum)}>{formatNumber(r.views)}</td>
                <td className={cn(table.td, table.tdNum)}>{formatNumber(r.saves)}</td>
                <td className={cn(table.td, table.tdNum)}>
                  {formatNumber(r.cooks)}
                  <span className="ml-1 text-amber-600">({formatNumber(r.completions)})</span>
                </td>
                <td className={table.td}>
                  <div className="flex items-center justify-end gap-1.5">
                    <form action={setRecipeFeatured.bind(null, r.id, !r.isFeatured)}>
                      <button
                        type="submit"
                        aria-pressed={r.isFeatured}
                        aria-label={r.isFeatured ? "Tavsiyadan olib tashlash" : "Tavsiya qilish"}
                        title={r.isFeatured ? "Tavsiya etilgan" : "Tavsiya qilish"}
                        className={cn("flex h-9 w-9 items-center justify-center rounded-md border", r.isFeatured ? "border-amber-700 bg-amber-700 text-white" : "border-amber-200 text-amber-500 hover:bg-amber-100")}
                      >
                        <Star className="h-4 w-4" fill={r.isFeatured ? "currentColor" : "none"} aria-hidden="true" />
                      </button>
                    </form>
                    <form action={setRecipeStatusAsAdmin.bind(null, r.id, published ? "draft" : "published")}>
                      <button type="submit" className={quickBtn}>{published ? "Yashirish" : "Nashr etish"}</button>
                    </form>
                    <Link href={`/admin/recipes/${r.id}`} className={quickBtn}>Tahrirlash</Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
