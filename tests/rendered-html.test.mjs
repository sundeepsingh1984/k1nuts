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
  const [account, accountPage, carousel, reviews, schema, storeData] = await Promise.all([
    readFile(
      new URL("../app/account/account-dashboard.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/account/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/review-carousel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/product-reviews.tsx", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/store-data.ts", import.meta.url), "utf8"),
  ]);

  assert.match(account, /Delivery addresses/);
  assert.match(account, /Orders & tracking/);
  assert.match(account, /useState<Tab>\(initialTab\)/);
  assert.doesNotMatch(account, /typeof window === "undefined"/);
  assert.match(accountPage, /initialTab={initialTab}/);
  assert.match(accountPage, /searchParams/);
  assert.match(carousel, /embla-carousel-react/);
  assert.match(reviews, /verified purchase/i);
  assert.match(schema, /productReviews/);
  assert.match(schema, /customerOrders/);
  assert.doesNotMatch(storeData, /catalogue\/[a-z0-9-]+\.png/);
});

test("keeps checkout state across sign-in without changing the hydration snapshot", async () => {
  const storefront = await readFile(
    new URL("../app/storefront-context.tsx", import.meta.url),
    "utf8",
  );
  assert.match(storefront, /k1_storefront_cart_v1/);
  assert.match(storefront, /if \(!cartReady\) return/);
  assert.match(storefront, /window\.localStorage\.getItem/);
  assert.match(storefront, /window\.localStorage\.setItem/);
  assert.match(storefront, /current\.length \? current : valid/);
  assert.match(storefront, /useState<CartLine\[\]>\(\[\]\)/);
  assert.doesNotMatch(storefront, /useState<CartLine\[\]>\(\(\) =>/);
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

test("ships first-party insights, consent campaigns and technical SEO", async () => {
  const [
    admin,
    events,
    campaigns,
    marketing,
    account,
    schema,
    productPage,
    categoryPage,
    sitemap,
  ] = await Promise.all([
    readFile(new URL("../app/admin/dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/events/route.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../app/api/admin/campaigns/route.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/marketing.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../app/account/account-dashboard.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../app/product/[slug]/page.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/category/[slug]/page.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
  ]);

  assert.match(admin, /Growth & behaviour insights/);
  assert.match(admin, /Marketing campaigns/);
  assert.match(admin, /Most visited pages/);
  assert.match(events, /sessionId/);
  assert.match(events, /classifyDevice/);
  assert.match(campaigns, /whatsappMarketingOptIn/);
  assert.match(marketing, /api\.resend\.com\/emails\/batch/);
  assert.match(marketing, /graph\.facebook\.com/);
  assert.match(account, /WhatsApp/);
  assert.match(schema, /marketingCampaigns/);
  assert.match(schema, /campaignDeliveries/);
  assert.match(productPage, /Product/);
  assert.match(productPage, /application\/ld\+json/);
  assert.match(categoryPage, /CollectionPage/);
  assert.match(sitemap, /getAllCatalogueProducts/);
});

test("ships controlled GST invoicing and accountant-ready working data", async () => {
  const [admin, gstRoute, invoiceRoute, invoicePage, gst, schema] =
    await Promise.all([
      readFile(new URL("../app/admin/dashboard.tsx", import.meta.url), "utf8"),
      readFile(
        new URL("../app/api/admin/gst/route.ts", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../app/api/admin/gst/invoices/route.ts", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../app/invoice/[id]/page.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/gst.ts", import.meta.url), "utf8"),
      readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    ]);

  assert.match(admin, /GSTR-3B · TABLE 3\.1\(a\)/);
  assert.match(admin, /RETURN \/ CREDIT-NOTE RECONCILIATION/);
  assert.match(gstRoute, /b2clInvoices/);
  assert.match(gstRoute, /unadjustedReturns/);
  assert.match(invoiceRoute, /authorised GSP\/IRP/);
  assert.match(invoiceRoute, /batch/);
  assert.match(invoicePage, /TAX INVOICE/);
  assert.match(gst, /calculateInclusiveTax/);
  assert.match(gst, /stateCodeFor/);
  assert.match(schema, /businessTaxSettings/);
  assert.match(schema, /productTaxProfiles/);
  assert.match(schema, /taxInvoices/);
  assert.match(schema, /taxInvoiceLines/);
});

test("ships private admin sessions and persistent K1 Concierge support", async () => {
  const [adminAuth, adminLogin, adminDashboard, supportRoute, adminSupport, chat, schema, storefront] =
    await Promise.all([
      readFile(new URL("../app/admin-auth.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/admin/login/page.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/admin/dashboard.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/api/support/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/admin/support/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/support-chat.tsx", import.meta.url), "utf8"),
      readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/storefront-context.tsx", import.meta.url), "utf8"),
    ]);

  assert.match(adminAuth, /httpOnly: true/);
  assert.match(adminAuth, /K1_ADMIN_PASSWORD_SHA256/);
  assert.match(adminLogin, /Administrator sign in/);
  assert.match(adminDashboard, /Customer support inbox/);
  assert.match(adminDashboard, /MARK RESOLVED/);
  assert.match(supportRoute, /K1 Concierge/);
  assert.match(supportRoute, /support_messages/);
  assert.match(adminSupport, /Authentication required/);
  assert.match(chat, /Quick guidance · team support/);
  assert.match(schema, /supportConversations/);
  assert.match(schema, /supportMessages/);
  assert.doesNotMatch(storefront, /href="\/admin"/);
});

test("ships dynamic catalogue administration and two-factor customer authentication", async () => {
  const [
    dashboard,
    productsRoute,
    categoriesRoute,
    catalogue,
    login,
    loginClient,
    customerAuth,
    emailAuth,
    googleAuth,
    schema,
    storefront,
  ] = await Promise.all([
    readFile(new URL("../app/admin/dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/products/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/categories/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/catalogue-db.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/login/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/login/customer-login.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/customer-auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/email/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/google/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/storefront-context.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(dashboard, /SAVE PRODUCT CHANGES/);
  assert.match(dashboard, /Create a store category/);
  assert.match(dashboard, /appear automatically in the Shop menu/);
  assert.match(productsRoute, /export async function PUT/);
  assert.match(categoriesRoute, /export async function POST/);
  assert.match(categoriesRoute, /export async function PUT/);
  assert.match(catalogue, /getCatalogueCategories/);
  assert.match(login, /Good food/);
  assert.match(loginClient, /CONTINUE WITH GOOGLE/);
  assert.match(loginClient, /CONTINUE TO EMAIL CODE/);
  assert.match(customerAuth, /PBKDF2/);
  assert.match(customerAuth, /httpOnly: true/);
  assert.match(emailAuth, /attempts >= 5/);
  assert.match(googleAuth, /openidconnect\.googleapis\.com/);
  assert.match(schema, /storeCategories/);
  assert.match(schema, /customerAccounts/);
  assert.match(schema, /emailOtpCodes/);
  assert.doesNotMatch(storefront, /signin-with-chatgpt/);
});

test("ships encrypted self-service integration administration", async () => {
  const [dashboard, route, settings, shipping, marketing, reviews, schema, migration] =
    await Promise.all([
      readFile(new URL("../app/admin/dashboard.tsx", import.meta.url), "utf8"),
      readFile(new URL("../app/api/admin/integrations/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/integration-settings.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/shipping.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/marketing.ts", import.meta.url), "utf8"),
      readFile(new URL("../app/api/google-reviews/route.ts", import.meta.url), "utf8"),
      readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
      readFile(new URL("../drizzle/0007_overconfident_warlock.sql", import.meta.url), "utf8"),
    ]);

  assert.match(dashboard, /Connect services without touching code/);
  assert.match(dashboard, /SAVE SETTINGS/);
  assert.match(dashboard, /never returned to this browser/);
  assert.match(route, /Authentication required/);
  assert.match(route, /testShiprocketConnection/);
  assert.match(route, /api\.razorpay\.com/);
  assert.match(settings, /AES-GCM/);
  assert.match(settings, /config_encrypted/);
  assert.match(settings, /secretHints/);
  assert.doesNotMatch(settings, /configEncrypted.*Response\.json/);
  assert.match(shipping, /getIntegrationConfig\("shiprocket"\)/);
  assert.match(marketing, /getIntegrationConfig\("email"\)/);
  assert.match(reviews, /getIntegrationConfig\("google_reviews"\)/);
  assert.match(schema, /integrationSettings/);
  assert.match(migration, /integration_settings/);
});
