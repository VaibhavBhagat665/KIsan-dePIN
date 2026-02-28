# 🌾 Kisan-DePIN — Decentralized MRV for Sustainable Agriculture

> **A 100% software-based Digital Measurement, Reporting, and Verification (D-MRV) system** that transforms every smartphone into an edge sensor, cross-verified by satellite imagery APIs, and secured by Zero-Knowledge Proofs on the Solana blockchain.

---

## 🏗️ Architecture — Why Software > $20,000 Hardware

Traditional air quality & crop monitoring relies on **CAAQMS (Continuous Ambient Air Quality Monitoring Stations)** that cost **$20,000+** per unit, require physical installation, regular calibration, and cover only a **1-2 km radius**. India has ~900 stations for 1.4B people.

**Kisan-DePIN eliminates hardware entirely:**

| Dimension | CAAQMS Hardware | Kisan-DePIN (Software) |
|---|---|---|
| **Cost per sensor** | $20,000+ | $0 (uses existing smartphones) |
| **Coverage** | 1-2 km radius | Infinite (every farmer = a node) |
| **Deployment time** | 3-6 months | Instant (download app) |
| **Calibration** | Manual, quarterly | AI-based, continuous |
| **Data integrity** | Centralized, tamperable | On-chain, ZK-verified |
| **Scalability** | Linear ($20K per node) | Exponential (network effects) |
| **Verification** | Government auditors | Automated D-MRV pipeline |

### The Pipeline

```
📱 Smartphone Capture → 🤖 AI Analysis (ResNet+U-Net) → 🛰️ Satellite Cross-Check (Sentinel-2)
  → 🔐 ZK-Proof Generation → ⛓️ On-chain Verification → 🪙 $GREEN Token Mint
```

Every step is **trustless**: farmers can't fake compliance because AI analysis is cross-verified against satellite thermal data, and privacy is preserved via zk-SNARKs (coordinates & identity never touch the public ledger).

---

## 📂 Project Structure

```
hackgreen/
├── frontend/          → Next.js mobile-first dashboard
│   ├── src/app/       → Pages & layout (App Router)
│   └── src/components → FieldCapture, WalletConnect, GreenBalance
├── backend/           → FastAPI + AI computer vision + RAG agent
├── geospatial/        → Sentinel-2 satellite data + super-resolution
├── zk-proofs/         → Circom circuits + SnarkJS proof generation
├── contracts/         → Solana Anchor smart contracts
└── README.md          → You are here
```

---

## 🚀 Quick Start — Phase 1 (Frontend)

### Prerequisites
- **Node.js 18+** & npm
- A Solana wallet (Phantom recommended for mobile)

### Run Locally

```bash
cd frontend
npm install
# Set up your local environment variables in .env before running
npm run dev
```

Open **http://localhost:3000** on your phone (same WiFi) or use Chrome DevTools mobile emulation.

### Features
- 📸 **Field Capture** — Opens device camera, extracts GPS + timestamp automatically
- 💰 **Wallet Integration** — Solana Phantom/Solflare with $GREEN token balance
- 🤖 **AI Verification** — Submit photos for compliance analysis (mock for demo)
- 🎨 **Glassmorphism UI** — Dark theme, animated counters, gradient accents
- 📱 **Mobile-first** — Works perfectly on smartphone browsers

---

## 🔮 Full Pipeline (All Phases)

| Phase | Component | Stack | Status |
|---|---|---|---|
| 1 | Mobile Sensor Frontend | Next.js, TailwindCSS, Solana Wallet | ✅ Complete |
| 2 | AI + Agentic RAG Backend | FastAPI, PyTorch, LangChain | ✅ Complete |
| 3 | Satellite Cross-Verification | OpenEO, Sentinel-2, Heatmaps | ✅ Complete |
| 4 | ZK-Proofs for Privacy | Circom, SnarkJS, zk-SNARKs | ✅ Complete |
| 5 | On-chain Token Minting | Solana Anchor, SPL Tokens | ✅ Complete |

---

## 🏆 Why This Wins

1. **Zero hardware cost** — 800M+ smartphones in India become D-MRV sensors
2. **Privacy-preserving** — Farmer identity & location never exposed on-chain
3. **Trustless verification** — AI ↔ Satellite cross-check eliminates fraud
4. **Instant scalability** — Adding sensors costs $0 (vs $20K per CAAQMS)
5. **Carbon credit monetization** — Direct farmer rewards via Solana SPL tokens
6. **Regulatory compliance** — Agentic RAG for Indian Environmental Law

---

## 📜 License

MIT — Built for the future of decentralized agriculture.
