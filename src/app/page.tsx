import { Container } from "@/components/ui/Container";
import { SiteShell } from "@/components/layout/SiteShell";
import { SearchBar } from "@/components/home/SearchBar";
import { CategoryRail, ContinueCooking, CreatorInvite, CreatorsStrip, HowItCooks, LatestRecipes, LeadRecipe, QuickList } from "@/components/home/sections";
import { getCurrentUser } from "@/server/auth";
import { listCreators, listPublishedRecipes } from "@/server/recipes";
import { getActiveCooking, getSavedRecipeIds } from "@/server/user-data";

export const dynamic = "force-dynamic";

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Tashkent" }).format(new Date()));
  if (hour >= 5 && hour < 11) return "Xayrli tong";
  if (hour >= 11 && hour < 17) return "Xayrli kun";
  if (hour >= 17 && hour < 23) return "Xayrli kech";
  return "Xayrli tun";
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const [recipes, creators, savedList, activeCooking] = await Promise.all([
    listPublishedRecipes(),
    listCreators(),
    user ? getSavedRecipeIds(user.id) : [],
    user ? getActiveCooking(user.id) : null,
  ]);
  const savedIds = new Set(savedList);

  // The cover story should be cookable right away, so prefer a free recipe.
  const lead = recipes.find((r) => !r.isPremium) ?? recipes[0];
  const rest = recipes.filter((r) => r.id !== lead?.id);
  const quickest = [...recipes].sort((a, b) => a.prepTimeMinutes + a.cookTimeMinutes - (b.prepTimeMinutes + b.cookTimeMinutes)).slice(0, 4);
  const activeCreators = creators.filter((c) => c.recipeCount > 0).slice(0, 6);

  return (
    <SiteShell>
      <Container size="xl" className="grid gap-10 pb-16 pt-8 lg:grid-cols-[5fr_6fr] lg:gap-14 lg:pb-24 lg:pt-12">
        <div className="flex min-w-0 flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            {user ? `${greeting()}, ${user.name.split(" ")[0]}` : "Qadam-baqadam pazandalik"}
          </p>
          <h1 className="mt-4 text-[2.75rem] font-medium leading-[1.04] text-amber-950 sm:text-6xl lg:text-[4.25rem]">
            Bugun nima <em className="font-normal italic text-amber-700">pishiramiz?</em>
          </h1>
          {!user && (
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-amber-900">
              Sevimli oshpazlaringizning retseptlari — aniq miqdor, taymer va har bir qadamda ko‘rsatma bilan. Videoni ortga qaytarib o‘tirmaysiz.
            </p>
          )}
          <div className="mt-8 max-w-xl">
            <SearchBar />
          </div>
          <div className="mt-5">
            <CategoryRail />
          </div>
          {activeCooking && (
            <div className="mt-8 max-w-xl">
              <ContinueCooking {...activeCooking} />
            </div>
          )}
        </div>
        {lead && <LeadRecipe recipe={lead} isLoggedIn={!!user} saved={savedIds.has(lead.id)} />}
      </Container>

      {rest.length > 0 && (
        <Container size="xl" className="grid gap-14 border-t border-amber-200 py-16 lg:grid-cols-[2fr_1fr] lg:gap-16 lg:py-24">
          <LatestRecipes recipes={rest.slice(0, 4)} isLoggedIn={!!user} savedIds={savedIds} />
          <QuickList recipes={quickest} />
        </Container>
      )}

      {!user && <HowItCooks />}

      {activeCreators.length > 0 && (
        <Container size="xl" className="py-16 lg:py-24">
          <CreatorsStrip creators={activeCreators} />
        </Container>
      )}

      <CreatorInvite />
    </SiteShell>
  );
}
