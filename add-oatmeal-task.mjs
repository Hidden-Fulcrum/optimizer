import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Add oatmeal prep task template
await connection.execute(`
  INSERT INTO task_templates (name, task_type, default_duration_minutes, can_run_in_parallel, requires_equipment)
  VALUES ('Oatmeal Prep', 'oatmeal_prep', 25, 1, NULL)
`);

console.log('✓ Added Oatmeal Prep task template');

await connection.end();
