import bcrypt from 'bcrypt';
import pool from '../db.js';

const accounts = [
  { name: 'Admin Demo', email: 'admin@spiritual.com', role: 'admin', pass: 'Admin@1234' },
  { name: 'Mentor Demo', email: 'mentor@spiritual.com', role: 'mentor', pass: 'Mentor@1234' },
  { name: 'User Demo', email: 'user@spiritual.com', role: 'user', pass: 'User@1234' }
];

async function seed() {
  for (const a of accounts) {
    const hash = await bcrypt.hash(a.pass, 10);
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [a.email]);
    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE users SET password_hash = $1, role = $2, is_verified = true WHERE email = $3',
        [hash, a.role, a.email]
      );
    } else {
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role, is_verified) VALUES ($1, $2, $3, $4, true)',
        [a.name, a.email, hash, a.role]
      );
    }
    console.log(`Seeded account: ${a.email} (${a.role}) -> Password: ${a.pass}`);
  }
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
