const express = require('express');
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct } = require('../controllers/productController');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');
const { upload } = require('../utils/storage');

const router = express.Router();

router.get('/', optionalAuth, getProducts);
router.get('/:id', getProductById);
router.post('/', requireAuth, requireRole('admin'), upload.single('image'), createProduct);
router.patch('/:id', requireAuth, requireRole('admin'), upload.single('image'), updateProduct);
router.delete('/:id', requireAuth, requireRole('admin'), deleteProduct);

module.exports = router;