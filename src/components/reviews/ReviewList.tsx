import Link from "next/link";
import { RatingStars, formatRating } from "@/components/reviews/RatingStars";
import { formatNumber, formatRelative } from "@/lib/format";
import type { RatingSummary, Review } from "@/server/reviews";

export function RatingOverview({ rating }: { rating: RatingSummary }) {
  return (
    <div>
      <p className="flex items-end gap-3">
        <span className="font-serif text-7xl font-medium leading-none text-amber-950">{formatRating(rating.average)}</span>
        <span className="pb-1 text-amber-600">/ 5</span>
      </p>
      <RatingStars value={rating.average} size="lg" className="mt-3" />
      <p className="mt-2 text-sm text-amber-600">{formatNumber(rating.count)} ta baho · faqat retseptni pishirganlar baholaydi</p>
      <dl className="mt-6 space-y-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const n = rating.distribution[stars - 1];
          return (
            <div key={stars} className="flex items-center gap-3 text-sm">
              <dt className="w-3 text-amber-900 tabular-nums">{stars}</dt>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-amber-100" aria-hidden="true">
                <div className="h-full rounded-full bg-clay-400" style={{ width: `${rating.count ? (n / rating.count) * 100 : 0}%` }} />
              </div>
              <dd className="w-6 text-right text-amber-600 tabular-nums">{n}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

export function ReviewList({ reviews, showRecipe = false }: { reviews: Review[]; showRecipe?: boolean }) {
  return (
    <ul className="divide-y divide-amber-200 border-y border-amber-200">
      {reviews.map((review) => (
        <li key={review.id} className="flex gap-5 py-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-100 font-serif text-lg text-sage-700" aria-hidden="true">
                {review.userName.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-amber-950">{review.userName}</p>
                <p className="flex items-center gap-2 text-sm text-amber-600">
                  <RatingStars value={review.rating} size="sm" />
                  <span className="sr-only">{review.rating} yulduz</span>
                  {formatRelative(review.createdAt)}
                </p>
              </div>
            </div>
            {review.comment && <p className="mt-3 max-w-2xl leading-relaxed text-amber-900">{review.comment}</p>}
            {showRecipe && (
              <p className="mt-2 text-sm text-amber-600">
                Retsept:{" "}
                <Link href={`/recipes/${review.recipeSlug}`} className="font-medium text-amber-950 hover:text-amber-700 hover:underline">{review.recipeTitle}</Link>
              </p>
            )}
          </div>
          {review.photoId && (
            <a href={`/api/review-photos/${review.photoId}`} target="_blank" rel="noopener" className="shrink-0" aria-label={`${review.userName} pishirgan taom rasmi`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- served by our own cached route */}
              <img src={`/api/review-photos/${review.photoId}`} alt="" loading="lazy" className="h-24 w-24 rounded-2xl object-cover sm:h-32 sm:w-32" />
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
