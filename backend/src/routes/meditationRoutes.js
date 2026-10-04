const express = require('express');
const { getCategories, createCategory, uploadMeditation, getMeditations, getMeditationById, updateProgress, getUserProgress, toggleBookmark, getBookmarkStatus, getMeditationStats, } = require('../controllers/meditationController');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');
const { upload } = require('../utils/storage');

const router = express.Router();

router.get('/categories', getCategories);
router.post('/categories', requireAuth, requireRole('mentor', 'admin'), createCategory);

router.get('/stats/me', requireAuth, getMeditationStats);

router.get('/', optionalAuth, getMeditations);
router.get('/:id', optionalAuth, getMeditationById);
router.post('/', requireAuth, requireRole('mentor', 'admin'), upload.single('media'), uploadMeditation);

router.get('/:id/progress', requireAuth, getUserProgress);
router.post('/:id/progress', requireAuth, updateProgress);

router.get('/:id/bookmark', requireAuth, getBookmarkStatus);
router.post('/:id/bookmark', requireAuth, toggleBookmark);

module.exports = router;