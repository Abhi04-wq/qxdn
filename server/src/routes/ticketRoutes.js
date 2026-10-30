import { Router } from 'express';
import {
  createTicket,
  getMyTickets,
  getTicketById,
  replyTicket,
  resolveTicket,
  adminGetTickets,
  adminReplyTicket,
  adminUpdateTicketStatus,
} from '../controllers/ticketController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Member ticket routes
router.post('/tickets/create', protect, createTicket);
router.get('/tickets/my-tickets', protect, getMyTickets);
router.get('/tickets/:id', protect, getTicketById);
router.post('/tickets/:id/reply', protect, replyTicket);
router.patch('/tickets/:id/resolve', protect, resolveTicket);

// Admin ticket management routes
router.get('/admin/tickets', protect, requireAdmin, adminGetTickets);
router.post('/admin/tickets/:id/reply', protect, requireAdmin, adminReplyTicket);
router.patch('/admin/tickets/:id/status', protect, requireAdmin, adminUpdateTicketStatus);

export default router;
