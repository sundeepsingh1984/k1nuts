interface K1RuntimeBindings {
  DB: D1Database;
  GOOGLE_PLACES_API_KEY?: string;
  GOOGLE_PLACE_ID?: string;
  SHIPROCKET_EMAIL?: string;
  SHIPROCKET_PASSWORD?: string;
  SHIPROCKET_PICKUP_LOCATION?: string;
  K1_SHIP_FROM_NAME?: string;
  K1_SHIP_FROM_ADDRESS?: string;
  K1_SHIP_FROM_CITY?: string;
  K1_SHIP_FROM_STATE?: string;
  K1_SHIP_FROM_PIN?: string;
  K1_SHIP_FROM_PHONE?: string;
  K1_SHIP_FROM_EMAIL?: string;
  AMAZON_LWA_CLIENT_ID?: string;
  AMAZON_LWA_CLIENT_SECRET?: string;
  AMAZON_LWA_REFRESH_TOKEN?: string;
  AMAZON_SP_API_ENDPOINT?: string;
  AMAZON_SHIPPING_BUSINESS_ID?: string;
}

declare global {
  interface Env extends K1RuntimeBindings {}

  namespace Cloudflare {
    interface Env extends K1RuntimeBindings {}
  }
}

export {};
