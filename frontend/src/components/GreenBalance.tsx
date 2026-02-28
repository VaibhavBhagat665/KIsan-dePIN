"use client";

import React, { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { MOCK_GREEN_BALANCE, USE_MOCK } from "@/lib/mock-data";

export default function GreenBalance() {
    const { connection } = useConnection();
    const { publicKey, connected } = useWallet();
    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [greenBalance, setGreenBalance] = useState<number>(0);
    const [displayedGreen, setDisplayedGreen] = useState<number>(0);

    // Fetch SOL balance
    useEffect(() => {
        if (!connected || !publicKey) {
            setSolBalance(null);
            return;
        }

        const fetchBalance = async () => {
            try {
                const bal = await connection.getBalance(publicKey);
                setSolBalance(bal / LAMPORTS_PER_SOL);
            } catch {
                setSolBalance(0);
            }
        };

        fetchBalance();
        const id = connection.onAccountChange(publicKey, (account) => {
            setSolBalance(account.lamports / LAMPORTS_PER_SOL);
        });

        return () => {
            connection.removeAccountChangeListener(id);
        };
    }, [connected, publicKey, connection]);

    // Set $GREEN balance (mock for demo)
    useEffect(() => {
        if (connected || USE_MOCK) {
            setGreenBalance(MOCK_GREEN_BALANCE);
        } else {
            setGreenBalance(0);
        }
    }, [connected]);

    // Animated counter for $GREEN
    useEffect(() => {
        if (greenBalance === 0) {
            setDisplayedGreen(0);
            return;
        }

        const duration = 1200;
        const steps = 30;
        const increment = greenBalance / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current = Math.min(current + increment, greenBalance);
            setDisplayedGreen(parseFloat(current.toFixed(1)));

            if (step >= steps) {
                setDisplayedGreen(greenBalance);
                clearInterval(timer);
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [greenBalance]);

    return (
        <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
                Carbon Credits
            </h3>
            <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-black bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent animate-count">
                    {displayedGreen.toFixed(1)}
                </span>
                <span className="text-lg font-bold text-green-400/70 mb-1">$GREEN</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                </svg>
                {connected && solBalance !== null ? (
                    <span>{solBalance.toFixed(4)} SOL on devnet</span>
                ) : (
                    <span>Connect wallet to see SOL balance</span>
                )}
            </div>
        </div>
    );
}
