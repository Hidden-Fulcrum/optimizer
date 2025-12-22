/**
 * Workflow Optimizer V3 - Integrated Timeline with Parallel Task Suggestions
 * 
 * Key Improvements:
 * 1. Inserts parallel task suggestions directly into critical path
 * 2. Shows what to do during cooking/chilling downtime
 * 3. Calculates which parallel tasks fit within each waiting period
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

export function optimizeWorkflowV3(
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

  // Separate meals by protein type
  const chickenMeals = meals.filter(m => m.proteinType === 'chicken');
  const beefMeals = meals.filter(m => m.proteinType === 'beef');
  const noProteinMeals = meals.filter(m => !m.requiresProtein);

  const totalChickenQty = chickenMeals.reduce((sum, m) => sum + m.quantity, 0);
  const totalBeefQty = beefMeals.reduce((sum, m) => sum + m.quantity, 0);
  const totalMeals = meals.reduce((sum, m) => sum + m.quantity, 0);

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
    parallelTasksRemaining.add('cook_rice_pasta');
    parallelTasksRemaining.add('make_sauces');
  }
  if (noProteinMeals.some(m => m.category === 'dessert')) {
    parallelTasksRemaining.add('bake_desserts');
  }

  // Helper function to suggest parallel tasks for a downtime period
  const suggestParallelTasks = (availableTime: number): string[] => {
    const suggestions: string[] = [];
    
    // Try to fit tasks into available time
    if (parallelTasksRemaining.has('make_sauces') && sauceTime <= availableTime) {
      suggestions.push(`Make sauces (${sauceTime} min)`);
      parallelTasksRemaining.delete('make_sauces');
    }
    
    if (parallelTasksRemaining.has('cook_rice_pasta') && riceTime <= availableTime) {
      suggestions.push(`Cook rice/pasta (${riceTime} min)`);
      parallelTasksRemaining.delete('cook_rice_pasta');
    }
    
    if (parallelTasksRemaining.has('bake_desserts') && dessertTime <= availableTime) {
      suggestions.push(`Bake desserts (${dessertTime} min)`);
      parallelTasksRemaining.delete('bake_desserts');
    }
    
    return suggestions;
  };

  // CRITICAL PATH: Chicken protein workflow
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

      // Cook chicken - THIS IS DOWNTIME
      const cookSuggestions = suggestParallelTasks(cookTime);
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

      // Blast chill chicken - THIS IS DOWNTIME
      const chillSuggestions = suggestParallelTasks(chillTime);
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

  // CRITICAL PATH: Beef protein workflow
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

      // Cook beef - THIS IS DOWNTIME
      const cookSuggestions = suggestParallelTasks(cookTime);
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

      // Blast chill beef - THIS IS DOWNTIME
      const chillSuggestions = suggestParallelTasks(chillTime);
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

  const proteinCompleteTime = currentTime;

  // CRITICAL PATH: Assembly (can only start after all proteins are chilled)
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

  // CRITICAL PATH: Package and label
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

  // Calculate total parallel work time
  const totalParallelTime = riceTime + sauceTime + (noProteinMeals.some(m => m.category === 'dessert') ? dessertTime : 0);
  const estimatedIdleTime = Math.max(0, proteinCompleteTime - totalParallelTime);

  return {
    tasks,
    totalMinutes: totalTime,
    summary: {
      totalProteinBatches: chickenBatches + beefBatches,
      totalMeals,
      blastChillerCycles: chickenBatches + beefBatches,
      estimatedIdleTime
    }
  };
}
