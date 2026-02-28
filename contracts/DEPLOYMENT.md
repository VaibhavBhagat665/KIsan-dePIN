# Kisan-DePIN — Solana Smart Contract Deployment Guide

## Prerequisites

```bash
# 1. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default 1.79.0

# 2. Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.18/install)"

# 3. Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.30.1
avm use 0.30.1
```

## Local Deployment (solana-test-validator)

### Step 1: Start local validator
```bash
# In a separate terminal
solana-test-validator --reset
```

### Step 2: Configure Solana CLI for localnet
```bash
solana config set --url localhost
solana-keygen new --no-bip39-passphrase -o ~/.config/solana/id.json  # if no keypair exists
solana airdrop 100  # fund your wallet
```

### Step 3: Build the program
```bash
cd contracts
anchor build
```

### Step 4: Get the program ID and update
```bash
# Get the generated program ID
solana address -k target/deploy/kisan_depin-keypair.json

# Update the declare_id!() in programs/kisan_depin/src/lib.rs
# Update Anchor.toml [programs.localnet] with the new ID
```

### Step 5: Build again and deploy
```bash
anchor build
anchor deploy
```

### Step 6: Run tests
```bash
anchor test --skip-local-validator
```

## Key Addresses

| Account | Description |
|---------|-------------|
| Program State PDA | `seeds = [b"kisan-depin-state"]` |
| $GREEN Mint PDA | `seeds = [b"green-token-mint"]` |
| Proof Record PDA | `seeds = [b"proof", commitment]` |

## Instruction Flow

```
1. Authority calls `initialize`
   → Creates ProgramState PDA
   → Creates $GREEN SPL token mint (PDA-controlled)

2. Farmer calls `verify_and_mint`
   → Submits ZK-SNARK proof (pi_a, pi_b, pi_c)
   → Program verifies proof structure
   → Creates ProofRecord PDA (replay protection)
   → Mints 1 $GREEN to farmer's ATA
```

## Devnet Deployment

```bash
solana config set --url devnet
solana airdrop 2
anchor build
anchor deploy --provider.cluster devnet
```
