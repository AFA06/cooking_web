import Link from "next/link";
import { Bookmark, CheckCircle2, Eye, Film, Flame, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getLocale, getT } from "@/i18n/server";
import { formatNumber, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { setRecipeStatus } from "@/app/dashboard/actions";

export interface StudioRecipe {
  id: string;
  slug: string;
  title: string;
  coverUrl: string;
  videoUrl: string | null;
  status: "draft" | "published";
  isPremium: boolean;
  updatedAt: Date;
  views: number;
  saves: number;
  cooks: number;
  completions: number;
}

/** One of the creator's recipes: cover, state, four numbers and the actions they reach for. */
export async function StudioRecipeCard({ recipe: r }: { recipe: StudioRecipe }) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const published = r.status === "published";
  return (
    <li className="flex flex-col overflow-hidden rounded-[1.5rem] border border-amber-200 bg-amber-100/40">
      <Link href={`/dashboard/recipes/${r.id}`} className="group relative block aspect-[16/10] bg-amber-200">
        {r.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- creator's own cover, any host
          <img src={r.coverUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <span className="flex h-full items-center justify-center text-sm text-amber-500">{t("studio.noCover")}</span>
        )}
        <span className={cn("absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold", published ? "bg-sage-600/95 text-amber-50" : "bg-ink/80 text-paper")}>
          {published ? t("dash.published") : t("dash.draft")}
        </span>
        <span className="absolute right-3 top-3 flex gap-1.5">
          {r.isPremium && <span className="rounded-full bg-amber-950/90 px-3 py-1 text-xs font-semibold text-amber-50">{t("filter.premium")}</span>}
          {r.videoUrl && (
            <span className="flex items-center gap-1 rounded-full bg-amber-50/95 px-2.5 py-1 text-xs font-semibold text-amber-950">
              <Film className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">{t("studio.hasVideo")}</span>
            </span>
          )}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 break-words text-xl font-medium leading-snug text-amber-950">{r.title}</h3>
        <p className="mt-1 text-sm text-amber-600">{t("adm.updated", { when: formatRelative(r.updatedAt, t, locale) })}</p>

        <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            { label: t("dash.col.views"), value: r.views, icon: Eye },
            { label: t("dash.col.saves"), value: r.saves, icon: Bookmark },
            { label: t("account.started"), value: r.cooks, icon: Flame },
            { label: t("account.completed"), value: r.completions, icon: CheckCircle2 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl bg-amber-50 px-1 py-2">
              <dt className="flex justify-center text-amber-500" title={label}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">{label}</span>
              </dt>
              <dd className="mt-0.5 font-serif text-lg font-medium tabular-nums text-amber-950">{formatNumber(value)}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button asChild size="md">
            <Link href={`/dashboard/recipes/${r.id}`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {t("dash.edit")}
            </Link>
          </Button>
          {published && (
            <Button asChild size="md" variant="outline">
              <Link href={`/recipes/${r.slug}`}>{t("dash.view")}</Link>
            </Button>
          )}
          <form action={setRecipeStatus.bind(null, r.id, published ? "draft" : "published")} className="ml-auto">
            <Button type="submit" size="md" variant="ghost">
              {published ? t("dash.unpublish") : t("dash.publish")}
            </Button>
          </form>
        </div>
      </div>
    </li>
  );
}
