const express = require('express');

const { listOpportunities, getOpportunityById, applyToOpportunity, cancelMyApplication, getMyVolunteering, uploadVolunteerBanner, } = require('../controllers/volunteerController');

const { adminListOpportunities, adminGetStats, createOpportunity, updateOpportunity, publishOpportunity, unpublishOpportunity, closeOpportunity, completeOpportunity, cancelOpportunity, deleteOpportunity, listApplications, approveApplication, rejectApplication, cancelApplication, completeApplication, issueVolunteerCertificate, } = require('../controllers/volunteerAdminController');

const { getAttendance, upsertAttendance, } = require('../controllers/volunteerAttendanceController');

const { optionalAuth, requireAuth, requireRole, } = require('../middleware/auth');

const { createImageUpload, handleUploadError, } = require('../utils/storage');

const volunteerBannerUpload = createImageUpload('volunteering');
const router = express.Router();

router.get('/', optionalAuth, listOpportunities);

router.get(
  '/admin/all',
  requireAuth,
  requireRole('admin'),
  adminListOpportunities
);

router.get(
  '/admin/stats',
  requireAuth,
  requireRole('admin'),
  adminGetStats
);

router.get('/my', requireAuth, getMyVolunteering);

router.post(
  '/uploads/banner',
  requireAuth,
  requireRole('admin'),
  volunteerBannerUpload.single('banner'),
  handleUploadError,
  uploadVolunteerBanner
);

router.patch(
  '/applications/:applicationId/approve',
  requireAuth,
  requireRole('admin'),
  approveApplication
);

router.patch(
  '/applications/:applicationId/reject',
  requireAuth,
  requireRole('admin'),
  rejectApplication
);

router.patch(
  '/applications/:applicationId/cancel',
  requireAuth,
  requireRole('admin'),
  cancelApplication
);

router.patch(
  '/applications/:applicationId/complete',
  requireAuth,
  requireRole('admin'),
  completeApplication
);

router.post(
  '/applications/:applicationId/certificate',
  requireAuth,
  requireRole('admin'),
  issueVolunteerCertificate
);

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  createOpportunity
);

router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  updateOpportunity
);

router.patch(
  '/:id/publish',
  requireAuth,
  requireRole('admin'),
  publishOpportunity
);

router.patch(
  '/:id/unpublish',
  requireAuth,
  requireRole('admin'),
  unpublishOpportunity
);

router.patch(
  '/:id/close',
  requireAuth,
  requireRole('admin'),
  closeOpportunity
);

router.patch(
  '/:id/complete',
  requireAuth,
  requireRole('admin'),
  completeOpportunity
);

router.patch(
  '/:id/cancel',
  requireAuth,
  requireRole('admin'),
  cancelOpportunity
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  deleteOpportunity
);

router.get(
  '/:id/applications',
  requireAuth,
  requireRole('admin'),
  listApplications
);

router.get(
  '/:id/attendance',
  requireAuth,
  requireRole('admin'),
  getAttendance
);

router.put(
  '/:id/attendance',
  requireAuth,
  requireRole('admin'),
  upsertAttendance
);

router.post('/:id/apply', requireAuth, applyToOpportunity);
router.delete('/:id/application', requireAuth, cancelMyApplication);

router.get('/:id', optionalAuth, getOpportunityById);

module.exports = router;
