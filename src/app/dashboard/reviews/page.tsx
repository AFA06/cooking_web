import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, PageHeader, Panel } from "@/components/admin/ui";
import { RatingOverview, ResultPhotos, ReviewList } from "@/components/reviews/ReviewList";
import { getT } from "@/i18n/server";
import { getCurrentUser } from "@/server/auth";
import { getCreatorForUser } from "@/server/creator";
import { getCreatorReviews, getCreatorSummary } from "@/server/reviews";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("studio.nav.reviews"), robots: { index: false } };
}

export default async function StudioReviewsPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  if (!user) redirect("/auth/login?next=/dashboard/reviews");
  const creator = await getCreatorForUser(user.id);
  if (!creator) redirect("/creators/join");
  const [summary, reviews] = await Promise.all([getCreatorSummary(creator.id), getCreatorReviews(creator.id)]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow={t("studio.eyebrow")} title={t("studio.nav.reviews")} description={t("studio.reviews.desc")} />

      {reviews.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-100">
          <EmptyState
            title={t("creator.unrated")}
            text={t("creator.reviewsNote")}
            action={<Link href="/dashboard/recipes" className="font-medium text-amber-700 underline">{t("nav.recipes")}</Link>}
          />
        </div>
      ) : (
        <div className="grid items-start gap-8 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <Panel>
            <RatingOverview rating={summary.rating} />
          </Panel>
          <div className="min-w-0 space-y-8">
            <ResultPhotos reviews={reviews} />
            <ReviewList reviews={reviews} showRecipe />
          </div>
        </div>
      )}
    </div>
  );
}
