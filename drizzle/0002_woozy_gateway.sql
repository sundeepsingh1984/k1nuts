CREATE TABLE `admin_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`category_slug` text NOT NULL,
	`description` text NOT NULL,
	`short` text NOT NULL,
	`accent` text DEFAULT '#8a5a2b' NOT NULL,
	`image` text NOT NULL,
	`badge` text DEFAULT 'K1 SELECTED' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_admin_products_slug` ON `admin_products` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_admin_products_category_active` ON `admin_products` (`category_slug`,`active`);--> statement-breakpoint
CREATE TABLE `order_returns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`reason` text NOT NULL,
	`amount_paise` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_order_returns_order_id` ON `order_returns` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_order_returns_status_created` ON `order_returns` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `order_shipments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`provider` text NOT NULL,
	`external_order_id` text,
	`external_shipment_id` text,
	`carrier` text,
	`tracking_number` text,
	`status` text DEFAULT 'created' NOT NULL,
	`label_url` text,
	`tracking_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_order_shipments_order_provider` ON `order_shipments` (`order_id`,`provider`);--> statement-breakpoint
CREATE INDEX `idx_order_shipments_tracking` ON `order_shipments` (`tracking_number`);--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_slug` text NOT NULL,
	`label` text NOT NULL,
	`weight_grams` integer NOT NULL,
	`sku` text NOT NULL,
	`price_paise` integer NOT NULL,
	`mrp_paise` integer NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_product_variants_sku` ON `product_variants` (`sku`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_product_variants_product_label` ON `product_variants` (`product_slug`,`label`);--> statement-breakpoint
CREATE INDEX `idx_product_variants_product_active` ON `product_variants` (`product_slug`,`active`);--> statement-breakpoint
ALTER TABLE `customer_orders` ADD `shipping_address_id` integer;--> statement-breakpoint
ALTER TABLE `order_items` ADD `variant_label` text DEFAULT '250g' NOT NULL;--> statement-breakpoint
ALTER TABLE `order_items` ADD `sku` text;
--> statement-breakpoint
PRAGMA optimize;
