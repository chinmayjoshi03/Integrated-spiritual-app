const { pool } = require('../db');
const { getFileUrl } = require('../utils/storage');

const createCourse = async (req, res) => {
  try {
    const { title, description, price, mentorId } = req.body || {};
    const createdBy = req.user.userId;

    if (!title) {
      return res.status(400).json({ error: 'Course title is required.' });
    }

    const thumbnailUrl = req.file ? getFileUrl(req.file.filename) : null;

    const result = await pool.query(
      `INSERT INTO courses (title, description, price, mentor_id, thumbnail_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description || null, price || 0, mentorId || null, thumbnailUrl, createdBy]
    );

    res.status(201).json({ course: result.rows[0] });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const getCourses = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const userId = req.user?.userId;
    const { status } = req.query;

    let query = `
      SELECT c.*, u.name AS mentor_name
      FROM courses c
      LEFT JOIN users u ON c.mentor_id = u.id
    `;
    const conditions = [];
    const params = [];

    if (isAdmin) {
      if (status && ['draft', 'published', 'cancelled'].includes(status)) {
        params.push(status);
        conditions.push(`c.status = $${params.length}`);
      }
    } else if (userId) {
      conditions.push(`(c.status = 'published' OR c.mentor_id = $${params.length + 1})`);
      params.push(userId);
    } else {
      conditions.push(`c.status = 'published'`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY c.created_at DESC';

    const result = await pool.query(query, params);
    res.status(200).json({ courses: result.rows });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.*, u.name AS mentor_name
       FROM courses c
       LEFT JOIN users u ON c.mentor_id = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    res.status(200).json({ course: result.rows[0] });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, mentorId, thumbnailUrl, status } = req.body || {};

    const existing = await pool.query('SELECT id FROM courses WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    if (status && !['draft', 'published', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const result = await pool.query(
      `UPDATE courses
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           mentor_id = COALESCE($4, mentor_id),
           thumbnail_url = COALESCE($5, thumbnail_url),
           status = COALESCE($6, status)
       WHERE id = $7
       RETURNING *`,
      [title, description, price, mentorId, thumbnailUrl, status, id]
    );

    res.status(200).json({ course: result.rows[0] });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

module.exports = { createCourse, getCourses, getCourseById, updateCourse };
