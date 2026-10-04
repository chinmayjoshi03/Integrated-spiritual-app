const express = require('express');
const { getCart, addToCart, updateCartItem, removeCartItem } = require('../controllers/cartController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, getCart);
router.post('/', requireAuth, addToCart);
router.patch('/:itemId', requireAuth, updateCartItem);
router.delete('/:itemId', requireAuth, removeCartItem);

module.exports = router;