import express from 'express';
import { enrollInCourse, getEnrollmentStatus, getMyEnrolledCourses } from '../controllers/enrollmentController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my-courses', requireAuth, getMyEnrolledCourses);
router.post('/:courseId/enroll', requireAuth, enrollInCourse);
router.get('/:courseId/enrollment-status', requireAuth, getEnrollmentStatus);

export default router;