"use client";

export type StoreEventPayload = {
  productSlug?: string;
  searchTerm?: string;
  resultCount?: number;
  durationMs?: number;
  metadata?: Record<string, string | number | boolean>;
};

export function trackStoreEvent(
  event: string,
  path: string,
  payload: StoreEventPayload = {},
) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({
    event,
    path,
    referrer: document.referrer || undefined,
    ...payload,
  });
  void fetch("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
