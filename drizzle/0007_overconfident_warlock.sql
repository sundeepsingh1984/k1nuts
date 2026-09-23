CREATE TABLE `integration_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text NOT NULL,
	`config_encrypted` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`last_test_status` text,
	`last_test_message` text,
	`last_tested_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_integration_settings_provider` ON `integration_settings` (`provider`);
--> statement-breakpoint
PRAGMA optimize;
