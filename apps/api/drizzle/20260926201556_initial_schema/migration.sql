CREATE TABLE `products` (
	`id` text PRIMARY KEY,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`price_cents` integer NOT NULL,
	`stock_quantity` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "products_price_check" CHECK("price_cents" >= 0),
	CONSTRAINT "products_stock_check" CHECK("stock_quantity" >= 0),
	CONSTRAINT "products_category_check" CHECK("category" in ('accessories', 'audio', 'keyboards', 'monitors', 'workspace')),
	CONSTRAINT "products_status_check" CHECK("status" in ('active', 'inactive'))
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`email` text NOT NULL,
	`full_name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "users_role_check" CHECK("role" in ('admin', 'viewer')),
	CONSTRAINT "users_status_check" CHECK("status" in ('active', 'inactive'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `products_name_index` ON `products` (`name`);--> statement-breakpoint
CREATE INDEX `products_category_index` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `products_status_index` ON `products` (`status`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_index` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);