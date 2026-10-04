import express from 'express';
import { checkout, getMyOrders } from '../controllers/orderController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/checkout', requireAuth, checkout);
router.get('/my-orders', requireAuth, getMyOrders);

export default router;