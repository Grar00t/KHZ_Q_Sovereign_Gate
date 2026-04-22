#ifndef KHZ_Q_SVD_H
#define KHZ_Q_SVD_H

/*
 * KHZ_Q Ethical Prism — WebAssembly ABI Header
 * Zero external dependencies. C11 clean. -nostdlib compatible.
 */

#include <stdint.h>
#include <stdbool.h>

#define KHZ_MAX_N       8
#define KHZ_JACOBI_ITER 100
#define KHZ_JACOBI_EPS  1e-9f

/* ── Wasm-shared static buffers (exported symbols) ──────────────────── */
extern float khzq_input_matrix[64];   /* JS writes 8x8 floats here       */
extern float khzq_output_energy;      /* JS reads energy_preserved here  */
extern float khzq_output_penalty;     /* JS reads penalty_nasl here      */
extern int   khzq_output_chi_e;       /* JS reads rank used              */
extern int   khzq_output_coherent;    /* JS reads 1=Accept 0=Reject      */

/* ── Wasm entry point ───────────────────────────────────────────────── */
void khz_q_verify_output_wasm(float target_energy);

#endif /* KHZ_Q_SVD_H */
