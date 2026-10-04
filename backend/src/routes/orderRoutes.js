const express = require('express');
const { checkout, getMyOrders } = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/checkout', requireAuth, checkout);
router.get('/my-orders', requireAuth, getMyOrders);

module.exports = router;