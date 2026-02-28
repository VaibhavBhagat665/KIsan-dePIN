"use client";

import React, { useState } from "react";
import WalletConnect from "@/components/WalletConnect";
import GreenBalance from "@/components/GreenBalance";
import FieldCapture from "@/components/FieldCapture";
import CapturePreview from "@/components/CapturePreview";
import type { CaptureData } from "@/lib/mock-data";

export default function Home() {
  const [captureData, setCaptureData] = useState<CaptureData | null>(null);

  return (
    <main className="relative min-h-screen min-h-[100dvh]">
      {/* Background gradient orbs */}
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 py-6 pb-12 stagger-children">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-400 pulse-glow" />
            <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">
              D-MRV Active
            </span>
          </div>
          <h1 className="text-3xl font-black mb-1">
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Kisan-DePIN
            </span>
          </h1>
          <p className="text-sm text-gray-400">
            Decentralized MRV for Sustainable Agriculture
          </p>
          <p className="text-[11px] text-gray-600 mt-1">
            Smartphone → AI → Satellite → ZK-Proof → $GREEN Token
          </p>
        </header>

        {/* Pipeline Visualization — mini */}
        <div className="glass-card p-3 mb-5">
          <div className="flex items-center justify-between text-[10px] font-mono">
            {[
              { icon: "📱", label: "CAPTURE", active: true },
              { icon: "🤖", label: "AI VERIFY", active: !!captureData },
              { icon: "🛰️", label: "SATELLITE", active: false },
              { icon: "🔐", label: "ZK-PROOF", active: false },
              { icon: "🪙", label: "MINT", active: false },
            ].map((step, i) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-base">{step.icon}</span>
                  <span
                    className={
                      step.active ? "text-green-400" : "text-gray-600"
                    }
                  >
                    {step.label}
                  </span>
                </div>
                {i < 4 && (
                  <div
                    className={`flex-1 h-px mx-1 ${step.active ? "bg-green-500/50" : "bg-gray-700"
                      }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Wallet + Balance Row */}
        <div className="grid grid-cols-1 gap-4 mb-5">
          <WalletConnect />
          <GreenBalance />
        </div>

        {/* Field Capture */}
        <div className="mb-5">
          <FieldCapture onCapture={(data) => setCaptureData(data)} />
        </div>

        {/* Capture Preview (after photo taken) */}
        {captureData && (
          <CapturePreview
            data={captureData}
            onReset={() => setCaptureData(null)}
          />
        )}

        {/* Footer */}
        <footer className="mt-8 text-center">
          <div className="inline-flex items-center gap-1.5 text-[10px] text-gray-600">
            <span>Built on</span>
            <span className="text-purple-400 font-semibold">Solana</span>
            <span>•</span>
            <span>Powered by</span>
            <span className="text-cyan-400 font-semibold">Sentinel-2</span>
            <span>•</span>
            <span>Secured by</span>
            <span className="text-green-400 font-semibold">zk-SNARKs</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
