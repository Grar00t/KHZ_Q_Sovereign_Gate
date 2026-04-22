/**
 * khzq.test.js — Unit Tests for KHZ_Q Core Engine
 * Run: node tests/khzq.test.js
 */
'use strict';

const {
  coreEquation,
  necessityRule,
  errorLoop,
  KhwarizmiBalance,
  svdEthicalPrism,
  qaoaEthicalOptimizer,
  vqeEthicalGroundState,
  FitrahQDSL,
} = require('../khz.js');

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${name}`);
    failed++;
  }
}

console.log('\n═══ KHZ_Q TESTS ═══\n');

// ── coreEquation ──
console.log('[1] coreEquation');
assert(coreEquation({ harm: 0, necessity: 0 }) === 1, 'Zero harm/necessity → score=1');
assert(coreEquation({ harm: 1 }) === 0, 'Full harm → score=0');
assert(coreEquation({ harm: 0.5, necessity: 0.5 }) > 0, 'Partial harm → positive score');

// ── necessityRule ──
console.log('\n[2] necessityRule');
assert(necessityRule(0, 0) === 'FULL_ASSISTANCE', 'Zero harm+necessity → FULL_ASSISTANCE');
assert(necessityRule(1, 0) === 'RESTRICT', 'High harm → RESTRICT');
assert(necessityRule(0.3, 0.8) === 'CONDITIONAL_ASSIST', 'Balanced → CONDITIONAL_ASSIST');

// ── errorLoop ──
console.log('\n[3] errorLoop');
const s0 = { decision: 'ASSIST' };
const s1 = errorLoop(s0, { newFact: true });
assert(s1.errorAdmitted === true, 'Error admitted on new evidence');
assert(s1.newFact === true, 'New evidence merged into state');
assert(errorLoop(s0, null) === s0, 'No evidence → state unchanged');

// ── KhwarizmiBalance ──
console.log('\n[4] KhwarizmiBalance');
const kb = new KhwarizmiBalance();
kb.alJabr('wisdom', 0.9).alJabr('necessity', 0.8);
const result = kb.collapse(0.5);
assert(result.state === 'MAX_FITRAH_ALIGNMENT', 'High Fitrah score collapses correctly');
assert(kb.alMuqabala(1.0, 1.0) === 'BALANCED', 'Equal terms → BALANCED');
assert(kb.alMuqabala(1.0, 0.5) === 'IMBALANCE', 'Unequal terms → IMBALANCE');

// ── SVD Ethical Prism ──
console.log('\n[5] svdEthicalPrism');
const svd = svdEthicalPrism([[3, 1], [1, 2]]);
assert(svd.singularValues.length === 2, 'Returns 2 singular values');
assert(svd.fitrahAlignment > 0 && svd.fitrahAlignment <= 1, 'Fitrah alignment in [0,1]');
assert(svd.biasDecomposed === true, 'Bias decomposed flag set');

// ── QAOA ──
console.log('\n[6] qaoaEthicalOptimizer');
const qaoa = qaoaEthicalOptimizer({
  nodes: [0, 1, 2], edges: [[0, 1, 1.0], [1, 2, 0.8]], p: 2, iterations: 30
});
assert(Array.isArray(qaoa.bestConfig), 'Returns bestConfig array');
assert(typeof qaoa.bestCost === 'number', 'Returns numeric bestCost');
assert(typeof qaoa.fitrahAligned === 'boolean', 'Returns fitrahAligned boolean');

// ── VQE ──
console.log('\n[7] vqeEthicalGroundState');
const vqe = vqeEthicalGroundState({ hamiltonianTerms: [1.0, -0.5, 0.8], maxIter: 50 });
assert(typeof vqe.groundStateEnergy === 'number', 'Returns numeric ground state energy');
assert(Array.isArray(vqe.params), 'Returns params array');
assert(typeof vqe.fitrahGroundState === 'boolean', 'Returns fitrahGroundState boolean');

// ── FitrahQDSL ──
console.log('\n[8] FitrahQDSL');
const dsl = new FitrahQDSL();
const dec = dsl.declare('TEST').balance(['wisdom'],['harm']).quantumOp().decide();
assert(['ASSIST','RESTRICT'].includes(dec.decision), 'DSL decision is ASSIST or RESTRICT');
assert(typeof dec.score === 'number', 'DSL decision has numeric score');
assert(dsl.dump().includes('DECLARATION'), 'Dump includes DECLARATION');

console.log(`\n═══ RESULTS: ${passed} passed, ${failed} failed ═══\n`);
if (failed > 0) process.exit(1);
