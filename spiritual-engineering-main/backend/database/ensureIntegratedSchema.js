import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ensureIntegratedSchema = async () => {
  const sqlPath = path.join(__dirname, 'schema', 'shop_and_courses.sql');
  if (!fs.existsSync(sqlPath)) {
    return;
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
};
