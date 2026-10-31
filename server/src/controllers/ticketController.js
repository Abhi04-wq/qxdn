import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import { getIO } from '../socket.js';

const VALID_CATEGORIES = [
  'DEPOSIT_ISSUE',
  'WITHDRAWAL_QUERY',
  'STAKING_REWARDS',
  'REFERRAL_TREE',
  'SECURITY_2FA',
  'GENERAL_INQUIRY',
  'ACCOUNT_SUSPENSION',
  'APPEAL',
];

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const generateTicketId = async () => {
  for (let i = 0; i < 5; i++) {
    const randomHex = Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase().padStart(6, '0');
    const candidate = `TK-${randomHex}`;
    const exists = await Ticket.exists({ ticketId: candidate });
    if (!exists) return candidate;
  }
  return `TK-${Date.now().toString(36).toUpperCase().slice(-6)}`;
};

// @route   POST /api/tickets/create
// @desc    Member creates a new support ticket
export const createTicket = async (req, res, next) => {
  try {
    const { subject, category, priority = 'MEDIUM', message } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: 'Ticket subject is required' });
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Please select a valid ticket category' });
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority value' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Initial message is required' });
    }

    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const senderRole = req.user?.role === 'admin' ? 'admin' : 'member';
    const ticketId = await generateTicketId();

    const ticket = await Ticket.create({
      ticketId,
      userId,
      subject: subject.trim(),
      category,
      priority,
      status: 'OPEN',
      messages: [
        {
          sender: userId,
          senderRole,
          message: message.trim(),
          createdAt: new Date(),
        },
      ],
      lastActivityAt: new Date(),
    });

    const populated = await Ticket.findById(ticket._id)
      .populate('userId', 'email referralCode role isEmailVerified')
      .populate('messages.sender', 'email referralCode role')
      .lean();

    const io = getIO();
    if (io) {
      io.to('admin_tickets').emit('ticket_created', populated || ticket);
      io.emit('ticket_list_updated');
    }

    res.status(201).json({
      success: true,
      message: 'Support ticket opened successfully',
      data: populated || ticket,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/tickets/my-tickets
// @desc    Get all tickets created by current member
export const getMyTickets = async (req, res, next) => {
  try {
    const { status, category, search } = req.query;
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    const filter = { userId };

    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (category && category !== 'ALL') {
      filter.category = category;
    }
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { ticketId: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
      ];
    }

    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(String(userId))
      : userId;

    const [tickets, aggStats] = await Promise.all([
      Ticket.find(filter).sort({ lastActivityAt: -1 }).lean(),
      Ticket.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const stats = {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
    };

    aggStats.forEach((r) => {
      stats.total += r.count;
      if (r._id === 'OPEN') stats.open = r.count;
      if (r._id === 'IN_PROGRESS') stats.inProgress = r.count;
      if (r._id === 'RESOLVED') stats.resolved = r.count;
      if (r._id === 'CLOSED') stats.closed = r.count;
    });

    res.status(200).json({
      success: true,
      data: {
        tickets,
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/tickets/:id
// @desc    Get single ticket with full message thread
export const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { ticketId: id.toUpperCase() };

    const ticket = await Ticket.findOne(query)
      .populate('userId', 'email referralCode role')
      .populate('messages.sender', 'email referralCode role')
      .lean();

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found' });
    }

    const ticketOwnerId = String(ticket.userId?._id || ticket.userId);
    const isOwner = String(userId) === ticketOwnerId;
    const isAdmin = req.user?.role === 'admin';

    // Authorization check: member can only view their own ticket
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this ticket' });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/tickets/:id/reply
// @desc    Member adds a reply message to their ticket thread
export const replyTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { ticketId: id.toUpperCase() };

    const ticket = await Ticket.findOne(query);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found' });
    }

    const ticketOwnerId = String(ticket.userId?._id || ticket.userId);
    const isOwner = String(userId) === ticketOwnerId;
    const isAdmin = req.user?.role === 'admin';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to reply to this ticket' });
    }

    if (ticket.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'This ticket has been closed and cannot accept new replies' });
    }

    const senderRole = isAdmin ? 'admin' : 'member';
    ticket.messages.push({
      sender: userId,
      senderRole,
      message: message.trim(),
      createdAt: new Date(),
    });

    // If member replies to a resolved ticket, reopen to IN_PROGRESS
    if (senderRole === 'member' && ticket.status === 'RESOLVED') {
      ticket.status = 'IN_PROGRESS';
    }

    ticket.lastActivityAt = new Date();
    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate('userId', 'email referralCode role isEmailVerified')
      .populate('messages.sender', 'email referralCode role')
      .lean();

    const io = getIO();
    if (io) {
      io.to(`ticket:${ticket.ticketId}`).to(`ticket:${ticket._id}`).emit('ticket_message', {
        ticketId: ticket.ticketId,
        ticket: populated,
        message: populated.messages[populated.messages.length - 1],
      });
      io.to('admin_tickets').emit('ticket_updated', populated);
      io.emit('ticket_list_updated');
    }

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/tickets/:id/resolve
// @desc    Member or admin marks ticket as resolved
export const resolveTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { ticketId: id.toUpperCase() };

    const ticket = await Ticket.findOne(query);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found' });
    }

    const ticketOwnerId = String(ticket.userId?._id || ticket.userId);
    const isOwner = String(userId) === ticketOwnerId;
    const isAdmin = req.user?.role === 'admin';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this ticket' });
    }

    ticket.status = 'RESOLVED';
    ticket.lastActivityAt = new Date();
    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate('userId', 'email referralCode role isEmailVerified')
      .populate('messages.sender', 'email referralCode role')
      .lean();

    const io = getIO();
    if (io) {
      io.to(`ticket:${ticket.ticketId}`).to(`ticket:${ticket._id}`).emit('ticket_status_changed', {
        ticketId: ticket.ticketId,
        status: 'RESOLVED',
        ticket: populated || ticket,
      });
      io.to('admin_tickets').emit('ticket_updated', populated || ticket);
      io.emit('ticket_list_updated');
    }

    res.status(200).json({
      success: true,
      message: 'Ticket marked as resolved',
      data: populated || ticket,
    });
  } catch (error) {
    next(error);
  }
};

// ================= ADMIN ENDPOINTS ================= //

// @route   GET /api/admin/tickets
// @desc    Admin lists all support tickets with stats & filters
export const adminGetTickets = async (req, res, next) => {
  try {
    const { status, priority, category, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status && status !== 'ALL') filter.status = status;
    if (priority && priority !== 'ALL') filter.priority = priority;
    if (category && category !== 'ALL') filter.category = category;

    if (search && search.trim()) {
      const q = search.trim();
      const matchedUsers = await User.find({
        $or: [
          { email: { $regex: q, $options: 'i' } },
          { referralCode: { $regex: q, $options: 'i' } },
        ],
      }).select('_id');
      const uids = matchedUsers.map((u) => u._id);

      filter.$or = [
        { ticketId: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { userId: { $in: uids } },
      ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [tickets, totalCount, aggStats] = await Promise.all([
      Ticket.find(filter)
        .populate('userId', 'email referralCode role isEmailVerified')
        .sort({ lastActivityAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Ticket.countDocuments(filter),
      Ticket.aggregate([
        {
          $group: {
            _id: { status: '$status', priority: '$priority' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = {
      totalAll: 0,
      totalOpen: 0,
      totalInProgress: 0,
      totalResolved: 0,
      totalClosed: 0,
      totalUrgent: 0,
    };

    aggStats.forEach((r) => {
      stats.totalAll += r.count;
      if (r._id.status === 'OPEN') stats.totalOpen += r.count;
      if (r._id.status === 'IN_PROGRESS') stats.totalInProgress += r.count;
      if (r._id.status === 'RESOLVED') stats.totalResolved += r.count;
      if (r._id.status === 'CLOSED') stats.totalClosed += r.count;
      if (r._id.priority === 'URGENT' && r._id.status !== 'CLOSED') {
        stats.totalUrgent += r.count;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        tickets,
        stats,
        pagination: {
          total: totalCount,
          page: pageNum,
          pages: Math.ceil(totalCount / limitNum) || 1,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/admin/tickets/:id/reply
// @desc    Admin replies to ticket and optionally updates status
export const adminReplyTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, status } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { ticketId: id.toUpperCase() };

    const ticket = await Ticket.findOne(query);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found' });
    }

    ticket.messages.push({
      sender: userId,
      senderRole: 'admin',
      message: message.trim(),
      createdAt: new Date(),
    });

    if (status && VALID_STATUSES.includes(status)) {
      ticket.status = status;
    } else if (ticket.status === 'OPEN') {
      ticket.status = 'IN_PROGRESS';
    }

    ticket.lastActivityAt = new Date();
    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate('userId', 'email referralCode role isEmailVerified')
      .populate('messages.sender', 'email referralCode role')
      .lean();

    const io = getIO();
    if (io) {
      io.to(`ticket:${ticket.ticketId}`).to(`ticket:${ticket._id}`).emit('ticket_message', {
        ticketId: ticket.ticketId,
        ticket: populated,
        message: populated.messages[populated.messages.length - 1],
      });
      io.to('admin_tickets').emit('ticket_updated', populated);
      io.emit('ticket_list_updated');
    }

    res.status(200).json({
      success: true,
      message: 'Admin response sent successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/admin/tickets/:id/status
// @desc    Admin updates status or priority of a ticket
export const adminUpdateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { ticketId: id.toUpperCase() };

    const ticket = await Ticket.findOne(query);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found' });
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
      }
      ticket.status = status;
    }

    if (priority) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ success: false, message: 'Invalid priority value' });
      }
      ticket.priority = priority;
    }

    ticket.lastActivityAt = new Date();
    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate('userId', 'email referralCode role isEmailVerified')
      .populate('messages.sender', 'email referralCode role')
      .lean();

    const io = getIO();
    if (io) {
      io.to(`ticket:${ticket.ticketId}`).to(`ticket:${ticket._id}`).emit('ticket_status_changed', {
        ticketId: ticket.ticketId,
        status: ticket.status,
        priority: ticket.priority,
        ticket: populated,
      });
      io.to('admin_tickets').emit('ticket_updated', populated);
      io.emit('ticket_list_updated');
    }

    res.status(200).json({
      success: true,
      message: 'Ticket status updated successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};
