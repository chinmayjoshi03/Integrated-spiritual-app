const express = require('express');
const { getMentors } = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/mentors', requireAuth, requireRole('admin'), getMentors);

module.exports = router;