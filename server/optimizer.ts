/**
 * Workflow Optimization Engine
 * 
 * This module contains the core algorithm for optimizing meal prep workflows.
 * It schedules tasks to minimize total time while respecting dependencies and constraints.
 */

export interface MealQuantity {
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

export interface EquipmentConfig {
  blastChillerCapacity: number; // trays
  proteinPerTray: number; // lbs
}

export interface ScheduledTask {
  id: string;
  name: string;
  taskType: string;
  startTime: number; // minutes from start
  endTime: number; // minutes from start
  duration: number; // minutes
  canRunInParallel: boolean;
  dependsOn: string[];
  details?: string;
}

export interface OptimizedWorkflow {
  tasks: ScheduledTask[];
  totalMinutes: number;
  criticalPath: string[];
}

/**
 * Main optimization function
 */
export function optimizeWorkflow(
  meals: MealQuantity[],
  taskEstimates: TaskEstimate[],
  equipment: EquipmentConfig
): OptimizedWorkflow {
  const scheduledTasks: ScheduledTask[] = [];
  let taskIdCounter = 1;

  // Helper to get task estimate
  const getTaskDuration = (taskType: string): number => {
    const estimate = taskEstimates.find(t => t.taskType === taskType);
    return estimate?.durationMinutes || 0;
  };

  // Helper to check if task can run in parallel
  const canParallel = (taskType: string): boolean => {
    const estimate = taskEstimates.find(t => t.taskType === taskType);
    return estimate?.canRunInParallel ?? true;
  };

  // Calculate total protein needed
  const chickenMeals = meals.filter(m => m.proteinType === 'chicken');
  const beefMeals = meals.filter(m => m.proteinType === 'beef');
  
  const totalChickenLbs = chickenMeals.reduce((sum, m) => sum + (m.quantity * 0.5), 0); // assume 0.5 lb per meal
  const totalBeefLbs = beefMeals.reduce((sum, m) => sum + (m.quantity * 0.5), 0);

  let currentTime = 0;
  const proteinBatches: { type: string; lbs: number; startTime: number; endTime: number; chilledTime: number }[] = [];

  // Schedule protein production (critical path)
  const scheduleProteinBatch = (proteinType: string, totalLbs: number) => {
    if (totalLbs === 0) return;

    const maxPerBatch = equipment.blastChillerCapacity * equipment.proteinPerTray;
    const numBatches = Math.ceil(totalLbs / maxPerBatch);

    for (let batch = 0; batch < numBatches; batch++) {
      const batchLbs = Math.min(maxPerBatch, totalLbs - (batch * maxPerBatch));
      const numTrays = Math.ceil(batchLbs / equipment.proteinPerTray);

      // Grind protein
      const grindTask: ScheduledTask = {
        id: `task-${taskIdCounter++}`,
        name: `Grind ${proteinType} (${batchLbs.toFixed(1)} lbs)`,
        taskType: 'grind_protein',
        startTime: currentTime,
        endTime: currentTime + getTaskDuration('grind_protein'),
        duration: getTaskDuration('grind_protein'),
        canRunInParallel: false,
        dependsOn: [],
        details: `Batch ${batch + 1}/${numBatches}, ${numTrays} trays`
      };
      scheduledTasks.push(grindTask);
      currentTime = grindTask.endTime;

      // Cook protein
      const cookTask: ScheduledTask = {
        id: `task-${taskIdCounter++}`,
        name: `Cook ${proteinType} (${numTrays} trays)`,
        taskType: 'cook_protein',
        startTime: currentTime,
        endTime: currentTime + getTaskDuration('cook_protein'),
        duration: getTaskDuration('cook_protein'),
        canRunInParallel: false,
        dependsOn: [grindTask.id],
        details: `${batchLbs.toFixed(1)} lbs total`
      };
      scheduledTasks.push(cookTask);
      currentTime = cookTask.endTime;

      // Blast chill
      const chillTask: ScheduledTask = {
        id: `task-${taskIdCounter++}`,
        name: `Blast chill ${proteinType}`,
        taskType: 'blast_chill',
        startTime: currentTime,
        endTime: currentTime + getTaskDuration('blast_chill'),
        duration: getTaskDuration('blast_chill'),
        canRunInParallel: false,
        dependsOn: [cookTask.id],
        details: `${numTrays} trays`
      };
      scheduledTasks.push(chillTask);
      currentTime = chillTask.endTime;

      proteinBatches.push({
        type: proteinType,
        lbs: batchLbs,
        startTime: grindTask.startTime,
        endTime: cookTask.endTime,
        chilledTime: chillTask.endTime
      });
    }
  };

  // Schedule chicken first, then beef
  if (totalChickenLbs > 0) {
    scheduleProteinBatch('chicken', totalChickenLbs);
  }
  if (totalBeefLbs > 0) {
    scheduleProteinBatch('beef', totalBeefLbs);
  }

  // Find earliest protein ready time (when first batch is chilled)
  const firstProteinReady = proteinBatches.length > 0 ? proteinBatches[0].chilledTime : 0;

  // Schedule parallel tasks (can start immediately and run during protein production)
  const parallelTasks: ScheduledTask[] = [];
  let parallelStartTime = 0;

  // Check if we need rice/pasta
  const needsRice = meals.some(m => ['chicken', 'beef', 'oats'].includes(m.category));
  if (needsRice && getTaskDuration('cook_rice_pasta') > 0) {
    parallelTasks.push({
      id: `task-${taskIdCounter++}`,
      name: 'Cook rice/pasta',
      taskType: 'cook_rice_pasta',
      startTime: parallelStartTime,
      endTime: parallelStartTime + getTaskDuration('cook_rice_pasta'),
      duration: getTaskDuration('cook_rice_pasta'),
      canRunInParallel: true,
      dependsOn: [],
      details: 'For all meals'
    });
  }

  // Check if we need sauces
  const needsSauces = meals.some(m => ['chicken', 'beef'].includes(m.category));
  if (needsSauces && getTaskDuration('make_sauces') > 0) {
    parallelTasks.push({
      id: `task-${taskIdCounter++}`,
      name: 'Make sauces/sides',
      taskType: 'make_sauces',
      startTime: parallelStartTime,
      endTime: parallelStartTime + getTaskDuration('make_sauces'),
      duration: getTaskDuration('make_sauces'),
      canRunInParallel: true,
      dependsOn: [],
      details: 'For protein dishes'
    });
  }

  // Check if we need desserts
  const needsDesserts = meals.some(m => m.category === 'dessert');
  if (needsDesserts && getTaskDuration('bake_desserts') > 0) {
    parallelTasks.push({
      id: `task-${taskIdCounter++}`,
      name: 'Bake desserts',
      taskType: 'bake_desserts',
      startTime: parallelStartTime,
      endTime: parallelStartTime + getTaskDuration('bake_desserts'),
      duration: getTaskDuration('bake_desserts'),
      canRunInParallel: true,
      dependsOn: [],
      details: 'Brownies & rice krispy treats'
    });
  }

  scheduledTasks.push(...parallelTasks);

  // Schedule assembly (must wait for protein to be ready)
  const totalMealsToAssemble = meals.reduce((sum, m) => sum + m.quantity, 0);
  if (totalMealsToAssemble > 0 && getTaskDuration('assemble_meals') > 0) {
    const assemblyTask: ScheduledTask = {
      id: `task-${taskIdCounter++}`,
      name: `Assemble meals (${totalMealsToAssemble} total)`,
      taskType: 'assemble_meals',
      startTime: Math.max(currentTime, firstProteinReady),
      endTime: Math.max(currentTime, firstProteinReady) + getTaskDuration('assemble_meals'),
      duration: getTaskDuration('assemble_meals'),
      canRunInParallel: false,
      dependsOn: proteinBatches.length > 0 ? scheduledTasks.filter(t => t.taskType === 'blast_chill').map(t => t.id) : [],
      details: `All ${totalMealsToAssemble} meals`
    };
    scheduledTasks.push(assemblyTask);
    currentTime = assemblyTask.endTime;

    // Package and label
    if (getTaskDuration('package_label') > 0) {
      const packageTask: ScheduledTask = {
        id: `task-${taskIdCounter++}`,
        name: 'Package and label',
        taskType: 'package_label',
        startTime: currentTime,
        endTime: currentTime + getTaskDuration('package_label'),
        duration: getTaskDuration('package_label'),
        canRunInParallel: false,
        dependsOn: [assemblyTask.id],
        details: `${totalMealsToAssemble} meals`
      };
      scheduledTasks.push(packageTask);
      currentTime = packageTask.endTime;
    }
  }

  // Calculate total time
  const totalMinutes = Math.max(...scheduledTasks.map(t => t.endTime), 0);

  // Identify critical path (tasks that determine total time)
  const criticalPath = scheduledTasks
    .filter(t => !t.canRunInParallel || t.endTime === totalMinutes)
    .map(t => t.id);

  return {
    tasks: scheduledTasks.sort((a, b) => a.startTime - b.startTime),
    totalMinutes,
    criticalPath
  };
}

/**
 * Format minutes into hours and minutes
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${mins} min`;
  } else if (mins === 0) {
    return `${hours} hr`;
  } else {
    return `${hours} hr ${mins} min`;
  }
}
