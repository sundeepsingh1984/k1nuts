import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the production K1 storefront", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /K1 Nuts/i);
  assert.match(html, /Goodness/);
  assert.match(html, /50%/);
  assert.match(html, /healthy-snacks/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("ships account, review and commerce data capabilities", async () => {
  const [account, carousel, reviews, schema, storeData] = await Promise.all([
    readFile(
      new URL("../app/account/account-dashboard.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/review-carousel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/product-reviews.tsx", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/store-data.ts", import.meta.url), "utf8"),
  ]);

  assert.match(account, /Delivery addresses/);
  assert.match(account, /Orders & tracking/);
  assert.match(carousel, /embla-carousel-react/);
  assert.match(reviews, /verified purchase/i);
  assert.match(schema, /productReviews/);
  assert.match(schema, /customerOrders/);
  assert.doesNotMatch(storeData, /catalogue\/[a-z0-9-]+\.png/);
});

test("ships structured collections, variants and carrier integrations", async () => {
  const [admin, category, variants, shipping, schema] = await Promise.all([
    readFile(new URL("../app/admin/dashboard.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../app/category/[slug]/category-catalogue.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/store-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/shipping.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
  ]);
  assert.match(category, /Choose by origin/);
  assert.match(variants, /250g/);
  assert.match(variants, /500g/);
  assert.match(variants, /1kg/);
  assert.match(admin, /CREATE PRODUCT \+ 3 VARIANTS/);
  assert.match(admin, /SHIP WITH SHIPROCKET/);
  assert.match(admin, /SHIP WITH AMAZON/);
  assert.match(shipping, /orders\/create\/adhoc/);
  assert.match(shipping, /shipping\/v2\/shipments\/rates/);
  assert.match(schema, /productVariants/);
  assert.match(schema, /orderReturns/);
  assert.match(schema, /orderShipments/);
});
