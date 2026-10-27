import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Icon from "@/components/pk/Icon";
import { getReviews } from "@/services/api/content";

/** The public page only lists 4- and 5-star reviews. */
const STARS = [5, 4] as const;

function starRow(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function formatDate(date: string | null): string {
  if (!date) return "";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Written 4- and 5-star suki reviews, newest first, with a breakdown and filter. */
export default function Reviews() {
  const [rating, setRating] = useState<number | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["reviews", rating],
    queryFn: ({ pageParam }) =>
      getReviews({ page: pageParam, rating: rating ?? undefined }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.current_page < lastPage.last_page ? lastPage.current_page + 1 : undefined,
  });

  const reviews = data?.pages.flatMap((page) => page.data) ?? [];
  const breakdown = data?.pages[0]?.breakdown;
  const writtenTotal = breakdown
    ? STARS.reduce((sum, star) => sum + breakdown[star], 0)
    : 0;
  // Average of the reviews listed here (4s and 5s), not of every rating.
  const average =
    breakdown && writtenTotal > 0
      ? (5 * breakdown[5] + 4 * breakdown[4]) / writtenTotal
      : null;
  const toggleRating = (star: number) =>
    setRating((current) => (current === star ? null : star));

  return (
    <main className="inner-page account-bg">
      <section className="support-hero reviews-hero">
        <div className="shell">
          <p className="kicker">Loved by our mga suki</p>
          <h1>What our suki are saying.</h1>
          <p>Real reviews from verified orders across our partner markets.</p>
        </div>
      </section>

      <section className="section shell">
        {breakdown && (
          <div className="reviews-summary">
            <div className="reviews-score">
              <strong>{average?.toFixed(1) ?? "–"}</strong>
              <div className="stars" aria-hidden="true">
                {starRow(average ?? 0)}
              </div>
              <small>
                {writtenTotal.toLocaleString("en-PH")}{" "}
                {writtenTotal === 1 ? "review" : "reviews"} · verified orders
              </small>
            </div>
            <div className="reviews-bars">
              {STARS.map((star) => {
                const count = breakdown[star];
                const percent = writtenTotal > 0 ? (count / writtenTotal) * 100 : 0;
                return (
                  <button
                    key={star}
                    type="button"
                    aria-pressed={rating === star}
                    onClick={() => toggleRating(star)}
                    aria-label={`Show ${star}-star reviews (${count})`}
                  >
                    <span>{star} ★</span>
                    <i>
                      <b style={{ width: `${percent}%` }} />
                    </i>
                    <em>{count}</em>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="reviews-filters" role="group" aria-label="Filter by rating">
          <button
            type="button"
            aria-pressed={rating === null}
            onClick={() => setRating(null)}
          >
            All
          </button>
          {STARS.map((star) => (
            <button
              key={star}
              type="button"
              aria-pressed={rating === star}
              onClick={() => toggleRating(star)}
            >
              {star} ★
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="empty">
            <p>Loading reviews…</p>
          </div>
        ) : isError ? (
          <div className="empty">
            <h3>Couldn’t load reviews</h3>
            <button type="button" className="btn outline" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="empty">
            <Icon name="star" size={34} />
            <h3>{rating ? `No ${rating}-star reviews yet` : "No reviews yet"}</h3>
            <p>
              Reviews appear here after customers rate their orders.{" "}
              <Link to="/shop">Start shopping</Link>
            </p>
          </div>
        ) : (
          <>
            <div className="testimonials reviews-grid">
              {reviews.map((review) => (
                <article key={review.id}>
                  <div className="stars" aria-label={`${review.rating} out of 5 stars`}>
                    {starRow(review.rating)}
                  </div>
                  <blockquote>“{review.comment.trim()}”</blockquote>
                  <div className="person">
                    <span>{review.public_customer_name.charAt(0)}</span>
                    <div>
                      <strong>{review.public_customer_name}</strong>
                      <small>
                        Verified suki
                        {review.market_name ? ` · ${review.market_name}` : ""}
                      </small>
                    </div>
                    {review.created_at && (
                      <time dateTime={review.created_at}>
                        {formatDate(review.created_at)}
                      </time>
                    )}
                  </div>
                </article>
              ))}
            </div>
            {hasNextPage && (
              <div className="reviews-more">
                <button
                  type="button"
                  className="btn outline"
                  disabled={isFetchingNextPage}
                  onClick={() => void fetchNextPage()}
                >
                  {isFetchingNextPage ? "Loading…" : "Load more reviews"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
