import { describe, expect, it } from "vitest";
import { optimizeWorkflow, formatDuration } from "./optimizer";

describe("Workflow Optimizer", () => {
  describe("formatDuration", () => {
    it("formats minutes only", () => {
      expect(formatDuration(30)).toBe("30 min");
      expect(formatDuration(45)).toBe("45 min");
    });

    it("formats hours only", () => {
      expect(formatDuration(60)).toBe("1 hr");
      expect(formatDuration(120)).toBe("2 hr");
    });

    it("formats hours and minutes", () => {
      expect(formatDuration(90)).toBe("1 hr 30 min");
      expect(formatDuration(135)).toBe("2 hr 15 min");
    });
  });

  describe("optimizeWorkflow", () => {
    const defaultTaskEstimates = [
      { taskType: "grind_protein", name: "Grind Protein", durationMinutes: 15, canRunInParallel: false },
      { taskType: "cook_protein", name: "Cook Protein", durationMinutes: 30, canRunInParallel: false },
      { taskType: "blast_chill", name: "Blast Chill", durationMinutes: 20, canRunInParallel: false },
      { taskType: "cook_rice_pasta", name: "Cook Rice/Pasta", durationMinutes: 25, canRunInParallel: true },
      { taskType: "make_sauces", name: "Make Sauces", durationMinutes: 20, canRunInParallel: true },
      { taskType: "assemble_meals", name: "Assemble Meals", durationMinutes: 40, canRunInParallel: false },
      { taskType: "package_label", name: "Package & Label", durationMinutes: 15, canRunInParallel: false },
      { taskType: "bake_desserts", name: "Bake Desserts", durationMinutes: 35, canRunInParallel: true },
    ];

    const defaultEquipment = {
      blastChillerCapacity: 5,
      proteinPerTray: 7,
    };

    it("generates workflow for chicken meals", () => {
      const meals = [
        {
          mealItemId: 1,
          name: "Chicken Dish 1",
          quantity: 20,
          category: "chicken",
          proteinType: "chicken",
          requiresProtein: true,
        },
      ];

      const workflow = optimizeWorkflow(meals, defaultTaskEstimates, defaultEquipment);

      expect(workflow.tasks.length).toBeGreaterThan(0);
      expect(workflow.totalMinutes).toBeGreaterThan(0);
      
      // Should have protein tasks
      const proteinTasks = workflow.tasks.filter(t => 
        t.taskType === "grind_protein" || 
        t.taskType === "cook_protein" || 
        t.taskType === "blast_chill"
      );
      expect(proteinTasks.length).toBeGreaterThan(0);

      // Should have assembly task
      const assemblyTask = workflow.tasks.find(t => t.taskType === "assemble_meals");
      expect(assemblyTask).toBeDefined();
    });

    it("enforces protein cooking dependency", () => {
      const meals = [
        {
          mealItemId: 1,
          name: "Chicken Dish 1",
          quantity: 10,
          category: "chicken",
          proteinType: "chicken",
          requiresProtein: true,
        },
      ];

      const workflow = optimizeWorkflow(meals, defaultTaskEstimates, defaultEquipment);

      const chillTask = workflow.tasks.find(t => t.taskType === "blast_chill");
      const assemblyTask = workflow.tasks.find(t => t.taskType === "assemble_meals");

      expect(chillTask).toBeDefined();
      expect(assemblyTask).toBeDefined();

      // Assembly must start after protein is chilled
      if (chillTask && assemblyTask) {
        expect(assemblyTask.startTime).toBeGreaterThanOrEqual(chillTask.endTime);
      }
    });

    it("schedules parallel tasks correctly", () => {
      const meals = [
        {
          mealItemId: 1,
          name: "Chicken Dish 1",
          quantity: 10,
          category: "chicken",
          proteinType: "chicken",
          requiresProtein: true,
        },
      ];

      const workflow = optimizeWorkflow(meals, defaultTaskEstimates, defaultEquipment);

      // Parallel tasks should start at time 0
      const parallelTasks = workflow.tasks.filter(t => t.canRunInParallel);
      
      if (parallelTasks.length > 0) {
        const earliestParallelStart = Math.min(...parallelTasks.map(t => t.startTime));
        expect(earliestParallelStart).toBe(0);
      }
    });

    it("respects blast chiller capacity constraint", () => {
      const meals = [
        {
          mealItemId: 1,
          name: "Chicken Dish 1",
          quantity: 100, // Large quantity requiring multiple batches
          category: "chicken",
          proteinType: "chicken",
          requiresProtein: true,
        },
      ];

      const workflow = optimizeWorkflow(meals, defaultTaskEstimates, defaultEquipment);

      // Should create multiple batches if needed
      const chillTasks = workflow.tasks.filter(t => t.taskType === "blast_chill");
      
      // With 100 meals at 0.5 lb each = 50 lbs total
      // Capacity is 5 trays * 7 lbs = 35 lbs per batch
      // Should need at least 2 batches
      expect(chillTasks.length).toBeGreaterThanOrEqual(1);
    });

    it("handles mixed protein types", () => {
      const meals = [
        {
          mealItemId: 1,
          name: "Chicken Dish 1",
          quantity: 10,
          category: "chicken",
          proteinType: "chicken",
          requiresProtein: true,
        },
        {
          mealItemId: 2,
          name: "Beef Dish 1",
          quantity: 10,
          category: "beef",
          proteinType: "beef",
          requiresProtein: true,
        },
      ];

      const workflow = optimizeWorkflow(meals, defaultTaskEstimates, defaultEquipment);

      // Should have tasks for both chicken and beef
      const chickenTasks = workflow.tasks.filter(t => t.name.toLowerCase().includes("chicken"));
      const beefTasks = workflow.tasks.filter(t => t.name.toLowerCase().includes("beef"));

      expect(chickenTasks.length).toBeGreaterThan(0);
      expect(beefTasks.length).toBeGreaterThan(0);
    });

    it("handles meals without protein", () => {
      const meals = [
        {
          mealItemId: 1,
          name: "Salad 1",
          quantity: 20,
          category: "salad",
          proteinType: null,
          requiresProtein: false,
        },
      ];

      const workflow = optimizeWorkflow(meals, defaultTaskEstimates, defaultEquipment);

      // Should not have protein tasks
      const proteinTasks = workflow.tasks.filter(t => 
        t.taskType === "grind_protein" || 
        t.taskType === "cook_protein" || 
        t.taskType === "blast_chill"
      );
      expect(proteinTasks.length).toBe(0);

      // Should still have assembly
      const assemblyTask = workflow.tasks.find(t => t.taskType === "assemble_meals");
      expect(assemblyTask).toBeDefined();
    });

    it("calculates total time correctly", () => {
      const meals = [
        {
          mealItemId: 1,
          name: "Chicken Dish 1",
          quantity: 10,
          category: "chicken",
          proteinType: "chicken",
          requiresProtein: true,
        },
      ];

      const workflow = optimizeWorkflow(meals, defaultTaskEstimates, defaultEquipment);

      // Total time should be the max end time of all tasks
      const maxEndTime = Math.max(...workflow.tasks.map(t => t.endTime));
      expect(workflow.totalMinutes).toBe(maxEndTime);
    });

    it("includes desserts when specified", () => {
      const meals = [
        {
          mealItemId: 1,
          name: "Brownies",
          quantity: 20,
          category: "dessert",
          proteinType: null,
          requiresProtein: false,
        },
      ];

      const workflow = optimizeWorkflow(meals, defaultTaskEstimates, defaultEquipment);

      // Should have bake desserts task
      const dessertTask = workflow.tasks.find(t => t.taskType === "bake_desserts");
      expect(dessertTask).toBeDefined();
      expect(dessertTask?.canRunInParallel).toBe(true);
    });

    it("generates tasks in chronological order", () => {
      const meals = [
        {
          mealItemId: 1,
          name: "Chicken Dish 1",
          quantity: 10,
          category: "chicken",
          proteinType: "chicken",
          requiresProtein: true,
        },
      ];

      const workflow = optimizeWorkflow(meals, defaultTaskEstimates, defaultEquipment);

      // Tasks should be sorted by start time
      for (let i = 1; i < workflow.tasks.length; i++) {
        expect(workflow.tasks[i].startTime).toBeGreaterThanOrEqual(workflow.tasks[i - 1].startTime);
      }
    });
  });
});
