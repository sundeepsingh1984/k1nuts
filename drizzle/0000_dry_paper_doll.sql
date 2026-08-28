CREATE TABLE `activity_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event` text NOT NULL,
	`path` text NOT NULL,
	`product_slug` text,
	`created_at` integer NOT NULL
);
