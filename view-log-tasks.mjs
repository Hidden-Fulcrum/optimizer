import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { productionLogTasks } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

const tasks = await db.select().from(productionLogTasks).where(eq(productionLogTasks.productionLogId, 1));

console.log('\nProduction Log ID 1 Tasks:');
console.log('='.repeat(80));

let totalEstimated = 0;
let totalActual = 0;

tasks.forEach((task, index) => {
  console.log(`\n${index + 1}. ${task.taskName} (${task.taskType})`);
  console.log(`   Estimated: ${task.estimatedMinutes} min`);
  console.log(`   Actual: ${task.actualMinutes || 0} min`);
  totalEstimated += task.estimatedMinutes;
  totalActual += (task.actualMinutes || 0);
});

console.log('\n' + '='.repeat(80));
console.log(`Total Estimated: ${totalEstimated} min (${Math.floor(totalEstimated/60)}h ${totalEstimated%60}m)`);
console.log(`Total Actual: ${totalActual} min (${Math.floor(totalActual/60)}h ${totalActual%60}m)`);
console.log(`Variance: ${totalActual - totalEstimated} min`);
