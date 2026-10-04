import pool from '../db.js';
import { upload, getFileUrl } from '../utils/storage.js';
import { notifyMeditationPublished } from '../services/notifications/hooks.js';

export const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM meditation_categories ORDER BY name ASC');
    res.status(200).json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body || {};

    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const slug = name.toLowerCase().trim().replace(/\s+/g, '-');

    const result = await pool.query(
      `INSERT INTO meditation_categories (name, slug, description) VALUES ($1, $2, $3) RETURNING *`,
      [name, slug, description || null]
    );

    res.status(201).json({ category: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A category with this name already exists.' });
    }
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

const verifyMentorOwnsCourseForMeditation = async (courseId, userId, userRole) => {
  if (!courseId) return { authorized: true };

  const result = await pool.query('SELECT mentor_id FROM courses WHERE id = $1', [courseId]);

  if (result.rows.length === 0) {
    return { authorized: false, error: 'Course not found.', status: 404 };
  }

  if (userRole === 'admin' || result.rows[0].mentor_id === userId) {
    return { authorized: true };
  }

  return { authorized: false, error: 'You can only upload meditations for courses assigned to you.', status: 403 };
};

export const uploadMeditation = async (req, res) => {
  try {
    const { title, description, categoryId, mediaType, durationSeconds, courseId } = req.body || {};
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!title || !mediaType || !durationSeconds) {
      return res.status(400).json({ error: 'Title, media type, and duration are required.' });
    }

    if (!['audio', 'video'].includes(mediaType)) {
      return res.status(400).json({ error: 'Media type must be audio or video.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'A media file is required.' });
    }

    if (courseId) {
      const ownership = await verifyMentorOwnsCourseForMeditation(courseId, userId, userRole);
      if (!ownership.authorized) {
        return res.status(ownership.status).json({ error: ownership.error });
      }
    }

    const mediaUrl = getFileUrl(req.file.filename);

    const result = await pool.query(
      `INSERT INTO meditations (title, description, category_id, media_type, media_url, duration_seconds, created_by, course_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, description || null, categoryId || null, mediaType, mediaUrl, durationSeconds, userId, courseId || null]
    );

    const meditation = result.rows[0];
    await notifyMeditationPublished(meditation);

    res.status(201).json({ meditation });
  } catch (error) {
    console.error('Upload meditation error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const getMeditations = async (req, res) => {
  try {
    const { categoryId, courseId, scope } = req.query;
    const userId = req.user?.userId;

    let query = `
      SELECT m.*, c.name AS category_name, co.title AS course_title
      FROM meditations m
      LEFT JOIN meditation_categories c ON m.category_id = c.id
      LEFT JOIN courses co ON m.course_id = co.id
    `;
    const conditions = [];
    const params = [];

    if (scope === 'general') {
      conditions.push('m.course_id IS NULL');
    } else if (courseId) {
      params.push(courseId);
      conditions.push(`m.course_id = $${params.length}`);
    }

    if (categoryId) {
      params.push(categoryId);
      conditions.push(`m.category_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY m.created_at DESC';

    const result = await pool.query(query, params);

    const enrolledCourseIds = new Set();
    if (userId) {
      const enrollments = await pool.query('SELECT course_id FROM course_enrollments WHERE user_id = $1', [userId]);
      enrollments.rows.forEach((row) => enrolledCourseIds.add(row.course_id));
    }

    const meditations = result.rows.map((m) => {
      const isFree = !m.course_id;
      const hasAccess = isFree || enrolledCourseIds.has(m.course_id) || req.user?.role === 'admin' || req.user?.role === 'mentor';
      return {
        ...m,
        media_url: hasAccess ? m.media_url : null,
        locked: !hasAccess,
      };
    });

    res.status(200).json({ meditations });
  } catch (error) {
    console.error('Get meditations error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const getMeditationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const result = await pool.query(
      `SELECT m.*, c.name AS category_name, co.title AS course_title
       FROM meditations m
       LEFT JOIN meditation_categories c ON m.category_id = c.id
       LEFT JOIN courses co ON m.course_id = co.id
       WHERE m.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meditation not found.' });
    }

    const meditation = result.rows[0];

    let hasAccess = !meditation.course_id || userRole === 'admin' || userRole === 'mentor';

    if (!hasAccess && userId) {
      const enrollment = await pool.query(
        'SELECT id FROM course_enrollments WHERE user_id = $1 AND course_id = $2',
        [userId, meditation.course_id]
      );
      hasAccess = enrollment.rows.length > 0;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'You need to enroll in the related course to access this meditation.' });
    }

    res.status(200).json({ meditation });
  } catch (error) {
    console.error('Get meditation error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progressSeconds, completed } = req.body || {};
    const userId = req.user.userId;

    if (progressSeconds === undefined) {
      return res.status(400).json({ error: 'progressSeconds is required.' });
    }

    const result = await pool.query(
      `INSERT INTO meditation_progress (user_id, meditation_id, progress_seconds, completed, last_played_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, meditation_id)
       DO UPDATE SET progress_seconds = $3, completed = $4, last_played_at = NOW()
       RETURNING *`,
      [userId, id, progressSeconds, completed || false]
    );

    res.status(200).json({ progress: result.rows[0] });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const getUserProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM meditation_progress WHERE user_id = $1 AND meditation_id = $2',
      [userId, id]
    );

    res.status(200).json({ progress: result.rows[0] || null });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const toggleBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const existing = await pool.query(
      'SELECT id FROM meditation_bookmarks WHERE user_id = $1 AND meditation_id = $2',
      [userId, id]
    );

    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM meditation_bookmarks WHERE user_id = $1 AND meditation_id = $2', [
        userId,
        id,
      ]);
      return res.status(200).json({ bookmarked: false });
    }

    await pool.query(
      'INSERT INTO meditation_bookmarks (user_id, meditation_id) VALUES ($1, $2)',
      [userId, id]
    );
    res.status(200).json({ bookmarked: true });
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const getBookmarkStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT id FROM meditation_bookmarks WHERE user_id = $1 AND meditation_id = $2',
      [userId, id]
    );

    res.status(200).json({ bookmarked: result.rows.length > 0 });
  } catch (error) {
    console.error('Get bookmark status error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const getMeditationStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const progressResult = await pool.query(
      `SELECT COUNT(*) AS sessions_played, COUNT(*) FILTER (WHERE completed = true) AS sessions_completed
       FROM meditation_progress WHERE user_id = $1`,
      [userId]
    );

    const bookmarksResult = await pool.query(
      'SELECT COUNT(*) AS bookmark_count FROM meditation_bookmarks WHERE user_id = $1',
      [userId]
    );

    const recentResult = await pool.query(
      `SELECT m.id, m.title, m.media_type, mp.progress_seconds, mp.completed
       FROM meditation_progress mp
       JOIN meditations m ON mp.meditation_id = m.id
       WHERE mp.user_id = $1
       ORDER BY mp.last_played_at DESC
       LIMIT 1`,
      [userId]
    );

    res.status(200).json({
      sessionsPlayed: Number(progressResult.rows[0]?.sessions_played || 0),
      sessionsCompleted: Number(progressResult.rows[0]?.sessions_completed || 0),
      bookmarkCount: Number(bookmarksResult.rows[0]?.bookmark_count || 0),
      lastPlayed: recentResult.rows[0] || null,
    });
  } catch (error) {
    console.error('Get meditation stats error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};