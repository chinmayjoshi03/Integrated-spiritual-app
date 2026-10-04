const fs = require('fs');
const path = require('path');
const { pool } = require('../db');


const ensureIntegratedSchema = async () => {
  const sqlPath = path.join(__dirname, 'schema', 'shop_and_courses.sql');
  if (!fs.existsSync(sqlPath)) {
    return;
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);
};


module.exports = { ensureIntegratedSchema };
