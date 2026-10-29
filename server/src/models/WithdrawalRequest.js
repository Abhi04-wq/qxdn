import mongoose from 'mongoose';

const BEP20_REGEX = /^0x[a-fA-F0-9]{40}$/;

const withdrawalRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    grossAmount: {
      type: Number,
      required: [true, 'Gross amount is required'],
      min: [20, 'Minimum withdrawal amount is 20 USDT'],
      validate: {
        validator: (v) => Number.isFinite(v) && v >= 20,
        message: 'Gross amount must be a finite number of at least 20 USDT',
      },
    },
    feeAmount: {
      type: Number,
      required: [true, 'Fee amount is required'],
      min: [0, 'Fee amount cannot be negative'],
    },
    netAmount: {
      type: Number,
      required: [true, 'Net amount is required'],
      min: [0, 'Net amount cannot be negative'],
    },
    destinationAddress: {
      type: String,
      required: [true, 'Destination address is required'],
      trim: true,
      match: [BEP20_REGEX, 'Destination address must be a valid BEP-20 address (0x followed by 40 hex characters)'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    autoProcessed: {
      type: Boolean,
      default: false,
      index: true,
    },
    txHash: {
      type: String,
      default: null,
      trim: true,
    },
    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },
    ledgerEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ledger',
      required: [true, 'Linked ledger entry ID is required'],
    },
  },
  { timestamps: true }
);

withdrawalRequestSchema.index({ userId: 1, createdAt: -1 });
withdrawalRequestSchema.index({ status: 1, createdAt: -1 });

const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);

export default WithdrawalRequest;
