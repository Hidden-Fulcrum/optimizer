ALTER TABLE `meal_items` ADD `chicken_oz` decimal(5,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `meal_items` ADD `beef_oz` decimal(5,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `meal_items` ADD `pasta_grams` decimal(5,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `meal_items` ADD `potato_oz` decimal(5,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `meal_items` DROP COLUMN `chicken_lbs`;--> statement-breakpoint
ALTER TABLE `meal_items` DROP COLUMN `beef_lbs`;