const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

function notFound(res, entity = 'Opportunity') {
  return res.status(404).json({ error: `${entity} not found.` });
}

/**
 * GET /api/volunteer/opportunities
 * List volunteer opportunities with application status for the current user.
 */
router.get('/opportunities', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT vo.id, vo.title, vo.description, vo.category, vo.location,
              vo.required_volunteers, vo.current_volunteers, vo.created_at,
              EXISTS(SELECT 1 FROM volunteer_applications va WHERE va.opportunity_id = vo.id AND va.user_id = $1) AS applied_by_user,
              (SELECT va.status FROM volunteer_applications va WHERE va.opportunity_id = vo.id AND va.user_id = $1 LIMIT 1) AS application_status
       FROM volunteer_opportunities vo
       ORDER BY vo.created_at DESC, vo.id ASC`,
      [req.user.id]
    );

    res.json({ opportunities: rows });
  } catch (err) {
    console.error('GET /api/volunteer/opportunities error:', err.message);
    res.status(500).json({ error: 'Failed to fetch volunteer opportunities.' });
  }
});

/**
 * POST /api/volunteer/apply
 * Apply for a volunteer opportunity.
 */
router.post('/apply', authenticate, async (req, res) => {
  try {
    const { opportunity_id, notes = '' } = req.body;

    if (!opportunity_id) {
      return res.status(400).json({ error: 'opportunity_id is required.' });
    }

    const { rows: oppCheck } = await pool.query(
      'SELECT id FROM volunteer_opportunities WHERE id = $1',
      [opportunity_id]
    );
    if (oppCheck.length === 0) return notFound(res, 'Opportunity');

    const { rows } = await pool.query(
      `INSERT INTO volunteer_applications (user_id, opportunity_id, notes, status)
       VALUES ($1, $2, $3, 'Applied')
       ON CONFLICT (user_id, opportunity_id)
       DO UPDATE SET notes = EXCLUDED.notes, applied_at = NOW()
       RETURNING *`,
      [req.user.id, opportunity_id, notes]
    );

    // Increment current_volunteers count if new application
    await pool.query(
      'UPDATE volunteer_opportunities SET current_volunteers = current_volunteers + 1 WHERE id = $1',
      [opportunity_id]
    );

    res.status(201).json({ message: 'Application submitted successfully.', application: rows[0] });
  } catch (err) {
    console.error('POST /api/volunteer/apply error:', err.message);
    res.status(500).json({ error: 'Failed to submit volunteer application.' });
  }
});

module.exports = router;
