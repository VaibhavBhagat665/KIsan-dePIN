// ============================================================
// Kisan-DePIN — Solana Smart Contract (Anchor Framework)
// ============================================================
//
// This program implements:
//   1. initialize   — Creates the $GREEN token mint and program state
//   2. verify_and_mint — Accepts a ZK-SNARK proof, verifies it,
//                        and mints 1 $GREEN token to the farmer
//
// Architecture:
//   - PDA-controlled token mint (no single authority)
//   - Commitment-based replay protection (each proof used once)
//   - On-chain proof verification (simplified for demo)
// ============================================================

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const GREEN_TOKEN_DECIMALS: u8 = 9;
const MINT_AMOUNT: u64 = 1_000_000_000; // 1 $GREEN (with 9 decimals)
const STATE_SEED: &[u8] = b"kisan-depin-state";
const MINT_SEED: &[u8] = b"green-token-mint";

// ─────────────────────────────────────────────────────────────
// Program
// ─────────────────────────────────────────────────────────────

#[program]
pub mod kisan_depin {
    use super::*;

    /// Initialize the program state and $GREEN token mint.
    /// Called once by the deployer.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.program_state;
        state.authority = ctx.accounts.authority.key();
        state.total_proofs_verified = 0;
        state.total_tokens_minted = 0;
        state.mint = ctx.accounts.green_mint.key();
        state.bump = ctx.bumps.program_state;
        state.mint_bump = ctx.bumps.green_mint;

        msg!("Kisan-DePIN initialized!");
        msg!("$GREEN mint: {}", ctx.accounts.green_mint.key());
        msg!("Program state: {}", ctx.accounts.program_state.key());

        Ok(())
    }

    /// Verify a ZK-SNARK proof and mint 1 $GREEN token to the farmer.
    ///
    /// # Arguments
    /// * `proof_a` — G1 point (pi_a) from Groth16 proof
    /// * `proof_b` — G2 point (pi_b) from Groth16 proof  
    /// * `proof_c` — G1 point (pi_c) from Groth16 proof
    /// * `public_signals` — Public inputs [commitment, expectedHash]
    /// * `compliance_commitment` — The unique commitment hash (replay protection)
    ///
    /// # Verification Logic
    /// In production: Perform full Groth16 pairing check on-chain using
    /// Solana's alt_bn128 precompile (available since v1.16).
    /// For demo: Verify the proof structure is well-formed and the
    /// commitment hasn't been used before.
    pub fn verify_and_mint(
        ctx: Context<VerifyAndMint>,
        proof_a: [u8; 64],
        proof_b: [u8; 128],
        proof_c: [u8; 64],
        public_signals: Vec<u8>,
        compliance_commitment: [u8; 32],
    ) -> Result<()> {
        let state = &mut ctx.accounts.program_state;
        let proof_record = &mut ctx.accounts.proof_record;

        // ── Step 1: Verify proof hasn't been used before ──
        // The proof_record PDA is derived from the commitment,
        // so attempting to reuse a commitment will fail (account exists)
        msg!("Step 1: Verifying proof uniqueness...");
        msg!("Commitment: {:?}", &compliance_commitment[..8]);

        // ── Step 2: Verify the ZK-SNARK proof ──
        // In production, this would call the alt_bn128 precompile:
        //   sol_alt_bn128_pairing(proof_a, proof_b, proof_c, vk, public_signals)
        //
        // For the hackathon demo, we verify:
        //   a) Proof components are non-zero (well-formed)
        //   b) Public signals are present
        //   c) Commitment is 32 bytes
        msg!("Step 2: Verifying ZK-SNARK proof (Groth16)...");
        
        require!(
            proof_a.iter().any(|&b| b != 0),
            KisanError::InvalidProof
        );
        require!(
            proof_b.iter().any(|&b| b != 0),
            KisanError::InvalidProof
        );
        require!(
            proof_c.iter().any(|&b| b != 0),
            KisanError::InvalidProof
        );
        require!(
            !public_signals.is_empty(),
            KisanError::InvalidPublicSignals
        );
        require!(
            compliance_commitment.iter().any(|&b| b != 0),
            KisanError::InvalidCommitment
        );

        msg!("Step 2: Proof structure verified ✓");

        // ── Step 3: Record the proof (replay protection) ──
        proof_record.commitment = compliance_commitment;
        proof_record.farmer = ctx.accounts.farmer.key();
        proof_record.timestamp = Clock::get()?.unix_timestamp;
        proof_record.verified = true;

        // ── Step 4: Mint 1 $GREEN token to the farmer ──
        msg!("Step 3: Minting 1 $GREEN to farmer: {}", ctx.accounts.farmer.key());

        let state_bump = state.bump;
        let signer_seeds: &[&[&[u8]]] = &[&[STATE_SEED, &[state_bump]]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.green_mint.to_account_info(),
                    to: ctx.accounts.farmer_token_account.to_account_info(),
                    authority: ctx.accounts.program_state.to_account_info(),
                },
                signer_seeds,
            ),
            MINT_AMOUNT,
        )?;

        // ── Step 5: Update global state ──
        state.total_proofs_verified += 1;
        state.total_tokens_minted += MINT_AMOUNT;

        msg!("═══════════════════════════════════════════");
        msg!("  ✅ $GREEN Token Minted Successfully!");
        msg!("  Farmer: {}", ctx.accounts.farmer.key());
        msg!("  Amount: 1.000000000 $GREEN");
        msg!("  Total proofs verified: {}", state.total_proofs_verified);
        msg!("═══════════════════════════════════════════");

        Ok(())
    }
}

// ─────────────────────────────────────────────────────────────
// Account Structures
// ─────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + ProgramState::INIT_SPACE,
        seeds = [STATE_SEED],
        bump,
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(
        init,
        payer = authority,
        mint::decimals = GREEN_TOKEN_DECIMALS,
        mint::authority = program_state,
        seeds = [MINT_SEED],
        bump,
    )]
    pub green_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(proof_a: [u8; 64], proof_b: [u8; 128], proof_c: [u8; 64], public_signals: Vec<u8>, compliance_commitment: [u8; 32])]
pub struct VerifyAndMint<'info> {
    #[account(mut)]
    pub farmer: Signer<'info>,

    #[account(
        mut,
        seeds = [STATE_SEED],
        bump = program_state.bump,
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(
        mut,
        seeds = [MINT_SEED],
        bump = program_state.mint_bump,
    )]
    pub green_mint: Account<'info, Mint>,

    /// The farmer's $GREEN token account (ATA)
    #[account(
        mut,
        token::mint = green_mint,
        token::authority = farmer,
    )]
    pub farmer_token_account: Account<'info, TokenAccount>,

    /// PDA derived from commitment — ensures each proof is used only once
    #[account(
        init,
        payer = farmer,
        space = 8 + ProofRecord::INIT_SPACE,
        seeds = [b"proof", compliance_commitment.as_ref()],
        bump,
    )]
    pub proof_record: Account<'info, ProofRecord>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// ─────────────────────────────────────────────────────────────
// State Accounts
// ─────────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct ProgramState {
    pub authority: Pubkey,            // 32
    pub mint: Pubkey,                 // 32
    pub total_proofs_verified: u64,   // 8
    pub total_tokens_minted: u64,     // 8
    pub bump: u8,                     // 1
    pub mint_bump: u8,                // 1
}

#[account]
#[derive(InitSpace)]
pub struct ProofRecord {
    pub commitment: [u8; 32],         // 32 — unique proof commitment
    pub farmer: Pubkey,               // 32 — farmer wallet
    pub timestamp: i64,               // 8  — verification timestamp
    pub verified: bool,               // 1  — always true (only stored if valid)
}

// ─────────────────────────────────────────────────────────────
// Error Codes
// ─────────────────────────────────────────────────────────────

#[error_code]
pub enum KisanError {
    #[msg("Invalid ZK-SNARK proof: proof components must be non-zero")]
    InvalidProof,

    #[msg("Invalid public signals: signals array must not be empty")]
    InvalidPublicSignals,

    #[msg("Invalid commitment: commitment hash must be non-zero")]
    InvalidCommitment,

    #[msg("Proof already used: this compliance commitment has been verified before")]
    ProofAlreadyUsed,
}
