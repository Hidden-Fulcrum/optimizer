import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { mysqlTable, int, varchar, mysqlEnum, timestamp } from "drizzle-orm/mysql-core";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const mealItems = mysqlTable("meal_items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["chicken", "beef", "oats", "dessert", "salad"]).notNull(),
  proteinType: mysqlEnum("protein_type", ["chicken", "beef", "none"]),
  requiresProtein: int("requires_protein").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log("Updating meal item names...");

await db.update(mealItems).set({ name: "Chicken Alfredo" }).where(eq(mealItems.id, 1));
console.log("Updated meal 1 to Chicken Alfredo");

await db.update(mealItems).set({ name: "Chicken Parmesan" }).where(eq(mealItems.id, 2));
console.log("Updated meal 2 to Chicken Parmesan");

await db.update(mealItems).set({ name: "Chicken Taco" }).where(eq(mealItems.id, 3));
console.log("Updated meal 3 to Chicken Taco");

await db.update(mealItems).set({ name: "Birria Beef" }).where(eq(mealItems.id, 4));
console.log("Updated meal 4 to Birria Beef");

await db.update(mealItems).set({ name: "Bacon Burger Bowl" }).where(eq(mealItems.id, 5));
console.log("Updated meal 5 to Bacon Burger Bowl");

console.log("Meal names updated successfully!");
await connection.end();
