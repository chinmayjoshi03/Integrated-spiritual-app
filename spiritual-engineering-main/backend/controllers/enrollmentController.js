import pool from '../db.js';

export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    const courseResult = await pool.query(
      "SELECT id, status FROM courses WHERE id = $1",
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    if (courseResult.rows[0].status !== 'published') {
      return res.status(400).json({ error: 'This course is not available for purchase.' });
    }

    const existing = await pool.query(
      'SELECT id FROM course_enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'You are already enrolled in this course.' });
    }

    const result = await pool.query(
      'INSERT INTO course_enrollments (user_id, course_id) VALUES ($1, $2) RETURNING *',
      [userId, courseId]
    );

    res.status(201).json({ enrollment: result.rows[0] });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const getEnrollmentStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT id FROM course_enrollments WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    res.status(200).json({ enrolled: result.rows.length > 0 });
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const getMyEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT c.*, u.name AS mentor_name, e.purchased_at
       FROM course_enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN users u ON c.mentor_id = u.id
       WHERE e.user_id = $1
       ORDER BY e.purchased_at DESC`,
      [userId]
    );

    res.status(200).json({ courses: result.rows });
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};