import express from 'express';
import { getAdminStats, getMentorStats } from '../controllers/statsController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin', requireAuth, requireRole('admin'), getAdminStats);
router.get('/mentor', requireAuth, requireRole('mentor'), getMentorStats);

export default router;