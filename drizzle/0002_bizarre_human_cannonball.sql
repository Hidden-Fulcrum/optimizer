CREATE TABLE `production_log_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`production_log_id` int NOT NULL,
	`task_type` varchar(255) NOT NULL,
	`task_name` varchar(255) NOT NULL,
	`estimated_minutes` int NOT NULL,
	`actual_minutes` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `production_log_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `production_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`scenario_id` int,
	`production_date` timestamp NOT NULL DEFAULT (now()),
	`total_actual_minutes` int,
	`total_estimated_minutes` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `production_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `task_templates` MODIFY COLUMN `task_type` enum('grind_protein','cook_protein','blast_chill','cook_rice_pasta','make_sauces','oatmeal_prep','assemble_meals','package_label','bake_desserts') NOT NULL;