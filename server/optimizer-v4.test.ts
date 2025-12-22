import { describe, expect, it } from "vitest";
import { optimizeWorkflowV4, type MealInput, type TaskEstimate, type EquipmentConstraints } from "./optimizer-v4";

describe("Workflow Optimizer V4 - Correct Task Order with Dessert Steps", () => {
  const defaultTaskEstimates: TaskEstimate[] = [
    { taskType: "grind_protein", name: "Grind Protein", durationMinutes: 15, canRunInParallel: false },
    { taskType: "cook_protein", name: "Cook Protein", durationMinutes: 30, canRunInParallel: false },
    { taskType: "blast_chill", name: "Blast Chill", durationMinutes: 20, canRunInParallel: false },
    { taskType: "cook_rice_pasta", name: "Cook Rice/Pasta", durationMinutes: 25, canRunInParallel: true },
    { taskType: "make_sauces", name: "Make Sauces", durationMinutes: 20, canRunInParallel: true },
    { taskType: "assemble_meals", name: "Assemble Meals", durationMinutes: 30, canRunInParallel: false },
    { taskType: "package_label", name: "Package & Label", durationMinutes: 20, canRunInParallel: false },
    { taskType: "bake_desserts", name: "Bake Desserts", durationMinutes: 35, canRunInParallel: true },
  ];

  const defaultEquipment: EquipmentConstraints = {
    blastChillerCapacity: 5,
    proteinPerTray: 7,
  };

  it("should start with rice/pasta cooking as first step", () => {
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

    const result = optimizeWorkflowV4(meals, defaultTaskEstimates, defaultEquipment);

    // First task should be rice/pasta
    expect(result.tasks[0].taskType).toBe("cook_rice_pasta");
    expect(result.tasks[0].startTime).toBe(0);
  });

  it("should follow sequence: rice → grind → cook → chill", () => {
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

    const result = optimizeWorkflowV4(meals, defaultTaskEstimates, defaultEquipment);

    // Check task sequence
    expect(result.tasks[0].taskType).toBe("cook_rice_pasta");
    expect(result.tasks[1].taskType).toBe("grind_protein");
    expect(result.tasks[2].taskType).toBe("cook_protein");
    expect(result.tasks[3].taskType).toBe("blast_chill");
  });

  it("should suggest dessert prep during protein cooking", () => {
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
      {
        mealItemId: 8,
        name: "Rice Krispy Treats",
        quantity: 15,
        category: "dessert",
        proteinType: null,
        requiresProtein: false,
      },
    ];

    const result = optimizeWorkflowV4(meals, defaultTaskEstimates, defaultEquipment);

    // Find cook protein task
    const cookTask = result.tasks.find(t => t.taskType === "cook_protein");
    const suggestions = cookTask?.parallelTasks || [];

    // Should suggest dessert prep
    const hasDessertPrep = suggestions.some(s => 
      s.toLowerCase().includes("rice krispy") || s.toLowerCase().includes("brownie")
    );
    expect(hasDessertPrep).toBe(true);
  });

  it("should include bake desserts step after protein workflow", () => {
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

    const result = optimizeWorkflowV4(meals, defaultTaskEstimates, defaultEquipment);

    // Should have bake desserts task
    const bakeTask = result.tasks.find(t => t.taskType === "bake_desserts");
    expect(bakeTask).toBeDefined();
    expect(bakeTask?.name).toContain("desserts");
  });

  it("should include rest time for rice krispy treats", () => {
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
        mealItemId: 8,
        name: "Rice Krispy Treats",
        quantity: 15,
        category: "dessert",
        proteinType: null,
        requiresProtein: false,
      },
    ];

    const result = optimizeWorkflowV4(meals, defaultTaskEstimates, defaultEquipment);

    // Should have rest task
    const restTask = result.tasks.find(t => t.taskType === "rest_desserts");
    expect(restTask).toBeDefined();
    expect(restTask?.name).toContain("rest");
  });

  it("should not include dessert steps when no desserts ordered", () => {
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

    const result = optimizeWorkflowV4(meals, defaultTaskEstimates, defaultEquipment);

    // Should not have bake or rest tasks
    const bakeTask = result.tasks.find(t => t.taskType === "bake_desserts");
    const restTask = result.tasks.find(t => t.taskType === "rest_desserts");
    
    expect(bakeTask).toBeUndefined();
    expect(restTask).toBeUndefined();
  });

  it("should handle both chicken and beef with correct sequencing", () => {
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
        mealItemId: 4,
        name: "Birria Beef",
        quantity: 40,
        category: "beef",
        proteinType: "beef",
        requiresProtein: true,
      },
    ];

    const result = optimizeWorkflowV4(meals, defaultTaskEstimates, defaultEquipment);

    // Should have rice first, then chicken workflow, then beef workflow
    expect(result.tasks[0].taskType).toBe("cook_rice_pasta");
    
    // Find first chicken and beef grind tasks
    const firstChickenGrind = result.tasks.find(t => t.taskType === "grind_protein" && t.name.includes("chicken"));
    const firstBeefGrind = result.tasks.find(t => t.taskType === "grind_protein" && t.name.includes("beef"));
    
    expect(firstChickenGrind).toBeDefined();
    expect(firstBeefGrind).toBeDefined();
    
    // Chicken should come before beef
    expect(firstChickenGrind!.startTime).toBeLessThan(firstBeefGrind!.startTime);
  });

  it("should calculate total time correctly with new sequence", () => {
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

    const result = optimizeWorkflowV4(meals, defaultTaskEstimates, defaultEquipment);

    // Total time should match last task end time
    const lastTask = result.tasks[result.tasks.length - 1];
    expect(result.totalMinutes).toBe(lastTask.endTime);
  });

  it("should maintain sequential timing for all tasks", () => {
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

    const result = optimizeWorkflowV4(meals, defaultTaskEstimates, defaultEquipment);

    // Each task should start when the previous one ends
    for (let i = 1; i < result.tasks.length; i++) {
      const prevTask = result.tasks[i - 1];
      const currentTask = result.tasks[i];
      expect(currentTask.startTime).toBe(prevTask.endTime);
    }
  });
});
