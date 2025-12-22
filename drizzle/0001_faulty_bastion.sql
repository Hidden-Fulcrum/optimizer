CREATE TABLE `equipment_constraints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`equipment_name` varchar(255) NOT NULL,
	`capacity` int NOT NULL,
	`unit` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipment_constraints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('chicken','beef','oats','dessert','salad') NOT NULL,
	`protein_type` enum('chicken','beef','none'),
	`requires_protein` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meal_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `production_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`total_estimated_minutes` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `production_scenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenario_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenario_id` int NOT NULL,
	`meal_item_id` int NOT NULL,
	`quantity` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scenario_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `task_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`task_type` enum('grind_protein','cook_protein','blast_chill','cook_rice_pasta','make_sauces','assemble_meals','package_label','bake_desserts') NOT NULL,
	`default_duration_minutes` int NOT NULL,
	`can_run_in_parallel` int NOT NULL DEFAULT 1,
	`requires_equipment` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `task_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `task_time_estimates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`task_template_id` int NOT NULL,
	`duration_minutes` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `task_time_estimates_id` PRIMARY KEY(`id`)
);
