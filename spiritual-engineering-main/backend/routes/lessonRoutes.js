import express from 'express';
import { createLesson, getLessonsByCourse, updateLesson, deleteLesson } from '../controllers/lessonController.js';
import { upload } from '../utils/storage.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.get('/', optionalAuth, getLessonsByCourse);
router.post('/', requireAuth, requireRole('mentor', 'admin'), upload.single('content'), createLesson);
router.patch('/:lessonId', requireAuth, requireRole('mentor', 'admin'), updateLesson);
router.delete('/:lessonId', requireAuth, requireRole('mentor', 'admin'), deleteLesson);

export default router;