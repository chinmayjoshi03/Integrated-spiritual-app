import pool from '../db.js';

export const getMentors = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE role = 'mentor' ORDER BY name ASC"
    );
    res.status(200).json({ mentors: result.rows });
  } catch (error) {
    console.error('Get mentors error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};