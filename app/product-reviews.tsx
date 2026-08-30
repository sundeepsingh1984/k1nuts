"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Review = {
  id: number;
  userName: string;
  rating: number;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  createdAt: number;
};
type ReviewFeed = {
  reviews: Review[];
  summary: { averageRating: number; count: number };
  signedIn: boolean;
  canReview: boolean;
  hasReviewed: boolean;
};

function ProductStars({ rating }: { rating: number }) {
  return (
    <span
      className="productReviewStars"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <i className={index < Math.round(rating) ? "filled" : ""} key={index}>
          ★
        </i>
      ))}
    </span>
  );
}

export function ProductReviews({
  productSlug,
  productName,
}: {
  productSlug: string;
  productName: string;
}) {
  const [feed, setFeed] = useState<ReviewFeed | null>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const loadReviews = useCallback(async () => {
    const response = await fetch(
      `/api/product-reviews?productSlug=${encodeURIComponent(productSlug)}`,
      { cache: "no-store" },
    );
    if (response.ok) setFeed((await response.json()) as ReviewFeed);
  }, [productSlug]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReviews(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReviews]);

  async function submitReview(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const response = await fetch("/api/product-reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productSlug, rating, title, body }),
    });
    const result = (await response.json()) as { error?: string };
    setNotice(
      response.ok
        ? "Thank you. Your verified review is now live."
        : result.error || "Unable to publish review.",
    );
    setBusy(false);
    if (response.ok) {
      setTitle("");
      setBody("");
      loadReviews();
    }
  }

  return (
    <section className="productReviewsSection sectionNew" id="product-reviews">
      <div className="productReviewHeader">
        <div>
          <p className="brandEyebrow">
            <span /> VERIFIED BUYER NOTES
          </p>
          <h2>
            Tried. Loved.
            <br />
            <em>Shared honestly.</em>
          </h2>
        </div>
        <div className="productReviewScore">
          <b>
            {feed?.summary.count ? feed.summary.averageRating.toFixed(1) : "—"}
          </b>
          <ProductStars rating={feed?.summary.averageRating ?? 0} />
          <span>
            {feed?.summary.count ?? 0} product review
            {(feed?.summary.count ?? 0) === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="productReviewLayout">
        <div className="productReviewList">
          {feed?.reviews.map((review) => (
            <article key={review.id}>
              <div>
                <ProductStars rating={review.rating} />
                {review.verifiedPurchase && <b>✓ VERIFIED PURCHASE</b>}
              </div>
              <h3>{review.title}</h3>
              <p>{review.body}</p>
              <footer>
                <span>{review.userName}</span>
                <small>
                  {new Date(review.createdAt).toLocaleDateString("en-IN")}
                </small>
              </footer>
            </article>
          ))}
          {feed && !feed.reviews.length && (
            <div className="productReviewEmpty">
              <span>01</span>
              <h3>Be the first verified buyer to review {productName}.</h3>
              <p>Only customers with a paid K1 order can publish here.</p>
            </div>
          )}
        </div>

        <aside className="productReviewAction">
          <small>YOUR EXPERIENCE</small>
          <h3>Help the next pantry choose well.</h3>
          {!feed ? (
            <p>Checking review eligibility…</p>
          ) : feed.canReview ? (
            <form onSubmit={submitReview}>
              <fieldset>
                <legend>Your rating</legend>
                <div className="reviewRatingPicker">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={value <= rating ? "active" : ""}
                      onClick={() => setRating(value)}
                      aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </fieldset>
              <label>
                Review title
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Fresh, flavourful and beautifully packed"
                  minLength={3}
                  maxLength={90}
                  required
                />
              </label>
              <label>
                Your review
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Tell other customers about taste, freshness and packaging."
                  minLength={20}
                  maxLength={1200}
                  required
                />
              </label>
              <button className="brandButton" disabled={busy}>
                {busy ? "PUBLISHING…" : "PUBLISH VERIFIED REVIEW →"}
              </button>
            </form>
          ) : feed.hasReviewed ? (
            <p>
              Your verified review has already been published for this product.
            </p>
          ) : feed.signedIn ? (
            <p>
              Review access unlocks after this product appears in one of your
              paid orders.
            </p>
          ) : (
            <p>
              <Link href="/account">Sign in to your K1 account</Link> to check
              purchase eligibility and leave a review.
            </p>
          )}
          {notice && <span className="reviewFormNotice">{notice}</span>}
        </aside>
      </div>
    </section>
  );
}
