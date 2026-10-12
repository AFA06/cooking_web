import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBasket } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { ShoppingListView } from "@/components/shopping/ShoppingListView";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PLATFORM_CONFIG } from "@/lib/constants";
import { getCurrentUser } from "@/server/auth";
import { getShoppingList } from "@/server/shopping";

export const metadata: Metadata = { title: "Xaridlar ro‘yxati", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ShoppingPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`${PLATFORM_CONFIG.urls.login}?next=${PLATFORM_CONFIG.urls.shopping}`);
  const list = await getShoppingList(user.id);

  return (
    <SiteShell>
      <Container size="lg" className="py-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Do‘konga borishdan oldin</p>
        <h1 className="mt-3 text-[2.6rem] font-medium leading-[1.04] text-amber-950 sm:text-6xl">Xaridlar ro‘yxati</h1>

        {list.rows.length === 0 ? (
          <div className="mt-10 rounded-[1.75rem] bg-amber-100 p-8 sm:p-12">
            <ShoppingBasket className="h-10 w-10 text-amber-700" strokeWidth={1.5} aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-medium text-amber-950">Ro‘yxat hozircha bo‘sh</h2>
            <p className="mt-2 max-w-xl text-amber-900">
              Retseptni oching, necha kishiga pishirishingizni tanlang va masalliqlar ostidagi “Xaridlar ro‘yxatiga qo‘shish” tugmasini bosing.
              Bir nechta retsept qo‘shsangiz, bir xil mahsulotlar jamlanib, bitta qatorda ko‘rinadi.
            </p>
            <Button asChild size="lg" className="mt-7">
              <Link href={PLATFORM_CONFIG.urls.recipes}>Retseptlarni ko‘rish</Link>
            </Button>
          </div>
        ) : (
          <ShoppingListView recipes={list.recipes} rows={list.rows} />
        )}
      </Container>
    </SiteShell>
  );
}
