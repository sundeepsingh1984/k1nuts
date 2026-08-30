import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const activityEvents = sqliteTable("activity_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  event: text("event").notNull(),
  path: text("path").notNull(),
  productSlug: text("product_slug"),
  createdAt: integer("created_at").notNull(),
});

export const customerProfiles = sqliteTable(
  "customer_profiles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    phone: text("phone"),
    marketingOptIn: integer("marketing_opt_in", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [uniqueIndex("idx_customer_profiles_user_id").on(table.userId)],
);

export const customerAddresses = sqliteTable(
  "customer_addresses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    label: text("label").notNull(),
    recipientName: text("recipient_name").notNull(),
    phone: text("phone").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull().default("India"),
    isDefault: integer("is_default", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("idx_customer_addresses_user_id").on(table.userId)],
);

export const customerOrders = sqliteTable(
  "customer_orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderNumber: text("order_number").notNull(),
    userId: text("user_id").notNull(),
    status: text("status").notNull().default("confirmed"),
    paymentStatus: text("payment_status").notNull().default("pending"),
    totalPaise: integer("total_paise").notNull(),
    carrier: text("carrier"),
    trackingNumber: text("tracking_number"),
    trackingUrl: text("tracking_url"),
    placedAt: integer("placed_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_customer_orders_order_number").on(table.orderNumber),
    index("idx_customer_orders_user_placed").on(table.userId, table.placedAt),
    index("idx_customer_orders_open_status")
      .on(table.status)
      .where(sql`${table.status} NOT IN ('delivered', 'cancelled')`),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id").notNull(),
    productSlug: text("product_slug").notNull(),
    productName: text("product_name").notNull(),
    quantity: integer("quantity").notNull(),
    unitPricePaise: integer("unit_price_paise").notNull(),
  },
  (table) => [
    index("idx_order_items_order_id").on(table.orderId),
    index("idx_order_items_product_slug").on(table.productSlug),
  ],
);

export const productReviews = sqliteTable(
  "product_reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    userName: text("user_name").notNull(),
    productSlug: text("product_slug").notNull(),
    orderId: integer("order_id").notNull(),
    rating: integer("rating").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    verifiedPurchase: integer("verified_purchase", { mode: "boolean" })
      .notNull()
      .default(true),
    status: text("status").notNull().default("approved"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_product_reviews_user_product").on(
      table.userId,
      table.productSlug,
    ),
    index("idx_product_reviews_product_status_created").on(
      table.productSlug,
      table.status,
      table.createdAt,
    ),
  ],
);
