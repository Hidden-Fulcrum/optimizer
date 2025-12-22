import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { mysqlTable, int, varchar, mysqlEnum, timestamp } from "drizzle-orm/mysql-core";
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

console.log("Current meal items:");
const items = await db.select().from(mealItems);
items.forEach(item => {
  console.log(`ID ${item.id}: ${item.name} (${item.category})`);
});

await connection.end();
