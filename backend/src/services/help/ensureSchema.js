const fs = require('fs');
const path = require('path');

const { pool } = require('../../db');


const ensureHelpSchema = async () => {
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


module.exports = { ensureHelpSchema };
