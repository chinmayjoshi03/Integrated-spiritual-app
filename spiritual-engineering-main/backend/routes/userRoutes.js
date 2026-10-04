import express from 'express';
import { getMentors } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/mentors', requireAuth, requireRole('admin'), getMentors);

export default router;