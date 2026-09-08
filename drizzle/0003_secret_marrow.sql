CREATE TABLE `campaign_deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`channel` text NOT NULL,
	`status` text NOT NULL,
	`provider_message_id` text,
	`error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_campaign_deliveries_campaign_user` ON `campaign_deliveries` (`campaign_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_campaign_deliveries_status_created` ON `campaign_deliveries` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `marketing_campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`channel` text NOT NULL,
	`subject` text,
	`message` text NOT NULL,
	`template_name` text,
	`template_language` text DEFAULT 'en_US',
	`status` text DEFAULT 'draft' NOT NULL,
	`audience_count` integer DEFAULT 0 NOT NULL,
	`sent_count` integer DEFAULT 0 NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_marketing_campaigns_status_created` ON `marketing_campaigns` (`status`,`created_at`);--> statement-breakpoint
ALTER TABLE `activity_events` ADD `session_id` text;--> statement-breakpoint
ALTER TABLE `activity_events` ADD `user_id` text;--> statement-breakpoint
ALTER TABLE `activity_events` ADD `search_term` text;--> statement-breakpoint
ALTER TABLE `activity_events` ADD `result_count` integer;--> statement-breakpoint
ALTER TABLE `activity_events` ADD `referrer` text;--> statement-breakpoint
ALTER TABLE `activity_events` ADD `metadata` text;--> statement-breakpoint
ALTER TABLE `activity_events` ADD `duration_ms` integer;--> statement-breakpoint
ALTER TABLE `activity_events` ADD `device` text;--> statement-breakpoint
CREATE INDEX `idx_activity_event_created` ON `activity_events` (`event`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_activity_product_event_created` ON `activity_events` (`product_slug`,`event`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_activity_path_created` ON `activity_events` (`path`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_activity_search_created` ON `activity_events` (`search_term`,`created_at`);--> statement-breakpoint
ALTER TABLE `customer_profiles` ADD `whatsapp_marketing_opt_in` integer DEFAULT false NOT NULL;--> statement-breakpoint
PRAGMA optimize;
