/**
 * Workflow Optimizer V5 - True Concurrent Workflow
 * 
 * Key insight: Distinguish between ACTIVE tasks (require worker attention) 
 * and PASSIVE tasks (equipment runs on its own, worker is free).
 * 
 * This allows realistic concurrency:
 * - Start rice cooking (PASSIVE) → Worker is FREE
 * - While rice cooks: Grind chicken (ACTIVE) → Worker is BUSY
 * - While rice still cooking: Cook chicken (PASSIVE) → Worker is FREE again
 * - While chicken cooks: Prep desserts (ACTIVE) → Worker is BUSY
 * - While chicken chills: Grind beef (ACTIVE) → Worker is BUSY
 */

export interface MealQuantity {
  mealId: number;
  mealName: string;
  quantity: number;
  proteinType: 'chicken' | 'beef' | 'none';
  chickenOz?: number;
  beefOz?: number;
}

export interface TaskTimes {
  grindProtein: number;
  cookProtein: number;
  blastChill: number;
  cookRicePasta: number;
  makeSauces: number;
  assembleMeals: number;
  packageLabel: number;
  prepDesserts: number;
  bakeDesserts: number;
  dessertRest: number;
}

export interface EquipmentConstraints {
  blastChillerCapacity: number; // trays
  proteinPerTray: number; // lbs
}

export interface WorkflowStep {
  stepNumber: number;
  taskName: string;
  duration: number;
  startTime: number;
  endTime: number;
  taskType: 'active' | 'passive'; // NEW: distinguish active vs passive
  equipment?: string;
  details?: string;
  concurrentWith?: string[]; // NEW: list of tasks happening at same time
}

export interface OptimizedWorkflow {
  steps: WorkflowStep[];
  totalTime: number;
  totalMeals: number;
  proteinBatches: number;
  chillerCycles: number;
  workerIdleTime: number;
  workerActiveTime: number; // NEW: track actual working time
  equipmentRunningTime: number; // Total time equipment is running (passive tasks)
}

export function optimizeWorkflowV5(
  meals: MealQuantity[],
  taskTimes: TaskTimes,
  equipment: EquipmentConstraints
): OptimizedWorkflow {
  const steps: WorkflowStep[] = [];
  let currentTime = 0;
  let stepNumber = 1;

  // Calculate protein requirements
  const chickenMeals = meals.filter(m => m.proteinType === 'chicken');
  const beefMeals = meals.filter(m => m.proteinType === 'beef');
  const desserts = meals.filter(m => m.mealName.includes('Brownie') || m.mealName.includes('Rice Krispy'));
  
  const totalChickenQty = chickenMeals.reduce((sum, m) => sum + m.quantity, 0);
  const totalBeefQty = beefMeals.reduce((sum, m) => sum + m.quantity, 0);
  const totalDessertQty = desserts.reduce((sum, m) => sum + m.quantity, 0);
  const totalMeals = meals.reduce((sum, m) => sum + m.quantity, 0);

  // Calculate actual protein weight from ingredient quantities
  let chickenLbs = 0;
  let beefLbs = 0;
  
  for (const meal of chickenMeals) {
    const chickenOz = meal.chickenOz || 0;
    chickenLbs += (chickenOz * meal.quantity) / 16; // Convert oz to lbs
  }
  
  for (const meal of beefMeals) {
    const beefOz = meal.beefOz || 0;
    beefLbs += (beefOz * meal.quantity) / 16; // Convert oz to lbs
  }

  // Calculate batches
  const maxProteinPerBatch = equipment.blastChillerCapacity * equipment.proteinPerTray;
  const chickenBatches = Math.ceil(chickenLbs / maxProteinPerBatch);
  const beefBatches = Math.ceil(beefLbs / maxProteinPerBatch);

  // Track worker state
  let workerFreeAt = 0; // When worker finishes current active task
  const passiveTasks: Array<{name: string, endTime: number}> = []; // Tasks running in background

  // Helper: Add a step with concurrency tracking
  const addStep = (
    taskName: string,
    duration: number,
    taskType: 'active' | 'passive',
    equipment?: string,
    details?: string
  ) => {
    const startTime = taskType === 'active' ? workerFreeAt : currentTime;
    const endTime = startTime + duration;

    // Find concurrent passive tasks
    const concurrentWith: string[] = [];
    for (const pt of passiveTasks) {
      if (pt.endTime > startTime) {
        concurrentWith.push(pt.name);
      }
    }

    steps.push({
      stepNumber: stepNumber++,
      taskName,
      duration,
      startTime,
      endTime,
      taskType,
      equipment,
      details,
      concurrentWith: concurrentWith.length > 0 ? concurrentWith : undefined
    });

    if (taskType === 'active') {
      workerFreeAt = endTime;
    } else {
      passiveTasks.push({name: taskName, endTime});
      // Clean up finished passive tasks
      const now = Math.max(currentTime, workerFreeAt);
      passiveTasks.splice(0, passiveTasks.length, ...passiveTasks.filter(pt => pt.endTime > now));
    }

    currentTime = Math.max(currentTime, endTime);
  };

  // STEP 1: Start rice/pasta cooking (PASSIVE - worker is free after starting)
  if (totalMeals > 0) {
    addStep('Cook rice/pasta', taskTimes.cookRicePasta, 'passive', 'stovetop', 'For all meals');
  }

  // STEP 2: While rice cooks, grind chicken (ACTIVE - worker is busy)
  if (chickenLbs > 0) {
    for (let batch = 1; batch <= chickenBatches; batch++) {
      const batchLbs = Math.min(chickenLbs - (batch - 1) * maxProteinPerBatch, maxProteinPerBatch);
      const trays = Math.ceil(batchLbs / equipment.proteinPerTray);
      
      addStep(
        `Grind chicken (${batchLbs.toFixed(1)} lbs)`,
        taskTimes.grindProtein,
        'active',
        'grinder',
        `Batch ${batch}/${chickenBatches}, ${trays} trays`
      );

      // STEP 3: Cook chicken (PASSIVE - worker is free)
      addStep(
        `Cook chicken (${trays} trays)`,
        taskTimes.cookProtein,
        'passive',
        'oven',
        `${batchLbs.toFixed(1)} lbs total`
      );

      // STEP 4: While chicken cooks, prep desserts if first batch (ACTIVE)
      if (batch === 1 && totalDessertQty > 0) {
        addStep(
          'Prep rice krispy treats',
          taskTimes.prepDesserts / 2,
          'active',
          undefined,
          'Mix and spread'
        );
        addStep(
          'Make brownie mix',
          taskTimes.prepDesserts / 2,
          'active',
          undefined,
          'Prepare batter'
        );
      }

      // STEP 5: Blast chill chicken (PASSIVE - worker is free)
      addStep(
        `Blast chill chicken`,
        taskTimes.blastChill,
        'passive',
        'blast_chiller',
        `${trays} trays`
      );

      // STEP 6: While chicken chills, make sauces if first batch (ACTIVE)
      if (batch === 1) {
        addStep(
          'Make sauces/sides',
          taskTimes.makeSauces,
          'active',
          undefined,
          'Prepare all sauces'
        );
      }
    }
  }

  // STEP 7: While chicken chills (or after), grind beef (ACTIVE)
  if (beefLbs > 0) {
    for (let batch = 1; batch <= beefBatches; batch++) {
      const batchLbs = Math.min(beefLbs - (batch - 1) * maxProteinPerBatch, maxProteinPerBatch);
      const trays = Math.ceil(batchLbs / equipment.proteinPerTray);
      
      addStep(
        `Grind beef (${batchLbs.toFixed(1)} lbs)`,
        taskTimes.grindProtein,
        'active',
        'grinder',
        `Batch ${batch}/${beefBatches}, ${trays} trays`
      );

      addStep(
        `Cook beef (${trays} trays)`,
        taskTimes.cookProtein,
        'passive',
        'oven',
        `${batchLbs.toFixed(1)} lbs total`
      );

      addStep(
        `Blast chill beef`,
        taskTimes.blastChill,
        'passive',
        'blast_chiller',
        `${trays} trays`
      );
    }
  }

  // STEP 8: Bake desserts (PASSIVE)
  if (totalDessertQty > 0) {
    addStep(
      'Bake desserts',
      taskTimes.bakeDesserts,
      'passive',
      'oven',
      'Brownies and rice krispy treats'
    );

    addStep(
      'Let desserts rest',
      taskTimes.dessertRest,
      'passive',
      undefined,
      'Cool before packaging'
    );
  }

  // STEP 9: Assemble meals (ACTIVE - requires worker attention)
  if (totalMeals > 0) {
    addStep(
      'Assemble meals',
      taskTimes.assembleMeals,
      'active',
      undefined,
      `${totalMeals} meals total`
    );
  }

  // STEP 10: Package and label (ACTIVE)
  if (totalMeals > 0) {
    addStep(
      'Package & label',
      taskTimes.packageLabel,
      'active',
      undefined,
      `${totalMeals} meals total`
    );
  }

  // Calculate metrics
  const totalTime = Math.max(currentTime, workerFreeAt);
  const workerActiveTime = steps
    .filter(s => s.taskType === 'active')
    .reduce((sum, s) => sum + s.duration, 0);
  const equipmentRunningTime = steps
    .filter(s => s.taskType === 'passive')
    .reduce((sum, s) => sum + s.duration, 0);
  const workerIdleTime = totalTime - workerActiveTime;

  return {
    steps,
    totalTime,
    totalMeals,
    proteinBatches: chickenBatches + beefBatches,
    chillerCycles: chickenBatches + beefBatches,
    workerIdleTime,
    workerActiveTime,
    equipmentRunningTime
  };
}
