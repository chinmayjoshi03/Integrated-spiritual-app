const express = require('express');
const { enrollInCourse, getEnrollmentStatus, getMyEnrolledCourses } = require('../controllers/enrollmentController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/my-courses', requireAuth, getMyEnrolledCourses);
router.post('/:courseId/enroll', requireAuth, enrollInCourse);
router.get('/:courseId/enrollment-status', requireAuth, getEnrollmentStatus);

module.exports = router;