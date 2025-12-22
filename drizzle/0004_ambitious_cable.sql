ALTER TABLE `meal_items` ADD `chicken_lbs` decimal(5,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `meal_items` ADD `beef_lbs` decimal(5,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `meal_items` ADD `rice_cups` decimal(5,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `production_logs` ADD `start_time` timestamp;--> statement-breakpoint
ALTER TABLE `production_logs` ADD `end_time` timestamp;