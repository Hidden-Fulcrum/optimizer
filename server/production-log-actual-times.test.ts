import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Production Log with Actual Task Times', () => {
  let logId: number;

  beforeAll(async () => {
    // Create a production log with tasks that have actual times
    logId = await db.createProductionLog({
      userId: 1,
      totalEstimatedMinutes: 125,
      totalWallClockMinutes: 179,
      notes: 'Test production run with actual task times',
    });

    // Create tasks with actual times
    await db.createProductionLogTask({
      productionLogId: logId,
      taskType: 'active',
      taskName: 'Grind chicken',
      estimatedMinutes: 15,
      actualMinutes: 20, // 5 min over estimate
    });

    await db.createProductionLogTask({
      productionLogId: logId,
      taskType: 'passive',
      taskName: 'Cook chicken',
      estimatedMinutes: 30,
      actualMinutes: 35, // 5 min over estimate
    });

    await db.createProductionLogTask({
      productionLogId: logId,
      taskType: 'active',
      taskName: 'Assemble meals',
      estimatedMinutes: 40,
      actualMinutes: 38, // 2 min under estimate
    });
  });

  it('should save actual task times to database', async () => {
    const tasks = await db.getProductionLogTasks(logId);
    
    expect(tasks).toHaveLength(3);
    expect(tasks[0].actualMinutes).toBe(20);
    expect(tasks[1].actualMinutes).toBe(35);
    expect(tasks[2].actualMinutes).toBe(38);
  });

  it('should calculate variance correctly', async () => {
    const tasks = await db.getProductionLogTasks(logId);
    
    // Grind chicken: 20 actual - 15 estimated = +5 variance
    const grindTask = tasks.find(t => t.taskName === 'Grind chicken');
    expect(grindTask?.actualMinutes! - grindTask?.estimatedMinutes!).toBe(5);

    // Cook chicken: 35 actual - 30 estimated = +5 variance
    const cookTask = tasks.find(t => t.taskName === 'Cook chicken');
    expect(cookTask?.actualMinutes! - cookTask?.estimatedMinutes!).toBe(5);

    // Assemble meals: 38 actual - 40 estimated = -2 variance
    const assembleTask = tasks.find(t => t.taskName === 'Assemble meals');
    expect(assembleTask?.actualMinutes! - assembleTask?.estimatedMinutes!).toBe(-2);
  });

  it('should identify bottlenecks (tasks over estimate by 5+ min)', async () => {
    const tasks = await db.getProductionLogTasks(logId);
    
    const bottlenecks = tasks.filter(t => 
      t.actualMinutes && t.estimatedMinutes && 
      (t.actualMinutes - t.estimatedMinutes) >= 5
    );

    expect(bottlenecks).toHaveLength(2); // Grind chicken and Cook chicken
    expect(bottlenecks.map(t => t.taskName)).toContain('Grind chicken');
    expect(bottlenecks.map(t => t.taskName)).toContain('Cook chicken');
  });
});
