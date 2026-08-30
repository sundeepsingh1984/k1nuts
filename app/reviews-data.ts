export type ReviewItem = {
  id: string;
  quote: string;
  name: string;
  rating: number;
  relativeTime: string;
  authorUrl?: string;
  photoUrl?: string;
  reviewUrl?: string;
};

export const googleMapsUrl =
  "https://www.google.com/maps/place/K1+nuts/@34.0586242,74.7972288,17z/data=!3m1!4b1!4m6!3m5!1s0x38e18f251fbd8967:0xda71c93f397abc03!8m2!3d34.0586242!4d74.7972288!16s%2Fg%2F11y58v_gcg";

export const fallbackReviews: ReviewItem[] = [
  {
    id: "parth-sanghavi",
    quote: "The dry fruits were fresh.",
    name: "Parth Sanghavi",
    rating: 5,
    relativeTime: "Verified Google review",
    reviewUrl: googleMapsUrl,
  },
  {
    id: "jagdeep-kochar",
    quote: "The nuts/seeds mix was great and really tasty.",
    name: "Jagdeep Kochar",
    rating: 5,
    relativeTime: "Verified Google review",
    reviewUrl: googleMapsUrl,
  },
  {
    id: "jaskirat-singh-gujral",
    quote: "Quality of dry fruits is very good.",
    name: "Jaskirat Singh Gujral",
    rating: 5,
    relativeTime: "Verified Google review",
    reviewUrl: googleMapsUrl,
  },
];
