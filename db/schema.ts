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
  sessionId: text("session_id"),
  userId: text("user_id"),
  searchTerm: text("search_term"),
  resultCount: integer("result_count"),
  referrer: text("referrer"),
  metadata: text("metadata"),
  durationMs: integer("duration_ms"),
  device: text("device"),
  createdAt: integer("created_at").notNull(),
}, (table) => [
  index("idx_activity_event_created").on(table.event, table.createdAt),
  index("idx_activity_product_event_created").on(
    table.productSlug,
    table.event,
    table.createdAt,
  ),
  index("idx_activity_path_created").on(table.path, table.createdAt),
  index("idx_activity_search_created").on(table.searchTerm, table.createdAt),
]);

export const customerProfiles = sqliteTable(
  "customer_profiles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    phone: text("phone"),
    billingLegalName: text("billing_legal_name"),
    billingGstin: text("billing_gstin"),
    marketingOptIn: integer("marketing_opt_in", { mode: "boolean" })
      .notNull()
      .default(false),
    whatsappMarketingOptIn: integer("whatsapp_marketing_opt_in", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [uniqueIndex("idx_customer_profiles_user_id").on(table.userId)],
);

export const businessTaxSettings = sqliteTable("business_tax_settings", {
  id: integer("id").primaryKey(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  legalName: text("legal_name").notNull(),
  tradeName: text("trade_name").notNull().default("K1 Nuts"),
  gstin: text("gstin").notNull(),
  pan: text("pan"),
  addressLine1: text("address_line_1").notNull(),
  addressLine2: text("address_line_2"),
  city: text("city").notNull(),
  stateName: text("state_name").notNull(),
  stateCode: text("state_code").notNull(),
  postalCode: text("postal_code").notNull(),
  invoicePrefix: text("invoice_prefix").notNull().default("K1"),
  invoiceFinancialYear: text("invoice_financial_year"),
  nextInvoiceSequence: integer("next_invoice_sequence").notNull().default(1),
  eInvoiceApplicable: integer("e_invoice_applicable", { mode: "boolean" })
    .notNull()
    .default(false),
  updatedAt: integer("updated_at").notNull(),
});

export const productTaxProfiles = sqliteTable(
  "product_tax_profiles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productSlug: text("product_slug").notNull(),
    hsnCode: text("hsn_code").notNull(),
    gstRateBps: integer("gst_rate_bps").notNull(),
    cessRateBps: integer("cess_rate_bps").notNull().default(0),
    unitCode: text("unit_code").notNull().default("NOS"),
    classificationNote: text("classification_note"),
    verifiedAt: integer("verified_at"),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_product_tax_profiles_slug").on(table.productSlug),
    index("idx_product_tax_profiles_hsn_rate").on(
      table.hsnCode,
      table.gstRateBps,
    ),
  ],
);

export const taxInvoices = sqliteTable(
  "tax_invoices",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id").notNull(),
    userId: text("user_id").notNull(),
    invoiceNumber: text("invoice_number").notNull(),
    financialYear: text("financial_year").notNull(),
    sequenceNumber: integer("sequence_number").notNull(),
    invoiceDate: integer("invoice_date").notNull(),
    supplyType: text("supply_type").notNull(),
    reverseCharge: integer("reverse_charge", { mode: "boolean" })
      .notNull()
      .default(false),
    sellerLegalName: text("seller_legal_name").notNull(),
    sellerTradeName: text("seller_trade_name").notNull(),
    sellerGstin: text("seller_gstin").notNull(),
    sellerAddress: text("seller_address").notNull(),
    sellerStateName: text("seller_state_name").notNull(),
    sellerStateCode: text("seller_state_code").notNull(),
    sellerPostalCode: text("seller_postal_code").notNull(),
    buyerLegalName: text("buyer_legal_name").notNull(),
    buyerGstin: text("buyer_gstin"),
    buyerAddress: text("buyer_address").notNull(),
    placeOfSupplyName: text("place_of_supply_name").notNull(),
    placeOfSupplyCode: text("place_of_supply_code").notNull(),
    taxableValuePaise: integer("taxable_value_paise").notNull(),
    cgstPaise: integer("cgst_paise").notNull().default(0),
    sgstPaise: integer("sgst_paise").notNull().default(0),
    igstPaise: integer("igst_paise").notNull().default(0),
    cessPaise: integer("cess_paise").notNull().default(0),
    totalPaise: integer("total_paise").notNull(),
    status: text("status").notNull().default("issued"),
    irn: text("irn"),
    acknowledgementNumber: text("acknowledgement_number"),
    signedQrCode: text("signed_qr_code"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_tax_invoices_order").on(table.orderId),
    uniqueIndex("idx_tax_invoices_number").on(table.invoiceNumber),
    index("idx_tax_invoices_date_status").on(table.invoiceDate, table.status),
    index("idx_tax_invoices_user_date").on(table.userId, table.invoiceDate),
  ],
);

export const taxInvoiceLines = sqliteTable(
  "tax_invoice_lines",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    invoiceId: integer("invoice_id").notNull(),
    productSlug: text("product_slug").notNull(),
    description: text("description").notNull(),
    hsnCode: text("hsn_code").notNull(),
    quantity: integer("quantity").notNull(),
    unitCode: text("unit_code").notNull(),
    grossValuePaise: integer("gross_value_paise").notNull(),
    taxableValuePaise: integer("taxable_value_paise").notNull(),
    gstRateBps: integer("gst_rate_bps").notNull(),
    cessRateBps: integer("cess_rate_bps").notNull().default(0),
    cgstPaise: integer("cgst_paise").notNull().default(0),
    sgstPaise: integer("sgst_paise").notNull().default(0),
    igstPaise: integer("igst_paise").notNull().default(0),
    cessPaise: integer("cess_paise").notNull().default(0),
    totalPaise: integer("total_paise").notNull(),
  },
  (table) => [
    index("idx_tax_invoice_lines_invoice").on(table.invoiceId),
    index("idx_tax_invoice_lines_hsn_rate").on(
      table.hsnCode,
      table.gstRateBps,
    ),
  ],
);

export const marketingCampaigns = sqliteTable(
  "marketing_campaigns",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    channel: text("channel").notNull(),
    subject: text("subject"),
    message: text("message").notNull(),
    templateName: text("template_name"),
    templateLanguage: text("template_language").default("en_US"),
    status: text("status").notNull().default("draft"),
    audienceCount: integer("audience_count").notNull().default(0),
    sentCount: integer("sent_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    createdBy: text("created_by").notNull(),
    startedAt: integer("started_at"),
    completedAt: integer("completed_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("idx_marketing_campaigns_status_created").on(
      table.status,
      table.createdAt,
    ),
  ],
);

export const campaignDeliveries = sqliteTable(
  "campaign_deliveries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    campaignId: integer("campaign_id").notNull(),
    userId: text("user_id").notNull(),
    channel: text("channel").notNull(),
    status: text("status").notNull(),
    providerMessageId: text("provider_message_id"),
    error: text("error"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_campaign_deliveries_campaign_user").on(
      table.campaignId,
      table.userId,
    ),
    index("idx_campaign_deliveries_status_created").on(
      table.status,
      table.createdAt,
    ),
  ],
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
