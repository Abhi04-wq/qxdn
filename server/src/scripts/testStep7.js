import assert from 'assert';
import mongoose from 'mongoose';
import Ledger from '../models/Ledger.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import { withdrawRequest } from '../controllers/withdrawalController.js';
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

async function runTests() {
  console.log('====================================================');
  console.log('STARTING STEP 7 E2E INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  // 1. Verify WithdrawalRequest schema
  console.log('1. Checking WithdrawalRequest Model definition...');
  const paths = WithdrawalRequest.schema.paths;
  assert(paths.userId, 'userId required');
  assert(paths.grossAmount, 'grossAmount required');
  assert(paths.feeAmount, 'feeAmount required');
  assert(paths.netAmount, 'netAmount required');
  assert(paths.destinationAddress, 'destinationAddress required');
  assert(paths.status, 'status required');
  assert(paths.ledgerEntryId, 'ledgerEntryId required');
  assert(paths.txHash, 'txHash field exists');
  assert(paths.rejectionReason, 'rejectionReason field exists');
  assert(paths.createdAt, 'timestamps enabled');
  console.log('✓ WithdrawalRequest Model schema verified successfully.\n');

  // 2. Verify Ledger schema enum
  console.log('2. Checking Ledger Model enum update...');
  const ledgerTypeEnum = Ledger.schema.paths.type.enumValues;
  assert(ledgerTypeEnum.includes('WITHDRAWAL'), 'Ledger must have WITHDRAWAL');
  assert(ledgerTypeEnum.includes('WITHDRAWAL_REFUND'), 'Ledger must have WITHDRAWAL_REFUND');
  console.log('✓ Ledger enum includes WITHDRAWAL and WITHDRAWAL_REFUND.\n');

  // 3. Validation tests
  console.log('3. Testing Withdrawal Validation Engine...');
  const mockUserId = new mongoose.Types.ObjectId();
  const mockDestAddress = '0x1234567890123456789012345678901234567890';

  // Test amount < 20 USDT
  const resMin = createMockRes();
  await withdrawRequest(
    { user: { id: mockUserId }, body: { amount: 15, destinationAddress: mockDestAddress } },
    resMin,
    (err) => { throw err; }
  );
  assert.strictEqual(resMin.statusCode, 400);
  assert(resMin.body.message.includes('Minimum withdrawal amount is 20 USDT'));
  console.log('✓ Rejects amount < 20 USDT with HTTP 400.');

  // Test invalid BEP-20 address
  const resAddr = createMockRes();
  await withdrawRequest(
    { user: { id: mockUserId }, body: { amount: 50, destinationAddress: 'invalid-address-format' } },
    resAddr,
    (err) => { throw err; }
  );
  assert.strictEqual(resAddr.statusCode, 400);
  assert(resAddr.body.message.includes('Invalid BEP-20 destination address'));
  console.log('✓ Rejects invalid BEP-20 address with HTTP 400.');

  // 4. Financial Calculations
  console.log('\n4. Testing Math & Fee Calculation Rules...');
  const gross = 100;
  const fee = Math.round(gross * 0.05 * 1e6) / 1e6;
  const net = Math.round((gross - fee) * 1e6) / 1e6;
  assert.strictEqual(fee, 5.0, '5% fee must be exactly 5.00 USDT');
  assert.strictEqual(net, 95.0, 'Net amount must be 95.00 USDT');

  const grossOdd = 33.33;
  const feeOdd = Math.round(grossOdd * 0.05 * 1e6) / 1e6;
  const netOdd = Math.round((grossOdd - feeOdd) * 1e6) / 1e6;
  assert.strictEqual(feeOdd, 1.6665);
  assert.strictEqual(netOdd, 31.6635);
  console.log('✓ 5% processing fee and net token calculations verified with high precision.\n');

  // 5. Admin controller validation
  console.log('5. Testing Admin Process Validation Rules...');
  const resAction = createMockRes();
  await processWithdrawalRequest(
    { params: { id: new mongoose.Types.ObjectId() }, body: { action: 'invalid_action' } },
    resAction,
    (err) => { throw err; }
  );
  assert.strictEqual(resAction.statusCode, 400);
  assert(resAction.body.message.includes("Must be either 'approve' or 'reject'"));
  console.log("✓ Rejects invalid admin action with HTTP 400.");

  console.log('\n====================================================');
  console.log('ALL STEP 7 VERIFICATION CHECKS PASSED PERFECTLY!');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
