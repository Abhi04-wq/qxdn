import mongoose from 'mongoose';

/**
 * Append-only financial ledger (QNDX core rule).
 * Balances are NEVER stored on users - they are always derived as:
 *   balance = SUM(credits) - SUM(debits) over confirmed entries.
 * Entries are created once and never mutated (no update/save paths here).
 */
const ledgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['DEPOSIT', 'STAKE_LOCK', 'STAKING_DAILY_ACCRUAL', 'REFERRAL_BONUS', 'WITHDRAWAL', 'PROMOTIONAL_REWARD', 'WITHDRAWAL_REFUND', 'STAKE_UNLOCK'],
    },
    // Positive = credit, Negative = debit
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: (v) => Number.isFinite(v) && v !== 0,
        message: 'Amount must be a non-zero number',
      },
    },
    currency: {
      type: String,
      enum: ['USDT', 'SHIB', 'VET', 'WILD', 'DOGE'],
      default: 'USDT',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending',
    },
    confirmations: {
      type: Number,
      default: 0,
    },
    // Unique sparse index: same on-chain hash can never be credited twice
    txHash: {
      type: String,
      unique: true,
      sparse: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

ledgerSchema.index({ userId: 1, createdAt: -1 });
ledgerSchema.index({ userId: 1, type: 1, status: 1 });

// Static: append a confirmed entry, guarding against duplicate txHash credits
ledgerSchema.statics.appendConfirmed = function (doc) {
  return this.create({ ...doc, status: 'confirmed', confirmations: doc.confirmations ?? 15 });
};

const Ledger = mongoose.model('Ledger', ledgerSchema);

export default Ledger;
