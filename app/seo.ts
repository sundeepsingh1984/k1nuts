export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://nourish-and-nut.sales-k1nuts.chatgpt.site";

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
