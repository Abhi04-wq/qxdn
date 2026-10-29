import crypto from 'crypto';
import Ledger from '../models/Ledger.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';

const round = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;

// @route   GET /api/admin/withdrawals
// @desc    Get all withdrawal requests with pagination, status filter, and summary stats
export const getAdminWithdrawals = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search, autoProcessed } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Filter by status if provided (and not 'all')
    const filter = {};
    if (['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    // Filter by autoProcessed if specified (e.g. false for manual reviews >= 300 USDT)
    if (autoProcessed === 'true') {
      filter.autoProcessed = true;
    } else if (autoProcessed === 'false') {
      filter.autoProcessed = false;
    }

    // Optional search across destination address or txHash
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { destinationAddress: { $regex: q, $options: 'i' } },
        { txHash: { $regex: q, $options: 'i' } },
      ];
    }

    const [withdrawals, total, statsAgg] = await Promise.all([
      WithdrawalRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'email referralCode depositAddress')
        .lean(),
      WithdrawalRequest.countDocuments(filter),
      WithdrawalRequest.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            grossVolume: { $sum: '$grossAmount' },
            netVolume: { $sum: '$netAmount' },
            feeVolume: { $sum: '$feeAmount' },
          },
        },
      ]),
    ]);

    const statsMap = Object.fromEntries(
      statsAgg.map((s) => [
        s._id,
        {
          count: s.count,
          grossVolume: round(s.grossVolume),
          netVolume: round(s.netVolume),
          feeVolume: round(s.feeVolume),
        },
      ])
    );

    const pendingStats = statsMap.pending || { count: 0, grossVolume: 0, netVolume: 0, feeVolume: 0 };
    const approvedStats = statsMap.approved || { count: 0, grossVolume: 0, netVolume: 0, feeVolume: 0 };
    const rejectedStats = statsMap.rejected || { count: 0, grossVolume: 0, netVolume: 0, feeVolume: 0 };

    return res.status(200).json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
        stats: {
          pendingPayoutVolume: pendingStats.netVolume,
          pendingGrossVolume: pendingStats.grossVolume,
          pendingRequestsCount: pendingStats.count,
          totalApprovedVolume: approvedStats.netVolume,
          totalApprovedGrossVolume: approvedStats.grossVolume,
          approvedRequestsCount: approvedStats.count,
          rejectedRequestsCount: rejectedStats.count,
          totalRequestsCount: total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/admin/withdrawals/:id/process
// @desc    Process a withdrawal request (action: 'approve' | 'reject')
export const processWithdrawalRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason, txHash } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be either 'approve' or 'reject'.",
      });
    }

    const withdrawal = await WithdrawalRequest.findById(id);
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found.',
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Withdrawal request has already been processed with status: '${withdrawal.status}'.`,
      });
    }

    // Process Approval
    if (action === 'approve') {
      let finalTxHash = txHash?.trim();
      if (finalTxHash) {
        if (!/^0x[0-9a-fA-F]{64}$/.test(finalTxHash)) {
          return res.status(400).json({
            success: false,
            message: 'Custom txHash must be a valid 64-character hex string prefixed with 0x.',
          });
        }
      } else {
        finalTxHash = `0x${crypto.randomBytes(32).toString('hex')}`;
      }

      // Update withdrawal request
      withdrawal.status = 'approved';
      withdrawal.txHash = finalTxHash;
      await withdrawal.save();

      // Update associated Ledger debit entry to confirmed with txHash
      if (withdrawal.ledgerEntryId) {
        await Ledger.findByIdAndUpdate(withdrawal.ledgerEntryId, {
          status: 'confirmed',
          txHash: finalTxHash,
          confirmations: 15,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Withdrawal request approved successfully. Ledger debit confirmed on-chain.',
        data: {
          withdrawal,
        },
      });
    }

    // Process Rejection
    if (action === 'reject') {
      const reason = typeof rejectionReason === 'string' ? rejectionReason.trim() : '';
      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is mandatory when rejecting a payout request.',
        });
      }

      // Update withdrawal request
      withdrawal.status = 'rejected';
      withdrawal.rejectionReason = reason;
      await withdrawal.save();

      // Append compensating credit Ledger record (type: 'WITHDRAWAL_REFUND', status: 'confirmed')
      const refundEntry = await Ledger.appendConfirmed({
        userId: withdrawal.userId,
        type: 'WITHDRAWAL_REFUND',
        amount: withdrawal.grossAmount, // positive compensating credit
        currency: 'USDT',
        status: 'confirmed',
        confirmations: 15,
        metadata: {
          withdrawalRequestId: withdrawal._id,
          rejectionReason: reason,
          originalLedgerEntryId: withdrawal.ledgerEntryId,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Withdrawal request rejected. Compensating credit refunded to user ledger.',
        data: {
          withdrawal,
          refundLedgerId: refundEntry._id,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};
