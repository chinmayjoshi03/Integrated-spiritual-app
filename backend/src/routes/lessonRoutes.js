const express = require('express');
const { createLesson, getLessonsByCourse, updateLesson, deleteLesson } = require('../controllers/lessonController');
const { upload } = require('../utils/storage');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.get('/', optionalAuth, getLessonsByCourse);
router.post('/', requireAuth, requireRole('mentor', 'admin'), upload.single('content'), createLesson);
router.patch('/:lessonId', requireAuth, requireRole('mentor', 'admin'), updateLesson);
router.delete('/:lessonId', requireAuth, requireRole('mentor', 'admin'), deleteLesson);

module.exports = router;