import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.execute('SELECT * FROM task_templates ORDER BY id');

console.log('Task Templates:');
rows.forEach(row => {
  console.log(`ID: ${row.id}, Type: ${row.task_type}, Name: ${row.name}, Duration: ${row.default_duration_minutes}, Parallel: ${row.can_run_in_parallel}`);
});

await connection.end();
