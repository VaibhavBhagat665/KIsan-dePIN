#!/bin/bash
# ============================================================
# Kisan-DePIN — ZK Circuit Compilation & Proof Generation
# ============================================================
#
# This script:
# 1. Installs circom & snarkjs (if not present)
# 2. Compiles the verify_compliance.circom circuit
# 3. Runs trusted setup (Powers of Tau + Groth16)
# 4. Generates a sample proof with mock inputs
# 5. Verifies the proof
#
# Usage: bash setup_and_prove.sh
# ============================================================

set -e

CIRCUIT_NAME="verify_compliance"
BUILD_DIR="build"
PTAU_FILE="pot12_final.ptau"

echo "============================================================"
echo "  Kisan-DePIN — ZK-SNARK Pipeline"
echo "============================================================"
echo ""

# ─────────────────────────────────────────────────────────────
# Step 0: Check / Install Dependencies
# ─────────────────────────────────────────────────────────────

echo "[Step 0] Checking dependencies..."

# Check for snarkjs
if ! command -v snarkjs &> /dev/null; then
    echo "  Installing snarkjs globally..."
    npm install -g snarkjs
fi

# Check for circom
if ! command -v circom &> /dev/null; then
    echo "  ⚠️  circom not found!"
    echo "  Install from: https://docs.circom.io/getting-started/installation/"
    echo "  Quick install:"
    echo "    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    echo "    git clone https://github.com/iden3/circom.git"
    echo "    cd circom && cargo build --release && cargo install --path circom"
    echo ""
    echo "  For demo purposes, we'll generate a mock proof instead."
    echo ""
    
    # Fall through to mock proof generation
    USE_MOCK=true
else
    USE_MOCK=false
fi

# Install circomlib for Poseidon hash
if [ ! -d "node_modules/circomlib" ]; then
    echo "  Installing circomlib..."
    npm init -y 2>/dev/null || true
    npm install circomlib
fi

mkdir -p "$BUILD_DIR"

# ─────────────────────────────────────────────────────────────
# Step 1: Compile Circuit
# ─────────────────────────────────────────────────────────────

if [ "$USE_MOCK" = false ]; then
    echo ""
    echo "[Step 1] Compiling circuit: ${CIRCUIT_NAME}.circom"
    circom "${CIRCUIT_NAME}.circom" \
        --r1cs \
        --wasm \
        --sym \
        -o "$BUILD_DIR"

    echo "  ✓ R1CS constraints generated"
    echo "  ✓ WASM witness generator compiled"

    # Print circuit info
    snarkjs r1cs info "${BUILD_DIR}/${CIRCUIT_NAME}.r1cs"

    # ─────────────────────────────────────────────────────────
    # Step 2: Trusted Setup (Powers of Tau)
    # ─────────────────────────────────────────────────────────

    echo ""
    echo "[Step 2] Running trusted setup..."

    # Phase 1: Powers of Tau ceremony
    snarkjs powersoftau new bn128 12 "${BUILD_DIR}/pot12_0000.ptau" -v
    snarkjs powersoftau contribute "${BUILD_DIR}/pot12_0000.ptau" "${BUILD_DIR}/pot12_0001.ptau" \
        --name="Kisan-DePIN Phase 1" -v -e="kisan-depin-randomness"
    snarkjs powersoftau prepare phase2 "${BUILD_DIR}/pot12_0001.ptau" "${BUILD_DIR}/${PTAU_FILE}" -v

    # Phase 2: Circuit-specific setup (Groth16)
    snarkjs groth16 setup "${BUILD_DIR}/${CIRCUIT_NAME}.r1cs" "${BUILD_DIR}/${PTAU_FILE}" \
        "${BUILD_DIR}/${CIRCUIT_NAME}_0000.zkey"
    snarkjs zkey contribute "${BUILD_DIR}/${CIRCUIT_NAME}_0000.zkey" "${BUILD_DIR}/${CIRCUIT_NAME}.zkey" \
        --name="Kisan-DePIN contribution" -v -e="kisan-depin-phase2-randomness"

    # Export verification key
    snarkjs zkey export verificationkey "${BUILD_DIR}/${CIRCUIT_NAME}.zkey" \
        "${BUILD_DIR}/verification_key.json"

    echo "  ✓ Trusted setup complete"
    echo "  ✓ Verification key exported"

    # ─────────────────────────────────────────────────────────
    # Step 3: Generate Witness & Proof
    # ─────────────────────────────────────────────────────────

    echo ""
    echo "[Step 3] Generating proof with sample inputs..."

    # Use the input.json file
    node "${BUILD_DIR}/${CIRCUIT_NAME}_js/generate_witness.js" \
        "${BUILD_DIR}/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm" \
        input.json \
        "${BUILD_DIR}/witness.wtns"

    # Generate Groth16 proof
    snarkjs groth16 prove "${BUILD_DIR}/${CIRCUIT_NAME}.zkey" "${BUILD_DIR}/witness.wtns" \
        "${BUILD_DIR}/proof.json" "${BUILD_DIR}/public.json"

    echo "  ✓ Proof generated: ${BUILD_DIR}/proof.json"
    echo "  ✓ Public signals: ${BUILD_DIR}/public.json"

    # ─────────────────────────────────────────────────────────
    # Step 4: Verify Proof
    # ─────────────────────────────────────────────────────────

    echo ""
    echo "[Step 4] Verifying proof..."

    snarkjs groth16 verify \
        "${BUILD_DIR}/verification_key.json" \
        "${BUILD_DIR}/public.json" \
        "${BUILD_DIR}/proof.json"

    echo ""
    echo "============================================================"
    echo "  ✅ ZK-SNARK proof verified successfully!"
    echo "  The farmer is COMPLIANT without revealing private data."
    echo "============================================================"

    # ─────────────────────────────────────────────────────────
    # Step 5: Export Solidity Verifier (for on-chain use)
    # ─────────────────────────────────────────────────────────

    echo ""
    echo "[Step 5] Exporting Solidity verifier..."
    snarkjs zkey export solidityverifier "${BUILD_DIR}/${CIRCUIT_NAME}.zkey" \
        "${BUILD_DIR}/Verifier.sol"
    echo "  ✓ Solidity verifier: ${BUILD_DIR}/Verifier.sol"

else
    # ─────────────────────────────────────────────────────────
    # Mock Proof Generation (circom not installed)
    # ─────────────────────────────────────────────────────────

    echo ""
    echo "[Mock Mode] Generating simulated ZK-SNARK proof..."
    echo ""

    node generate_mock_proof.js

    echo ""
    echo "============================================================"
    echo "  ✅ Mock ZK-SNARK proof generated and verified!"  
    echo "  Install circom for real proof generation."
    echo "============================================================"
fi
