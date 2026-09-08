"use client";

import { useEffect } from "react";
import { trackStoreEvent } from "./analytics";

type LayoutShiftEntry = PerformanceEntry & {
  value: number;
  hadRecentInput: boolean;
};

function metricRating(name: string, value: number) {
  const limits: Record<string, [number, number]> = {
    lcp: [2500, 4000],
    cls: [0.1, 0.25],
    ttfb: [800, 1800],
  };
  const [good, poor] = limits[name] || [0, 0];
  return value <= good ? "good" : value <= poor ? "needs-improvement" : "poor";
}

export function PerformanceReporter() {
  useEffect(() => {
    const path = window.location.pathname;
    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming | undefined;
    if (navigation) {
      const value = Math.max(0, navigation.responseStart);
      trackStoreEvent("web_vital_ttfb", path, {
        durationMs: value,
        metadata: { rating: metricRating("ttfb", value) },
      });
    }

    let lcp = 0;
    let cls = 0;
    const observers: PerformanceObserver[] = [];
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        lcp = entries.at(-1)?.startTime || lcp;
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      observers.push(lcpObserver);

      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as LayoutShiftEntry[]) {
          if (!entry.hadRecentInput) cls += entry.value;
        }
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
      observers.push(clsObserver);
    } catch {
      // Older browsers still report navigation timing above.
    }

    const report = () => {
      if (lcp) {
        trackStoreEvent("web_vital_lcp", path, {
          durationMs: lcp,
          metadata: { rating: metricRating("lcp", lcp) },
        });
      }
      trackStoreEvent("web_vital_cls", path, {
        durationMs: Math.round(cls * 1000),
        metadata: { score: Number(cls.toFixed(4)), rating: metricRating("cls", cls) },
      });
    };
    document.addEventListener("visibilitychange", report, { once: true });
    return () => {
      observers.forEach((observer) => observer.disconnect());
      document.removeEventListener("visibilitychange", report);
    };
  }, []);

  return null;
}
