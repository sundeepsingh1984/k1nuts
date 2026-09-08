CREATE TABLE `business_tax_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`legal_name` text NOT NULL,
	`trade_name` text DEFAULT 'K1 Nuts' NOT NULL,
	`gstin` text NOT NULL,
	`pan` text,
	`address_line_1` text NOT NULL,
	`address_line_2` text,
	`city` text NOT NULL,
	`state_name` text NOT NULL,
	`state_code` text NOT NULL,
	`postal_code` text NOT NULL,
	`invoice_prefix` text DEFAULT 'K1' NOT NULL,
	`invoice_financial_year` text,
	`next_invoice_sequence` integer DEFAULT 1 NOT NULL,
	`e_invoice_applicable` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_tax_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_slug` text NOT NULL,
	`hsn_code` text NOT NULL,
	`gst_rate_bps` integer NOT NULL,
	`cess_rate_bps` integer DEFAULT 0 NOT NULL,
	`unit_code` text DEFAULT 'NOS' NOT NULL,
	`classification_note` text,
	`verified_at` integer,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_product_tax_profiles_slug` ON `product_tax_profiles` (`product_slug`);--> statement-breakpoint
CREATE INDEX `idx_product_tax_profiles_hsn_rate` ON `product_tax_profiles` (`hsn_code`,`gst_rate_bps`);--> statement-breakpoint
CREATE TABLE `tax_invoice_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`product_slug` text NOT NULL,
	`description` text NOT NULL,
	`hsn_code` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_code` text NOT NULL,
	`gross_value_paise` integer NOT NULL,
	`taxable_value_paise` integer NOT NULL,
	`gst_rate_bps` integer NOT NULL,
	`cess_rate_bps` integer DEFAULT 0 NOT NULL,
	`cgst_paise` integer DEFAULT 0 NOT NULL,
	`sgst_paise` integer DEFAULT 0 NOT NULL,
	`igst_paise` integer DEFAULT 0 NOT NULL,
	`cess_paise` integer DEFAULT 0 NOT NULL,
	`total_paise` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_tax_invoice_lines_invoice` ON `tax_invoice_lines` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `idx_tax_invoice_lines_hsn_rate` ON `tax_invoice_lines` (`hsn_code`,`gst_rate_bps`);--> statement-breakpoint
CREATE TABLE `tax_invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`invoice_number` text NOT NULL,
	`financial_year` text NOT NULL,
	`sequence_number` integer NOT NULL,
	`invoice_date` integer NOT NULL,
	`supply_type` text NOT NULL,
	`reverse_charge` integer DEFAULT false NOT NULL,
	`seller_legal_name` text NOT NULL,
	`seller_trade_name` text NOT NULL,
	`seller_gstin` text NOT NULL,
	`seller_address` text NOT NULL,
	`seller_state_name` text NOT NULL,
	`seller_state_code` text NOT NULL,
	`seller_postal_code` text NOT NULL,
	`buyer_legal_name` text NOT NULL,
	`buyer_gstin` text,
	`buyer_address` text NOT NULL,
	`place_of_supply_name` text NOT NULL,
	`place_of_supply_code` text NOT NULL,
	`taxable_value_paise` integer NOT NULL,
	`cgst_paise` integer DEFAULT 0 NOT NULL,
	`sgst_paise` integer DEFAULT 0 NOT NULL,
	`igst_paise` integer DEFAULT 0 NOT NULL,
	`cess_paise` integer DEFAULT 0 NOT NULL,
	`total_paise` integer NOT NULL,
	`status` text DEFAULT 'issued' NOT NULL,
	`irn` text,
	`acknowledgement_number` text,
	`signed_qr_code` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tax_invoices_order` ON `tax_invoices` (`order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tax_invoices_number` ON `tax_invoices` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `idx_tax_invoices_date_status` ON `tax_invoices` (`invoice_date`,`status`);--> statement-breakpoint
CREATE INDEX `idx_tax_invoices_user_date` ON `tax_invoices` (`user_id`,`invoice_date`);--> statement-breakpoint
ALTER TABLE `customer_profiles` ADD `billing_legal_name` text;--> statement-breakpoint
ALTER TABLE `customer_profiles` ADD `billing_gstin` text;--> statement-breakpoint
PRAGMA optimize;
