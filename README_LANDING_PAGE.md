# QNDX Staking Ecosystem — Landing Page Content & Architecture Specification

> **Purpose:** This document provides a complete, structured, and exhaustive inventory of all content, copy, formulas, tiers, token reward allocations, referral structures, security pillars, and interactive components on the **QNDX Landing Page**. Use this document as the reference source when crafting prompts to redesign, expand, or restyle any section or the full landing page.

---

## 1. Visual Identity & Design System

- **Brand Name:** QNDX Staking Protocol (v2.0 Developer Plan & Institutional Architecture)
- **Aesthetic Direction:** Ultra-Premium Dark Web3 Cyber-Fintech (Deep Emerald, Fresh Mint, Metallic Gold)
- **Palette Hex Codes:**
  - **Background Base:** Deep Obsidian Emerald (`#020B08` / `#071C18`)
  - **Deep Emerald:** `#064E3B`
  - **Dark Emerald Surface:** `#022C22` / `#0B2720`
  - **Card Background:** `#10352C`
  - **Primary Mint Accent:** Electric Mint (`#34D399` / `#A7F3D0`)
  - **Secondary Soft Mint:** `#6EE7B7` / `#D1FAE5`
  - **Luxury Gold Accent:** Metallic Gold (`#D4AF37`) / Champagne Gold (`#F5D98E` / `#F1D78A`)
  - **Primary Text:** `#F5F5F0` / `#ECFDF5`
  - **Secondary Text:** `#A7B8AE` / `#A7C4B8`
  - **Borders:** `#1E493B` and gold-accented `#D4AF37`/35
- **Color Distribution Rule:**
  - 65% Deep Dark Emerald / Black
  - 20% Emerald and Mint Glow
  - 10% Metallic Gold (accents, values, badges, buttons)
  - 5% Crisp Neutral White
- **Motion & Materials:**
  - Multi-layer canvas with floating constellation particles, flowing harmonic light waves, and rotating geometric rings.
  - Glassmorphism (`backdrop-blur-2xl` with frosted borders and soft drop shadows).
  - 3D mouse parallax tilt cards (`rotateX`, `rotateY` physics).
  - Kinetic typography with gold shimmer and word-by-word reveal animations.

---

## 2. Section 0: Floating Glass Navigation Bar (`Navbar.jsx`)

### Brand Identity (Left)
- **Logo Icon:** 10x10 rounded square with rotating ambient aura (`rgba(212,175,55,0.4)`), gold emblem **"Q"** (`text-gold-gradient`).
- **Brand Title:** `QNDX` (`#F5F5F0` font-mono font-extrabold).
- **Badge:** `v2.0` (mint badge with border).
- **Subtitle:** `Emerald Mint Staking`.

### Navigation Links (Center)
Aligned in the center with Framer Motion animated hover pill (`layoutId="nav-hover-pill"`):
1. **Ecosystem** (`#hero`)
2. **Staking Tiers** (`#tiers`)
3. **Yield Calculator** (`#calculator`)
4. **Token Drops** (`#token-drops`)
5. **10-Tier Network** (`#referrals`)
6. **Security & Ledger** (`#security`)
7. **Whitepaper** (Triggers technical architecture modal with Sparkles icon)

### Action Buttons (Right)
- **Live Network Indicator:**
  - Pill button: `BEP-20 Live` with glowing green pulse indicator dot (`0x71C...4E89` toggle).
- **Primary CTA:**
  - Text: `Launch App` (or `Open Dashboard` if authenticated).
  - Icon: `ArrowUpRight`.
  - Design: Emerald gradient with metallic gold border highlight, soft mint glow, and light sweep on hover.
- **Mobile Responsive Drawer:**
  - Hamburger toggle with full-screen slide-down menu and direct links.

### Scroll Dynamics
- **Default:** `py-3.5 max-w-7xl bg-[#020B08]/65 backdrop-blur-xl border border-[#1E493B]/80`.
- **Scrolled (> 30px):** `py-2.5 max-w-6xl bg-[#020B08]/85 backdrop-blur-2xl border border-[#D4AF37]/25 shadow-[0_15px_45px_rgba(2,44,34,0.8),0_0_30px_rgba(52,211,153,0.12)]`.

---

## 3. Section 1: Hero Section (`Hero.jsx`)

### Layout
- Cinematic full-screen hero section (`min-h-screen`, `pt-32` to `pb-28`).
- 2-Column layout: Left Content + Right 3D Interactive Card.

### Left Column: Typography & CTAs
1. **Eyebrow Ticker Badge:**
   - Pulsing green indicator dot (`animate-ping`).
   - Text: `Institutional Staking Ecosystem • Up to 182.5% APY`.
   - Style: Frosted dark emerald glass with gold hairline border.
2. **Main Headline (Kinetic Typography):**
   - Text: `Next-Gen Capital Accumulation &`
   - Highlighted Words: `Multi-Token Yields` (gradient from `#A7F3D0` via `#D1FAE5` to `#F5D98E` with drop-shadow glow).
3. **Engaging Subheading:**
   - Text: *"Stake USDT on Binance Smart Chain with mathematical certainty. Earn 0.40% to 0.50% daily, unlock instant 4-token airdrops (SHIB, VET, WILD, DOGE), and benefit from a cryptographically audited append-only ledger."*
4. **Dual Action CTA Group:**
   - **Primary Button:** `Start Staking Now` (Emerald-to-dark-emerald gradient with gold border, animated light sweep, `ArrowRight` icon).
   - **Secondary Button:** `Explore Architecture & Whitepaper` (Glass button with mint border and `Sparkles` icon).
5. **Supporting Trust Metrics:**
   - `Strict Append-Only Ledger` (ShieldCheck icon)
   - `Zero Native Inflation` (Coins icon)
   - `Saturday Batch Releases` (Clock icon)

### Right Column: 3D Interactive Position Card
- **Mouse Parallax Physics:** Smooth 3D tilt responding to cursor movement (`rotateX`, `rotateY`).
- **4 Floating Orbital Airdrop Chips:**
  - `+2,000,000 SHIB` (Gold gradient)
  - `+1,000 VET` (Mint gradient)
  - `+100 WILD` (Emerald gradient)
  - `+50 DOGE` (Champagne Gold gradient)
- **Central Card Structure:**
  - Header: Active Position `RAPID Plan v2.0` + Pulsing badge `Accruing Yield`.
  - Locked Principal Display: `1,000.00 USDT` at `0.45% / day`.
  - Micro Live Accrual Counter: Real-time live ticking number (`+4.50000 USDT`).
  - Cumulative Return Progress Bar: Animated progress toward `100% Guaranteed Cap` (at 45.2%).
  - Next Saturday Release Countdown Clock: 4 digital countdown boxes (`Days : Hours : Mins : Secs`) targeting the weekly Saturday 00:05 UTC batch release.

---

## 4. Section 2: Tiered Staking Positions (`TierCards.jsx`)

### Section Header
- Eyebrow: `Developer Plan v2.0 Architecture` (Zap icon)
- Title: `Tiered Staking Positions`
- Subtitle: *"Transparent rates governed by smart contracts and audited financial ledgers. Higher staking tiers unlock accelerated yields and the complete 4-token airdrop suite."*

### The 3 Staking Tiers

| Parameter | Plan 1: STARTER | Plan 2: RAPID (Most Popular) | Plan 3: ROCKET (Max APY) |
| :--- | :--- | :--- | :--- |
| **Deposit Range** | `100 – 1,000 USDT` | `1,001 – 5,000 USDT` | `5,001+ USDT` |
| **Daily Yield Rate** | **`0.40%`** per day | **`0.45%`** per day | **`0.50%`** per day |
| **Annualized Yield** | `146.0% APY` | `164.25% APY` | `182.5% APY` |
| **Cycle Duration** | `250 Days` to 100% Cap | `~223 Days` to 100% Cap | `200 Days` to 100% Cap |
| **Cumulative Cap** | `100% of Principal` | `100% of Principal` | `100% of Principal` |
| **Principal Return** | 100% Unlocked at Cap | 100% Unlocked at Cap | 100% Unlocked at Cap |
| **Airdrop Tokens** | `1,000,000 SHIB + 500 VET` | `2M SHIB + 100 VET + 50 WILD` | `10M SHIB + 5K VET + 250 WILD + 250 DOGE` |
| **Referral Depth** | 10 Levels Qualified | 10 Levels Qualified | 10 Levels Qualified (Max Commission) |
| **Card Styling** | Emerald border `#1E493B` | Mint highlight border `#34D399` + "Most Popular" ribbon | Luxury Gold Gradient border + "Maximum APY & Airdrops" badge |

### Key Feature Bullets on Each Card
- Daily Accrual Engine (Runs daily at 00:00 UTC).
- Weekly Saturday Batch Liquidity Release (00:05 UTC).
- 100% Cumulative Cap Guarantee (Principal doubled: 100% reward + 100% principal return).
- Automatic STAKE_UNLOCK ledger credit returning 100% original capital.
- 10-Level Referral Commission qualified.

---

## 5. Section 3: Interactive Yield & Return Calculator (`StakingCalculator.jsx`)

### Section Header
- Eyebrow: `Live Mathematical Simulator` (Calculator icon)
- Title: `Interactive Yield & Return Calculator`
- Subtitle: *"Simulate your earnings across tiered rates, Saturday liquidity releases, 100% principal return cap, and instant crypto airdrops."*

### Interactive Controls
- **Dual Input:**
  1. Range Slider: `$100` to `$10,000+ USDT` (Smooth mint slider track with progress fill).
  2. Direct Numerical Input Box: Enter custom USDT value.
  3. Quick Preset Pills: `500 USDT`, `1,000 USDT`, `2,500 USDT`, `5,000 USDT`, `10,000 USDT`.

### Mathematical Output Matrix (Auto-Calculated in Real Time)
1. **Detected Tier Badge:** Automatically updates between `STARTER (0.40%)`, `RAPID (0.45%)`, and `ROCKET (0.50%)`.
2. **Daily Return:** `USDT / day = Principal * Daily Rate` (e.g. $2,500 at 0.45% = `$11.25 USDT / day`).
3. **Weekly Saturday Release:** `USDT / week = Daily Return * 7` (e.g. `$78.75 USDT / week`).
4. **100% Cumulative Reward Cap:** Guaranteed `$2,500.00 USDT` maximum yield.
5. **Total Capital Return at Unlock:** Principal + 100% Cap = `$5,000.00 USDT` (200% total value).
6. **Days to Maturity:** Dynamically shows `250 Days`, `223 Days`, or `200 Days`.
7. **Instant Multi-Token Bonus Allocation Box:** Shows exact counts of SHIB, VET, WILD, and DOGE granted for the selected amount.

---

## 6. Section 4: The 4 Promotional Airdrop Tokens (`TokenDrops.jsx`)

### Section Header
- Eyebrow: `Guaranteed Multi-Token Allocation` (Gift icon)
- Title: `The 4 Promotional Airdrop Assets`
- Subtitle: *"Every active stake instantly unlocks promotional allocations of top-tier crypto assets. Tracked securely in isolated verified asset ledgers alongside your USDT balance."*
- Trust Badge: `Allocated instantly on stake activation | Tracked in isolated multi-currency financial ledger`.

### Token Breakdown Matrix

| Asset | Ecosystem / Subtitle | Starter Plan | Rapid Plan | Rocket Plan | Key Narrative |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SHIB** (Shiba Inu) | Ethereum / Shibarium Layer 2 | `1,000,000` | `2,000,000` | `10,000,000` | Instant liquidity celebrating decentralized community ownership and ecosystem engagement. |
| **VET** (VeChain) | VeChainThor Enterprise Blockchain | `500` | `100` | `5,000` | Enterprise blockchain asset tracking carbon neutrality, authenticity, and logistics. |
| **WILD** (Wilder World) | Decentralized 5D Metaverse | *Tier Locked* | `50` | `250` | Photorealistic immersive metaverse token powered by Unreal Engine 5. |
| **DOGE** (Dogecoin) | Peer-to-Peer PoW Currency | *Tier Locked* | *Tier Locked* | `250` | Top-tier decentralized PoW currency reserved exclusively for Rocket Plan stakers. |

---

## 7. Section 5: Multi-Level Referral Network (`ReferralTree.jsx`)

### Section Header
- Eyebrow: `10-Tier Cascading Commission Engine` (Users icon)
- Title: `Multi-Level Referral Network`
- Subtitle: *"Earn up to 18% total commission pool across 10 cascading network levels. Commissions enter the ledger as pending bonus and release each Saturday alongside daily staking rewards."*

### 10-Tier Commission Structure

| Level | Title | Commission Rate | Description |
| :--- | :--- | :--- | :--- |
| **Level 1** | Direct Sponsor | **`6.0%`** | Direct invite commission paid on every stake activated by personal referrals. |
| **Level 2** | Secondary Network | **`3.0%`** | Second generation downline volume. |
| **Level 3** | Tertiary Network | **`2.0%`** | Third generation network volume. |
| **Level 4** | Network Depth L4 | **`1.0%`** | Fourth generation downline volume. |
| **Level 5** | Network Depth L5 | **`1.0%`** | Fifth generation downline volume. |
| **Level 6** | Network Depth L6 | **`1.0%`** | Sixth generation downline volume. |
| **Level 7** | Network Depth L7 | **`1.0%`** | Seventh generation downline volume. |
| **Level 8** | Network Depth L8 | **`1.0%`** | Eighth generation downline volume. |
| **Level 9** | Network Depth L9 | **`1.0%`** | Ninth generation downline volume. |
| **Level 10** | Deep Community L10 | **`1.0%`** | Full protocol depth cap reaching an aggregate 18.0% pool. |

### Interactive Network Volume Simulator
- Slider allowing user to simulate team volume (from `$1,000` to `$100,000+ USDT`).
- Shows dynamic breakdown of earnings per level (e.g. Level 1 on $5,000 volume = `+$300.00 USDT`).
- Protocol Rules:
  - Permanent sponsor locking on registration via referral code/link.
  - Zero unearned leakage — commissions accumulate into pending ledger.
  - Automated weekly Saturday release alongside staking yields.

---

## 8. Section 6: Institutional Security & Ledger Architecture (`SecurityGrid.jsx`)

### Section Header
- Eyebrow: `Audited Financial Infrastructure` (ShieldCheck icon)
- Title: `Institutional Security Architecture`
- Subtitle: *"Engineered with military-grade accounting standards. Built to prevent double-spending, protect user liquidity, and maintain mathematical transparency at every step."*

### The 4 Security Pillars

#### 1. Append-Only Financial Ledger (Cryptographic Integrity)
- **Core Concept:** Balances are **never** stored as raw mutable integers in the database.
- **Formula:** `Available Balance = SUM(confirmed inflows) - SUM(confirmed outflows)`.
- **Guarantees:**
  - Zero direct SQL/Mongo `$set: { balance: ... }` mutations.
  - Unique sparse database indexes guard against duplicate on-chain txHash credits.
  - 100% audit traceability for every USDT movement.

#### 2. 2-Tier Secure Withdrawal Engine (Dual-Channel Routing)
- **Partitioning by Liquidity Risk:**
  - **Tier 1 (< 300 USDT):** Automated processing via 6-digit email OTP verification (10-minute TTL).
  - **Tier 2 (>= 300 USDT):** Multi-signature administrative governance approval required.
- **Reconciliation:** Flat 5% withdrawal fee automatically reconciled into ledger transactions.

#### 3. Guaranteed 100% Principal Unlock (Zero Capital Lock-In)
- **Core Rule:** Cumulative yield is mathematically capped at 100% of principal (`amount * 1.0`).
- **Trigger:** Reaching 100% switches status to `'completed'` and fires an atomic `STAKE_UNLOCK` credit.
- **Result:** Unlocks 100% of the original staked capital into available balance immediately.

#### 4. Saturday Batch Release Engine (Liquidity Preservation)
- **Core Purpose:** Isolates operational liquidity from speculative flash withdrawals.
- **Cadence:** Rewards enter the ledger with `status: 'pending'` and release atomically every Saturday at 00:05 UTC.
- **Auditing:** Every release batch is stamped with a unique `releaseBatch` UUID in permanent `ReleaseLog` records.

---

## 9. Section 7: Technical Architecture Whitepaper Modal (`WhitepaperModal.jsx`)

Detailed modal accessible from Navbar and Hero buttons:
- **Section 1: Core Mathematical Engine & Formulas:**
  - `STAKE_LOCK` debit, daily accrual engine at 00:00 UTC.
  - Mathematical ceiling formula: `maxRewardCap = amount * 1.0`.
  - Automatic `STAKE_UNLOCK` credit event.
- **Section 2: Saturday Release Worker & Cron:**
  - `Ledger.updateMany({ type: { $in: ['STAKING_DAILY_ACCRUAL', 'REFERRAL_BONUS'] }, status: 'pending' }, ...)`
  - `ReleaseLog` schema and atomic batch execution.
- **Section 3: Referral Hierarchy Engine:**
  - 10-level tree traversal and commission calculation.
- **Section 4: Append-Only Balance Derivation Schema:**
  - Complete list of ledger transaction types (`DEPOSIT`, `STAKE_LOCK`, `STAKING_DAILY_ACCRUAL`, `REFERRAL_BONUS`, `WITHDRAWAL`, `WITHDRAWAL_REFUND`, `STAKE_UNLOCK`, `PROMOTIONAL_REWARD`).

---

## 10. Section 8: Footer (`Footer.jsx`)

### Column 1: Brand & Network Identity
- Logo: `QNDX PROTOCOL`
- Tagline: `Emerald Capital Staking Engine`
- Description: *"Institutional-grade capital yield and promotional token reward protocol deployed on BNB Smart Chain. Governed strictly by append-only immutable financial accounting."*
- Network Badge: `BNB Smart Chain (BEP-20) Live`

### Column 2: Protocol Links
- Ecosystem (`#hero`)
- Staking Plans (`#tiers`)
- Yield Calculator (`#calculator`)
- 4 Token Drops (`#token-drops`)
- 10-Tier Network (`#referrals`)

### Column 3: Architecture & Security
- Whitepaper PDF modal trigger
- Append-Only Ledger (`#security`)
- Saturday Release Engine (`#security`)
- 100% Principal Unlock Guarantee (`#security`)
- Admin Governance Portal (`/admin/login`)

### Column 4: Newsletter & Real-Time Alerts
- Interactive email subscribe form with confirmation toast: *"Get notified on Saturday release batches & token distribution events."*

### Bottom Bar
- Risk disclaimer regarding cryptocurrency staking and market volatility.
- Copyright: `© 2026 QNDX Protocol. All cryptographic rights reserved.`

---

## 11. Section 9: Multi-Layer Background Engine (`ParticleCanvas.jsx`)

- **Layer 1:** Deep Dark Emerald Atmosphere (`#020B08` base with time-animated radial light glows in `#064E3B` and `#D4AF37`).
- **Layer 2:** Hundreds of floating particles in Mint (`#A7F3D0`), Soft Mint (`#D1FAE5`), Emerald (`#34D399`), and Metallic Gold (`#D4AF37`) with fine constellation lines.
- **Layer 3:** Smooth flowing harmonic sine waves in mint and gold flowing across the canvas.
- **Layer 4:** Rotating geometric dashed orbital rings rotating in opposite directions centered behind the hero visual.
- **Layer 5:** Mouse-reactive magnetic repulsion field with smooth interpolation.

---

## 12. Master Prompt Template for AI Generation

*You can copy and customize the prompt below whenever asking an AI or designer to rebuild, restyle, or expand the QNDX landing page:*

```text
Act as a Principal Frontend Engineer and Elite Web3 Creative Designer (Awwwards-level). Redesign the full Landing Page for QNDX Staking Ecosystem using React, Tailwind CSS, Framer Motion, and HTML5 Canvas.

### 1. Visual & Color Theme
- Theme: Ultra-Premium Dark Web3 Cyber-Fintech (Deep Emerald, Fresh Mint, Metallic Gold).
- Palette: Background #020B08, Deep Emerald #064E3B, Dark Emerald #022C22, Electric Mint #34D399, Soft Mint #A7F3D0 / #D1FAE5, Metallic Gold #D4AF37, Champagne Gold #F5D98E, Primary Text #F5F5F0, Secondary Text #A7B8AE.
- Materials: Frosted glassmorphism (backdrop-blur-2xl), 3D isometric tilt cards, floating glowing airdrop chips, and kinetic gradient typography.

### 2. Required Landing Page Sections (Include Full Content)
1. Sticky Floating Glass Navbar: Logo with rotating aura, links (Ecosystem, Tiers, Calculator, Token Drops, 10-Tier Network, Security), animated hover pill, BEP-20 Live wallet indicator, and primary "Launch App" CTA button. Compact transformation on scroll.
2. Full-Screen Cinematic Hero Section (Min 100vh): Eyebrow badge ("Institutional Staking Ecosystem • Up to 182.5% APY"), large kinetic headline ("Next-Gen Capital Accumulation & Multi-Token Yields"), engaging description, dual CTAs ("Start Staking Now" + "Explore Architecture & Whitepaper"), 3 trust badges, and right-column 3D tilt card simulating $1,000 USDT RAPID position with live ticking accrual counter, 100% cap progress bar, Saturday countdown timer, and 4 orbiting tokens (SHIB, VET, WILD, DOGE).
3. Tiered Staking Cards Section: 3 cards:
   - STARTER (100–1,000 USDT | 0.40% daily | 250 days | 146.0% APY | 1M SHIB + 500 VET)
   - RAPID (1,001–5,000 USDT | 0.45% daily | ~223 days | 164.25% APY | 2M SHIB + 100 VET + 50 WILD | Most Popular)
   - ROCKET (5,001+ USDT | 0.50% daily | 200 days | 182.5% APY | 10M SHIB + 5K VET + 250 WILD + 250 DOGE | Max APY)
4. Interactive Staking Yield Calculator: Slider (100 to 10,000 USDT) + preset buttons. Real-time calculation of daily earnings, weekly Saturday release, 100% cumulative cap return, total return with principal unlock, and live token drop preview.
5. The 4 Promotional Airdrop Tokens Showcase: Cards for SHIB, VET, WILD, and DOGE detailing token utility, network, and allocation tiers.
6. 10-Level Referral Network Section: 10 cascading tiers (L1: 6%, L2: 3%, L3: 2%, L4-L10: 1% each = 18% total pool). Interactive team volume simulator slider ($1,000 - $100,000).
7. Institutional Security & Ledger Architecture: 4 Pillars:
   - Append-Only Financial Ledger (SUM inflows - SUM outflows).
   - 2-Tier Secure Withdrawal Engine (< 300 USDT OTP email vs >= 300 USDT admin multi-sig).
   - Guaranteed 100% Principal Unlock (automatic STAKE_UNLOCK event).
   - Saturday Batch Release Engine (weekly 00:05 UTC atomic release with ReleaseLog UUID).
8. Footer: Brand overview, BNB Smart Chain BEP-20 badge, protocol links, whitepaper modal trigger, newsletter subscription, and risk disclaimer.
9. Interactive Technical Architecture Whitepaper Modal: Explaining core mathematical formulas, ledger schemas, and release cron workers.
10. Multi-Layer Canvas Background: Atmosphere, hundreds of floating particles (mint & gold), flowing harmonic light waves, and rotating geometric orbital rings.
```
