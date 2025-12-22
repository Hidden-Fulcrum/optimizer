import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { 
  InsertUser, 
  users,
  mealItems,
  taskTemplates,
  productionScenarios,
  scenarioItems,
  taskTimeEstimates,
  equipmentConstraints,
  productionLogs,
  productionLogTasks,
  inventoryItems,
  inventoryCounts,
  InsertMealItem,
  InsertTaskTemplate,
  InsertProductionScenario,
  InsertScenarioItem,
  InsertTaskTimeEstimate,
  InsertEquipmentConstraint,
  InsertProductionLog,
  InsertProductionLogTask,
  InsertInventoryItem,
  InsertInventoryCount
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Meal Items
export async function getAllMealItems() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(mealItems);
}

export async function createMealItem(item: InsertMealItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(mealItems).values(item);
  return result;
}

export async function updateMealItemIngredients(id: number, ingredients: { chickenOz?: string, beefOz?: string, pastaGrams?: string, riceCups?: string, potatoOz?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(mealItems)
    .set(ingredients)
    .where(eq(mealItems.id, id));
  return result;
}

// Task Templates
export async function getAllTaskTemplates() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(taskTemplates);
}

export async function createTaskTemplate(template: InsertTaskTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(taskTemplates).values(template);
  return result;
}

export async function updateTaskTemplateFormula(id: number, data: { useFormula: number, baseTimeMinutes: string, ingredientMultiplier: string, ingredientType: "chicken_oz" | "beef_oz" | "pasta_grams" | "rice_cups" | "potato_oz" | "none" }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(taskTemplates)
    .set(data)
    .where(eq(taskTemplates.id, id));
  return result;
}

// Production Scenarios
export async function getUserScenarios(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(productionScenarios).where(eq(productionScenarios.userId, userId));
}

export async function getScenarioById(scenarioId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(productionScenarios).where(eq(productionScenarios.id, scenarioId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createScenario(scenario: InsertProductionScenario) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(productionScenarios).values(scenario);
  return result;
}

export async function updateScenario(scenarioId: number, updates: Partial<InsertProductionScenario>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(productionScenarios).set(updates).where(eq(productionScenarios.id, scenarioId));
}

export async function deleteScenario(scenarioId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete scenario items first
  await db.delete(scenarioItems).where(eq(scenarioItems.scenarioId, scenarioId));
  // Then delete scenario
  await db.delete(productionScenarios).where(eq(productionScenarios.id, scenarioId));
}

// Scenario Items
export async function getScenarioItems(scenarioId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(scenarioItems).where(eq(scenarioItems.scenarioId, scenarioId));
}

export async function createScenarioItem(item: InsertScenarioItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(scenarioItems).values(item);
  return result;
}

export async function deleteScenarioItems(scenarioId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(scenarioItems).where(eq(scenarioItems.scenarioId, scenarioId));
}

// Task Time Estimates
export async function getUserTaskEstimates(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(taskTimeEstimates).where(eq(taskTimeEstimates.userId, userId));
}

export async function upsertTaskEstimate(estimate: InsertTaskTimeEstimate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if estimate exists
  const existing = await db.select().from(taskTimeEstimates)
    .where(and(
      eq(taskTimeEstimates.userId, estimate.userId),
      eq(taskTimeEstimates.taskTemplateId, estimate.taskTemplateId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing
    await db.update(taskTimeEstimates)
      .set({ durationMinutes: estimate.durationMinutes, notes: estimate.notes })
      .where(eq(taskTimeEstimates.id, existing[0].id));
    return existing[0].id;
  } else {
    // Insert new
    const result = await db.insert(taskTimeEstimates).values(estimate);
    return result;
  }
}

// Equipment Constraints
export async function getUserEquipmentConstraints(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(equipmentConstraints).where(eq(equipmentConstraints.userId, userId));
}

export async function upsertEquipmentConstraint(constraint: InsertEquipmentConstraint) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if constraint exists
  const existing = await db.select().from(equipmentConstraints)
    .where(and(
      eq(equipmentConstraints.userId, constraint.userId),
      eq(equipmentConstraints.equipmentName, constraint.equipmentName)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing
    await db.update(equipmentConstraints)
      .set({ capacity: constraint.capacity, unit: constraint.unit })
      .where(eq(equipmentConstraints.id, existing[0].id));
    return existing[0].id;
  } else {
    // Insert new
    const result = await db.insert(equipmentConstraints).values(constraint);
    return result;
  }
}

export async function updateEquipmentConstraint(id: number, data: { equipmentName: string, capacity: number, unit: string, mealCapacity: number | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(equipmentConstraints)
    .set(data)
    .where(eq(equipmentConstraints.id, id));
  return result;
}

export async function createEquipmentConstraint(constraint: InsertEquipmentConstraint & { mealCapacity?: number | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(equipmentConstraints).values(constraint);
  return result;
}

// Production Logs
export async function createProductionLog(log: Omit<InsertProductionLog, 'runNumber'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get the next run number (max + 1, or 1 if no logs exist)
  const maxRunResult = await db.select({ maxRun: sql<number>`MAX(${productionLogs.runNumber})` })
    .from(productionLogs)
    .limit(1);
  const nextRunNumber = (maxRunResult[0]?.maxRun || 0) + 1;
  
  const result = await db.insert(productionLogs).values({
    ...log,
    runNumber: nextRunNumber,
  });
  return Number(result[0].insertId);
}

export async function getUserProductionLogs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(productionLogs)
    .where(eq(productionLogs.userId, userId))
    .orderBy(desc(productionLogs.productionDate));
}

export async function getProductionLogById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(productionLogs).where(eq(productionLogs.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateProductionLog(id: number, updates: Partial<InsertProductionLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(productionLogs).set(updates).where(eq(productionLogs.id, id));
}

export async function deleteProductionLog(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productionLogs).where(eq(productionLogs.id, id));
}

// Production Log Tasks
export async function createProductionLogTask(task: InsertProductionLogTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(productionLogTasks).values(task);
  return Number(result[0].insertId);
}

export async function getProductionLogTasks(productionLogId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(productionLogTasks)
    .where(eq(productionLogTasks.productionLogId, productionLogId));
}

export async function updateProductionLogTask(id: number, actualMinutes: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(productionLogTasks)
    .set({ actualMinutes, notes })
    .where(eq(productionLogTasks.id, id));
}

export async function deleteProductionLogTasks(productionLogId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productionLogTasks).where(eq(productionLogTasks.productionLogId, productionLogId));
}

// Inventory Items
export async function getAllInventoryItems() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(inventoryItems).orderBy(inventoryItems.name);
}

export async function getInventoryItemById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createInventoryItem(item: InsertInventoryItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(inventoryItems).values(item);
  return Number(result[0].insertId);
}

export async function updateInventoryItem(id: number, updates: Partial<InsertInventoryItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(inventoryItems).set(updates).where(eq(inventoryItems.id, id));
}

export async function deleteInventoryItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
}

// Inventory Counts
export async function createInventoryCount(count: InsertInventoryCount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(inventoryCounts).values(count);
  return Number(result[0].insertId);
}

export async function getInventoryCountHistory(inventoryItemId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(inventoryCounts)
    .where(eq(inventoryCounts.inventoryItemId, inventoryItemId))
    .orderBy(desc(inventoryCounts.countedAt));
}
