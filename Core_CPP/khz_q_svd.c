/*
 * khz_q_svd.c — KHZ_Q Ethical Prism (WebAssembly build)
 *
 * Constraints:
 *   - Zero libc / libm calls  → compiles with -nostdlib
 *   - No heap allocation      → all stack + static globals
 *   - C11 clean
 *   - Exports 5 symbols via __attribute__((visibility("default")))
 *
 * Clang Wasm build command:
 *   clang --target=wasm32 -O3 -nostdlib \
 *       -Wl,--no-entry \
 *       -Wl,--export=khzq_input_matrix \
 *       -Wl,--export=khzq_output_energy \
 *       -Wl,--export=khzq_output_penalty \
 *       -Wl,--export=khzq_output_chi_e \
 *       -Wl,--export=khzq_output_coherent \
 *       -Wl,--export=khz_q_verify_output_wasm \
 *       Core_CPP/khz_q_svd.c -o khzq_prism.wasm
 */

#include "khz_q_svd.h"

/* ── Fast math (compiler intrinsics — no libm) ───────────────────────── */
static inline float _sqrtf(float x) { return __builtin_sqrtf(x); }
static inline float _fabsf(float x) { return __builtin_fabsf(x); }

/* ══════════════════════════════════════════════════════════════════════
 * 1.  Wasm-shared static buffers
 *     Exported symbols — JS reads/writes via wasm.exports + memory.
 * ══════════════════════════════════════════════════════════════════════ */
__attribute__((visibility("default"))) float khzq_input_matrix[64] = {0};
__attribute__((visibility("default"))) float khzq_output_energy    = 0.0f;
__attribute__((visibility("default"))) float khzq_output_penalty   = 0.0f;
__attribute__((visibility("default"))) int   khzq_output_chi_e     = 0;
__attribute__((visibility("default"))) int   khzq_output_coherent  = 0;

/* ══════════════════════════════════════════════════════════════════════
 * 2.  One-sided Jacobi SVD  (symmetric 8×8, stack only)
 *     A is modified in-place; S[i] = |A[i][i]| after convergence.
 * ══════════════════════════════════════════════════════════════════════ */
static void jacobi_svd(float A[KHZ_MAX_N][KHZ_MAX_N],
                       float S[KHZ_MAX_N])
{
    for (int iter = 0; iter < KHZ_JACOBI_ITER; iter++) {
        /* off-diagonal Frobenius norm */
        float off = 0.0f;
        for (int p = 0; p < KHZ_MAX_N; p++)
            for (int q = p + 1; q < KHZ_MAX_N; q++)
                off += A[p][q] * A[p][q];
        if (off < KHZ_JACOBI_EPS) break;

        for (int p = 0; p < KHZ_MAX_N - 1; p++) {
            for (int q = p + 1; q < KHZ_MAX_N; q++) {
                float apq = A[p][q];
                if (_fabsf(apq) < KHZ_JACOBI_EPS) continue;

                float tau   = (A[q][q] - A[p][p]) / (2.0f * apq);
                float t     = (tau >= 0.0f)
                              ?  1.0f / (tau + _sqrtf(1.0f + tau * tau))
                              : -1.0f / (-tau + _sqrtf(1.0f + tau * tau));
                float c     = 1.0f / _sqrtf(1.0f + t * t);
                float s     = t * c;

                for (int i = 0; i < KHZ_MAX_N; i++) {
                    float aip = A[i][p], aiq = A[i][q];
                    A[i][p] = c * aip - s * aiq;
                    A[i][q] = s * aip + c * aiq;
                }
                for (int j = 0; j < KHZ_MAX_N; j++) {
                    float apj = A[p][j], aqj = A[q][j];
                    A[p][j] = c * apj - s * aqj;
                    A[q][j] = s * apj + c * aqj;
                }
            }
        }
    }
    for (int i = 0; i < KHZ_MAX_N; i++)
        S[i] = _fabsf(A[i][i]);
}

/* ── selection sort descending ───────────────────────────────────────── */
static void sort_desc(float S[KHZ_MAX_N])
{
    for (int i = 0; i < KHZ_MAX_N - 1; i++)
        for (int j = i + 1; j < KHZ_MAX_N; j++)
            if (S[j] > S[i]) { float t = S[i]; S[i] = S[j]; S[j] = t; }
}

/* ══════════════════════════════════════════════════════════════════════
 * 3.  Wasm entry point
 *     Reads khzq_input_matrix[64] (row-major 8×8).
 *     Writes results to the four output globals.
 * ══════════════════════════════════════════════════════════════════════ */
__attribute__((visibility("default")))
void khz_q_verify_output_wasm(float target_energy)
{
    /* Clamp target */
    if (target_energy <= 0.0f || target_energy > 1.0f) target_energy = 0.85f;

    /* Copy input into stack matrix (keeps globals intact for JS) */
    float M[KHZ_MAX_N][KHZ_MAX_N];
    for (int i = 0; i < KHZ_MAX_N; i++)
        for (int j = 0; j < KHZ_MAX_N; j++)
            M[i][j] = khzq_input_matrix[i * KHZ_MAX_N + j];

    /* SVD */
    float S[KHZ_MAX_N];
    jacobi_svd(M, S);
    sort_desc(S);

    /* Total spectral energy */
    float total = 0.0f;
    for (int i = 0; i < KHZ_MAX_N; i++) total += S[i] * S[i];

    /* Adaptive chi_E */
    float cumul = 0.0f;
    int   chi_e = 0;
    for (int i = 0; i < KHZ_MAX_N; i++) {
        cumul += S[i] * S[i];
        chi_e++;
        if (total > 1e-9f && (cumul / total) >= target_energy) break;
    }

    /* Energy preserved */
    float energy = (total > 1e-9f) ? (cumul / total) : 0.0f;

    /* Penalty_Nasl: residual energy × 10 */
    float penalty = (total > 1e-9f) ? ((total - cumul) / total) * 10.0f : 10.0f;

    /* Write outputs */
    khzq_output_energy   = energy;
    khzq_output_penalty  = penalty;
    khzq_output_chi_e    = chi_e;
    khzq_output_coherent = (energy >= target_energy && penalty < 1.0f) ? 1 : 0;
}
