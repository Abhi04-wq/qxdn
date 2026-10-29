import mongoose from 'mongoose';
import Ledger from '../models/Ledger.js';

export const PROMOTIONAL_TOKENS = [
  { symbol: 'SHIB', name: 'Shiba Inu', accent: 'orange' },
  { symbol: 'VET', name: 'VeChain', accent: 'cyan' },
  { symbol: 'WILD', name: 'Wilder World', accent: 'purple' },
  { symbol: 'DOGE', name: 'Dogecoin', accent: 'amber' },
];

/**
 * Calculates token allocation based on PDF Section 03.4 and Business Rules:
 * Tier 1 (100 to 1,000 USDT):   1,000,000 SHIB, 500 VET
 * Tier 2 (1,001 to 5,000 USDT): 2,000,000 SHIB, 100 VET, 50 WILD
 * Tier 3 (Above 5,000 USDT):    10,000,000 SHIB, 5,000 VET, 250 WILD, 250 DOGE
 */
export const calculatePromotionalTokens = (stakeAmount) => {
  const amount = Number(stakeAmount) || 0;

  if (amount < 100) {
    return [];
  }

  if (amount <= 1000) {
    return [
      { currency: 'SHIB', amount: 1000000 },
      { currency: 'VET', amount: 500 },
    ];
  }

  if (amount <= 5000) {
    return [
      { currency: 'SHIB', amount: 2000000 },
      { currency: 'VET', amount: 100 },
      { currency: 'WILD', amount: 50 },
    ];
  }

  // Tier 3: Above 5,000 USDT
  return [
    { currency: 'SHIB', amount: 10000000 },
    { currency: 'VET', amount: 5000 },
    { currency: 'WILD', amount: 250 },
    { currency: 'DOGE', amount: 250 },
  ];
};

/**
 * Credits promotional tokens as confirmed append-only ledger entries via batch Ledger.insertMany()
 */
export const creditPromotionalRewards = async (userId, stakeId, stakeAmount) => {
  const tokens = calculatePromotionalTokens(stakeAmount);
  if (!tokens || tokens.length === 0) {
    return [];
  }

  const entries = tokens.map((token) => ({
    userId,
    type: 'PROMOTIONAL_REWARD',
    amount: token.amount,
    currency: token.currency,
    status: 'confirmed',
    confirmations: 15,
    metadata: {
      stakeId,
      stakeAmount,
    },
  }));

  const created = await Ledger.insertMany(entries);
  return created;
};

/**
 * Aggregates confirmed ledger entries grouped by promotional currency (SHIB, VET, WILD, DOGE)
 */
export const getPromotionalBalances = async (userId) => {
  const uid = new mongoose.Types.ObjectId(String(userId));

  const rows = await Ledger.aggregate([
    {
      $match: {
        userId: uid,
        type: 'PROMOTIONAL_REWARD',
        status: 'confirmed',
        currency: { $in: ['SHIB', 'VET', 'WILD', 'DOGE'] },
      },
    },
    {
      $group: {
        _id: '$currency',
        total: { $sum: '$amount' },
      },
    },
  ]);

  const balanceMap = Object.fromEntries(rows.map((r) => [r._id, Number(r.total) || 0]));

  return PROMOTIONAL_TOKENS.map((token) => ({
    symbol: token.symbol,
    name: token.name,
    balance: balanceMap[token.symbol] || 0,
  }));
};

export default {
  PROMOTIONAL_TOKENS,
  calculatePromotionalTokens,
  creditPromotionalRewards,
  getPromotionalBalances,
};
