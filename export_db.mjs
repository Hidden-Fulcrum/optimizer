import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import fs from 'fs';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Get all tables
const [tables] = await connection.query('SHOW TABLES');
const tableNames = tables.map(t => Object.values(t)[0]);

console.log('Found tables:', tableNames);

const exportData = {};

for (const tableName of tableNames) {
  try {
    const [rows] = await connection.query(`SELECT * FROM ${tableName}`);
    exportData[tableName] = rows;
    console.log(`Exported ${tableName}: ${rows.length} rows`);
  } catch (error) {
    console.error(`Error exporting ${tableName}:`, error.message);
  }
}

fs.writeFileSync('/home/ubuntu/db_export.json', JSON.stringify(exportData, null, 2));
console.log('\nExport complete! Saved to /home/ubuntu/db_export.json');

await connection.end();
