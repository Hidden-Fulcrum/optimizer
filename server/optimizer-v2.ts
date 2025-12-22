/**
 * Workflow Optimizer V2 - Focus on Bottlenecks
 * 
 * Key Principles:
 * 1. Blast chiller is the main constraint (5 trays max, sequential batches)
 * 2. Multiple protein batches can cook in oven simultaneously
 * 3. Prep tasks (rice, pasta, sauces, chopping) can happen during protein cooking
 * 4. Assembly can only start after ALL proteins are chilled
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
  category: 'critical_path' | 'parallel_work';
  equipment?: string;
  details?: string;
}

export interface OptimizedWorkflow {
  tasks: WorkflowTask[];
  totalMinutes: number;
  criticalPath: WorkflowTask[];
  parallelTasks: WorkflowTask[];
  summary: {
    totalProteinBatches: number;
    totalMeals: number;
    blastChillerCycles: number;
    estimatedIdleTime: number;
  };
}

const PROTEIN_WEIGHT_PER_MEAL = 0.5; // lbs per meal (approximate)

export function optimizeWorkflowV2(
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

      // Cook chicken
      tasks.push({
        id: `task-${taskId++}`,
        name: `Cook chicken (${trays} trays)`,
        taskType: 'cook_protein',
        startTime: currentTime,
        endTime: currentTime + cookTime,
        durationMinutes: cookTime,
        category: 'critical_path',
        equipment: 'oven',
        details: `${batchLbs.toFixed(1)} lbs total`
      });
      currentTime += cookTime;

      // Blast chill chicken
      tasks.push({
        id: `task-${taskId++}`,
        name: `Blast chill chicken`,
        taskType: 'blast_chill',
        startTime: currentTime,
        endTime: currentTime + chillTime,
        durationMinutes: chillTime,
        category: 'critical_path',
        equipment: 'blast_chiller',
        details: `${trays} trays`
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

      // Cook beef
      tasks.push({
        id: `task-${taskId++}`,
        name: `Cook beef (${trays} trays)`,
        taskType: 'cook_protein',
        startTime: currentTime,
        endTime: currentTime + cookTime,
        durationMinutes: cookTime,
        category: 'critical_path',
        equipment: 'oven',
        details: `${batchLbs.toFixed(1)} lbs total`
      });
      currentTime += cookTime;

      // Blast chill beef
      tasks.push({
        id: `task-${taskId++}`,
        name: `Blast chill beef`,
        taskType: 'blast_chill',
        startTime: currentTime,
        endTime: currentTime + chillTime,
        durationMinutes: chillTime,
        category: 'critical_path',
        equipment: 'blast_chiller',
        details: `${trays} trays`
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

  // PARALLEL TASKS: Things you can do during protein cooking
  const parallelTasks: WorkflowTask[] = [];

  // Cook rice/pasta (can start immediately)
  if (totalChickenQty > 0 || totalBeefQty > 0) {
    const riceTime = getTaskDuration('cook_rice_pasta');
    parallelTasks.push({
      id: `task-${taskId++}`,
      name: `Cook rice/pasta`,
      taskType: 'cook_rice_pasta',
      startTime: 0,
      endTime: riceTime,
      durationMinutes: riceTime,
      category: 'parallel_work',
      equipment: 'stovetop',
      details: 'For all meals'
    });
  }

  // Make sauces (can start immediately)
  const sauceTime = getTaskDuration('make_sauces');
  parallelTasks.push({
    id: `task-${taskId++}`,
    name: `Make sauces/sides`,
    taskType: 'make_sauces',
    startTime: 0,
    endTime: sauceTime,
    durationMinutes: sauceTime,
    category: 'parallel_work',
    details: 'For protein dishes'
  });

  // Bake desserts (can start immediately)
  const hasDesserts = noProteinMeals.some(m => m.category === 'dessert');
  if (hasDesserts) {
    const dessertTime = getTaskDuration('bake_desserts');
    parallelTasks.push({
      id: `task-${taskId++}`,
      name: `Bake desserts`,
      taskType: 'bake_desserts',
      startTime: 0,
      endTime: dessertTime,
      durationMinutes: dessertTime,
      category: 'parallel_work',
      equipment: 'oven',
      details: 'Brownies & rice krispy treats'
    });
  }

  // Combine all tasks
  const allTasks = [...tasks, ...parallelTasks].sort((a, b) => a.startTime - b.startTime);

  // Calculate idle time (time when you could be doing parallel work)
  const criticalPathTime = proteinCompleteTime;
  const longestParallelTask = Math.max(...parallelTasks.map(t => t.durationMinutes), 0);
  const estimatedIdleTime = Math.max(0, criticalPathTime - longestParallelTask);

  return {
    tasks: allTasks,
    totalMinutes: totalTime,
    criticalPath: tasks,
    parallelTasks,
    summary: {
      totalProteinBatches: chickenBatches + beefBatches,
      totalMeals,
      blastChillerCycles: chickenBatches + beefBatches,
      estimatedIdleTime
    }
  };
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}
