# QNDX Backend Specification, Function Catalog & Security Audit Report

> **Purpose:** This document is designed for side-by-side comparison with your official Business Plan / Technical PDF. It details **every single function, route, mathematical formula, background cron worker, and database model** currently implemented in the backend, followed by a **thorough security fault audit** with exact remediation steps before hosting on a live server.

---

## Table of Contents
1. [Backend Architecture Overview](#1-backend-architecture-overview)
2. [Complete Functional Inventory (PDF Comparison)](#2-complete-functional-inventory-pdf-comparison)
   - [2.1 Authentication & Member Identity](#21-authentication--member-identity)
   - [2.2 Staking Engine & Tier System](#22-staking-engine--tier-system)
   - [2.3 Daily Accrual Worker & Principal Unlock Engine](#23-daily-accrual-worker--principal-unlock-engine)
   - [2.4 Weekly Saturday Release Engine](#24-weekly-saturday-release-engine)
   - [2.5 Multi-Level Referral Engine (L1–L10)](#25-multi-level-referral-engine-l1l10)
   - [2.6 Promotional Airdrop Assets Engine (SHIB, VET, WILD, DOGE)](#26-promotional-airdrop-assets-engine)
   - [2.7 Financial Ledger & Dynamic Balance Derivation](#27-financial-ledger--dynamic-balance-derivation)
   - [2.8 Withdrawal Engine (Dual-Tier Routing: < 300 vs >= 300 USDT)](#28-withdrawal-engine)
   - [2.9 Admin Governance & Platform Analytics](#29-admin-governance--platform-analytics)
   - [2.10 Sandbox & Test Simulators](#210-sandbox--test-simulators)
3. [Summary Table of All Backend Functions](#3-summary-table-of-all-backend-functions)
4. [Security Fault Audit & Vulnerability Report](#4-security-fault-audit--vulnerability-report)
   - [4.1 Critical Faults (Must Fix Before Production)](#41-critical-faults)
   - [4.2 High Severity Security Faults](#42-high-severity-security-faults)
   - [4.3 Medium Severity Architectural & Operational Faults](#43-medium-severity-faults)
5. [Production Pre-Flight Checklist](#5-production-pre-flight-checklist)

---

## 1. Backend Architecture Overview

* **Runtime:** Node.js (ESM modules: `"type": "module"`)
* **Framework:** Express.js 4.21
* **Database:** MongoDB via Mongoose 8.9 (Strict append-only ledger pattern for financial balances)
* **Background Schedulers:** `node-cron`
* **Security & Auth:** `bcryptjs` (salt rounds: 10), `jsonwebtoken` (JWT), `crypto`
* **Email Service:** `nodemailer` (SMTP transport)

---

## 2. Complete Functional Inventory (PDF Comparison)

### 2.1 Authentication & Member Identity
**Files:** [`server/src/controllers/authController.js`](server/src/controllers/authController.js), [`server/src/models/User.js`](server/src/models/User.js), [`server/src/middleware/authMiddleware.js`](server/src/middleware/authMiddleware.js)

| Function / Handler | Route | Auth / Role | Description & Logic |
| :--- | :--- | :--- | :--- |
| `registerWithReferral` | `POST /api/auth/register-with-referral` | Public | Registers member with a mandatory `sponsorCode`. Validates sponsor existence, generates 6-digit cryptographic SHA-256 OTP (`issueOtp`), sends verification email via Nodemailer, sets `isEmailVerified: false`. |
| `register` | `POST /api/auth/register` | Public | Invite-code based registration (supports `DISABLE_INVITE_REQUIREMENT` or `MASTER_INVITE_CODE` in `.env`). |
| `verifyOtp` | `POST /api/auth/verify-otp` | Public | Verifies the 6-digit email OTP against SHA-256 hash. If valid and not expired (10 min TTL), marks `isEmailVerified: true` and clears the token. |
| `resendOtp` | `POST /api/auth/resend-otp` | Public | Resends OTP email with a 60-second cooldown rule (`RESEND_COOLDOWN_SECONDS`). |
| `memberLogin` / `login` | `POST /api/auth/member-login` | Public | Authenticates member via email + bcrypt password. Checks `isEmailVerified === true`. Returns JWT token (7-day validity). |
| `adminLogin` | `POST /api/auth/admin-login` | Public | Authenticates admin users strictly where `role === 'admin'`. Returns admin JWT. |
| `getMe` | `GET /api/auth/me` | Bearer JWT | Returns current authenticated profile, role, referral code, sponsor code, and dynamic balances from `deriveBalances`. |

---

### 2.2 Staking Engine & Tier System
**Files:** [`server/src/controllers/stakingController.js`](server/src/controllers/stakingController.js), [`server/src/models/StakingPosition.js`](server/src/models/StakingPosition.js)

* **Minimum Stake:** `100 USDT`
* **Plan Tiers Implemented:**
  1. **STARTER (100 – 1,000 USDT):** Daily rate `0.004` (0.40% daily yield, 250 days to 100% cap)
  2. **RAPID (1,001 – 5,000 USDT):** Daily rate `0.0045` (0.45% daily yield, ~223 days to 100% cap)
  3. **ROCKET (> 5,000 USDT):** Daily rate `0.005` (0.50% daily yield, 200 days to 100% cap)

| Function / Handler | Route | Auth / Role | Description & Logic |
| :--- | :--- | :--- | :--- |
| `createStake` | `POST /api/staking/create` | Bearer JWT | 1. Verifies `amount >= 100`.<br>2. Derives real-time balance via `deriveBalances(userId)` — checks `availableDeposit >= amount`.<br>3. Creates `StakingPosition` with `status: 'active'`, `cumulativeReward: 0`, and `maxRewardCap: amount * 1.0`.<br>4. Inserts confirmed Ledger entry `STAKE_LOCK` (`amount: -value`).<br>5. Triggers 10-Level Referral Engine (`distributeReferralCommissions`).<br>6. Triggers Promotional Token Allocation (`creditPromotionalRewards`). |
| `getMyStakes` | `GET /api/staking/my-stakes` | Bearer JWT | Retrieves all user staking positions sorted by `createdAt: -1`. Computes `progressPercent = Math.min(100, (cumulativeReward / maxRewardCap) * 100)`. Computes `totalStaked`. |

---

### 2.3 Daily Accrual Worker & Principal Unlock Engine
**Files:** [`server/src/workers/accrualWorker.js`](server/src/workers/accrualWorker.js)

* **Scheduler:** `node-cron` scheduled at **`0 0 * * *`** (Every day at 00:00 UTC / Midnight).

| Function | Execution Trigger | Description & Mathematical Rules |
| :--- | :--- | :--- |
| `startAccrualCron()` | Server startup (`server.js`) | Arms the daily UTC midnight cron job. |
| `stopAccrualCron()` | Process teardown | Cancels active cron task. |
| `executeDailyAccrual(targetDate, trigger)` | Cron / Manual (`POST /api/test/run-daily-accrual`) | **Core Daily Engine:**<br>1. Scans all `StakingPosition` documents with `status: 'active'`.<br>2. **Idempotency Guard:** Checks `Ledger.exists({ type: 'STAKING_DAILY_ACCRUAL', 'metadata.stakeId': stake._id, 'metadata.date': today })`. Never accrues twice for the same date.<br>3. Computes daily return: `round(stake.amount * stake.dailyRate)`.<br>4. **100% Cap Enforcement:** `allowedCredit = Math.min(dailyReturn, maxRewardCap - cumulativeReward)`.<br>5. If `allowedCredit > 0`: Appends Ledger entry `{ type: 'STAKING_DAILY_ACCRUAL', amount: allowedCredit, status: 'pending' }`.<br>6. Increments `stake.cumulativeReward` and updates `lastAccrualDate`.<br>7. **Principal Return:** When `cumulativeReward >= maxRewardCap`, marks `stake.status = 'completed'` and triggers `unlockStakePrincipal()`. |
| `unlockStakePrincipal(stake)` | Triggered on 100% Cap Reach | Appends a confirmed Ledger entry `{ type: 'STAKE_UNLOCK', amount: stake.amount, status: 'confirmed' }` guarded against duplicate unlock runs. Unlocks original principal capital back into available balance. |

---

### 2.4 Weekly Saturday Release Engine
**Files:** [`server/src/workers/releaseWorker.js`](server/src/workers/releaseWorker.js), [`server/src/models/ReleaseLog.js`](server/src/models/ReleaseLog.js)

* **Scheduler:** `node-cron` scheduled at **`5 0 * * 6`** (Every Saturday at 00:05 UTC, 5 mins after midnight accrual).

| Function | Execution Trigger | Description & Logic |
| :--- | :--- | :--- |
| `startReleaseCron()` | Server startup (`server.js`) | Arms the Saturday release cron scheduler. |
| `stopReleaseCron()` | Process teardown | Stops Saturday cron. |
| `releasePendingRewards(trigger)` | Cron / Manual (`POST /api/test/run-saturday-release`) | **Weekly Release Engine:**<br>1. Generates unique `releaseBatch` UUID.<br>2. Performs atomic transition: `Ledger.updateMany({ type: { $in: ['STAKING_DAILY_ACCRUAL', 'REFERRAL_BONUS'] }, status: 'pending' }, { $set: { status: 'confirmed', 'metadata.releasedAt': new Date(), 'metadata.releaseBatch': releaseBatch } })`.<br>3. Derives batch release analytics grouped by type and per-user total amounts.<br>4. Appends audit log to `ReleaseLog` model (tracking total volume, trigger source, user breakdowns). |

---

### 2.5 Multi-Level Referral Engine (L1–L10)
**Files:** [`server/src/services/referralService.js`](server/src/services/referralService.js), [`server/src/routes/referralRoutes.js`](server/src/routes/referralRoutes.js)

* **Commission Structure (Developer Plan v2 / Rule Table 03):**
  * Level 1 (Direct): **6%**
  * Level 2: **3%**
  * Level 3: **2%**
  * Levels 4 through 10: **1% each** (Total max referral payout: **18%**)

| Function / Handler | Route | Auth / Role | Description & Logic |
| :--- | :--- | :--- | :--- |
| `distributeReferralCommissions` | Internal Service | System | Invoked on `createStake`. Traverses upline sponsors up to 10 levels. If sponsor qualifies (`isEmailVerified === true`), appends a pending Ledger entry `{ type: 'REFERRAL_BONUS', amount: commission, status: 'pending' }`. Released on Saturday. |
| `getUpline` | Internal Service | System | Iteratively ascends sponsor links (`sponsorCode -> referralCode`), protecting against cycles via `visited` Set. |
| `getTeamBreakdown` | `GET /api/referrals/team-breakdown` | Bearer JWT | Uses MongoDB `$graphLookup` to build an aggregated downline structure for Levels 1–10, reporting member count, total staked volume, confirmed earnings, and pending earnings. |
| `getDownlineTree` | `GET /api/referrals/downline-tree` | Bearer JWT | Constructs recursive tree object of downline members up to 10 levels deep for hierarchy visualization. |

---

### 2.6 Promotional Airdrop Assets Engine
**Files:** [`server/src/services/promotionalService.js`](server/src/services/promotionalService.js), [`server/src/controllers/walletController.js`](server/src/controllers/walletController.js)

* **Supported Airdrop Tokens:** `SHIB` (Shiba Inu), `VET` (VeChain), `WILD` (Wilder World), `DOGE` (Dogecoin).
* **Tier Packages Allocated Instantly upon Staking:**
  * **Tier 1 (100 – 1,000 USDT):** 1,000,000 SHIB + 500 VET
  * **Tier 2 (1,001 – 5,000 USDT):** 2,000,000 SHIB + 100 VET + 50 WILD
  * **Tier 3 (> 5,000 USDT):** 10,000,000 SHIB + 5,000 VET + 250 WILD + 250 DOGE

| Function / Handler | Route | Auth / Role | Description & Logic |
| :--- | :--- | :--- | :--- |
| `creditPromotionalRewards` | Internal Service | System | Batch inserts confirmed ledger rows (`Ledger.insertMany`) with `type: 'PROMOTIONAL_REWARD'`, status `confirmed`, currency matching respective airdrop token. |
| `getPromotionalBalances` | Internal Service | System | Aggregates confirmed `PROMOTIONAL_REWARD` entries per token for the user. |
| `getPromotionalAssets` | `GET /api/wallet/promotional-assets` | Bearer JWT | Returns current promotional asset balances for user display. |

---

### 2.7 Financial Ledger & Dynamic Balance Derivation
**Files:** [`server/src/models/Ledger.js`](server/src/models/Ledger.js), [`server/src/services/balanceService.js`](server/src/services/balanceService.js)

* **Rule:** No balance column exists on the User table. Balances are derived dynamically strictly via append-only ledger aggregation:
  $$\text{Total Inflow} = \text{DEPOSIT} + \text{Confirmed Released Rewards} + \text{WITHDRAWAL\_REFUND} + \text{STAKE\_UNLOCK}$$
  $$\text{Total Outflow} = \text{STAKE\_LOCK} + \text{Confirmed WITHDRAWAL} + \text{Pending WITHDRAWAL}$$
  $$\text{Available Withdrawable Balance} = \max(0, \text{Total Inflow} - \text{Total Outflow})$$
  $$\text{Available Deposit (Principal Pool)} = \max(0, \text{DEPOSIT} + \text{Refunds} + \text{STAKE\_UNLOCK} - \text{STAKE\_LOCK} - \text{Withdrawals})$$

| Function / Handler | Route | Auth / Role | Description & Logic |
| :--- | :--- | :--- | :--- |
| `deriveBalances(userId)` | Internal Service | System | Runs dual MongoDB aggregations (`confirmedRows` & `pendingRows`). Computes `totalDeposits`, `stakedAmount` (active locked), `unlockedPrincipal`, `availableBalance`, `availableDeposit`, `pendingRewards`, and `confirmedEarned`. |
| `getAvailableBalance(userId)` | Internal Service | System | Direct helper returning strictly the current withdrawable USDT amount. |
| `getBalanceAndLedger` | `GET /api/ledger/balance` | Bearer JWT | Returns derived balance breakdown along with recent ledger transaction history. |
| `ledgerHistory(userId, limit)` | Internal Service | System | Returns recent ledger events sorted by `createdAt: -1`. |

---

### 2.8 Withdrawal Engine
**Files:** [`server/src/controllers/withdrawalController.js`](server/src/controllers/withdrawalController.js), [`server/src/controllers/adminWithdrawalController.js`](server/src/controllers/adminWithdrawalController.js), [`server/src/models/WithdrawalRequest.js`](server/src/models/WithdrawalRequest.js), [`server/src/models/OtpVerification.js`](server/src/models/OtpVerification.js)

* **Rules:** Minimum `20 USDT`, Platform Processing Fee `5%`, Destination must match BEP-20 regex (`0x[a-fA-F0-9]{40}`).
* **Dual Routing Threshold:**
  * **Under 300 USDT:** Auto-processed instantly upon 2FA OTP verification.
  * **300 USDT and Above:** Automatically placed into `pending` status for Admin manual review.

| Function / Handler | Route | Auth / Role | Description & Logic |
| :--- | :--- | :--- | :--- |
| `withdrawInitiate` | `POST /api/wallet/withdraw-initiate` | Bearer JWT | Validates address and available balance. Generates 6-digit OTP (10 min TTL in `OtpVerification`), dispatches authorization email. |
| `withdrawConfirm` | `POST /api/wallet/withdraw-confirm` | Bearer JWT | Verifies & burns single-use OTP. Re-verifies available balance.<br>• **If < 300 USDT:** Inserts confirmed `WITHDRAWAL` ledger debit, generates txHash, marks request `approved` (`autoProcessed: true`).<br>• **If >= 300 USDT:** Inserts pending `WITHDRAWAL` ledger debit (securing funds against double-spend), marks request `pending` (`autoProcessed: false`) for Admin review. |
| `getMyWithdrawals` | `GET /api/wallet/my-withdrawals` | Bearer JWT | Returns member's withdrawal history with statuses (`pending`, `approved`, `rejected`), fee breakdowns, and transaction hashes. |
| `getAdminWithdrawals` | `GET /api/admin/withdrawals` | Admin Only | Paginated withdrawal requests with search, filter (`status`, `autoProcessed`), and volume statistics. |
| `processWithdrawalRequest` | `POST /api/admin/withdrawals/:id/process` | Admin Only | Admin action (`approve` or `reject`):<br>• **Approve:** Updates request to `approved`, confirms pending Ledger debit, records on-chain `txHash`.<br>• **Reject:** Updates request to `rejected` with mandatory `rejectionReason`, appends compensating credit `{ type: 'WITHDRAWAL_REFUND', amount: grossAmount, status: 'confirmed' }` restoring user's balance. |

---

### 2.9 Admin Governance & Platform Analytics
**Files:** [`server/src/controllers/adminController.js`](server/src/controllers/adminController.js), [`server/src/routes/adminRoutes.js`](server/src/routes/adminRoutes.js)

| Function / Handler | Route | Auth / Role | Description & Logic |
| :--- | :--- | :--- | :--- |
| `getPlatformOverview` | `GET /api/admin/overview` | Admin Only | Aggregate metrics: total member count, total platform deposits, active staked volume, total rewards generated, total withdrawals, top stakers, recent platform activity. |
| `getReferralLink` | `GET /api/admin/referral-link` | Admin Only | Returns admin sponsor code and root invite link. |
| `getAllStakes` | `GET /api/admin/all-stakes` | Admin Only | Paginated list of all member staking positions across the platform with progress caps and status filters. |
| `getMemberDetail` | `GET /api/admin/member/:userId` | Admin Only | Deep inspection of an individual member: profile, upline sponsor, downline count, full derived ledger balance, active stakes, and transaction history. |
| `getMemberTree` | `GET /api/admin/member-tree/:userId` | Admin Only | Generates visual downline tree starting from any designated member. |
| `getReleaseLogs` | `GET /api/admin/release-logs` | Admin Only | Historical audit trail of all Saturday release batches (amounts, triggers, timestamps). |

---

### 2.10 Sandbox & Test Simulators
**Files:** [`server/src/controllers/testController.js`](server/src/controllers/testController.js), [`server/src/routes/testRoutes.js`](server/src/routes/testRoutes.js)

| Function / Handler | Route | Auth / Role | Description & Logic |
| :--- | :--- | :--- | :--- |
| `simulateDeposit` | `POST /api/test/simulate-deposit` | Bearer JWT | Mocks on-chain BEP-20 USDT deposit (min 100 USDT). Appends confirmed `DEPOSIT` entry with 15 confirmations. |
| `runDailyAccrual` | `POST /api/test/run-daily-accrual` | Bearer JWT | Manually triggers 1-day accrual for active stakes (allows optional `date` parameter for historical backfill testing). Calls `executeDailyAccrual()`. |
| `runSaturdayRelease` | `POST /api/test/run-saturday-release` | Bearer JWT | Manually triggers the Saturday release engine, flipping pending rewards to confirmed. |
| `getReleaseHistory` | `GET /api/test/release-history` | Bearer JWT | Returns recent 20 Saturday release audit batches. |

---

## 3. Summary Table of All Backend Functions

| Category | Primary Controller / Worker | Exported Functions / Endpoints | Status |
| :--- | :--- | :--- | :--- |
| **Auth** | `authController.js` | `registerWithReferral`, `register`, `verifyOtp`, `resendOtp`, `memberLogin`, `adminLogin`, `getMe` | Implemented |
| **Staking** | `stakingController.js` | `createStake`, `getMyStakes` | Implemented |
| **Daily Accrual** | `accrualWorker.js` | `executeDailyAccrual`, `unlockStakePrincipal`, `startAccrualCron`, `stopAccrualCron` | Implemented (00:00 UTC) |
| **Weekly Release** | `releaseWorker.js` | `releasePendingRewards`, `startReleaseCron`, `stopReleaseCron` | Implemented (Sat 00:05 UTC) |
| **Referrals** | `referralService.js` | `distributeReferralCommissions`, `getUpline`, `getTeamBreakdown`, `getDownlineTree` | Implemented (10 Levels) |
| **Airdrop Assets** | `promotionalService.js` | `calculatePromotionalTokens`, `creditPromotionalRewards`, `getPromotionalBalances` | Implemented (4 Tokens) |
| **Balance & Wallet**| `balanceService.js` / `walletController.js` | `deriveBalances`, `getAvailableBalance`, `ledgerHistory`, `getDepositInfo`, `getBalanceAndLedger`, `getPromotionalAssets` | Implemented |
| **Withdrawals** | `withdrawalController.js` | `withdrawInitiate`, `withdrawConfirm`, `getMyWithdrawals` | Implemented (Dual Tier) |
| **Admin Controls** | `adminController.js` / `adminWithdrawalController.js` | `getPlatformOverview`, `getReferralLink`, `getAllStakes`, `getMemberDetail`, `getMemberTree`, `getReleaseLogs`, `getAdminWithdrawals`, `processWithdrawalRequest` | Implemented |
| **Testing** | `testController.js` | `simulateDeposit`, `runDailyAccrual`, `runSaturdayRelease`, `getReleaseHistory` | Implemented |

---

## 4. Security Fault Audit & Vulnerability Report

> [!CAUTION]
> Below are real security vulnerabilities, architectural faults, and exploit vectors identified in the current backend codebase. Before hosting this application on a production server with real user funds, you must review and address these issues.

---

### 4.1 Critical Faults (Showstoppers)

#### Fault 1: Test Simulator Routes Open in Production (`/api/test/simulate-deposit`)
* **Location:** [`server/src/routes/testRoutes.js`](server/src/routes/testRoutes.js), [`server/src/app.js`](server/src/app.js#L34)
* **Risk Level:** 🚨 **CRITICAL (Severity 10/10)**
* **The Vulnerability:** 
  The route `POST /api/test/simulate-deposit` is protected only by standard member JWT (`protect`), but line 19 of `testController.js` explicitly allows a user to deposit to their own account:
  ```javascript
  const targetUserId = userId || req.user.id;
  if (targetUserId !== req.user.id && req.user.role !== 'admin') { ... }
  ```
  Any regular logged-in user can send a POST request with `{ "amount": 1000000 }` to `/api/test/simulate-deposit` and instantly credit their account with 1,000,000 real USDT in the ledger, then stake or withdraw it!
* **Remediation:**
  In `server/src/app.js`, disable or restrict test routes to development only:
  ```javascript
  if (process.env.NODE_ENV !== 'production') {
    app.use('/api', testRoutes);
  }
  ```
  Alternatively, require `protect, requireAdmin` for test routes, and never allow self-credit in production.

---

#### Fault 2: No Real Blockchain RPC / Smart Contract Verification
* **Location:** [`server/src/controllers/walletController.js`](server/src/controllers/walletController.js), [`server/src/controllers/withdrawalController.js`](server/src/controllers/withdrawalController.js#L176)
* **Risk Level:** 🚨 **CRITICAL (Severity 9.5/10)**
* **The Vulnerability:**
  1. **Deposits:** When users send actual USDT to their deposit address on BNB Smart Chain, the backend does **not** have an on-chain blockchain listener (like Web3/Ethers connecting to BSC RPC or BscScan API). Real on-chain transfers will **not** be detected automatically.
  2. **Withdrawals (< 300 USDT):** When auto-withdrawal executes, line 176 of `withdrawalController.js` generates a mock hex string:
     ```javascript
     const simulatedTxHash = `0x${crypto.randomBytes(32).toString('hex')}`;
     ```
     No USDT is actually transferred to the user's BEP-20 address.
* **Remediation:**
  * For Deposits: Integrate a Web3/Ethers block listener or custodial payment gateway (e.g., Binance Pay, Tatum, NowPayments, or custom BSC RPC cron worker monitoring `Transfer` events on the USDT BEP-20 contract `0x55d398326f99059fF775485246999027B3197955`).
  * For Withdrawals: Connect an operational hot-wallet signer (Ethers.js `Wallet` + BEP-20 contract `transfer(destinationAddress, netAmount)`) to dispatch real on-chain transactions.

---

#### Fault 3: Race Condition & Double-Spending on Concurrent Requests
* **Location:** [`server/src/controllers/stakingController.js`](server/src/controllers/stakingController.js#L35-L54), [`server/src/controllers/withdrawalController.js`](server/src/controllers/withdrawalController.js#L158-L180)
* **Risk Level:** 🚨 **CRITICAL (Severity 9.0/10)**
* **The Vulnerability:**
  Checking balances and inserting debits is currently done across two separate asynchronous steps without database locks or ACID transactions:
  ```javascript
  const balances = await deriveBalances(req.user.id);
  if (balances.availableBalance < value) return error;
  // <--- GAP: Concurrent request enters here before ledger entry is created!
  await Ledger.create({ type: 'WITHDRAWAL', amount: -value });
  ```
  If an attacker sends 5 identical withdrawal requests simultaneously (within 50ms), all 5 requests will read the same available balance before any debit is saved, allowing the user to withdraw 5x their actual balance.
* **Remediation:**
  1. Wrap balance-verification and ledger creation inside a **MongoDB Transaction Session** (`session.startTransaction()`), or:
  2. Implement a per-user atomic lock (using Redis `redlock` or a memory Mutex) on withdrawal and stake creation endpoints.

---

### 4.2 High Severity Security Faults

#### Fault 4: No Rate Limiting on Authentication & 2FA OTP
* **Location:** [`server/src/routes/authRoutes.js`](server/src/routes/authRoutes.js), [`server/src/controllers/withdrawalController.js`](server/src/controllers/withdrawalController.js#L104)
* **Risk Level:** ⚠️ **HIGH (Severity 8.5/10)**
* **The Vulnerability:**
  There is no rate limiting library installed (`express-rate-limit` is missing).
  * A 6-digit numeric OTP has only 1,000,000 combinations.
  * With a 10-minute expiry and no request throttling or max-attempt counter, an attacker can script 5,000 HTTP requests per second to `/api/wallet/withdraw-confirm` or `/api/auth/verify-otp` and brute-force the code within minutes.
* **Remediation:**
  1. Install `express-rate-limit`:
     ```bash
     npm install express-rate-limit
     ```
  2. Add strict rate limiters (e.g., maximum 5 attempts per 10 minutes per IP/User for OTP verification and login).
  3. Add an `attempts` counter to `OtpVerification` model; delete the OTP if `attempts >= 5`.

---

#### Fault 5: Weak OTP Generation & Plaintext OTP Storage in Withdrawal Controller
* **Location:** [`server/src/controllers/withdrawalController.js`](server/src/controllers/withdrawalController.js#L61)
* **Risk Level:** ⚠️ **HIGH (Severity 8.0/10)**
* **The Vulnerability:**
  1. `withdrawalController.js` generates OTPs using JavaScript's non-cryptographic PRNG:
     ```javascript
     const otp = Math.floor(100000 + Math.random() * 900000).toString();
     ```
     `Math.random()` is statistically predictable and can be reverse-engineered by an attacker observing past seeds. (Note: `authController.js` correctly used `crypto.randomInt`, but `withdrawalController.js` did not).
  2. The generated OTP is stored in **plaintext** inside MongoDB:
     ```javascript
     await OtpVerification.create({ code: otp, ... });
     ```
     If database read access is compromised, all pending withdrawal OTPs are exposed in plaintext.
* **Remediation:**
  1. Use `crypto.randomInt(100000, 1000000).toString()`.
  2. Hash the OTP using SHA-256 before saving to `OtpVerification`, exactly like in `authController.js`.

---

#### Fault 6: Plaintext OTP Leaked into Server Console Logs
* **Location:** [`server/src/utils/mailer.js`](server/src/utils/mailer.js#L36,L64)
* **Risk Level:** ⚠️ **HIGH (Severity 7.5/10)**
* **The Vulnerability:**
  When SMTP is not configured in `.env`, `mailer.js` prints the secret authorization OTP directly to `console.log`:
  ```javascript
  console.log(`[dev] SMTP not configured - Withdrawal OTP for ${email}: ${otp}`);
  ```
  If hosted on cloud platforms (AWS CloudWatch, Render, Heroku, Docker), logs are retained in plaintext and accessible to any developer or compromised log-aggregator.
* **Remediation:**
  In production (`process.env.NODE_ENV === 'production'`), throw an explicit configuration error rather than falling back to printing secret authorization codes to stdout.

---

### 4.3 Medium Severity Architectural & Operational Faults

#### Fault 7: Default Hardcoded Admin Password in Seed Script
* **Location:** [`server/src/scripts/seedUsers.js`](server/src/scripts/seedUsers.js#L24)
* **Risk Level:** 🟡 **MEDIUM (Severity 6.5/10)**
* **The Vulnerability:**
  The database seeding script defaults to:
  * Email: `admin@qndx.io`
  * Password: `AdminPass123`
  If a developer runs `npm run seed` on the production server without supplying CLI flags, the platform can be compromised with the known default admin password.
* **Remediation:**
  Ensure `seedUsers.js` requires an explicit `--password` argument or randomly generates a secure password and prints it once.

---

#### Fault 8: Missing Security Headers (`helmet`) & NoSQL Injection Protection
* **Location:** [`server/src/app.js`](server/src/app.js)
* **Risk Level:** 🟡 **MEDIUM (Severity 6.0/10)**
* **The Vulnerability:**
  The Express app lacks basic HTTP security headers (`helmet`) such as `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, and CSP. NoSQL query sanitization (`mongo-sanitize`) is also omitted.
* **Remediation:**
  Install and configure `helmet`:
  ```javascript
  import helmet from 'helmet';
  app.use(helmet());
  ```

---

#### Fault 9: JWT Token Blacklist / Invalidation Missing
* **Location:** [`server/src/middleware/authMiddleware.js`](server/src/middleware/authMiddleware.js)
* **Risk Level:** 🟡 **MEDIUM (Severity 5.5/10)**
* **The Vulnerability:**
  JWTs are signed with a 7-day expiration (`7d`). There is no token revocation mechanism. If a user's token is intercepted, or if an admin locks/bans a fraudulent account, the token remains valid and can make authorized API calls until the 7 days lapse.
* **Remediation:**
  Store token issue timestamps (`user.tokenInvalidBefore`) or integrate Redis-based JWT blocklisting on user logout or role changes.

---

## 5. Production Pre-Flight Checklist

Before launching on a public domain / cloud server:

- [ ] **Set `NODE_ENV=production`** in `.env`.
- [ ] **Disable or remove test routes** (`/api/test/*`) from `app.js`.
- [ ] **Configure real SMTP credentials** (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) and verify emails deliver.
- [ ] **Replace `JWT_SECRET`** with a strong 64-character random string.
- [ ] **Install `express-rate-limit`** and attach limiters to `/api/auth/*` and `/api/wallet/withdraw-*`.
- [ ] **Switch OTP generation** in `withdrawalController.js` to `crypto.randomInt` and store hashed codes.
- [ ] **Integrate Web3 on-chain deposit listener** for BEP-20 USDT contract.
- [ ] **Integrate secure hot-wallet / MPC signing** for automatic payouts under 300 USDT.
- [ ] **Set strict `CLIENT_URL`** to your actual frontend domain (prevent open CORS).
