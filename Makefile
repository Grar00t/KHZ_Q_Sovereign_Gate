# KHZ_Q Sovereign Gate — Wasm Build
# Requires: clang with wasm32 target (LLVM)
# Install:  brew install llvm  /  apt install clang lld

WASM_OUT   = khzq_prism.wasm
WASM_SRC   = Core_CPP/khz_q_svd.c

EXPORTS    = -Wl,--export=khzq_input_matrix  \
             -Wl,--export=khzq_output_energy  \
             -Wl,--export=khzq_output_penalty \
             -Wl,--export=khzq_output_chi_e   \
             -Wl,--export=khzq_output_coherent \
             -Wl,--export=khz_q_verify_output_wasm

.PHONY: wasm clean

wasm:
	clang --target=wasm32 -O3 -nostdlib \
	    -Wl,--no-entry $(EXPORTS) \
	    $(WASM_SRC) -o $(WASM_OUT)
	@echo "Built: $(WASM_OUT) ($$(wc -c < $(WASM_OUT)) bytes)"

clean:
	rm -f $(WASM_OUT)
