import { describe, expect, it } from "vitest";
import { optimizeWorkflowV3, type MealInput, type TaskEstimate, type EquipmentConstraints } from "./optimizer-v3";

describe("Workflow Optimizer V3 - Integrated Parallel Task Suggestions", () => {
  const defaultTaskEstimates: TaskEstimate[] = [
    { taskType: "grind_protein", name: "Grind Protein", durationMinutes: 15, canRunInParallel: false },
    { taskType: "cook_protein", name: "Cook Protein", durationMinutes: 30, canRunInParallel: false },
    { taskType: "blast_chill", name: "Blast Chill", durationMinutes: 20, canRunInParallel: false },
    { taskType: "cook_rice_pasta", name: "Cook Rice/Pasta", durationMinutes: 25, canRunInParallel: true },
    { taskType: "make_sauces", name: "Make Sauces", durationMinutes: 20, canRunInParallel: true },
    { taskType: "assemble_meals", name: "Assemble Meals", durationMinutes: 30, canRunInParallel: false },
    { taskType: "package_label", name: "Package & Label", durationMinutes: 20, canRunInParallel: false },
    { taskType: "bake_desserts", name: "Bake Desserts", durationMinutes: 25, canRunInParallel: true },
  ];

  const defaultEquipment: EquipmentConstraints = {
    blastChillerCapacity: 5,
    proteinPerTray: 7,
  };

  it("should insert parallel task suggestions during cooking time", () => {
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

    const result = optimizeWorkflowV3(meals, defaultTaskEstimates, defaultEquipment);

    // Find the first cook task
    const cookTask = result.tasks.find(t => t.taskType === "cook_protein");
    
    expect(cookTask).toBeDefined();
    expect(cookTask?.parallelTasks).toBeDefined();
    expect(cookTask?.parallelTasks?.length).toBeGreaterThan(0);
  });

  it("should suggest sauces during cooking (fits in 30 min)", () => {
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

    const result = optimizeWorkflowV3(meals, defaultTaskEstimates, defaultEquipment);

    const cookTask = result.tasks.find(t => t.taskType === "cook_protein");
    const suggestions = cookTask?.parallelTasks || [];
    
    // Sauces (20 min) should fit in cooking time (30 min)
    const hasSauces = suggestions.some(s => s.toLowerCase().includes("sauce"));
    expect(hasSauces).toBe(true);
  });

  it("should suggest rice during cooking (fits in 30 min)", () => {
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

    const result = optimizeWorkflowV3(meals, defaultTaskEstimates, defaultEquipment);

    const cookTask = result.tasks.find(t => t.taskType === "cook_protein");
    const suggestions = cookTask?.parallelTasks || [];
    
    // Rice (25 min) should fit in cooking time (30 min)
    const hasRice = suggestions.some(s => s.toLowerCase().includes("rice") || s.toLowerCase().includes("pasta"));
    expect(hasRice).toBe(true);
  });

  it("should not suggest the same parallel task twice", () => {
    const meals: MealInput[] = [
      {
        mealItemId: 1,
        name: "Chicken Alfredo",
        quantity: 100, // Multiple batches
        category: "chicken",
        proteinType: "chicken",
        requiresProtein: true,
      },
    ];

    const result = optimizeWorkflowV3(meals, defaultTaskEstimates, defaultEquipment);

    // Collect all parallel task suggestions
    const allSuggestions = result.tasks
      .flatMap(t => t.parallelTasks || [])
      .map(s => s.toLowerCase());

    // Count occurrences of "sauce"
    const sauceCount = allSuggestions.filter(s => s.includes("sauce")).length;
    
    // Should only suggest sauces once, not for every batch
    expect(sauceCount).toBeLessThanOrEqual(1);
  });

  it("should include desserts in parallel suggestions when applicable", () => {
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

    const result = optimizeWorkflowV3(meals, defaultTaskEstimates, defaultEquipment);

    const allSuggestions = result.tasks
      .flatMap(t => t.parallelTasks || [])
      .join(" ")
      .toLowerCase();

    expect(allSuggestions).toContain("dessert");
  });

  it("should only show parallel tasks on critical path items, not on assembly/packaging", () => {
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

    const result = optimizeWorkflowV3(meals, defaultTaskEstimates, defaultEquipment);

    const assemblyTask = result.tasks.find(t => t.taskType === "assemble_meals");
    const packageTask = result.tasks.find(t => t.taskType === "package_label");

    // Assembly and packaging should not have parallel suggestions
    expect(assemblyTask?.parallelTasks).toBeUndefined();
    expect(packageTask?.parallelTasks).toBeUndefined();
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

    const result = optimizeWorkflowV3(meals, defaultTaskEstimates, defaultEquipment);

    // Total time should be sum of all critical path tasks
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

    const result = optimizeWorkflowV3(meals, defaultTaskEstimates, defaultEquipment);

    // Each task should start when the previous one ends
    for (let i = 1; i < result.tasks.length; i++) {
      const prevTask = result.tasks[i - 1];
      const currentTask = result.tasks[i];
      expect(currentTask.startTime).toBe(prevTask.endTime);
    }
  });

  it("should handle multiple protein types with suggestions", () => {
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

    const result = optimizeWorkflowV3(meals, defaultTaskEstimates, defaultEquipment);

    expect(result.summary.totalMeals).toBe(90);
    
    // Should have suggestions during cooking
    const tasksWithSuggestions = result.tasks.filter(t => t.parallelTasks && t.parallelTasks.length > 0);
    expect(tasksWithSuggestions.length).toBeGreaterThan(0);
  });
});
