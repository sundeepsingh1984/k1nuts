CREATE TABLE `customer_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`password_hash` text,
	`email_verified` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_customer_accounts_user_id` ON `customer_accounts` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_customer_accounts_email` ON `customer_accounts` (`email`);--> statement-breakpoint
CREATE TABLE `customer_oauth_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text NOT NULL,
	`provider_subject` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_customer_oauth_provider_subject` ON `customer_oauth_accounts` (`provider`,`provider_subject`);--> statement-breakpoint
CREATE INDEX `idx_customer_oauth_user` ON `customer_oauth_accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `customer_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_hash` text NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_customer_sessions_token` ON `customer_sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_customer_sessions_user_expiry` ON `customer_sessions` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE TABLE `email_otp_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`code_hash` text NOT NULL,
	`purpose` text NOT NULL,
	`expires_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`consumed_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_email_otp_email_purpose_created` ON `email_otp_codes` (`email`,`purpose`,`created_at`);--> statement-breakpoint
CREATE TABLE `store_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`kicker` text NOT NULL,
	`description` text NOT NULL,
	`emoji` text DEFAULT '✦' NOT NULL,
	`tone` text DEFAULT '#356055' NOT NULL,
	`image` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 100 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_store_categories_slug` ON `store_categories` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_store_categories_active_order` ON `store_categories` (`active`,`sort_order`);--> statement-breakpoint
PRAGMA optimize;
