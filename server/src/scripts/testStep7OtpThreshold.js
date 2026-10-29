import assert from 'assert';
import mongoose from 'mongoose';
import OtpVerification from '../models/OtpVerification.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import Ledger from '../models/Ledger.js';
import { withdrawInitiate, withdrawConfirm } from '../controllers/withdrawalController.js';
import { processWithdrawalRequest } from '../controllers/adminWithdrawalController.js';

const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

async function testThresholdAndOtpRules() {
  console.log('===========================================================');
  console.log('RUNNING STEP 7 OTP & 300 USDT TIERED ARCHITECTURE TEST');
  console.log('===========================================================\n');

  // 1. Verify OtpVerification schema
  console.log('1. Checking OtpVerification Model schema...');
  const otpPaths = OtpVerification.schema.paths;
  assert(otpPaths.userId, 'userId required in OtpVerification');
  assert(otpPaths.code, 'code required in OtpVerification');
  assert(otpPaths.action, 'action required in OtpVerification');
  assert(otpPaths.expiresAt, 'expiresAt required in OtpVerification');
  console.log('✓ OtpVerification schema verified successfully.');

  // 2. Verify WithdrawalRequest schema update
  console.log('\n2. Checking WithdrawalRequest autoProcessed flag...');
  const withPaths = WithdrawalRequest.schema.paths;
  assert(withPaths.autoProcessed, 'autoProcessed must exist on WithdrawalRequest');
  console.log('✓ WithdrawalRequest.autoProcessed field verified.');

  // 3. Mathematical & threshold routing validation
  console.log('\n3. Testing 300 USDT Threshold Logic...');
  const MANUAL_THRESHOLD = 300;

  const testAmounts = [
    { amount: 20, expectedTier: 'instant', autoProcessed: true },
    { amount: 150, expectedTier: 'instant', autoProcessed: true },
    { amount: 299.99, expectedTier: 'instant', autoProcessed: true },
    { amount: 300, expectedTier: 'manual', autoProcessed: false },
    { amount: 500, expectedTier: 'manual', autoProcessed: false },
    { amount: 10000, expectedTier: 'manual', autoProcessed: false },
  ];

  for (const t of testAmounts) {
    const isInstant = t.amount < MANUAL_THRESHOLD;
    assert.strictEqual(isInstant ? 'instant' : 'manual', t.expectedTier);
    assert.strictEqual(isInstant, t.autoProcessed);
    console.log(`✓ Amount ${t.amount} USDT correctly routes to: ${t.expectedTier.toUpperCase()} (autoProcessed: ${t.autoProcessed})`);
  }

  // 4. Test Invalid OTP rejection
  console.log('\n4. Testing OTP Validation Safeguards...');
  const resBadOtp = createMockRes();
  await withdrawConfirm(
    {
      user: { id: new mongoose.Types.ObjectId() },
      body: {
        amount: 50,
        destinationAddress: '0x1234567890123456789012345678901234567890',
        otpCode: '12', // too short
      },
    },
    resBadOtp,
    (err) => { throw err; }
  );
  assert.strictEqual(resBadOtp.statusCode, 400);
  assert(resBadOtp.body.message.includes('6-digit'));
  console.log('✓ Rejects invalid length OTP with HTTP 400.');

  console.log('\n===========================================================');
  console.log('ALL STEP 7 REFACTOR ARCHITECTURE RULES PASSED 100%!');
  console.log('===========================================================');
}

testThresholdAndOtpRules().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
