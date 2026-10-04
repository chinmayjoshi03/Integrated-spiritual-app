const express = require('express');

const { adminGetSupportOverview, adminGetSupportTicket, adminGetSupportTickets, adminPatchSupportTicket, adminReplySupportTicket, createSupportTicket, getMySupportTicket, getMySupportTickets, patchMySupportTicketStatus, replyMySupportTicket, } = require('../controllers/supportController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/admin/overview', requireRole('admin'), adminGetSupportOverview);
router.get('/admin/tickets', requireRole('admin'), adminGetSupportTickets);
router.get('/admin/tickets/:id', requireRole('admin'), adminGetSupportTicket);
router.post('/admin/tickets/:id/messages', requireRole('admin'), adminReplySupportTicket);
router.patch('/admin/tickets/:id', requireRole('admin'), adminPatchSupportTicket);

router.post('/tickets', createSupportTicket);
router.get('/tickets', getMySupportTickets);
router.get('/tickets/:id', getMySupportTicket);
router.post('/tickets/:id/messages', replyMySupportTicket);
router.patch('/tickets/:id/status', patchMySupportTicketStatus);

module.exports = router;
