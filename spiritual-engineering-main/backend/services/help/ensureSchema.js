import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import pool from '../../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ensureHelpSchema = async () => {
  const possiblePaths = [
    path.join(__dirname, '../../database/schema/help_support.sql'),
    path.join(__dirname, '../../help_support.sql'),
  ];

  const sqlPath = possiblePaths.find((p) => fs.existsSync(p));
  if (!sqlPath) {
    console.warn('Help support schema SQL file not found, skipping schema init.');
    return;
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
};
