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
    shippingAddressId: integer("shipping_address_id"),
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
    variantLabel: text("variant_label").notNull().default("250g"),
    sku: text("sku"),
    quantity: integer("quantity").notNull(),
    unitPricePaise: integer("unit_price_paise").notNull(),
  },
  (table) => [
    index("idx_order_items_order_id").on(table.orderId),
    index("idx_order_items_product_slug").on(table.productSlug),
  ],
);

export const adminProducts = sqliteTable(
  "admin_products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    categorySlug: text("category_slug").notNull(),
    description: text("description").notNull(),
    short: text("short").notNull(),
    accent: text("accent").notNull().default("#8a5a2b"),
    image: text("image").notNull(),
    badge: text("badge").notNull().default("K1 SELECTED"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_admin_products_slug").on(table.slug),
    index("idx_admin_products_category_active").on(
      table.categorySlug,
      table.active,
    ),
  ],
);

export const productVariants = sqliteTable(
  "product_variants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productSlug: text("product_slug").notNull(),
    label: text("label").notNull(),
    weightGrams: integer("weight_grams").notNull(),
    sku: text("sku").notNull(),
    pricePaise: integer("price_paise").notNull(),
    mrpPaise: integer("mrp_paise").notNull(),
    stock: integer("stock").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_product_variants_sku").on(table.sku),
    uniqueIndex("idx_product_variants_product_label").on(
      table.productSlug,
      table.label,
    ),
    index("idx_product_variants_product_active").on(
      table.productSlug,
      table.active,
    ),
  ],
);

export const orderReturns = sqliteTable(
  "order_returns",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id").notNull(),
    status: text("status").notNull().default("requested"),
    reason: text("reason").notNull(),
    amountPaise: integer("amount_paise").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("idx_order_returns_order_id").on(table.orderId),
    index("idx_order_returns_status_created").on(table.status, table.createdAt),
  ],
);

export const orderShipments = sqliteTable(
  "order_shipments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id").notNull(),
    provider: text("provider").notNull(),
    externalOrderId: text("external_order_id"),
    externalShipmentId: text("external_shipment_id"),
    carrier: text("carrier"),
    trackingNumber: text("tracking_number"),
    status: text("status").notNull().default("created"),
    labelUrl: text("label_url"),
    trackingUrl: text("tracking_url"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_order_shipments_order_provider").on(
      table.orderId,
      table.provider,
    ),
    index("idx_order_shipments_tracking").on(table.trackingNumber),
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
