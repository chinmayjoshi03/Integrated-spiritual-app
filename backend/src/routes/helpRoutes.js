const express = require('express');

const { getHelpCategories, getHelpFaqById, getHelpFaqs, postFaqFeedback, searchHelp, } = require('../controllers/helpController');
const { adminCreateFaqHandler, adminDeleteFaqHandler, adminGetFaqById, adminGetFaqs, adminUpdateFaqHandler, } = require('../controllers/helpAdminController');
const { optionalAuth, requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', getHelpCategories);
router.get('/search', searchHelp);
router.get('/faqs', getHelpFaqs);

router.get(
  '/admin/faqs',
  requireAuth,
  requireRole('admin'),
  adminGetFaqs
);
router.post(
  '/admin/faqs',
  requireAuth,
  requireRole('admin'),
  adminCreateFaqHandler
);
router.get(
  '/admin/faqs/:id',
  requireAuth,
  requireRole('admin'),
  adminGetFaqById
);
router.patch(
  '/admin/faqs/:id',
  requireAuth,
  requireRole('admin'),
  adminUpdateFaqHandler
);
router.delete(
  '/admin/faqs/:id',
  requireAuth,
  requireRole('admin'),
  adminDeleteFaqHandler
);

router.post('/faqs/:id/feedback', requireAuth, postFaqFeedback);
router.get('/faqs/:id', optionalAuth, getHelpFaqById);

module.exports = router;
