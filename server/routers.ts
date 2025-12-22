import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { optimizeWorkflowV5 } from "./optimizer-v5";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Meal Items
  mealItems: router({
    list: publicProcedure.query(async () => {
      return await db.getAllMealItems();
    }),
    create: publicProcedure
      .input(z.object({
        name: z.string(),
        category: z.enum(["chicken", "beef", "oats", "dessert", "salad"]),
        proteinType: z.enum(["chicken", "beef", "none"]).nullable(),
        requiresProtein: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.createMealItem({
          name: input.name,
          category: input.category,
          proteinType: input.proteinType,
          requiresProtein: input.requiresProtein ? 1 : 0,
        });
        return { success: true };
      }),
    updateIngredients: publicProcedure
      .input(z.object({
        id: z.number(),
        chickenOz: z.number().optional(),
        beefOz: z.number().optional(),
        pastaGrams: z.number().optional(),
        riceCups: z.number().optional(),
        potatoOz: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...ingredients } = input;
        const updateData: Record<string, string> = {};
        if (ingredients.chickenOz !== undefined) updateData.chickenOz = ingredients.chickenOz.toString();
        if (ingredients.beefOz !== undefined) updateData.beefOz = ingredients.beefOz.toString();
        if (ingredients.pastaGrams !== undefined) updateData.pastaGrams = ingredients.pastaGrams.toString();
        if (ingredients.riceCups !== undefined) updateData.riceCups = ingredients.riceCups.toString();
        if (ingredients.potatoOz !== undefined) updateData.potatoOz = ingredients.potatoOz.toString();
        await db.updateMealItemIngredients(id, updateData);
        return { success: true };
      }),
  }),

  // Task Templates
  taskTemplates: router({
    list: publicProcedure.query(async () => {
      return await db.getAllTaskTemplates();
    }),
    create: publicProcedure
      .input(z.object({
        name: z.string(),
        taskType: z.enum([
          "grind_protein",
          "cook_protein",
          "blast_chill",
          "cook_rice_pasta",
          "make_sauces",
          "assemble_meals",
          "package_label",
          "bake_desserts"
        ]),
        defaultDurationMinutes: z.number(),
        canRunInParallel: z.boolean(),
        requiresEquipment: z.string().nullable(),
      }))
      .mutation(async ({ input }) => {
        await db.createTaskTemplate({
          name: input.name,
          taskType: input.taskType,
          defaultDurationMinutes: input.defaultDurationMinutes,
          canRunInParallel: input.canRunInParallel ? 1 : 0,
          requiresEquipment: input.requiresEquipment,
        });
        return { success: true };
      }),
    updateFormula: publicProcedure
      .input(z.object({
        id: z.number(),
        useFormula: z.number(),
        baseTimeMinutes: z.number(),
        ingredientMultiplier: z.number(),
        ingredientType: z.enum(["chicken_oz", "beef_oz", "pasta_grams", "rice_cups", "potato_oz", "none"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateTaskTemplateFormula(input.id, {
          useFormula: input.useFormula,
          baseTimeMinutes: input.baseTimeMinutes.toString(),
          ingredientMultiplier: input.ingredientMultiplier.toString(),
          ingredientType: input.ingredientType,
        });
        return { success: true };
      }),
  }),

  // Task Time Estimates
  taskEstimates: router({
    list: publicProcedure.query(async ({ ctx }) => {
      return await db.getUserTaskEstimates(ctx.user.id);
    }),
    upsert: publicProcedure
      .input(z.object({
        taskTemplateId: z.number(),
        durationMinutes: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertTaskEstimate({
          userId: ctx.user.id,
          taskTemplateId: input.taskTemplateId,
          durationMinutes: input.durationMinutes,
          notes: input.notes,
        });
        return { success: true };
      }),
  }),

  // Equipment Constraints
  equipment: router({
    list: publicProcedure.query(async ({ ctx }) => {
      return await db.getUserEquipmentConstraints(ctx.user.id);
    }),
    upsert: publicProcedure
      .input(z.object({
        equipmentName: z.string(),
        capacity: z.number(),
        unit: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertEquipmentConstraint({
          userId: ctx.user.id,
          equipmentName: input.equipmentName,
          capacity: input.capacity,
          unit: input.unit,
        });
        return { success: true };
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        equipmentName: z.string(),
        capacity: z.number(),
        unit: z.string(),
        mealCapacity: z.number().nullable(),
      }))
      .mutation(async ({ input }) => {
        await db.updateEquipmentConstraint(input.id, {
          equipmentName: input.equipmentName,
          capacity: input.capacity,
          unit: input.unit,
          mealCapacity: input.mealCapacity,
        });
        return { success: true };
      }),
    create: publicProcedure
      .input(z.object({
        equipmentName: z.string(),
        capacity: z.number(),
        unit: z.string(),
        mealCapacity: z.number().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createEquipmentConstraint({
          userId: ctx.user.id,
          equipmentName: input.equipmentName,
          capacity: input.capacity,
          unit: input.unit,
          mealCapacity: input.mealCapacity,
        });
        return { success: true };
      }),
  }),

  // Production Scenarios
  scenarios: router({
    list: publicProcedure.query(async ({ ctx }) => {
      return await db.getUserScenarios(ctx.user.id);
    }),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const scenario = await db.getScenarioById(input.id);
        if (!scenario) return null;
        const items = await db.getScenarioItems(input.id);
        return { ...scenario, items };
      }),
    create: publicProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        items: z.array(z.object({
          mealItemId: z.number(),
          quantity: z.number(),
        })),
        totalEstimatedMinutes: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createScenario({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          totalEstimatedMinutes: input.totalEstimatedMinutes,
        });
        
        const scenarioId = Number((result as any).insertId);
        
        for (const item of input.items) {
          await db.createScenarioItem({
            scenarioId,
            mealItemId: item.mealItemId,
            quantity: item.quantity,
          });
        }
        
        return { success: true, scenarioId };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteScenario(input.id);
        return { success: true };
      }),
  }),

  // Workflow Optimization
  optimize: router({
    calculate: publicProcedure
      .input(z.object({
        meals: z.array(z.object({
          mealItemId: z.number(),
          name: z.string(),
          quantity: z.number(),
          category: z.string(),
          proteinType: z.string().nullable(),
          requiresProtein: z.boolean(),
        })),
        taskEstimates: z.array(z.object({
          taskType: z.string(),
          name: z.string(),
          durationMinutes: z.number(),
          canRunInParallel: z.boolean(),
        })),
        equipment: z.object({
          blastChillerCapacity: z.number(),
          proteinPerTray: z.number(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        // Fetch meal items with ingredient data
        const mealItems = await db.getAllMealItems();
        
        // Map input meals to V5 format with ingredient weights
        const meals = input.meals.map(m => {
          const mealItem = mealItems.find(mi => mi.id === m.mealItemId);
          const chickenOz = mealItem ? (typeof mealItem.chickenOz === 'number' ? mealItem.chickenOz : parseFloat(mealItem.chickenOz || '0')) : 0;
          const beefOz = mealItem ? (typeof mealItem.beefOz === 'number' ? mealItem.beefOz : parseFloat(mealItem.beefOz || '0')) : 0;
          
          return {
            mealId: m.mealItemId,
            mealName: m.name,
            quantity: m.quantity,
            proteinType: (m.proteinType as 'chicken' | 'beef' | 'none') || 'none',
            chickenOz,
            beefOz,
          };
        });

        // Map task estimates to V5 format
        const taskTimes = {
          grindProtein: input.taskEstimates.find(t => t.taskType === 'grind_protein')?.durationMinutes || 15,
          cookProtein: input.taskEstimates.find(t => t.taskType === 'cook_protein')?.durationMinutes || 30,
          blastChill: input.taskEstimates.find(t => t.taskType === 'blast_chill')?.durationMinutes || 20,
          cookRicePasta: input.taskEstimates.find(t => t.taskType === 'cook_rice_pasta')?.durationMinutes || 25,
          makeSauces: input.taskEstimates.find(t => t.taskType === 'make_sauces')?.durationMinutes || 20,
          assembleMeals: input.taskEstimates.find(t => t.taskType === 'assemble_meals')?.durationMinutes || 40,
          packageLabel: input.taskEstimates.find(t => t.taskType === 'package_label')?.durationMinutes || 15,
          prepDesserts: input.taskEstimates.find(t => t.taskType === 'prep_desserts')?.durationMinutes || 20,
          bakeDesserts: input.taskEstimates.find(t => t.taskType === 'bake_desserts')?.durationMinutes || 35,
          dessertRest: input.taskEstimates.find(t => t.taskType === 'dessert_rest')?.durationMinutes || 15,
        };

        const workflow = optimizeWorkflowV5(meals, taskTimes, input.equipment);
        
        // Check oven capacity constraints based on protein weight
        const equipmentWarnings: string[] = [];
        
        // Calculate total protein weight from meals (already have ingredient data in meals array)
        let totalProteinLbs = 0;
        
        for (const meal of meals) {
          const proteinOzPerMeal = (meal.chickenOz || 0) + (meal.beefOz || 0);
          const proteinLbsForThisMeal = (proteinOzPerMeal * meal.quantity) / 16;
          totalProteinLbs += proteinLbsForThisMeal;
        }
        
        // Oven capacity: protein_per_tray (7 lbs) × 5 trays = 35 lbs per batch
        // Can handle 2 batches without issue (batch 1 blast chills while batch 2 cooks) = 70 lbs
        // Warning only when 3+ batches needed (> 70 lbs total protein)
        const proteinPerTray = input.equipment.proteinPerTray || 7;
        const traysPerBatch = 5;
        const lbsPerBatch = proteinPerTray * traysPerBatch;
        const twoBatchCapacity = lbsPerBatch * 2; // 70 lbs default
        
        if (totalProteinLbs > twoBatchCapacity) {
          const batchesNeeded = Math.ceil(totalProteinLbs / lbsPerBatch);
          equipmentWarnings.push(
            `Oven Capacity: ${totalProteinLbs.toFixed(1)} lbs total protein requires ${batchesNeeded} batches (capacity: ${twoBatchCapacity} lbs for 2 batches). Consider splitting production or using additional oven.`
          );
        }
        
        return { ...workflow, equipmentWarnings };
      }),
  }),

  // Production Logs
  productionLogs: router({
    list: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Not authenticated");
      return await db.getUserProductionLogs(ctx.user.id);
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const log = await db.getProductionLogById(input.id);
        if (!log) throw new Error("Production log not found");
        const tasks = await db.getProductionLogTasks(input.id);
        return { log, tasks };
      }),
    create: publicProcedure
      .input(z.object({
        scenarioId: z.number().optional(),
        totalEstimatedMinutes: z.number(),
        totalWallClockMinutes: z.number().optional(),
        notes: z.string().optional(),
        tasks: z.array(z.object({
          taskType: z.string(),
          taskName: z.string(),
          estimatedMinutes: z.number(),
          actualMinutes: z.number().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Not authenticated");
        
        // Create production log
        const logId = await db.createProductionLog({
          userId: ctx.user.id,
          scenarioId: input.scenarioId,
          totalEstimatedMinutes: input.totalEstimatedMinutes,
          totalWallClockMinutes: input.totalWallClockMinutes,
          notes: input.notes,
        });

        // Create production log tasks
        for (const task of input.tasks) {
          await db.createProductionLogTask({
            productionLogId: logId,
            taskType: task.taskType,
            taskName: task.taskName,
            estimatedMinutes: task.estimatedMinutes,
            actualMinutes: task.actualMinutes,
          });
        }

        return { logId };
      }),
    updateTask: publicProcedure
      .input(z.object({
        taskId: z.number(),
        actualMinutes: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateProductionLogTask(input.taskId, input.actualMinutes, input.notes);
        return { success: true };
      }),
    complete: publicProcedure
      .input(z.object({
        logId: z.number(),
        totalActualMinutes: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateProductionLog(input.logId, {
          totalActualMinutes: input.totalActualMinutes,
          notes: input.notes,
        });
        return { success: true };
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        notes: z.string().optional(),
        totalWallClockMinutes: z.number().optional(),
        tasks: z.array(z.object({
          id: z.number(),
          actualMinutes: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        // Update production log notes and wall-clock time
        await db.updateProductionLog(input.id, {
          notes: input.notes,
          totalWallClockMinutes: input.totalWallClockMinutes,
        });

        // Update task actual times
        for (const task of input.tasks) {
          await db.updateProductionLogTask(task.id, task.actualMinutes);
        }

        // Recalculate total actual minutes
        const tasks = await db.getProductionLogTasks(input.id);
        const totalActual = tasks.reduce((sum, task) => sum + (task.actualMinutes || 0), 0);
        await db.updateProductionLog(input.id, {
          totalActualMinutes: totalActual,
        });

        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        // Delete production log tasks first (foreign key constraint)
        await db.deleteProductionLogTasks(input.id);
        // Delete production log
        await db.deleteProductionLog(input.id);
        return { success: true };
      }),
  }),

  // Inventory
  inventory: router({
    list: publicProcedure.query(async () => {
      return await db.getAllInventoryItems();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getInventoryItemById(input.id);
      }),
    create: publicProcedure
      .input(z.object({
        name: z.string(),
        category: z.enum(["protein", "grain", "vegetable", "sauce", "other"]),
        unit: z.string(),
        currentQuantity: z.number(),
        minThreshold: z.number(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createInventoryItem({
          ...input,
          currentQuantity: input.currentQuantity.toString(),
          minThreshold: input.minThreshold.toString(),
        });
        return { success: true, id };
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        category: z.enum(["protein", "grain", "vegetable", "sauce", "other"]).optional(),
        unit: z.string().optional(),
        currentQuantity: z.number().optional(),
        minThreshold: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, currentQuantity, minThreshold, ...updates } = input;
        const dbUpdates: any = { ...updates };
        if (currentQuantity !== undefined) dbUpdates.currentQuantity = currentQuantity.toString();
        if (minThreshold !== undefined) dbUpdates.minThreshold = minThreshold.toString();
        await db.updateInventoryItem(id, dbUpdates);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteInventoryItem(input.id);
        return { success: true };
      }),
    count: publicProcedure
      .input(z.object({
        inventoryItemId: z.number(),
        countedQuantity: z.number(),
        countedBy: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Get current quantity
        const item = await db.getInventoryItemById(input.inventoryItemId);
        if (!item) throw new Error("Inventory item not found");

        // Create count record
        await db.createInventoryCount({
          inventoryItemId: input.inventoryItemId,
          countedQuantity: input.countedQuantity.toString(),
          previousQuantity: item.currentQuantity,
          countedBy: input.countedBy,
          notes: input.notes,
        });

        // Update current quantity
        await db.updateInventoryItem(input.inventoryItemId, {
          currentQuantity: input.countedQuantity.toString(),
        });

        return { success: true };
      }),
    getCountHistory: publicProcedure
      .input(z.object({ inventoryItemId: z.number() }))
      .query(async ({ input }) => {
        return await db.getInventoryCountHistory(input.inventoryItemId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
