CREATE TABLE `inventory_counts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inventory_item_id` int NOT NULL,
	`counted_quantity` decimal(10,2) NOT NULL,
	`previous_quantity` decimal(10,2) NOT NULL,
	`counted_by` varchar(255) NOT NULL,
	`notes` text,
	`counted_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_counts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('protein','grain','vegetable','sauce','other') NOT NULL,
	`unit` varchar(50) NOT NULL,
	`current_quantity` decimal(10,2) NOT NULL DEFAULT '0.00',
	`min_threshold` decimal(10,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_items_id` PRIMARY KEY(`id`)
);
