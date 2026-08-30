"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import {
  fallbackReviews,
  googleMapsUrl as fallbackGoogleMapsUrl,
  type ReviewItem,
} from "./reviews-data";

type ReviewFeed = {
  live: boolean;
  rating: number;
  reviewCount: number;
  reviews: ReviewItem[];
  googleMapsUrl: string;
  updatedAt: string;
};

const initialFeed: ReviewFeed = {
  live: false,
  rating: 5,
  reviewCount: 13,
  reviews: fallbackReviews,
  googleMapsUrl: fallbackGoogleMapsUrl,
  updatedAt: "",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="reviewStars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <i className={index < Math.round(rating) ? "filled" : ""} key={index}>
          ★
        </i>
      ))}
    </span>
  );
}

export function ReviewCarousel() {
  const [feed, setFeed] = useState(initialFeed);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [autoplay] = useState(() =>
    Autoplay({ delay: 5200, stopOnInteraction: false, stopOnMouseEnter: true }),
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { align: "start", loop: true, skipSnaps: false },
    [autoplay],
  );

  const refreshReviews = useCallback(async () => {
    try {
      const response = await fetch("/api/google-reviews", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return;
      const nextFeed = (await response.json()) as ReviewFeed;
      if (nextFeed.reviews?.length) setFeed(nextFeed);
    } catch {
      // Keep the verified fallback reviews visible when Google is unavailable.
    }
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    const firstRefresh = window.setTimeout(() => void refreshReviews(), 0);
    const refreshTimer = window.setInterval(refreshReviews, 15 * 60 * 1000);
    return () => {
      window.clearTimeout(firstRefresh);
      window.clearInterval(refreshTimer);
    };
  }, [refreshReviews]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    emblaApi?.reInit();
  }, [emblaApi, feed.reviews]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) autoplay.stop();
  }, [autoplay]);

  return (
    <section className="googleReviews sectionNew" id="testimonials">
      <div className="reviewHeader">
        <div>
          <p className="brandEyebrow">
            <span /> REAL WORDS · REAL CUSTOMERS
          </p>
          <h2>
            Five stars,
            <br />
            <em>now in motion.</em>
          </h2>
          <p className={`reviewSyncState ${feed.live ? "isLive" : ""}`}>
            <i />
            {feed.live
              ? "SYNCED FROM GOOGLE · REFRESHES EVERY 15 MINUTES"
              : "VERIFIED REVIEWS · LIVE GOOGLE FEED READY"}
          </p>
        </div>
        <a
          href={feed.googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="googleScore"
          aria-label={`View K1 Nuts' ${feed.reviewCount} Google reviews`}
        >
          <span>G</span>
          <b>{feed.rating.toFixed(1)}</b>
          <div>
            <Stars rating={feed.rating} />
            <small>{feed.reviewCount} GOOGLE REVIEWS</small>
          </div>
        </a>
      </div>

      <div
        className="reviewCarousel"
        role="region"
        aria-label="K1 Nuts Google customer reviews"
        aria-roledescription="carousel"
      >
        <div className="reviewRail" ref={emblaRef}>
          <div className="reviewTrack">
            {feed.reviews.map((review, index) => (
              <article
                className="reviewSlide"
                key={review.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${feed.reviews.length}`}
              >
                <blockquote>
                  <div className="reviewCardTop">
                    <Stars rating={review.rating} />
                    <span>GOOGLE</span>
                  </div>
                  <p>“{review.quote}”</p>
                  <footer>
                    {review.photoUrl ? (
                      <img
                        src={review.photoUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <i className="reviewAvatar">
                        {review.name.slice(0, 1).toUpperCase()}
                      </i>
                    )}
                    <span>{review.name}</span>
                    <small>{review.relativeTime}</small>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                  </footer>
                  <a
                    className="reviewCardLink"
                    href={review.reviewUrl ?? feed.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Read ${review.name}'s review on Google`}
                  />
                </blockquote>
              </article>
            ))}
          </div>
        </div>

        <div className="reviewControls">
          <div className="reviewArrows">
            <button
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Previous review"
            >
              ←
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Next review"
            >
              →
            </button>
          </div>
          <div className="reviewDots" aria-label="Choose a review">
            {feed.reviews.map((review, index) => (
              <button
                className={index === selectedIndex ? "active" : ""}
                key={review.id}
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Go to review ${index + 1}`}
                aria-current={index === selectedIndex ? "true" : undefined}
              />
            ))}
          </div>
          <span>
            {String(selectedIndex + 1).padStart(2, "0")} /{" "}
            {String(feed.reviews.length).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="reviewSource">
        <span>
          Google Places supplies up to five relevant reviews · Google
          attribution
        </span>
        <a href={feed.googleMapsUrl} target="_blank" rel="noreferrer">
          READ ALL REVIEWS ON GOOGLE ↗
        </a>
      </div>
    </section>
  );
}
