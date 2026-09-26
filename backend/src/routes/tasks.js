const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const DEFAULT_TASKS = [
  'Morning prayer',
  'Meditation',
  'Reading',
  'Gratitude journal',
  'Evening reflection',
];

/**
 * GET /api/tasks/today
 * Returns today's task list for the authenticated user.
 * Creates default rows if none exist for today.
 */
router.get('/today', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Ensure rows exist for today
    for (const name of DEFAULT_TASKS) {
      await pool.query(
        `INSERT INTO daily_tasks (user_id, task_name, task_date)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, task_name, task_date) DO NOTHING`,
        [req.user.id, name, today]
      );
    }

    const { rows } = await pool.query(
      `SELECT id, task_name, completed
       FROM daily_tasks
       WHERE user_id = $1 AND task_date = $2
       ORDER BY id ASC`,
      [req.user.id, today]
    );

    res.json({ tasks: rows });
  } catch (err) {
    console.error('GET /tasks/today error:', err.message);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

/**
 * POST /api/tasks/:taskId/toggle
 * Toggles the completed state of a single task.
 */
router.post('/:taskId/toggle', authenticate, async (req, res) => {
  const taskId = parseInt(req.params.taskId, 10);
  if (isNaN(taskId)) return res.status(400).json({ error: 'Invalid task id.' });

  try {
    const { rows } = await pool.query(
      `UPDATE daily_tasks
       SET completed = NOT completed
       WHERE id = $1 AND user_id = $2
       RETURNING id, task_name, completed`,
      [taskId, req.user.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Task not found.' });
    res.json({ task: rows[0] });
  } catch (err) {
    console.error('POST /tasks toggle error:', err.message);
    res.status(500).json({ error: 'Failed to toggle task.' });
  }
});

module.exports = router;
