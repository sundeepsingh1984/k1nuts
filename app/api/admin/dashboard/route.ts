import { desc } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getAdminUser } from "../../../admin-auth";
import { getDb } from "../../../../db";
import {
  adminProducts,
  customerOrders,
  orderReturns,
  orderShipments,
  productVariants,
  storeCategories,
} from "../../../../db/schema";
import { products } from "../../../store-data";
import { getShippingConfiguration } from "../../../shipping";
import { getMarketingConfiguration } from "../../../marketing";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAdminUser();
  if (!user)
    return Response.json(
      { error: "Authentication required." },
      { status: 401 },
    );

  const db = getDb();
  const [
    metrics,
    dailyResult,
    customProducts,
    customCategories,
    variants,
    orders,
    returns,
    shipments,
    topPagesResult,
    topProductsResult,
    topSearchesResult,
    funnelResult,
    performanceResult,
    devicesResult,
    productSalesResult,
  ] = await Promise.all([
    env.DB.prepare(
      `SELECT
          COUNT(*) AS orders,
          COALESCE(SUM(CASE WHEN payment_status = 'paid' AND status != 'cancelled' THEN total_paise ELSE 0 END), 0) AS sales_paise,
          COALESCE(SUM(CASE WHEN status = 'cancelled' THEN total_paise ELSE 0 END), 0) AS cancelled_paise
        FROM customer_orders`,
    ).first<Record<string, number>>(),
    env.DB.prepare(
      `WITH RECURSIVE days(day) AS (
          SELECT date('now', '-6 day')
          UNION ALL SELECT date(day, '+1 day') FROM days WHERE day < date('now')
        )
        SELECT days.day,
          COUNT(customer_orders.id) AS orders,
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_paise ELSE 0 END), 0) AS sales_paise
        FROM days
        LEFT JOIN customer_orders ON date(customer_orders.placed_at / 1000, 'unixepoch') = days.day
        GROUP BY days.day ORDER BY days.day`,
    ).all<Record<string, number | string>>(),
    db.select().from(adminProducts).orderBy(desc(adminProducts.createdAt)),
    db.select().from(storeCategories).orderBy(storeCategories.sortOrder),
    db.select().from(productVariants).orderBy(productVariants.weightGrams),
    db
      .select()
      .from(customerOrders)
      .orderBy(desc(customerOrders.placedAt))
      .limit(50),
    db
      .select()
      .from(orderReturns)
      .orderBy(desc(orderReturns.createdAt))
      .limit(50),
    db
      .select()
      .from(orderShipments)
      .orderBy(desc(orderShipments.createdAt))
      .limit(50),
    env.DB.prepare(
      `SELECT path, COUNT(*) AS views, COUNT(DISTINCT session_id) AS visitors
       FROM activity_events
       WHERE event = 'page_view' AND created_at >= ?
       GROUP BY path ORDER BY views DESC LIMIT 10`,
    )
      .bind(Date.now() - 30 * 86400000)
      .all<Record<string, number | string>>(),
    env.DB.prepare(
      `SELECT product_slug,
          SUM(CASE WHEN event = 'product_view' THEN 1 ELSE 0 END) AS views,
          SUM(CASE WHEN event = 'add_to_cart' THEN 1 ELSE 0 END) AS adds,
          COUNT(DISTINCT session_id) AS visitors
       FROM activity_events
       WHERE product_slug IS NOT NULL
         AND event IN ('product_view', 'add_to_cart')
         AND created_at >= ?
       GROUP BY product_slug ORDER BY views DESC, adds DESC LIMIT 12`,
    )
      .bind(Date.now() - 30 * 86400000)
      .all<Record<string, number | string>>(),
    env.DB.prepare(
      `SELECT search_term, COUNT(*) AS searches,
          ROUND(AVG(result_count), 1) AS average_results,
          SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END) AS zero_results
       FROM activity_events
       WHERE event = 'catalogue_search' AND search_term IS NOT NULL
         AND created_at >= ?
       GROUP BY search_term ORDER BY searches DESC LIMIT 12`,
    )
      .bind(Date.now() - 30 * 86400000)
      .all<Record<string, number | string>>(),
    env.DB.prepare(
      `SELECT
          SUM(CASE WHEN event = 'page_view' THEN 1 ELSE 0 END) AS page_views,
          COUNT(DISTINCT CASE WHEN event = 'page_view' THEN session_id END) AS sessions,
          SUM(CASE WHEN event = 'product_view' THEN 1 ELSE 0 END) AS product_views,
          SUM(CASE WHEN event = 'add_to_cart' THEN 1 ELSE 0 END) AS add_to_carts,
          SUM(CASE WHEN event = 'begin_checkout' THEN 1 ELSE 0 END) AS checkouts
       FROM activity_events WHERE created_at >= ?`,
    )
      .bind(Date.now() - 30 * 86400000)
      .first<Record<string, number>>(),
    env.DB.prepare(
      `SELECT
          ROUND(AVG(CASE WHEN event = 'web_vital_lcp' THEN duration_ms END)) AS lcp_ms,
          ROUND(AVG(CASE WHEN event = 'web_vital_ttfb' THEN duration_ms END)) AS ttfb_ms,
          ROUND(AVG(CASE WHEN event = 'web_vital_cls' THEN duration_ms END)) AS cls_milli
       FROM activity_events WHERE created_at >= ?`,
    )
      .bind(Date.now() - 30 * 86400000)
      .first<Record<string, number>>(),
    env.DB.prepare(
      `SELECT COALESCE(device, 'unknown') AS device, COUNT(DISTINCT session_id) AS sessions
       FROM activity_events WHERE event = 'page_view' AND created_at >= ?
       GROUP BY device ORDER BY sessions DESC`,
    )
      .bind(Date.now() - 30 * 86400000)
      .all<Record<string, number | string>>(),
    env.DB.prepare(
      `SELECT product_slug, COALESCE(SUM(quantity), 0) AS units
       FROM order_items GROUP BY product_slug`,
    ).all<Record<string, number | string>>(),
  ]);
  const [customerCount, returnMetrics] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS count FROM customer_profiles").first<{
      count: number;
    }>(),
    env.DB.prepare(
      "SELECT COUNT(*) AS count, COALESCE(SUM(amount_paise), 0) AS amount_paise FROM order_returns WHERE status != 'rejected'",
    ).first<{ count: number; amount_paise: number }>(),
  ]);

  return Response.json(
    {
      metrics: {
        salesPaise: Number(metrics?.sales_paise ?? 0),
        orders: Number(metrics?.orders ?? 0),
        customers: Number(customerCount?.count ?? 0),
        returns: Number(returnMetrics?.count ?? 0),
        returnPaise: Number(returnMetrics?.amount_paise ?? 0),
        cancelledPaise: Number(metrics?.cancelled_paise ?? 0),
        catalogueProducts: products.length + customProducts.length,
      },
      daily: dailyResult.results,
      customProducts: customProducts.map((product) => ({
        ...product,
        variants: variants.filter(
          (variant) => variant.productSlug === product.slug,
        ),
      })),
      customCategories,
      orders: orders.map((order) => ({
        ...order,
        shipment:
          shipments.find((shipment) => shipment.orderId === order.id) ?? null,
      })),
      returns,
      insights: {
        rangeDays: 30,
        topPages: topPagesResult.results,
        topProducts: topProductsResult.results.map((row) => ({
          ...row,
          units:
            productSalesResult.results.find(
              (sale) => sale.product_slug === row.product_slug,
            )?.units ?? 0,
        })),
        topSearches: topSearchesResult.results,
        funnel: {
          pageViews: Number(funnelResult?.page_views ?? 0),
          sessions: Number(funnelResult?.sessions ?? 0),
          productViews: Number(funnelResult?.product_views ?? 0),
          addToCarts: Number(funnelResult?.add_to_carts ?? 0),
          checkouts: Number(funnelResult?.checkouts ?? 0),
        },
        performance: {
          lcpMs: Number(performanceResult?.lcp_ms ?? 0),
          ttfbMs: Number(performanceResult?.ttfb_ms ?? 0),
          cls: Number(performanceResult?.cls_milli ?? 0) / 1000,
        },
        devices: devicesResult.results,
        seo: {
          indexablePages: 1 + categoriesCount() + products.length + customProducts.length,
          productsWithDescriptions:
            products.filter((product) => Boolean(product.description)).length +
            customProducts.filter((product) => Boolean(product.description)).length,
          productsWithImages:
            products.filter((product) => Boolean(product.image)).length +
            customProducts.filter((product) => Boolean(product.image)).length,
          productCount: products.length + customProducts.length,
        },
      },
      integrations: {
        ...(await getShippingConfiguration()),
        ...(await getMarketingConfiguration()),
      },
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}

function categoriesCount() {
  return new Set(products.map((product) => product.categorySlug)).size;
}
