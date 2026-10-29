import mongoose from 'mongoose';

/**
 * Audit record for every Saturday release batch (Step 4).
 * Append-only: created once per run, never mutated.
 * Each released ledger entry is stamped with the matching releaseBatch id.
 */
const releaseLogSchema = new mongoose.Schema(
  {
    releaseBatch: {
      type: String,
      required: true,
      unique: true,
    },
    trigger: {
      type: String,
      enum: ['cron', 'manual'],
      default: 'manual',
    },
    releasedAt: {
      type: Date,
      default: Date.now,
    },
    totalEntries: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    byType: {
      type: Map,
      of: Number,
      default: {},
    },
    perUser: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        amount: Number,
        entries: Number,
      },
    ],
  },
  { timestamps: true }
);

const ReleaseLog = mongoose.model('ReleaseLog', releaseLogSchema);
export default ReleaseLog;
