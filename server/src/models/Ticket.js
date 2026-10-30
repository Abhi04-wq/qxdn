import mongoose from 'mongoose';

const ticketMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderRole: {
    type: String,
    enum: ['member', 'admin'],
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  attachments: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'DEPOSIT_ISSUE',
        'WITHDRAWAL_QUERY',
        'STAKING_REWARDS',
        'REFERRAL_TREE',
        'SECURITY_2FA',
        'GENERAL_INQUIRY',
      ],
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    messages: [ticketMessageSchema],
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

ticketSchema.index({ userId: 1, lastActivityAt: -1 });
ticketSchema.index({ status: 1, priority: 1, lastActivityAt: -1 });

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
