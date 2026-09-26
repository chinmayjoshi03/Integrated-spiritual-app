const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

function notFound(res, entity = 'Meditation') {
  return res.status(404).json({ error: `${entity} not found.` });
}

/**
 * GET /api/meditations
 * List all meditations enriched with current user's progress.
 * Optional query: ?category=Guided | Sound | Breathwork | Ambient
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { category } = req.query;

    let queryStr = `
      SELECT m.id, m.title, m.description, m.category, m.audio_filename,
             m.duration_sec, m.guide_name, m.thumbnail_url, m.is_featured, m.sort_order,
             COALESCE(mp.completed, false) AS completed,
             COALESCE(mp.listened_sec, 0) AS listened_sec,
             mp.completed_at
      FROM meditations m
      LEFT JOIN meditation_progress mp ON mp.meditation_id = m.id AND mp.user_id = $1
    `;
    const params = [req.user.id];

    if (category && category !== 'All') {
      queryStr += ` WHERE m.category = $2`;
      params.push(category);
    }

    queryStr += ` ORDER BY m.sort_order ASC, m.id ASC`;

    const { rows } = await pool.query(queryStr, params);

    // Calculate user summary stats
    const { rows: stats } = await pool.query(
      `SELECT COUNT(id) FILTER (WHERE completed = true) AS completed_count,
              COALESCE(SUM(listened_sec), 0) AS total_seconds
       FROM meditation_progress
       WHERE user_id = $1`,
      [req.user.id]
    );

    const summary = {
      completed_count: parseInt(stats[0]?.completed_count || '0', 10),
      total_minutes: Math.round(parseInt(stats[0]?.total_seconds || '0', 10) / 60),
    };

    res.json({ meditations: rows, summary });
  } catch (err) {
    console.error('GET /api/meditations error:', err.message);
    res.status(500).json({ error: 'Failed to fetch meditations.' });
  }
});

/**
 * GET /api/meditations/:id
 * Fetch single meditation detail with user progress.
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const meditationId = parseInt(req.params.id, 10);
    const { rows } = await pool.query(
      `SELECT m.id, m.title, m.description, m.category, m.audio_filename,
              m.duration_sec, m.guide_name, m.thumbnail_url, m.is_featured,
              COALESCE(mp.completed, false) AS completed,
              COALESCE(mp.listened_sec, 0) AS listened_sec
       FROM meditations m
       LEFT JOIN meditation_progress mp ON mp.meditation_id = m.id AND mp.user_id = $1
       WHERE m.id = $2`,
      [req.user.id, meditationId]
    );

    if (rows.length === 0) return notFound(res, 'Meditation');

    res.json({ meditation: rows[0] });
  } catch (err) {
    console.error('GET /api/meditations/:id error:', err.message);
    res.status(500).json({ error: 'Failed to fetch meditation.' });
  }
});

/**
 * POST /api/meditations/:id/progress
 * Update listened seconds and completion status.
 */
router.post('/:id/progress', authenticate, async (req, res) => {
  try {
    const meditationId = parseInt(req.params.id, 10);
    const { listened_sec = 0, completed = false } = req.body;

    const { rows: medCheck } = await pool.query(
      'SELECT id, duration_sec FROM meditations WHERE id = $1',
      [meditationId]
    );
    if (medCheck.length === 0) return notFound(res, 'Meditation');

    const duration = medCheck[0].duration_sec;
    const isCompleted = completed || (duration > 0 && listened_sec >= duration - 5);

    const { rows } = await pool.query(
      `INSERT INTO meditation_progress (user_id, meditation_id, listened_sec, completed, last_listened_at, completed_at)
       VALUES ($1, $2, $3, $4, NOW(), CASE WHEN $4 = true THEN NOW() ELSE NULL END)
       ON CONFLICT (user_id, meditation_id)
       DO UPDATE SET
         listened_sec = GREATEST(meditation_progress.listened_sec, EXCLUDED.listened_sec),
         completed = meditation_progress.completed OR EXCLUDED.completed,
         last_listened_at = NOW(),
         completed_at = CASE
           WHEN EXCLUDED.completed = true AND meditation_progress.completed_at IS NULL THEN NOW()
           ELSE meditation_progress.completed_at
         END
       RETURNING *`,
      [req.user.id, meditationId, listened_sec, isCompleted]
    );

    res.json({ message: 'Progress saved successfully.', progress: rows[0] });
  } catch (err) {
    console.error('POST /api/meditations/:id/progress error:', err.message);
    res.status(500).json({ error: 'Failed to update meditation progress.' });
  }
});

module.exports = router;
