const express = require('express');
const { getAdminStats, getMentorStats } = require('../controllers/statsController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/admin', requireAuth, requireRole('admin'), getAdminStats);
router.get('/mentor', requireAuth, requireRole('mentor'), getMentorStats);

module.exports = router;