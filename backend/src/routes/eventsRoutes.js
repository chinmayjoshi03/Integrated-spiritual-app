const express = require('express');

const { getEvents, getEventById, getAdminEvents, getMyEvents, createEvent, updateEvent, cancelEvent, deleteEvent, registerForEvent, } = require('../controllers/eventsController');

const { getEventRegistrations, removeEventRegistration, getEventAttendance, upsertEventAttendance, getEventCertificates, issueEventCertificate, issueEligibleEventCertificates, getMyEventCertificate, getEventAnalytics, } = require('../controllers/eventsOpsController');

const { joinEventSession, heartbeatEventSession, leaveEventSession, uploadEventBanner, } = require('../controllers/eventsSessionController');

const { optionalAuth, requireAuth, requireRole, } = require('../middleware/auth');

const { createImageUpload, handleUploadError, } = require('../utils/storage');

const eventBannerUpload = createImageUpload('events');

const router = express.Router();

router.get('/', getEvents);

router.get(
  '/admin/all',
  requireAuth,
  requireRole('admin'),
  getAdminEvents
);

router.get(
  '/my-events',
  requireAuth,
  getMyEvents
);

router.post(
  '/uploads/banner',
  requireAuth,
  requireRole('admin'),
  eventBannerUpload.single('banner'),
  handleUploadError,
  uploadEventBanner
);

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  createEvent
);

router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  updateEvent
);

router.patch(
  '/:id/cancel',
  requireAuth,
  requireRole('admin'),
  cancelEvent
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  deleteEvent
);

router.post(
  '/:id/register',
  requireAuth,
  registerForEvent
);

router.get(
  '/:id/registrations',
  requireAuth,
  requireRole('admin'),
  getEventRegistrations
);

router.delete(
  '/:id/registrations/:userId',
  requireAuth,
  requireRole('admin'),
  removeEventRegistration
);

router.get(
  '/:id/attendance',
  requireAuth,
  requireRole('admin'),
  getEventAttendance
);

router.put(
  '/:id/attendance',
  requireAuth,
  requireRole('admin'),
  upsertEventAttendance
);

router.get(
  '/:id/certificates/me',
  requireAuth,
  getMyEventCertificate
);

router.get(
  '/:id/certificates',
  requireAuth,
  requireRole('admin'),
  getEventCertificates
);

router.post(
  '/:id/certificates/issue-eligible',
  requireAuth,
  requireRole('admin'),
  issueEligibleEventCertificates
);

router.post(
  '/:id/certificates',
  requireAuth,
  requireRole('admin'),
  issueEventCertificate
);

router.get(
  '/:id/analytics',
  requireAuth,
  requireRole('admin'),
  getEventAnalytics
);

router.post(
  '/:id/session/join',
  requireAuth,
  joinEventSession
);

router.post(
  '/:id/session/heartbeat',
  requireAuth,
  heartbeatEventSession
);

router.post(
  '/:id/session/leave',
  requireAuth,
  leaveEventSession
);

router.get('/:id', optionalAuth, getEventById);

module.exports = router;
