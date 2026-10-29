import mongoose from 'mongoose';

const round = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;

/**
 * Immutable staking position (Developer Plan v2 / Step 3).
 * Rewards flow ONLY through append-only Ledger entries (STAKING_DAILY_ACCRUAL).
 * cumulativeReward tracks progress toward the 100% maxRewardCap.
 */
const stakingPositionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Staked amount is required'],
      min: [100, 'Minimum stake is 100 USDT'],
    },
    // Snapshot of the daily yield rate at stake activation (v2 tier rules)
    dailyRate: {
      type: Number,
      required: true,
      enum: {
        values: [0.004, 0.0045, 0.005],
        message: 'Invalid daily rate tier',
      },
    },
    ruleVersion: {
      type: String,
      default: 'v2.0',
    },
    cumulativeReward: {
      type: Number,
      default: 0,
      set: (v) => round(v),
    },
    // 100% cumulative reward cap (amount * 1.0)
    maxRewardCap: {
      type: Number,
      required: true,
      set: (v) => round(v),
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    lastAccrualDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

stakingPositionSchema.index({ userId: 1, status: 1 });
stakingPositionSchema.index({ status: 1, updatedAt: 1 });

// Virtual: progress toward 100% cumulative cap (percent, 2dp)
stakingPositionSchema.virtual('progressPercent').get(function () {
  if (!this.maxRewardCap) return 0;
  return Math.min(100, round((this.cumulativeReward / this.maxRewardCap) * 100));
});

stakingPositionSchema.set('toJSON', { virtuals: true });
stakingPositionSchema.set('toObject', { virtuals: true });

const StakingPosition = mongoose.model('StakingPosition', stakingPositionSchema);

export default StakingPosition;
