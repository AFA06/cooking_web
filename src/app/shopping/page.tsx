import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBasket } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { ShoppingListView } from "@/components/shopping/ShoppingListView";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getT } from "@/i18n/server";
import { PLATFORM_CONFIG } from "@/lib/constants";
import { getCurrentUser } from "@/server/auth";
import { getShoppingList } from "@/server/shopping";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("shopping.title"), robots: { index: false } };
}
export const dynamic = "force-dynamic";

export default async function ShoppingPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  if (!user) redirect(`${PLATFORM_CONFIG.urls.login}?next=${PLATFORM_CONFIG.urls.shopping}`);
  const list = await getShoppingList(user.id);

  return (
    <SiteShell>
      <Container size="lg" className="py-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{t("shopping.eyebrow")}</p>
        <h1 className="mt-3 text-[2.6rem] font-medium leading-[1.04] text-amber-950 sm:text-6xl">{t("shopping.title")}</h1>

        {list.rows.length === 0 ? (
          <div className="mt-10 rounded-[1.75rem] bg-amber-100 p-8 sm:p-12">
            <ShoppingBasket className="h-10 w-10 text-amber-700" strokeWidth={1.5} aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-medium text-amber-950">{t("shopping.empty")}</h2>
            <p className="mt-2 max-w-xl text-amber-900">
              {t("shopping.emptyText")}
            </p>
            <Button asChild size="lg" className="mt-7">
              <Link href={PLATFORM_CONFIG.urls.recipes}>{t("common.browseRecipes")}</Link>
            </Button>
          </div>
        ) : (
          <ShoppingListView recipes={list.recipes} rows={list.rows} />
        )}
      </Container>
    </SiteShell>
  );
}
