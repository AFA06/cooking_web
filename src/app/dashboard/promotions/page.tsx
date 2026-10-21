import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader, Panel } from "@/components/admin/ui";
import { PromoForm, PromoList, SaleRow } from "@/components/studio/Promotions";
import { getT } from "@/i18n/server";
import { getCurrentCreator } from "@/server/creator";
import { listPromos, ownPremiumRecipes, promoStatus } from "@/server/promos";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("studio.nav.promotions"), robots: { index: false } };
}

export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  const [ctx, t] = await Promise.all([getCurrentCreator(), getT()]);
  if (!ctx) notFound();
  const [recipes, promos] = await Promise.all([ownPremiumRecipes(ctx.creator.id), listPromos(ctx.creator.id)]);
  const prefix = ctx.creator.name.normalize("NFKD").replace(/[^A-Za-z]/g, "").slice(0, 6).toUpperCase();

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow={t("promo.eyebrow")} title={t("studio.nav.promotions")} description={t("promo.desc")} />

      <Panel title={t("promo.salesTitle")} description={t("promo.salesDesc")} flush>
        {recipes.length === 0 ? (
          <p className="px-6 py-10 text-center text-amber-600">{t("promo.noPremium")}</p>
        ) : (
          <ul>
            {recipes.map((r) => (
              <SaleRow
                key={r.id}
                recipe={{ id: r.id, title: r.title, price: r.price, salePrice: r.salePrice, saleEndsAt: r.saleEndsAt?.toISOString() ?? null, published: r.status === "published" }}
              />
            ))}
          </ul>
        )}
      </Panel>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Panel title={t("promo.newCode")} description={t("promo.newCodeDesc")}>
          <PromoForm recipes={recipes.map((r) => ({ id: r.id, title: r.title }))} prefix={prefix} />
        </Panel>
        <Panel title={t("promo.codes")} description={t("promo.codesDesc")} flush>
          <PromoList
            items={promos.map((p) => ({
              id: p.id,
              code: p.code,
              kind: p.kind,
              value: p.value,
              recipeCount: p.recipeIds.length,
              uses: p.uses,
              maxUses: p.maxUses,
              expiresAt: p.expiresAt?.toISOString() ?? null,
              active: p.active,
              status: promoStatus(p),
            }))}
          />
        </Panel>
      </div>
    </div>
  );
}
