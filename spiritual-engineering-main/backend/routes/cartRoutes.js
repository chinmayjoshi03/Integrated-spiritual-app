import express from 'express';
import { getCart, addToCart, updateCartItem, removeCartItem } from '../controllers/cartController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, getCart);
router.post('/', requireAuth, addToCart);
router.patch('/:itemId', requireAuth, updateCartItem);
router.delete('/:itemId', requireAuth, removeCartItem);

export default router;