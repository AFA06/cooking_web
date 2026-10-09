import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BookOpen, Flame, Star } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SocialLinks } from "@/components/creator/SocialLinks";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { RatingStars, formatRating } from "@/components/reviews/RatingStars";
import { ReviewList } from "@/components/reviews/ReviewList";
import { formatNumber } from "@/lib/format";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser } from "@/server/creator";
import { getCreatorBySlug, getRecipesByCreator } from "@/server/recipes";
import { getCreatorReviews, getCreatorSummary } from "@/server/reviews";
import { getSavedRecipeIds } from "@/server/user-data";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const creator = await getCreatorBySlug(slug);
  if (!creator) return { title: "Ijodkor topilmadi" };
  return { title: creator.name, description: creator.bio, alternates: { canonical: `/creators/${creator.slug}` } };
}

export default async function CreatorPage({ params }: Props) {
  const { slug } = await params;
  const creator = await getCreatorBySlug(slug);
  if (!creator) notFound();

  const user = await getCurrentUser();
  const [recipes, summary, reviews, savedList, ownCreator] = await Promise.all([
    getRecipesByCreator(creator.slug),
    getCreatorSummary(creator.id),
    getCreatorReviews(creator.id),
    user ? getSavedRecipeIds(user.id) : [],
    user ? getCreatorForUser(user.id) : null,
  ]);
  const savedIds = new Set(savedList);
  const { rating } = summary;

  const stats = [
    {
      label: "O‘rtacha baho",
      icon: Star,
      value: rating.count > 0 ? formatRating(rating.average) : "—",
      note: rating.count > 0 ? `${formatNumber(rating.count)} ta baho asosida` : "Hali baholanmagan",
      stars: rating.count > 0 ? rating.average : null,
    },
    { label: "Pishirilgan", icon: Flame, value: formatNumber(summary.cooked), note: "marta oxirigacha pishirilgan", stars: null },
    { label: "Retseptlar", icon: BookOpen, value: formatNumber(summary.publishedRecipes), note: "nashr etilgan", stars: null },
  ];

  return (
    <div className="pb-24">
      <Container size="xl" className="pt-10 lg:pt-16">
        <header className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            {creator.avatarUrl ? (
              <Image src={creator.avatarUrl} alt="" width={160} height={160} priority className="h-28 w-28 shrink-0 rounded-full object-cover sm:h-40 sm:w-40" />
            ) : (
              <span className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-sage-100 font-serif text-5xl text-sage-700 sm:h-40 sm:w-40" aria-hidden="true">
                {creator.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{creator.isFoundingCreator ? "Asoschi ijodkor" : "Ijodkor"}</p>
              <h1 className="mt-3 text-[2.6rem] font-medium leading-[1.04] text-amber-950 break-words sm:text-6xl">{creator.name}</h1>
              {creator.bio && <p className="mt-4 max-w-xl text-lg leading-relaxed text-amber-900">{creator.bio}</p>}
              <div className="mt-6">
                <SocialLinks links={creator.socialLinks} canEdit={ownCreator?.id === creator.id} />
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-3 divide-x divide-amber-200 rounded-[1.75rem] bg-amber-100/70 py-7">
            {stats.map(({ label, icon: Icon, value, note, stars }) => (
              <div key={label} className="min-w-0 px-4 text-center sm:px-6">
                <dt className="flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-wider text-amber-600">
                  <Icon className="h-4 w-4 shrink-0 text-amber-700" strokeWidth={2} aria-hidden="true" />
                  {label}
                </dt>
                <dd className="mt-3">
                  <span className="block font-serif text-5xl font-medium leading-none text-amber-950 sm:text-6xl">{value}</span>
                  {stars !== null && <RatingStars value={stars} className="mt-3" />}
                  <span className="mt-2 block text-sm text-amber-600">{note}</span>
                </dd>
              </div>
            ))}
          </dl>
        </header>
      </Container>

      <Container size="xl" className="mt-16 lg:mt-24">
        <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-amber-950 pb-4">
          <h2 className="text-3xl font-medium text-amber-950 sm:text-4xl">Retseptlar</h2>
          <p className="text-sm text-amber-600">{recipes.length} ta</p>
        </div>
        {recipes.length === 0 ? (
          <p className="py-10 text-amber-900">Hali retseptlar nashr etilmagan.</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {recipes.map((r, i) => (
              <RecipeCard key={r.id} recipe={r} isLoggedIn={!!user} saved={savedIds.has(r.id)} priority={i < 4} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw" />
            ))}
          </div>
        )}
      </Container>

      <Container size="xl" className="mt-20 lg:mt-28">
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <h2 className="text-3xl font-medium text-amber-950 sm:text-4xl">Pishirganlar fikri</h2>
          {rating.count > 0 && <p className="text-sm text-amber-600">{formatNumber(rating.count)} ta baho</p>}
        </div>
        <p className="mb-8 max-w-2xl text-amber-900">Faqat shu ijodkorning retseptini oxirigacha pishirgan odamlar baho va rasm qoldira oladi.</p>
        {reviews.length === 0 ? (
          <p className="border-y border-amber-200 py-10 text-amber-600">Hali baholar yo‘q. Retseptlardan birini pishirib, birinchi bo‘lib baho qoldiring.</p>
        ) : (
          <ReviewList reviews={reviews} showRecipe />
        )}
      </Container>
    </div>
  );
}
