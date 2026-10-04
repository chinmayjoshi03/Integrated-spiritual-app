import express from 'express';
import { createCourse, getCourses, getCourseById, updateCourse } from '../controllers/courseController.js';
import lessonRoutes from './lessonRoutes.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/authMiddleware.js';
import { upload } from '../utils/storage.js';
const router = express.Router();

router.get('/', optionalAuth, getCourses);
router.get('/:id', getCourseById);
router.post('/', requireAuth, requireRole('admin'), upload.single('thumbnail'), createCourse);

router.patch('/:id', requireAuth, requireRole('admin'), updateCourse);

router.use('/:courseId/lessons', lessonRoutes);

export default router;