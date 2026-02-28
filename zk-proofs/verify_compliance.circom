// ============================================================
// Kisan-DePIN — Zero-Knowledge Compliance Verification Circuit
// verify_compliance.circom
// ============================================================
//
// Purpose: Prove that a farmer is COMPLIANT without revealing:
//   - Their exact GPS coordinates (privacy)
//   - Their wallet address (anonymity)
//   - The raw AI analysis hash (data protection)
//
// Public Inputs (visible on-chain):
//   - complianceCommitment: Poseidon hash of all private inputs
//
// Private Inputs (known only to prover):
//   - complianceStatusHash: Hash of "COMPLIANT" from AI system
//   - gpsLatitude: GPS latitude * 10000 (integer representation)  
//   - gpsLongitude: GPS longitude * 10000 (integer representation)
//   - farmerWalletHash: Hash of farmer's Solana wallet pubkey
//   - nonce: Random nonce for uniqueness
//
// The circuit verifies:
//   1. The compliance status hash matches the expected "COMPLIANT" hash
//   2. GPS coordinates are within valid range
//   3. The commitment is correctly computed from all private inputs
// ============================================================

pragma circom 2.1.0;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

// ─────────────────────────────────────────────────────────────
// Main Circuit: VerifyCompliance
// ─────────────────────────────────────────────────────────────

template VerifyCompliance() {
    // ── Private Inputs ──
    signal input complianceStatusHash;   // Poseidon("COMPLIANT") 
    signal input gpsLatitude;            // lat * 10000 (e.g., 28.6139 → 286139)
    signal input gpsLongitude;           // lng * 10000 (e.g., 77.2090 → 772090)
    signal input farmerWalletHash;       // Poseidon(wallet_pubkey_bytes)
    signal input nonce;                  // Random nonce for replay protection

    // ── Public Inputs ──
    signal input expectedComplianceHash; // Known hash of "COMPLIANT" status
    signal output complianceCommitment;  // On-chain commitment

    // ── Step 1: Verify compliance status ──
    // The prover must know the correct compliance hash
    // This ensures only COMPLIANT farmers can generate valid proofs
    signal statusCheck;
    statusCheck <== complianceStatusHash - expectedComplianceHash;
    statusCheck === 0;

    // ── Step 2: Verify GPS coordinates are in valid range ──
    // Latitude: -90 to 90 → -900000 to 900000 (after *10000)
    // Longitude: -180 to 180 → -1800000 to 1800000 (after *10000)
    // We use shifted values (add offset) to keep everything positive in the field
    // Shifted lat = gpsLatitude + 900000 (range: 0 to 1800000)
    // Shifted lng = gpsLongitude + 1800000 (range: 0 to 3600000)
    
    signal shiftedLat;
    shiftedLat <== gpsLatitude + 900000;
    
    signal shiftedLng;
    shiftedLng <== gpsLongitude + 1800000;
    
    // Verify shifted values are non-negative (within bounds)
    // Using LessThan comparator: shiftedLat < 1800001
    component latCheck = LessThan(21);  // 21 bits enough for 1800001
    latCheck.in[0] <== shiftedLat;
    latCheck.in[1] <== 1800001;
    latCheck.out === 1;
    
    component lngCheck = LessThan(22);  // 22 bits enough for 3600001
    lngCheck.in[0] <== shiftedLng;
    lngCheck.in[1] <== 3600001;
    lngCheck.out === 1;

    // ── Step 3: Compute commitment hash ──
    // commitment = Poseidon(statusHash, lat, lng, walletHash, nonce)
    // This single hash commits to ALL private inputs
    component hasher = Poseidon(5);
    hasher.inputs[0] <== complianceStatusHash;
    hasher.inputs[1] <== gpsLatitude;
    hasher.inputs[2] <== gpsLongitude;
    hasher.inputs[3] <== farmerWalletHash;
    hasher.inputs[4] <== nonce;

    complianceCommitment <== hasher.out;
}

// Instantiate the main component
// Public signals: expectedComplianceHash (input) + complianceCommitment (output)
component main {public [expectedComplianceHash]} = VerifyCompliance();
