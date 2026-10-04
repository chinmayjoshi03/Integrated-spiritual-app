const express = require('express');
const { createCourse, getCourses, getCourseById, updateCourse } = require('../controllers/courseController');
const lessonRoutes = require('./lessonRoutes');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');
const { upload } = require('../utils/storage');
const router = express.Router();

router.get('/', optionalAuth, getCourses);
router.get('/:id', getCourseById);
router.post('/', requireAuth, requireRole('admin'), upload.single('thumbnail'), createCourse);

router.patch('/:id', requireAuth, requireRole('admin'), updateCourse);

router.use('/:courseId/lessons', lessonRoutes);

module.exports = router;