const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

function notFound(res, entity = 'Event') {
  return res.status(404).json({ error: `${entity} not found.` });
}

/**
 * GET /api/events
 * List upcoming events with user RSVP registration status.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.id, e.title, e.description, e.event_date, e.time_str, e.location, e.is_online,
              e.meeting_link, e.banner_url, e.attendees_count, e.created_at,
              EXISTS(SELECT 1 FROM event_registrations er WHERE er.event_id = e.id AND er.user_id = $1) AS registered_by_user
       FROM events e
       ORDER BY e.event_date ASC, e.id ASC`,
      [req.user.id]
    );

    res.json({ events: rows });
  } catch (err) {
    console.error('GET /api/events error:', err.message);
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
});

/**
 * GET /api/events/:id
 * Get single event detail with user RSVP status.
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const { rows } = await pool.query(
      `SELECT e.id, e.title, e.description, e.event_date, e.time_str, e.location, e.is_online,
              e.meeting_link, e.banner_url, e.attendees_count, e.created_at,
              EXISTS(SELECT 1 FROM event_registrations er WHERE er.event_id = e.id AND er.user_id = $1) AS registered_by_user
       FROM events e
       WHERE e.id = $2`,
      [req.user.id, eventId]
    );

    if (rows.length === 0) return notFound(res, 'Event');

    res.json({ event: rows[0] });
  } catch (err) {
    console.error('GET /api/events/:id error:', err.message);
    res.status(500).json({ error: 'Failed to fetch event details.' });
  }
});

/**
 * POST /api/events/:id/register
 * Toggle event registration / RSVP.
 */
router.post('/:id/register', authenticate, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const { rows: existing } = await pool.query(
      'SELECT id FROM event_registrations WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );

    let registered = false;
    if (existing.length > 0) {
      await pool.query('DELETE FROM event_registrations WHERE user_id = $1 AND event_id = $2', [userId, eventId]);
      await pool.query('UPDATE events SET attendees_count = GREATEST(0, attendees_count - 1) WHERE id = $1', [eventId]);
      registered = false;
    } else {
      await pool.query('INSERT INTO event_registrations (user_id, event_id) VALUES ($1, $2)', [userId, eventId]);
      await pool.query('UPDATE events SET attendees_count = attendees_count + 1 WHERE id = $1', [eventId]);
      registered = true;
    }

    const { rows: updated } = await pool.query('SELECT attendees_count FROM events WHERE id = $1', [eventId]);

    res.json({ registered, attendees_count: updated[0]?.attendees_count || 0 });
  } catch (err) {
    console.error('POST /api/events/:id/register error:', err.message);
    res.status(500).json({ error: 'Failed to update event registration.' });
  }
});

module.exports = router;
