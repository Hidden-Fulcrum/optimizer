/**
 * DEPRECATED: This file is for MySQL seeding.
 * Since we're using Supabase (PostgreSQL), use Supabase migrations instead.
 * 
 * To seed data, use Supabase migrations or the Supabase SQL editor.
 * See: drizzle/migrations/ for migration files
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { pgTable, serial, varchar, text, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is not set!");
  process.exit(1);
}

// Note: This uses the PostgreSQL schema. For Supabase, prefer using migrations.
const mealItems = pgTable("meal_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: text("category").notNull(),
  proteinType: text("protein_type"),
  requiresProtein: integer("requires_protein").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

const taskTemplates = pgTable("task_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  taskType: text("task_type").notNull(),
  defaultDurationMinutes: integer("default_duration_minutes").notNull(),
  canRunInParallel: integer("can_run_in_parallel").default(1).notNull(),
  requiresEquipment: varchar("requires_equipment", { length: 255 }),
  createdAt: timestamp("createdat").defaultNow().notNull(),
});

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

console.log("Seeding database...");

// Check if meal items already exist
const existingMeals = await db.select().from(mealItems);
if (existingMeals.length > 0) {
  console.log(`Found ${existingMeals.length} existing meal items. Skipping meal items seed.`);
} else {
  const mealItemsData = [
    { name: "Chicken Alfredo", category: "chicken", proteinType: "chicken", requiresProtein: 1 },
    { name: "Chicken Parmesan", category: "chicken", proteinType: "chicken", requiresProtein: 1 },
    { name: "Chicken Taco", category: "chicken", proteinType: "chicken", requiresProtein: 1 },
    { name: "Birria Beef", category: "beef", proteinType: "beef", requiresProtein: 1 },
    { name: "Bacon Burger Bowl", category: "beef", proteinType: "beef", requiresProtein: 1 },
    { name: "Oats Bowl", category: "oats", proteinType: "none", requiresProtein: 0 },
    { name: "Brownies", category: "dessert", proteinType: "none", requiresProtein: 0 },
    { name: "Rice Krispy Treats", category: "dessert", proteinType: "none", requiresProtein: 0 },
  ];

  for (const item of mealItemsData) {
    await db.insert(mealItems).values(item);
    console.log("Added: " + item.name);
  }
}

// Check if task templates already exist
const existingTasks = await db.select().from(taskTemplates);
if (existingTasks.length > 0) {
  console.log(`Found ${existingTasks.length} existing task templates. Skipping task templates seed.`);
} else {
  const taskTemplatesData = [
    { name: "Grind Protein", taskType: "grind_protein", defaultDurationMinutes: 15, canRunInParallel: 0, requiresEquipment: "grinder" },
    { name: "Cook Protein", taskType: "cook_protein", defaultDurationMinutes: 30, canRunInParallel: 0, requiresEquipment: "oven" },
    { name: "Blast Chill", taskType: "blast_chill", defaultDurationMinutes: 20, canRunInParallel: 0, requiresEquipment: "blast_chiller" },
    { name: "Cook Rice/Pasta", taskType: "cook_rice_pasta", defaultDurationMinutes: 25, canRunInParallel: 1, requiresEquipment: "stove" },
    { name: "Make Sauces/Sides", taskType: "make_sauces", defaultDurationMinutes: 20, canRunInParallel: 1, requiresEquipment: null },
    { name: "Assemble Meals", taskType: "assemble_meals", defaultDurationMinutes: 40, canRunInParallel: 0, requiresEquipment: null },
    { name: "Package & Label", taskType: "package_label", defaultDurationMinutes: 15, canRunInParallel: 0, requiresEquipment: null },
    { name: "Bake Desserts", taskType: "bake_desserts", defaultDurationMinutes: 35, canRunInParallel: 1, requiresEquipment: "oven" },
  ];

  for (const template of taskTemplatesData) {
    await db.insert(taskTemplates).values(template);
    console.log("Added: " + template.name);
  }
}

console.log("Database seeded successfully!");
await client.end();
