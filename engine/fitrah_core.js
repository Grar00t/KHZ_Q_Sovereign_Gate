/**
 * fitrah_core.js — Fitrah Base State + Khwarizmi Balance Logic
 * KHZ_Q Sovereign Gate | GraTech 2026
 */
'use strict';

const FITRAH_ANCHOR = {
  source: ['Quran', 'Luqman', 'Khidr', 'All_Wisdom', 'All_Science'],
  biasNull: true,
  locked: true,
};

function fitrahBaseState(input = {}) {
  return {
    harm:      input.harm      ?? 0,
    necessity: input.necessity ?? 0,
    wisdom:    input.wisdom    ?? 1,
    fitrahScore: 1 - (input.harm ?? 0),
    anchor: FITRAH_ANCHOR,
  };
}

function khwarizmiReduce(terms = []) {
  // Al-Jabr: remove zero or contradicting terms
  return terms.filter(t => t.value !== 0 && !t.contradicts);
}

function khwarizmiBalance(lhs = [], rhs = []) {
  // Al-Muqabala: move terms across equality to balance
  const lhsSum = lhs.reduce((s, t) => s + t.value, 0);
  const rhsSum = rhs.reduce((s, t) => s + t.value, 0);
  return { balanced: Math.abs(lhsSum - rhsSum) < 1e-6, lhsSum, rhsSum, delta: lhsSum - rhsSum };
}

module.exports = { FITRAH_ANCHOR, fitrahBaseState, khwarizmiReduce, khwarizmiBalance };
