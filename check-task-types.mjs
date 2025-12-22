import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

const tasks = await db.select().from(schema.taskTemplates);
console.log('Task templates in database:');
tasks.forEach(t => {
  console.log(`  ID: ${t.id}, Type: ${t.taskType}, Name: ${t.name}, Duration: ${t.defaultDurationMinutes}`);
});
