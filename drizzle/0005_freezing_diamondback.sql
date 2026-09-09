CREATE TABLE `support_conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`visitor_token_hash` text NOT NULL,
	`user_id` text,
	`customer_name` text,
	`customer_email` text,
	`status` text DEFAULT 'open' NOT NULL,
	`last_message_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_support_conversations_token` ON `support_conversations` (`visitor_token_hash`);--> statement-breakpoint
CREATE INDEX `idx_support_conversations_status_recent` ON `support_conversations` (`status`,`last_message_at`);--> statement-breakpoint
CREATE TABLE `support_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversation_id` integer NOT NULL,
	`sender` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`read_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_support_messages_conversation_created` ON `support_messages` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_support_messages_sender_read` ON `support_messages` (`sender`,`read_at`);--> statement-breakpoint
PRAGMA optimize;
