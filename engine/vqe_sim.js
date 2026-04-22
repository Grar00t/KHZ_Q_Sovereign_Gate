/**
 * vqe_sim.js — VQE Variational Ethical Ground-State Solver
 * Minimizes ethical Hamiltonian expectation value.
 * KHZ_Q Sovereign Gate | GraTech 2026
 */
'use strict';

/**
 * Parameter-shift rule analog for gradient computation.
 * @param {number[]} hamiltonianTerms — ethical cost coefficients
 * @param {number}   maxIter          — max optimization steps
 * @param {number}   lr               — learning rate
 */
function vqeSim({ hamiltonianTerms = [], maxIter = 300, lr = 0.05 } = {}) {
  let params = hamiltonianTerms.map(() => Math.random() * Math.PI * 2);
  let energyHistory = [];

  for (let i = 0; i < maxIter; i++) {
    // Expectation value: E(θ) = Σ h_i · cos(θ_i)
    const energy = hamiltonianTerms.reduce((s, h, idx) => s + h * Math.cos(params[idx]), 0);
    energyHistory.push(energy);

    // Parameter shift gradient: ∂E/∂θ_i = (E(θ+π/2) - E(θ-π/2)) / 2
    const grad = params.map((p, idx) => {
      const plus  = hamiltonianTerms.reduce((s, h, j) => s + h * Math.cos(j === idx ? p + Math.PI/2 : params[j]), 0);
      const minus = hamiltonianTerms.reduce((s, h, j) => s + h * Math.cos(j === idx ? p - Math.PI/2 : params[j]), 0);
      return (plus - minus) / 2;
    });

    params = params.map((p, idx) => p - lr * grad[idx]);
  }

  const finalEnergy = hamiltonianTerms.reduce((s, h, idx) => s + h * Math.cos(params[idx]), 0);

  return {
    groundStateEnergy: finalEnergy,
    optimalParams: params,
    energyHistory,
    fitrahGroundState: finalEnergy < 0,
    convergence: Math.abs(energyHistory[energyHistory.length - 1] - energyHistory[energyHistory.length - 2] ?? 0) < 1e-6,
    protocol: 'VQE_FITRAH_ETHICS_SIM',
  };
}

module.exports = { vqeSim };
