import { describe, expect, it } from "vitest";
import { optimizeWorkflowV2, type MealInput, type TaskEstimate, type EquipmentConstraints } from "./optimizer-v2";

describe("Workflow Optimizer V2 - Bottleneck Focus", () => {
  const defaultTaskEstimates: TaskEstimate[] = [
    { taskType: "grind_protein", name: "Grind Protein", durationMinutes: 15, canRunInParallel: false },
    { taskType: "cook_protein", name: "Cook Protein", durationMinutes: 30, canRunInParallel: false },
    { taskType: "blast_chill", name: "Blast Chill", durationMinutes: 45, canRunInParallel: false },
    { taskType: "cook_rice_pasta", name: "Cook Rice/Pasta", durationMinutes: 20, canRunInParallel: true },
    { taskType: "make_sauces", name: "Make Sauces", durationMinutes: 15, canRunInParallel: true },
    { taskType: "assemble_meals", name: "Assemble Meals", durationMinutes: 30, canRunInParallel: false },
    { taskType: "package_label", name: "Package & Label", durationMinutes: 20, canRunInParallel: false },
    { taskType: "bake_desserts", name: "Bake Desserts", durationMinutes: 25, canRunInParallel: true },
  ];

  const defaultEquipment: EquipmentConstraints = {
    blastChillerCapacity: 5, // trays
    proteinPerTray: 7, // lbs
  };

  it("should create critical path for chicken meals", () => {
    const meals: MealInput[] = [
      {
        mealItemId: 1,
        name: "Chicken Alfredo",
        quantity: 50,
        category: "chicken",
        proteinType: "chicken",
        requiresProtein: true,
      },
    ];

    const result = optimizeWorkflowV2(meals, defaultTaskEstimates, defaultEquipment);

    expect(result.summary.totalMeals).toBe(50);
    expect(result.summary.totalProteinBatches).toBeGreaterThan(0);
    expect(result.criticalPath.length).toBeGreaterThan(0);
    
    // Should have grind, cook, chill, assemble, package in critical path
    const taskTypes = result.criticalPath.map(t => t.taskType);
    expect(taskTypes).toContain("grind_protein");
    expect(taskTypes).toContain("cook_protein");
    expect(taskTypes).toContain("blast_chill");
    expect(taskTypes).toContain("assemble_meals");
    expect(taskTypes).toContain("package_label");
  });

  it("should create parallel tasks for rice and sauces", () => {
    const meals: MealInput[] = [
      {
        mealItemId: 1,
        name: "Chicken Alfredo",
        quantity: 50,
        category: "chicken",
        proteinType: "chicken",
        requiresProtein: true,
      },
    ];

    const result = optimizeWorkflowV2(meals, defaultTaskEstimates, defaultEquipment);

    expect(result.parallelTasks.length).toBeGreaterThan(0);
    
    const parallelTaskTypes = result.parallelTasks.map(t => t.taskType);
    expect(parallelTaskTypes).toContain("cook_rice_pasta");
    expect(parallelTaskTypes).toContain("make_sauces");
    
    // Parallel tasks should start at time 0
    result.parallelTasks.forEach(task => {
      expect(task.startTime).toBe(0);
      expect(task.category).toBe("parallel_work");
    });
  });

  it("should handle multiple protein batches when exceeding blast chiller capacity", () => {
    const meals: MealInput[] = [
      {
        mealItemId: 1,
        name: "Chicken Alfredo",
        quantity: 100, // More than one batch worth
        category: "chicken",
        proteinType: "chicken",
        requiresProtein: true,
      },
    ];

    const result = optimizeWorkflowV2(meals, defaultTaskEstimates, defaultEquipment);

    // 100 meals * 0.5 lbs/meal = 50 lbs
    // 5 trays * 7 lbs/tray = 35 lbs per batch
    // Should need 2 batches
    expect(result.summary.totalProteinBatches).toBe(2);
    expect(result.summary.blastChillerCycles).toBe(2);
  });

  it("should sequence chicken and beef batches correctly", () => {
    const meals: MealInput[] = [
      {
        mealItemId: 1,
        name: "Chicken Alfredo",
        quantity: 50,
        category: "chicken",
        proteinType: "chicken",
        requiresProtein: true,
      },
      {
        mealItemId: 2,
        name: "Bacon Burger Bowl",
        quantity: 40,
        category: "beef",
        proteinType: "beef",
        requiresProtein: true,
      },
    ];

    const result = optimizeWorkflowV2(meals, defaultTaskEstimates, defaultEquipment);

    expect(result.summary.totalMeals).toBe(90);
    
    // Should have both chicken and beef in critical path
    const criticalPathNames = result.criticalPath.map(t => t.name.toLowerCase());
    const hasChicken = criticalPathNames.some(name => name.includes("chicken"));
    const hasBeef = criticalPathNames.some(name => name.includes("beef"));
    
    expect(hasChicken).toBe(true);
    expect(hasBeef).toBe(true);
    
    // Chicken should come before beef (sequential processing)
    const chickenIndex = result.criticalPath.findIndex(t => t.name.toLowerCase().includes("chicken"));
    const beefIndex = result.criticalPath.findIndex(t => t.name.toLowerCase().includes("beef"));
    expect(chickenIndex).toBeLessThan(beefIndex);
  });

  it("should include desserts in parallel tasks", () => {
    const meals: MealInput[] = [
      {
        mealItemId: 1,
        name: "Chicken Alfredo",
        quantity: 50,
        category: "chicken",
        proteinType: "chicken",
        requiresProtein: true,
      },
      {
        mealItemId: 7,
        name: "Brownies",
        quantity: 20,
        category: "dessert",
        proteinType: null,
        requiresProtein: false,
      },
    ];

    const result = optimizeWorkflowV2(meals, defaultTaskEstimates, defaultEquipment);

    const parallelTaskTypes = result.parallelTasks.map(t => t.taskType);
    expect(parallelTaskTypes).toContain("bake_desserts");
  });

  it("should calculate total time correctly", () => {
    const meals: MealInput[] = [
      {
        mealItemId: 1,
        name: "Chicken Alfredo",
        quantity: 50,
        category: "chicken",
        proteinType: "chicken",
        requiresProtein: true,
      },
    ];

    const result = optimizeWorkflowV2(meals, defaultTaskEstimates, defaultEquipment);

    // Total time should be sum of critical path
    const criticalPathTime = result.criticalPath.reduce((sum, task) => sum + task.durationMinutes, 0);
    expect(result.totalMinutes).toBe(criticalPathTime);
  });

  it("should mark all critical path tasks with correct category", () => {
    const meals: MealInput[] = [
      {
        mealItemId: 1,
        name: "Chicken Alfredo",
        quantity: 50,
        category: "chicken",
        proteinType: "chicken",
        requiresProtein: true,
      },
    ];

    const result = optimizeWorkflowV2(meals, defaultTaskEstimates, defaultEquipment);

    result.criticalPath.forEach(task => {
      expect(task.category).toBe("critical_path");
    });
  });

  it("should have sequential timing for critical path tasks", () => {
    const meals: MealInput[] = [
      {
        mealItemId: 1,
        name: "Chicken Alfredo",
        quantity: 50,
        category: "chicken",
        proteinType: "chicken",
        requiresProtein: true,
      },
    ];

    const result = optimizeWorkflowV2(meals, defaultTaskEstimates, defaultEquipment);

    // Each task should start when the previous one ends
    for (let i = 1; i < result.criticalPath.length; i++) {
      const prevTask = result.criticalPath[i - 1];
      const currentTask = result.criticalPath[i];
      expect(currentTask.startTime).toBe(prevTask.endTime);
    }
  });

  it("should calculate idle time estimate", () => {
    const meals: MealInput[] = [
      {
        mealItemId: 1,
        name: "Chicken Alfredo",
        quantity: 50,
        category: "chicken",
        proteinType: "chicken",
        requiresProtein: true,
      },
    ];

    const result = optimizeWorkflowV2(meals, defaultTaskEstimates, defaultEquipment);

    // Idle time should be non-negative
    expect(result.summary.estimatedIdleTime).toBeGreaterThanOrEqual(0);
  });
});
