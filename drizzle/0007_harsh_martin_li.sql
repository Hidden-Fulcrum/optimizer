ALTER TABLE `equipment_constraints` ADD `meal_capacity` int;--> statement-breakpoint
ALTER TABLE `task_templates` ADD `use_formula` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `task_templates` ADD `base_time_minutes` decimal(8,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `task_templates` ADD `ingredient_multiplier` decimal(8,4) DEFAULT '0.0000';--> statement-breakpoint
ALTER TABLE `task_templates` ADD `ingredient_type` enum('chicken_oz','beef_oz','pasta_grams','rice_cups','potato_oz','none') DEFAULT 'none';