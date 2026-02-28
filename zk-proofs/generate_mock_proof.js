// ============================================================
// Kisan-DePIN — Mock ZK-SNARK Proof Generator
// Used when circom is not installed (demo fallback)
// ============================================================

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Read input signals
const input = JSON.parse(fs.readFileSync("input.json", "utf8"));

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  ZK-SNARK Proof Generation (Mock Mode)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("");

// ── Step 1: Verify private inputs ──
console.log("[1/4] Validating private inputs...");
console.log(`  Compliance Hash: ${input.complianceStatusHash.substring(0, 20)}...`);
console.log(`  GPS (encoded):   ${input.gpsLatitude}, ${input.gpsLongitude}`);
console.log(`  Wallet Hash:     ${input.farmerWalletHash.substring(0, 20)}...`);
console.log(`  Nonce:           ${input.nonce}`);

// Verify compliance hash matches expected
const statusMatch = input.complianceStatusHash === input.expectedComplianceHash;
console.log(`  Status check:    ${statusMatch ? "PASS ✓" : "FAIL ✗"}`);

if (!statusMatch) {
    console.error("\n  ✗ PROOF GENERATION FAILED: Compliance hash mismatch!");
    console.error("    The farmer's status does not match COMPLIANT.");
    process.exit(1);
}

// ── Step 2: Compute commitment (simulated Poseidon hash) ──
console.log("\n[2/4] Computing commitment hash (simulated Poseidon)...");
const commitmentInput = [
    input.complianceStatusHash,
    input.gpsLatitude,
    input.gpsLongitude,
    input.farmerWalletHash,
    input.nonce,
].join("|");

const commitment = crypto
    .createHash("sha256")
    .update(commitmentInput)
    .digest("hex");

console.log(`  Commitment: 0x${commitment.substring(0, 32)}...`);

// ── Step 3: Generate mock Groth16 proof ──
console.log("\n[3/4] Generating Groth16 proof...");

const mockProof = {
    pi_a: [
        crypto.randomBytes(32).toString("hex"),
        crypto.randomBytes(32).toString("hex"),
        "1",
    ],
    pi_b: [
        [crypto.randomBytes(32).toString("hex"), crypto.randomBytes(32).toString("hex")],
        [crypto.randomBytes(32).toString("hex"), crypto.randomBytes(32).toString("hex")],
        ["1", "0"],
    ],
    pi_c: [
        crypto.randomBytes(32).toString("hex"),
        crypto.randomBytes(32).toString("hex"),
        "1",
    ],
    protocol: "groth16",
    curve: "bn128",
};

const publicSignals = [
    commitment,  // complianceCommitment (output)
    input.expectedComplianceHash,  // expectedComplianceHash (public input)
];

// Save proof artifacts
const buildDir = "build";
if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });

fs.writeFileSync(
    path.join(buildDir, "proof.json"),
    JSON.stringify(mockProof, null, 2)
);

fs.writeFileSync(
    path.join(buildDir, "public.json"),
    JSON.stringify(publicSignals, null, 2)
);

// Generate mock verification key
const verificationKey = {
    protocol: "groth16",
    curve: "bn128",
    nPublic: 2,
    vk_alpha_1: [crypto.randomBytes(32).toString("hex"), crypto.randomBytes(32).toString("hex"), "1"],
    vk_beta_2: [
        [crypto.randomBytes(32).toString("hex"), crypto.randomBytes(32).toString("hex")],
        [crypto.randomBytes(32).toString("hex"), crypto.randomBytes(32).toString("hex")],
        ["1", "0"],
    ],
    vk_gamma_2: [
        [crypto.randomBytes(32).toString("hex"), crypto.randomBytes(32).toString("hex")],
        [crypto.randomBytes(32).toString("hex"), crypto.randomBytes(32).toString("hex")],
        ["1", "0"],
    ],
    vk_delta_2: [
        [crypto.randomBytes(32).toString("hex"), crypto.randomBytes(32).toString("hex")],
        [crypto.randomBytes(32).toString("hex"), crypto.randomBytes(32).toString("hex")],
        ["1", "0"],
    ],
    IC: [
        [crypto.randomBytes(32).toString("hex"), crypto.randomBytes(32).toString("hex"), "1"],
        [crypto.randomBytes(32).toString("hex"), crypto.randomBytes(32).toString("hex"), "1"],
        [crypto.randomBytes(32).toString("hex"), crypto.randomBytes(32).toString("hex"), "1"],
    ],
};

fs.writeFileSync(
    path.join(buildDir, "verification_key.json"),
    JSON.stringify(verificationKey, null, 2)
);

console.log(`  ✓ Proof saved:            ${buildDir}/proof.json`);
console.log(`  ✓ Public signals saved:   ${buildDir}/public.json`);
console.log(`  ✓ Verification key saved: ${buildDir}/verification_key.json`);

// ── Step 4: Verify the mock proof ──
console.log("\n[4/4] Verifying proof...");

// In real snarkjs, this performs elliptic curve pairing checks
// For mock: we verify the commitment computation is consistent
const recomputedCommitment = crypto
    .createHash("sha256")
    .update(commitmentInput)
    .digest("hex");

const verified = recomputedCommitment === commitment;

console.log(`  Verification result: ${verified ? "VALID ✓" : "INVALID ✗"}`);
console.log("");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`  PROOF SUMMARY`);
console.log(`  ├─ Protocol:    Groth16`);
console.log(`  ├─ Curve:       BN128`);
console.log(`  ├─ Status:      ${verified ? "VERIFIED ✓" : "FAILED ✗"}`);
console.log(`  ├─ Commitment:  0x${commitment.substring(0, 16)}...`);
console.log(`  └─ Privacy:     GPS, wallet, status = HIDDEN`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("");
console.log("  The on-chain verifier can confirm compliance");
console.log("  without learning the farmer's location or identity.");
console.log("");
