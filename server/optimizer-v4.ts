/**
 * Workflow Optimizer V4 - Realistic Task Order with Detailed Dessert Steps
 * 
 * Key Improvements:
 * 1. Start with rice/pasta cooking (not as parallel task)
 * 2. Add detailed dessert preparation steps (prep → rest/bake)
 * 3. Suggest dessert prep during protein cooking downtime
 * 4. More realistic workflow: rice → protein batches → assembly
 */

export interface MealInput {
  mealItemId: number;
  name: string;
  quantity: number;
  category: string;
  proteinType: string | null;
  requiresProtein: boolean;
}

export interface TaskEstimate {
  taskType: string;
  name: string;
  durationMinutes: number;
  canRunInParallel: boolean;
}

export interface EquipmentConstraints {
  blastChillerCapacity: number; // trays
  proteinPerTray: number; // lbs
}

export interface WorkflowTask {
  id: string;
  name: string;
  taskType: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  category: 'critical_path' | 'parallel_suggestion';
  equipment?: string;
  details?: string;
  parallelTasks?: string[]; // Suggestions for what to do during this task
}

export interface OptimizedWorkflow {
  tasks: WorkflowTask[];
  totalMinutes: number;
  summary: {
    totalProteinBatches: number;
    totalMeals: number;
    blastChillerCycles: number;
    estimatedIdleTime: number;
  };
}

const PROTEIN_WEIGHT_PER_MEAL = 0.5; // lbs per meal (approximate)

export function optimizeWorkflowV4(
  meals: MealInput[],
  taskEstimates: TaskEstimate[],
  equipment: EquipmentConstraints
): OptimizedWorkflow {
  const tasks: WorkflowTask[] = [];
  let currentTime = 0;
  let taskId = 1;

  // Get task durations
  const getTaskDuration = (taskType: string): number => {
    const task = taskEstimates.find(t => t.taskType === taskType);
    return task?.durationMinutes || 30;
  };

  const grindTime = getTaskDuration('grind_protein');
  const cookTime = getTaskDuration('cook_protein');
  const chillTime = getTaskDuration('blast_chill');
  const assemblyTime = getTaskDuration('assemble_meals');
  const packageTime = getTaskDuration('package_label');
  const riceTime = getTaskDuration('cook_rice_pasta');
  const sauceTime = getTaskDuration('make_sauces');
  const dessertTime = getTaskDuration('bake_desserts');

  // Separate meals by type
  const chickenMeals = meals.filter(m => m.proteinType === 'chicken');
  const beefMeals = meals.filter(m => m.proteinType === 'beef');
  const dessertMeals = meals.filter(m => m.category === 'dessert');
  const noProteinMeals = meals.filter(m => !m.requiresProtein && m.category !== 'dessert');

  const totalChickenQty = chickenMeals.reduce((sum, m) => sum + m.quantity, 0);
  const totalBeefQty = beefMeals.reduce((sum, m) => sum + m.quantity, 0);
  const totalMeals = meals.filter(m => m.requiresProtein).reduce((sum, m) => sum + m.quantity, 0);
  const hasDesserts = dessertMeals.length > 0 && dessertMeals.some(m => m.quantity > 0);

  // Calculate protein weights
  const chickenLbs = totalChickenQty * PROTEIN_WEIGHT_PER_MEAL;
  const beefLbs = totalBeefQty * PROTEIN_WEIGHT_PER_MEAL;

  // Calculate batches based on blast chiller capacity
  const maxLbsPerBatch = equipment.blastChillerCapacity * equipment.proteinPerTray;
  
  const chickenBatches = Math.ceil(chickenLbs / maxLbsPerBatch);
  const beefBatches = Math.ceil(beefLbs / maxLbsPerBatch);

  // Track which parallel tasks have been suggested
  const parallelTasksRemaining = new Set<string>();
  if (totalChickenQty > 0 || totalBeefQty > 0) {
    parallelTasksRemaining.add('make_sauces');
  }
  if (hasDesserts) {
    parallelTasksRemaining.add('prep_rice_krispy');
    parallelTasksRemaining.add('prep_brownies');
  }

  // Helper function to suggest parallel tasks for a downtime period
  const suggestParallelTasks = (availableTime: number, taskType: string): string[] => {
    const suggestions: string[] = [];
    
    // During cooking, suggest dessert prep
    if (taskType === 'cook_protein') {
      if (parallelTasksRemaining.has('prep_rice_krispy')) {
        suggestions.push(`Prep rice krispy treats (10 min)`);
        parallelTasksRemaining.delete('prep_rice_krispy');
      }
      if (parallelTasksRemaining.has('prep_brownies')) {
        suggestions.push(`Make brownie mix (10 min)`);
        parallelTasksRemaining.delete('prep_brownies');
      }
      if (parallelTasksRemaining.has('make_sauces') && sauceTime <= availableTime) {
        suggestions.push(`Make sauces (${sauceTime} min)`);
        parallelTasksRemaining.delete('make_sauces');
      }
    }
    
    // During chilling, suggest other prep work
    if (taskType === 'blast_chill') {
      if (parallelTasksRemaining.has('make_sauces') && sauceTime <= availableTime) {
        suggestions.push(`Make sauces (${sauceTime} min)`);
        parallelTasksRemaining.delete('make_sauces');
      }
    }
    
    return suggestions;
  };

  // STEP 1: Start with rice/pasta (if needed)
  if (totalChickenQty > 0 || totalBeefQty > 0) {
    tasks.push({
      id: `task-${taskId++}`,
      name: `Cook rice/pasta`,
      taskType: 'cook_rice_pasta',
      startTime: currentTime,
      endTime: currentTime + riceTime,
      durationMinutes: riceTime,
      category: 'critical_path',
      equipment: 'stovetop',
      details: 'For all meals'
    });
    currentTime += riceTime;
  }

  // STEP 2: Chicken protein workflow
  if (chickenBatches > 0) {
    for (let batch = 1; batch <= chickenBatches; batch++) {
      const batchLbs = Math.min(chickenLbs - (batch - 1) * maxLbsPerBatch, maxLbsPerBatch);
      const trays = Math.ceil(batchLbs / equipment.proteinPerTray);

      // Grind chicken
      tasks.push({
        id: `task-${taskId++}`,
        name: `Grind chicken (${batchLbs.toFixed(1)} lbs)`,
        taskType: 'grind_protein',
        startTime: currentTime,
        endTime: currentTime + grindTime,
        durationMinutes: grindTime,
        category: 'critical_path',
        equipment: 'grinder',
        details: `Batch ${batch}/${chickenBatches}, ${trays} trays`
      });
      currentTime += grindTime;

      // Cook chicken - DOWNTIME for dessert prep
      const cookSuggestions = suggestParallelTasks(cookTime, 'cook_protein');
      tasks.push({
        id: `task-${taskId++}`,
        name: `Cook chicken (${trays} trays)`,
        taskType: 'cook_protein',
        startTime: currentTime,
        endTime: currentTime + cookTime,
        durationMinutes: cookTime,
        category: 'critical_path',
        equipment: 'oven',
        details: `${batchLbs.toFixed(1)} lbs total`,
        parallelTasks: cookSuggestions.length > 0 ? cookSuggestions : undefined
      });
      currentTime += cookTime;

      // Blast chill chicken - DOWNTIME
      const chillSuggestions = suggestParallelTasks(chillTime, 'blast_chill');
      tasks.push({
        id: `task-${taskId++}`,
        name: `Blast chill chicken`,
        taskType: 'blast_chill',
        startTime: currentTime,
        endTime: currentTime + chillTime,
        durationMinutes: chillTime,
        category: 'critical_path',
        equipment: 'blast_chiller',
        details: `${trays} trays`,
        parallelTasks: chillSuggestions.length > 0 ? chillSuggestions : undefined
      });
      currentTime += chillTime;
    }
  }

  // STEP 3: Beef protein workflow
  if (beefBatches > 0) {
    for (let batch = 1; batch <= beefBatches; batch++) {
      const batchLbs = Math.min(beefLbs - (batch - 1) * maxLbsPerBatch, maxLbsPerBatch);
      const trays = Math.ceil(batchLbs / equipment.proteinPerTray);

      // Grind beef
      tasks.push({
        id: `task-${taskId++}`,
        name: `Grind beef (${batchLbs.toFixed(1)} lbs)`,
        taskType: 'grind_protein',
        startTime: currentTime,
        endTime: currentTime + grindTime,
        durationMinutes: grindTime,
        category: 'critical_path',
        equipment: 'grinder',
        details: `Batch ${batch}/${beefBatches}, ${trays} trays`
      });
      currentTime += grindTime;

      // Cook beef - DOWNTIME
      const cookSuggestions = suggestParallelTasks(cookTime, 'cook_protein');
      tasks.push({
        id: `task-${taskId++}`,
        name: `Cook beef (${trays} trays)`,
        taskType: 'cook_protein',
        startTime: currentTime,
        endTime: currentTime + cookTime,
        durationMinutes: cookTime,
        category: 'critical_path',
        equipment: 'oven',
        details: `${batchLbs.toFixed(1)} lbs total`,
        parallelTasks: cookSuggestions.length > 0 ? cookSuggestions : undefined
      });
      currentTime += cookTime;

      // Blast chill beef - DOWNTIME
      const chillSuggestions = suggestParallelTasks(chillTime, 'blast_chill');
      tasks.push({
        id: `task-${taskId++}`,
        name: `Blast chill beef`,
        taskType: 'blast_chill',
        startTime: currentTime,
        endTime: currentTime + chillTime,
        durationMinutes: chillTime,
        category: 'critical_path',
        equipment: 'blast_chiller',
        details: `${trays} trays`,
        parallelTasks: chillSuggestions.length > 0 ? chillSuggestions : undefined
      });
      currentTime += chillTime;
    }
  }

  // STEP 4: Bake desserts (if prepped during protein cooking)
  if (hasDesserts && (!parallelTasksRemaining.has('prep_rice_krispy') || !parallelTasksRemaining.has('prep_brownies'))) {
    tasks.push({
      id: `task-${taskId++}`,
      name: `Bake desserts (brownies & rice krispy treats)`,
      taskType: 'bake_desserts',
      startTime: currentTime,
      endTime: currentTime + dessertTime,
      durationMinutes: dessertTime,
      category: 'critical_path',
      equipment: 'oven',
      details: 'Both desserts together'
    });
    currentTime += dessertTime;

    // Let rice krispy treats rest
    const restTime = 15;
    tasks.push({
      id: `task-${taskId++}`,
      name: `Let rice krispy treats rest`,
      taskType: 'rest_desserts',
      startTime: currentTime,
      endTime: currentTime + restTime,
      durationMinutes: restTime,
      category: 'critical_path',
      details: 'Cool before cutting'
    });
    currentTime += restTime;
  }

  const proteinCompleteTime = currentTime;

  // STEP 5: Assembly (can only start after all proteins are chilled)
  if (totalMeals > 0) {
    tasks.push({
      id: `task-${taskId++}`,
      name: `Assemble meals (${totalMeals} total)`,
      taskType: 'assemble_meals',
      startTime: currentTime,
      endTime: currentTime + assemblyTime,
      durationMinutes: assemblyTime,
      category: 'critical_path',
      details: `All ${totalMeals} meals`
    });
    currentTime += assemblyTime;
  }

  // STEP 6: Package and label
  tasks.push({
    id: `task-${taskId++}`,
    name: `Package and label`,
    taskType: 'package_label',
    startTime: currentTime,
    endTime: currentTime + packageTime,
    durationMinutes: packageTime,
    category: 'critical_path'
  });
  currentTime += packageTime;

  const totalTime = currentTime;

  // Calculate estimated idle time
  const totalParallelTime = sauceTime + (hasDesserts ? 20 : 0); // 10 min rice krispy + 10 min brownies
  const estimatedIdleTime = Math.max(0, proteinCompleteTime - riceTime - totalParallelTime);

  return {
    tasks,
    totalMinutes: totalTime,
    summary: {
      totalProteinBatches: chickenBatches + beefBatches,
      totalMeals: totalMeals + dessertMeals.reduce((sum, m) => sum + m.quantity, 0),
      blastChillerCycles: chickenBatches + beefBatches,
      estimatedIdleTime
    }
  };
}
