CREATE TABLE `customer_addresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`label` text NOT NULL,
	`recipient_name` text NOT NULL,
	`phone` text NOT NULL,
	`line1` text NOT NULL,
	`line2` text,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`postal_code` text NOT NULL,
	`country` text DEFAULT 'India' NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_customer_addresses_user_id` ON `customer_addresses` (`user_id`);--> statement-breakpoint
CREATE TABLE `customer_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_number` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`total_paise` integer NOT NULL,
	`carrier` text,
	`tracking_number` text,
	`tracking_url` text,
	`placed_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_customer_orders_order_number` ON `customer_orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `idx_customer_orders_user_placed` ON `customer_orders` (`user_id`,`placed_at`);--> statement-breakpoint
CREATE INDEX `idx_customer_orders_open_status` ON `customer_orders` (`status`) WHERE "customer_orders"."status" NOT IN ('delivered', 'cancelled');--> statement-breakpoint
CREATE TABLE `customer_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`phone` text,
	`marketing_opt_in` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_customer_profiles_user_id` ON `customer_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`product_slug` text NOT NULL,
	`product_name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_paise` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_order_items_order_id` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_order_items_product_slug` ON `order_items` (`product_slug`);--> statement-breakpoint
CREATE TABLE `product_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`user_name` text NOT NULL,
	`product_slug` text NOT NULL,
	`order_id` integer NOT NULL,
	`rating` integer NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`verified_purchase` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'approved' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_product_reviews_user_product` ON `product_reviews` (`user_id`,`product_slug`);--> statement-breakpoint
CREATE INDEX `idx_product_reviews_product_status_created` ON `product_reviews` (`product_slug`,`status`,`created_at`);
--> statement-breakpoint
PRAGMA optimize;
