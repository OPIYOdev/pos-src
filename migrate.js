#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const DATABASE_URL = process.env.DATABASE_URL;
async function runMigrations() {
  if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable not set');
    process.exit(1);
  }
  const connection = await mysql.createConnection(DATABASE_URL);
  try {
    console.log('Starting database migrations...');
    const sqlDir = path.join(__dirname, 'sql');
    const files = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      const filePath = path.join(sqlDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Executing: ${file}`);
      await connection.query(sql);
      console.log(`✅ ${file} completed`);
    }
    console.log('✅ All migrations completed successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}
runMigrations();
