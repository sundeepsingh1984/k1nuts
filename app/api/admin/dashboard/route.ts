import { desc } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { getDb } from "../../../../db";
import {
  adminProducts,
  customerOrders,
  orderReturns,
  orderShipments,
  productVariants,
} from "../../../../db/schema";
import { products } from "../../../store-data";
import { getShippingConfiguration } from "../../../shipping";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getChatGPTUser();
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
    variants,
    orders,
    returns,
    shipments,
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
      orders: orders.map((order) => ({
        ...order,
        shipment:
          shipments.find((shipment) => shipment.orderId === order.id) ?? null,
      })),
      returns,
      integrations: getShippingConfiguration(),
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}
