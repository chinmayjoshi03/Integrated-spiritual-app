require('dotenv').config();
const { Pool } = require('pg');

async function initializeDatabase() {
  const dbName = process.env.DB_NAME || 'spiritual_app';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432', 10);

  console.log('🔧 Initializing database setup...');
  console.log(`📌 Connecting to PostgreSQL at ${host}:${port} as user "${user}"...`);

  // Step 1: Connect to default 'postgres' database to ensure target database exists
  const rootPool = new Pool({ host, port, database: 'postgres', user, password });

  try {
    const dbCheckRes = await rootPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (dbCheckRes.rows.length === 0) {
      console.log(`🔨 Database "${dbName}" does not exist. Creating database...`);
      await rootPool.query(`CREATE DATABASE "${dbName}";`);
      console.log(`✅ Database "${dbName}" created!`);
    } else {
      console.log(`ℹ️ Database "${dbName}" already exists.`);
    }
  } catch (error) {
    console.error(`\n❌ PostgreSQL Connection Error: ${error.message}`);
    console.error(`\n============================================================`);
    console.error(`💡 HOW TO FIX:`);
    console.error(`1. Check your PostgreSQL credentials in backend/.env`);
    console.error(`   - DB_USER (current: "${user}")`);
    console.error(`   - DB_PASSWORD (current: "${password}")`);
    console.error(`   - DB_PORT (current: ${port})`);
    console.error(`2. Make sure your local PostgreSQL service is running.`);
    console.error(`3. Update DB_PASSWORD in backend/.env to match your PostgreSQL password.`);
    console.error(`============================================================\n`);
    await rootPool.end();
    process.exit(1);
  } finally {
    await rootPool.end();
  }

  // Step 2: Connect to target database and create tables
  const appPool = new Pool({ host, port, database: dbName, user, password });

  try {
    console.log(`🔧 Creating table schema in "${dbName}"...`);

    await appPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('✅ Table "users" created (or already exists)');

    await appPool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    console.log('✅ Index "idx_users_email" created (or already exists)');
    console.log('\n🎉 Database initialization complete!');
  } catch (error) {
    console.error('❌ Table schema creation failed:', error.message);
  } finally {
    await appPool.end();
  }
}

initializeDatabase();
