import express from 'express';
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct } from '../controllers/productController.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/authMiddleware.js';
import { upload } from '../utils/storage.js';

const router = express.Router();

router.get('/', optionalAuth, getProducts);
router.get('/:id', getProductById);
router.post('/', requireAuth, requireRole('admin'), upload.single('image'), createProduct);
router.patch('/:id', requireAuth, requireRole('admin'), upload.single('image'), updateProduct);
router.delete('/:id', requireAuth, requireRole('admin'), deleteProduct);

export default router;