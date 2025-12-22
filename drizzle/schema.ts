import { integer, pgTable, text, timestamp, varchar, numeric, serial } from "drizzle-orm/pg-core";

/**
 * Note: Using text with check constraints instead of pgEnum
 * to match the existing Supabase database structure
 */

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openid", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginmethod", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user").notNull(), // "user" | "admin"
  createdAt: timestamp("createdat").defaultNow().notNull(),
  updatedAt: timestamp("updatedat").defaultNow().notNull(),
  lastSignedIn: timestamp("lastsignedin").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Meal items - the different dishes that can be produced
 */
export const mealItems = pgTable("meal_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // "chicken" | "beef" | "oats" | "dessert" | "salad"
  proteinType: text("protein_type"), // "chicken" | "beef" | "none"
  requiresProtein: integer("requires_protein").default(0).notNull(), // boolean: 1 = yes, 0 = no
  chickenOz: numeric("chicken_oz", { precision: 5, scale: 2 }).default("0.00"),
  beefOz: text("beef_oz"), // Note: In DB this is text, should be numeric but keeping as-is for now
  pastaGrams: integer("pasta_grams"), // Note: In DB this is bigint, should be numeric but keeping as-is
  riceCups: numeric("rice_cups", { precision: 5, scale: 2 }),
  potatoOz: text("potato_oz"), // Note: In DB this is text, should be numeric but keeping as-is
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type MealItem = typeof mealItems.$inferSelect;
export type InsertMealItem = typeof mealItems.$inferInsert;

/**
 * Task templates - the different types of tasks in the workflow
 */
export const taskTemplates = pgTable("task_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  taskType: varchar("task_type", { length: 50 }).notNull(), // Check constraint in DB
  defaultDurationMinutes: integer("default_duration_minutes").notNull(),
  canRunInParallel: integer("can_run_in_parallel").default(1).notNull(), // boolean
  requiresEquipment: varchar("requires_equipment", { length: 255 }), // e.g., "blast_chiller", "oven"
  // Time formula fields: baseTime + (ingredientMultiplier × ingredient_quantity)
  useFormula: integer("use_formula").default(0).notNull(), // boolean: 1 = use formula, 0 = use default time
  baseTimeMinutes: numeric("base_time_minutes", { precision: 8, scale: 2 }).default("0.00"),
  ingredientMultiplier: numeric("ingredient_multiplier", { precision: 8, scale: 4 }).default("0.0000"), // minutes per unit
  ingredientType: varchar("ingredient_type", { length: 50 }).default("none"), // Check constraint in DB
  createdAt: timestamp("createdat").defaultNow().notNull(),
});

export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type InsertTaskTemplate = typeof taskTemplates.$inferInsert;

/**
 * Production scenarios - saved production plans
 */
export const productionScenarios = pgTable("production_scenarios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  totalEstimatedMinutes: integer("total_estimated_minutes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ProductionScenario = typeof productionScenarios.$inferSelect;
export type InsertProductionScenario = typeof productionScenarios.$inferInsert;

/**
 * Scenario items - quantities for each meal in a scenario
 */
export const scenarioItems = pgTable("scenario_items", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").notNull(),
  mealItemId: integer("meal_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScenarioItem = typeof scenarioItems.$inferSelect;
export type InsertScenarioItem = typeof scenarioItems.$inferInsert;

/**
 * Task time estimates - user-configurable time estimates for tasks
 */
export const taskTimeEstimates = pgTable("task_time_estimates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  taskTemplateId: integer("task_template_id").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TaskTimeEstimate = typeof taskTimeEstimates.$inferSelect;
export type InsertTaskTimeEstimate = typeof taskTimeEstimates.$inferInsert;

/**
 * Equipment constraints - configurable equipment limitations
 */
export const equipmentConstraints = pgTable("equipment_constraints", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  equipmentName: varchar("equipment_name", { length: 255 }).notNull(),
  capacity: integer("capacity").notNull(), // e.g., 5 for blast chiller trays
  unit: varchar("unit", { length: 50 }).notNull(), // e.g., "trays", "ovens"
  mealCapacity: integer("meal_capacity"), // max meals this equipment can handle (e.g., oven holds 50 meals)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type EquipmentConstraint = typeof equipmentConstraints.$inferSelect;
export type InsertEquipmentConstraint = typeof equipmentConstraints.$inferInsert;

/**
 * Production logs - actual production run data for tracking and insights
 */
export const productionLogs = pgTable("production_logs", {
  id: serial("id").primaryKey(),
  runNumber: integer("run_number").notNull(), // unique sequential run identifier
  userId: integer("user_id").notNull(),
  scenarioId: integer("scenario_id"), // optional reference to saved scenario
  productionDate: timestamp("production_date").defaultNow().notNull(),
  startTime: timestamp("start_time"), // actual start time
  endTime: timestamp("end_time"), // actual end time
  totalActualMinutes: integer("total_actual_minutes"),
  totalEstimatedMinutes: integer("total_estimated_minutes"),
  totalWallClockMinutes: integer("total_wall_clock_minutes"), // actual wall-clock time from start to finish
  notes: text("notes"),
  createdAt: timestamp("createdat").defaultNow().notNull(),
});

export type ProductionLog = typeof productionLogs.$inferSelect;
export type InsertProductionLog = typeof productionLogs.$inferInsert;

/**
 * Production log tasks - actual time for each task in a production run
 */
export const productionLogTasks = pgTable("production_log_tasks", {
  id: serial("id").primaryKey(),
  productionLogId: integer("production_log_id").notNull(),
  taskType: varchar("task_type", { length: 255 }).notNull(),
  taskName: varchar("task_name", { length: 255 }).notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull(),
  actualMinutes: integer("actual_minutes"),
  notes: text("notes"),
  createdAt: timestamp("createdat").defaultNow().notNull(),
});

export type ProductionLogTask = typeof productionLogTasks.$inferSelect;
export type InsertProductionLogTask = typeof productionLogTasks.$inferInsert;

/**
 * Inventory items - ingredients tracked in stock
 */
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // "protein" | "grain" | "vegetable" | "sauce" | "other"
  unit: varchar("unit", { length: 50 }).notNull(), // e.g., "lbs", "oz", "cups", "grams"
  currentQuantity: numeric("current_quantity", { precision: 10, scale: 2 }).default("0.00").notNull(),
  minThreshold: numeric("min_threshold", { precision: 10, scale: 2 }).default("0.00").notNull(), // alert when below this
  createdAt: timestamp("createdat").defaultNow().notNull(),
  updatedAt: timestamp("updatedat").defaultNow().notNull(),
});

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;

/**
 * Inventory counts - history of inventory counts
 */
export const inventoryCounts = pgTable("inventory_counts", {
  id: serial("id").primaryKey(),
  inventoryItemId: integer("inventory_item_id").notNull(),
  countedQuantity: numeric("counted_quantity", { precision: 10, scale: 2 }).notNull(),
  previousQuantity: numeric("previous_quantity", { precision: 10, scale: 2 }).notNull(),
  countedBy: varchar("counted_by", { length: 255 }).notNull(), // user name
  notes: text("notes"),
  countedAt: timestamp("counted_at").defaultNow().notNull(),
});

export type InventoryCount = typeof inventoryCounts.$inferSelect;
export type InsertInventoryCount = typeof inventoryCounts.$inferInsert;
