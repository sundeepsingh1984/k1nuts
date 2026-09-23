import { getIntegrationConfig } from "../../integration-settings";
import {
  fallbackReviews,
  googleMapsUrl,
  type ReviewItem,
} from "../../reviews-data";

type GoogleReview = {
  name?: string;
  relativePublishTimeDescription?: string;
  text?: { text?: string };
  rating?: number;
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
  googleMapsUri?: string;
};

type ReviewResponse = {
  live: boolean;
  rating: number;
  reviewCount: number;
  reviews: ReviewItem[];
  googleMapsUrl: string;
  updatedAt: string;
};

const cacheDuration = 15 * 60 * 1000;
let reviewCache: { expiresAt: number; payload: ReviewResponse } | null = null;

const responseHeaders = {
  "Cache-Control":
    "public, max-age=300, s-maxage=900, stale-while-revalidate=86400",
};

function fallbackPayload(): ReviewResponse {
  return {
    live: false,
    rating: 5,
    reviewCount: 13,
    reviews: fallbackReviews,
    googleMapsUrl,
    updatedAt: new Date().toISOString(),
  };
}

async function findK1PlaceId(apiKey: string) {
  const result = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id",
      },
      body: JSON.stringify({
        textQuery: "K1 Nuts, Aluchi Bagh, Srinagar, Jammu and Kashmir 190008",
        languageCode: "en",
        regionCode: "IN",
      }),
    },
  );

  if (!result.ok) return null;
  const data = (await result.json()) as { places?: Array<{ id?: string }> };
  return data.places?.[0]?.id ?? null;
}

export async function GET() {
  if (reviewCache && reviewCache.expiresAt > Date.now()) {
    return Response.json(reviewCache.payload, { headers: responseHeaders });
  }

  const config = await getIntegrationConfig("google_reviews");
  const apiKey = config.apiKey?.trim();
  if (!apiKey) {
    return Response.json(fallbackPayload(), { headers: responseHeaders });
  }

  try {
    const placeId =
      config.placeId?.trim() || (await findK1PlaceId(apiKey));
    if (!placeId) throw new Error("K1 Nuts place was not found");

    const details = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "displayName,rating,userRatingCount,reviews,googleMapsUri",
        },
      },
    );
    if (!details.ok) throw new Error("Google Place Details request failed");

    const data = (await details.json()) as {
      rating?: number;
      userRatingCount?: number;
      googleMapsUri?: string;
      reviews?: GoogleReview[];
    };
    const reviews = (data.reviews ?? [])
      .filter(
        (review) => review.text?.text && review.authorAttribution?.displayName,
      )
      .slice(0, 5)
      .map((review, index): ReviewItem => ({
        id: review.name ?? `google-review-${index}`,
        quote: review.text?.text?.trim() ?? "",
        name: review.authorAttribution?.displayName ?? "Google reviewer",
        rating: Math.max(1, Math.min(5, review.rating ?? 5)),
        relativeTime: review.relativePublishTimeDescription ?? "Google review",
        authorUrl: review.authorAttribution?.uri,
        photoUrl: review.authorAttribution?.photoUri,
        reviewUrl: review.googleMapsUri ?? data.googleMapsUri ?? googleMapsUrl,
      }));

    if (!reviews.length)
      throw new Error("Google returned no displayable reviews");

    const payload: ReviewResponse = {
      live: true,
      rating: data.rating ?? 5,
      reviewCount: data.userRatingCount ?? reviews.length,
      reviews,
      googleMapsUrl: data.googleMapsUri ?? googleMapsUrl,
      updatedAt: new Date().toISOString(),
    };
    reviewCache = { expiresAt: Date.now() + cacheDuration, payload };
    return Response.json(payload, { headers: responseHeaders });
  } catch {
    return Response.json(fallbackPayload(), { headers: responseHeaders });
  }
}
