const express = require('express');

const { getGroups, getGroupById, createGroup, joinGroup, leaveGroup, getGroupQuestions, createQuestion, getRecentQuestions, getQuestionById, createReply, uploadCommunityBanner, } = require('../controllers/communityController');

const { adminGetGroups, adminGetGroupById, adminGetQuestionById, adminUpdateGroupStatus, adminRemoveQuestion, adminRemoveReply, } = require('../controllers/communityAdminController');

const { requireAuth, requireRole, } = require('../middleware/auth');

const { createImageUpload, handleUploadError, } = require('../utils/storage');

const communityBannerUpload = createImageUpload('community');
const router = express.Router();

router.use(requireAuth);

router.get(
  '/admin/groups',
  requireRole('admin'),
  adminGetGroups
);
router.get(
  '/admin/groups/:id',
  requireRole('admin'),
  adminGetGroupById
);
router.patch(
  '/admin/groups/:id',
  requireRole('admin'),
  adminUpdateGroupStatus
);
router.get(
  '/admin/questions/:id',
  requireRole('admin'),
  adminGetQuestionById
);
router.patch(
  '/admin/questions/:id',
  requireRole('admin'),
  adminRemoveQuestion
);
router.patch(
  '/admin/replies/:id',
  requireRole('admin'),
  adminRemoveReply
);

router.post(
  '/uploads/banner',
  communityBannerUpload.single('banner'),
  handleUploadError,
  uploadCommunityBanner
);

router.get('/groups', getGroups);
router.post('/groups', createGroup);
router.get('/groups/:id/questions', getGroupQuestions);
router.post('/groups/:id/questions', createQuestion);
router.post('/groups/:id/join', joinGroup);
router.delete('/groups/:id/leave', leaveGroup);
router.get('/groups/:id', getGroupById);

router.get('/questions', getRecentQuestions);
router.get('/questions/:id', getQuestionById);
router.post('/questions/:id/replies', createReply);

module.exports = router;
