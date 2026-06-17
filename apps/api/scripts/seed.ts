import fs from 'fs/promises';
import path from 'path';
import { pool } from '../src/config/db.js';

async function run() {
  const file = path.resolve(process.cwd(), '../../database/seed.sql');
  const sql = await fs.readFile(file, 'utf-8');
  // naive split by semicolon; ignore comments and empty lines
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (err) {
      console.warn('Seed statement failed (ignored):', err?.message || err, '\nStatement:', stmt.slice(0,120));
    }
  }

  console.log('Seed completed');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
