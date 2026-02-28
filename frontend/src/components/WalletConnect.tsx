"use client";

import React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

export default function WalletConnect() {
    const { publicKey, connected } = useWallet();

    return (
        <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div
                        className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-green-400 pulse-glow" : "bg-gray-500"
                            }`}
                    />
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                        Wallet
                    </h3>
                </div>
                {connected && publicKey && (
                    <span className="text-xs font-mono text-gray-500">
                        {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                    </span>
                )}
            </div>
            <WalletMultiButton />
        </div>
    );
}
