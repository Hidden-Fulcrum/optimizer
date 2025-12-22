import { describe, expect, it } from "vitest";
import { optimizeWorkflowV5, type MealQuantity, type TaskTimes, type EquipmentConstraints } from "./optimizer-v5";

describe("optimizeWorkflowV5 - Concurrent Workflow", () => {
  const defaultTaskTimes: TaskTimes = {
    grindProtein: 15,
    cookProtein: 30,
    blastChill: 20,
    cookRicePasta: 25,
    makeSauces: 20,
    assembleMeals: 40,
    packageLabel: 15,
    prepDesserts: 20,
    bakeDesserts: 35,
    dessertRest: 15,
  };

  const defaultEquipment: EquipmentConstraints = {
    blastChillerCapacity: 5,
    proteinPerTray: 7,
  };

  it("should start with rice/pasta cooking as first step", () => {
    const meals: MealQuantity[] = [
      { mealId: 1, mealName: "Chicken Alfredo", quantity: 50, proteinType: "chicken" },
    ];

    const workflow = optimizeWorkflowV5(meals, defaultTaskTimes, defaultEquipment);

    expect(workflow.steps[0].taskName).toBe("Cook rice/pasta");
    expect(workflow.steps[0].taskType).toBe("passive");
  });

  it("should mark rice/pasta as passive task", () => {
    const meals: MealQuantity[] = [
      { mealId: 1, mealName: "Chicken Alfredo", quantity: 50, proteinType: "chicken" },
    ];

    const workflow = optimizeWorkflowV5(meals, defaultTaskTimes, defaultEquipment);

    const riceStep = workflow.steps.find(s => s.taskName === "Cook rice/pasta");
    expect(riceStep?.taskType).toBe("passive");
  });

  it("should mark grind chicken as active task", () => {
    const meals: MealQuantity[] = [
      { mealId: 1, mealName: "Chicken Alfredo", quantity: 50, proteinType: "chicken" },
    ];

    const workflow = optimizeWorkflowV5(meals, defaultTaskTimes, defaultEquipment);

    const grindStep = workflow.steps.find(s => s.taskName.includes("Grind chicken"));
    expect(grindStep?.taskType).toBe("active");
  });

  it("should mark cook chicken as passive task", () => {
    const meals: MealQuantity[] = [
      { mealId: 1, mealName: "Chicken Alfredo", quantity: 50, proteinType: "chicken" },
    ];

    const workflow = optimizeWorkflowV5(meals, defaultTaskTimes, defaultEquipment);

    const cookStep = workflow.steps.find(s => s.taskName.includes("Cook chicken"));
    expect(cookStep?.taskType).toBe("passive");
  });

  it("should allow grind chicken to happen during rice cooking", () => {
    const meals: MealQuantity[] = [
      { mealId: 1, mealName: "Chicken Alfredo", quantity: 50, proteinType: "chicken" },
    ];

    const workflow = optimizeWorkflowV5(meals, defaultTaskTimes, defaultEquipment);

    const riceStep = workflow.steps.find(s => s.taskName === "Cook rice/pasta");
    const grindStep = workflow.steps.find(s => s.taskName.includes("Grind chicken"));

    // Grind should start while rice is still cooking
    expect(grindStep!.startTime).toBeLessThan(riceStep!.endTime);
  });

  it("should show concurrent tasks in concurrentWith field", () => {
    const meals: MealQuantity[] = [
      { mealId: 1, mealName: "Chicken Alfredo", quantity: 50, proteinType: "chicken" },
    ];

    const workflow = optimizeWorkflowV5(meals, defaultTaskTimes, defaultEquipment);

    const grindStep = workflow.steps.find(s => s.taskName.includes("Grind chicken"));
    
    // Grind chicken should show it's concurrent with rice cooking
    expect(grindStep?.concurrentWith).toBeDefined();
    expect(grindStep?.concurrentWith).toContain("Cook rice/pasta");
  });

  it("should calculate worker active time correctly", () => {
    const meals: MealQuantity[] = [
      { mealId: 1, mealName: "Chicken Alfredo", quantity: 50, proteinType: "chicken" },
    ];

    const workflow = optimizeWorkflowV5(meals, defaultTaskTimes, defaultEquipment);

    const activeTasks = workflow.steps.filter(s => s.taskType === 'active');
    const expectedActiveTime = activeTasks.reduce((sum, task) => sum + task.duration, 0);

    expect(workflow.workerActiveTime).toBe(expectedActiveTime);
  });

  it("should have total time less than sum of all task durations (due to concurrency)", () => {
    const meals: MealQuantity[] = [
      { mealId: 1, mealName: "Chicken Alfredo", quantity: 50, proteinType: "chicken" },
    ];

    const workflow = optimizeWorkflowV5(meals, defaultTaskTimes, defaultEquipment);

    const sumOfAllDurations = workflow.steps.reduce((sum, step) => sum + step.duration, 0);

    // Total time should be less than sum because tasks run concurrently
    expect(workflow.totalTime).toBeLessThan(sumOfAllDurations);
  });

  it("should include dessert prep as active tasks", () => {
    const meals: MealQuantity[] = [
      { mealId: 1, mealName: "Chicken Alfredo", quantity: 50, proteinType: "chicken" },
      { mealId: 7, mealName: "Brownies", quantity: 30, proteinType: "none" },
    ];

    const workflow = optimizeWorkflowV5(meals, defaultTaskTimes, defaultEquipment);

    const prepRiceKrispy = workflow.steps.find(s => s.taskName === "Prep rice krispy treats");
    const prepBrownie = workflow.steps.find(s => s.taskName === "Make brownie mix");

    expect(prepRiceKrispy?.taskType).toBe("active");
    expect(prepBrownie?.taskType).toBe("active");
  });

  it("should allow beef grinding to happen concurrently with chicken workflow", () => {
    const meals: MealQuantity[] = [
      { mealId: 1, mealName: "Chicken Alfredo", quantity: 50, proteinType: "chicken" },
      { mealId: 4, mealName: "Birria Beef", quantity: 40, proteinType: "beef" },
    ];

    const workflow = optimizeWorkflowV5(meals, defaultTaskTimes, defaultEquipment);

    const beefGrindStep = workflow.steps.find(s => s.taskName.includes("Grind beef"));

    // Beef grinding should be marked as active task
    expect(beefGrindStep!.taskType).toBe("active");
    
    // Beef grinding should have concurrent tasks listed
    expect(beefGrindStep!.concurrentWith).toBeDefined();
  });

  it("should mark assembly as active task", () => {
    const meals: MealQuantity[] = [
      { mealId: 1, mealName: "Chicken Alfredo", quantity: 50, proteinType: "chicken" },
    ];

    const workflow = optimizeWorkflowV5(meals, defaultTaskTimes, defaultEquipment);

    const assemblyStep = workflow.steps.find(s => s.taskName === "Assemble meals");
    expect(assemblyStep?.taskType).toBe("active");
  });

  it("should mark package/label as active task", () => {
    const meals: MealQuantity[] = [
      { mealId: 1, mealName: "Chicken Alfredo", quantity: 50, proteinType: "chicken" },
    ];

    const workflow = optimizeWorkflowV5(meals, defaultTaskTimes, defaultEquipment);

    const packageStep = workflow.steps.find(s => s.taskName === "Package & label");
    expect(packageStep?.taskType).toBe("active");
  });

  it("should handle complex scenario with chicken, beef, and desserts", () => {
    const meals: MealQuantity[] = [
      { mealId: 1, mealName: "Chicken Alfredo", quantity: 50, proteinType: "chicken" },
      { mealId: 2, mealName: "Chicken Parmesan", quantity: 45, proteinType: "chicken" },
      { mealId: 4, mealName: "Birria Beef", quantity: 40, proteinType: "beef" },
      { mealId: 7, mealName: "Brownies", quantity: 30, proteinType: "none" },
      { mealId: 8, mealName: "Rice Krispy Treats", quantity: 25, proteinType: "none" },
    ];

    const workflow = optimizeWorkflowV5(meals, defaultTaskTimes, defaultEquipment);

    // Should start with rice
    expect(workflow.steps[0].taskName).toBe("Cook rice/pasta");
    
    // Should have chicken steps
    expect(workflow.steps.some(s => s.taskName.includes("Grind chicken"))).toBe(true);
    expect(workflow.steps.some(s => s.taskName.includes("Cook chicken"))).toBe(true);
    
    // Should have beef steps
    expect(workflow.steps.some(s => s.taskName.includes("Grind beef"))).toBe(true);
    expect(workflow.steps.some(s => s.taskName.includes("Cook beef"))).toBe(true);
    
    // Should have dessert steps
    expect(workflow.steps.some(s => s.taskName === "Prep rice krispy treats")).toBe(true);
    expect(workflow.steps.some(s => s.taskName === "Make brownie mix")).toBe(true);
    expect(workflow.steps.some(s => s.taskName === "Bake desserts")).toBe(true);
    
    // Should have assembly and packaging
    expect(workflow.steps.some(s => s.taskName === "Assemble meals")).toBe(true);
    expect(workflow.steps.some(s => s.taskName === "Package & label")).toBe(true);
    
    // Total time should be reasonable (less than sequential sum)
    const sumOfAllDurations = workflow.steps.reduce((sum, step) => sum + step.duration, 0);
    expect(workflow.totalTime).toBeLessThan(sumOfAllDurations);
  });

  it("should calculate correct total meals count", () => {
    const meals: MealQuantity[] = [
      { mealId: 1, mealName: "Chicken Alfredo", quantity: 50, proteinType: "chicken" },
      { mealId: 4, mealName: "Birria Beef", quantity: 40, proteinType: "beef" },
      { mealId: 7, mealName: "Brownies", quantity: 30, proteinType: "none" },
    ];

    const workflow = optimizeWorkflowV5(meals, defaultTaskTimes, defaultEquipment);

    expect(workflow.totalMeals).toBe(120);
  });
});
