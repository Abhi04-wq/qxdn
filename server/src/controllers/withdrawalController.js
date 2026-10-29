import crypto from 'crypto';
import Ledger from '../models/Ledger.js';
import User from '../models/User.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import OtpVerification from '../models/OtpVerification.js';
import { deriveBalances } from '../services/balanceService.js';
import { sendWithdrawalOtp } from '../utils/mailer.js';

const MIN_WITHDRAWAL = 20;
const MANUAL_THRESHOLD = 300; // Under 300 is auto-processed; 300 and above requires Admin review
const FEE_PERCENT = 0.05; // 5% platform processing fee
const BEP20_REGEX = /^0x[a-fA-F0-9]{40}$/;
const OTP_EXPIRY_MINUTES = 10;
const round = (n) => Math.round((Number(n) || 0) * 1e6) / 1e6;

// @route   POST /api/wallet/withdraw-initiate
// @desc    Step 1: Validate request, generate 6-digit OTP, send security email
export const withdrawInitiate = async (req, res, next) => {
  try {
    const { amount, destinationAddress } = req.body;

    const grossAmount = round(Number(amount));
    if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal amount must be a valid positive number.',
      });
    }

    if (grossAmount < MIN_WITHDRAWAL) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal amount is ${MIN_WITHDRAWAL} USDT.`,
      });
    }

    const trimmedAddress = typeof destinationAddress === 'string' ? destinationAddress.trim() : '';
    if (!trimmedAddress || !BEP20_REGEX.test(trimmedAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid BEP-20 destination address. Must be a 42-character hex address starting with 0x.',
      });
    }

    // Dynamic real-time balance verification strictly from confirmed available funds
    const balances = await deriveBalances(req.user.id);
    if (grossAmount > balances.availableBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient available balance. You have ${balances.availableBalance} USDT available to withdraw.`,
        data: { availableBalance: balances.availableBalance },
      });
    }

    const user = await User.findById(req.user.id).select('email');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate any older unused OTP for withdrawal action
    await OtpVerification.deleteMany({ userId: req.user.id, action: 'WITHDRAWAL' });

    // Store new OTP
    await OtpVerification.create({
      userId: req.user.id,
      code: otp,
      action: 'WITHDRAWAL',
      expiresAt,
      metadata: {
        grossAmount,
        destinationAddress: trimmedAddress,
      },
    });

    // Send email with OTP code
    await sendWithdrawalOtp(user.email, otp, grossAmount, trimmedAddress);

    const isInstant = grossAmount < MANUAL_THRESHOLD;

    return res.status(200).json({
      success: true,
      message: `OTP verification code sent to ${user.email}. Code is valid for 10 minutes.`,
      data: {
        email: user.email,
        expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
        tier: isInstant ? 'instant' : 'manual',
        requiresAdmin: !isInstant,
        grossAmount,
        netAmount: round(grossAmount * (1 - FEE_PERCENT)),
        feeAmount: round(grossAmount * FEE_PERCENT),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/wallet/withdraw-confirm
// @desc    Step 2: Validate OTP, route between Auto Payout (< 300) vs Manual Review (>= 300)
export const withdrawConfirm = async (req, res, next) => {
  try {
    const { amount, destinationAddress, otpCode } = req.body;

    const grossAmount = round(Number(amount));
    if (!Number.isFinite(grossAmount) || grossAmount < MIN_WITHDRAWAL) {
      return res.status(400).json({
        success: false,
        message: `Withdrawal amount must be at least ${MIN_WITHDRAWAL} USDT.`,
      });
    }

    const trimmedAddress = typeof destinationAddress === 'string' ? destinationAddress.trim() : '';
    if (!trimmedAddress || !BEP20_REGEX.test(trimmedAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid BEP-20 destination address.',
      });
    }

    const cleanOtp = typeof otpCode === 'string' ? otpCode.trim() : '';
    if (!cleanOtp || cleanOtp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit numeric OTP code.',
      });
    }

    // 1. Verify OTP record
    const otpRecord = await OtpVerification.findOne({
      userId: req.user.id,
      action: 'WITHDRAWAL',
      code: cleanOtp,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or incorrect OTP code. Please verify and try again.',
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      await OtpVerification.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: 'OTP code has expired. Please request a new verification code.',
      });
    }

    // Delete used OTP record to enforce single-use
    await OtpVerification.deleteOne({ _id: otpRecord._id });

    // 2. Re-verify dynamic available balance
    const balances = await deriveBalances(req.user.id);
    if (grossAmount > balances.availableBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient available balance. You have ${balances.availableBalance} USDT available.`,
        data: { availableBalance: balances.availableBalance },
      });
    }

    // Financial calculations
    const feeAmount = round(grossAmount * FEE_PERCENT);
    const netAmount = round(grossAmount - feeAmount);

    // 3. Conditional 300 USDT Threshold Logic
    if (grossAmount < MANUAL_THRESHOLD) {
      // -------------------------------------------------------------
      // CASE A: Amount < 300 USDT (Automatic Processing)
      // -------------------------------------------------------------
      const simulatedTxHash = `0x${crypto.randomBytes(32).toString('hex')}`;

      // Append debit entry directly as confirmed
      const ledgerEntry = await Ledger.appendConfirmed({
        userId: req.user.id,
        type: 'WITHDRAWAL',
        amount: -grossAmount,
        currency: 'USDT',
        status: 'confirmed',
        confirmations: 15,
        txHash: simulatedTxHash,
        metadata: {
          destinationAddress: trimmedAddress,
          feeAmount,
          netAmount,
          grossAmount,
          autoProcessed: true,
        },
      });

      // Save WithdrawalRequest with status 'approved' and autoProcessed = true
      const withdrawal = await WithdrawalRequest.create({
        userId: req.user.id,
        grossAmount,
        feeAmount,
        netAmount,
        destinationAddress: trimmedAddress,
        status: 'approved',
        autoProcessed: true,
        txHash: simulatedTxHash,
        ledgerEntryId: ledgerEntry._id,
      });

      ledgerEntry.metadata.withdrawalRequestId = withdrawal._id;
      await ledgerEntry.save();

      const updatedBalances = await deriveBalances(req.user.id);

      return res.status(201).json({
        success: true,
        status: 'approved',
        autoProcessed: true,
        message: 'Withdrawal authorized and processed instantly on BNB Smart Chain!',
        data: {
          withdrawal,
          txHash: simulatedTxHash,
          netAmount,
          balances: updatedBalances,
        },
      });
    } else {
      // -------------------------------------------------------------
      // CASE B: Amount >= 300 USDT (Admin Manual Review)
      // -------------------------------------------------------------
      // Append debit entry with status 'pending' to secure funds against double-spend
      const ledgerEntry = await Ledger.create({
        userId: req.user.id,
        type: 'WITHDRAWAL',
        amount: -grossAmount,
        currency: 'USDT',
        status: 'pending',
        confirmations: 0,
        metadata: {
          destinationAddress: trimmedAddress,
          feeAmount,
          netAmount,
          grossAmount,
          autoProcessed: false,
        },
      });

      // Save WithdrawalRequest with status 'pending' and autoProcessed = false
      const withdrawal = await WithdrawalRequest.create({
        userId: req.user.id,
        grossAmount,
        feeAmount,
        netAmount,
        destinationAddress: trimmedAddress,
        status: 'pending',
        autoProcessed: false,
        txHash: null,
        ledgerEntryId: ledgerEntry._id,
      });

      ledgerEntry.metadata.withdrawalRequestId = withdrawal._id;
      await ledgerEntry.save();

      const updatedBalances = await deriveBalances(req.user.id);

      return res.status(201).json({
        success: true,
        status: 'pending',
        autoProcessed: false,
        message: 'Withdrawal request authorized via OTP. Sent to Admin Panel for manual approval (amount >= 300 USDT).',
        data: {
          withdrawal,
          netAmount,
          balances: updatedBalances,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/wallet/my-withdrawals
// @desc    Get user's personal withdrawal history
export const getMyWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await WithdrawalRequest.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        withdrawals,
      },
    });
  } catch (error) {
    next(error);
  }
};
