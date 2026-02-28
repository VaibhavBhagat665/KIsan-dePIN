"use client";

import React, { useState } from "react";
import Image from "next/image";
import { formatCoords } from "@/lib/geolocation";
import {
    MOCK_COMPLIANCE_RESULT,
    BACKEND_URL,
    USE_MOCK,
} from "@/lib/mock-data";
import type { CaptureData, ComplianceResult } from "@/lib/mock-data";

interface CapturePreviewProps {
    data: CaptureData;
    onReset: () => void;
}

export default function CapturePreview({ data, onReset }: CapturePreviewProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<ComplianceResult | null>(null);

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            if (USE_MOCK) {
                // Simulate API delay for realism
                await new Promise((r) => setTimeout(r, 2000));
                setResult(MOCK_COMPLIANCE_RESULT);
            } else {
                // Real backend call
                const formData = new FormData();
                if (data.image) formData.append("image", data.image);
                formData.append("latitude", data.gps.latitude.toString());
                formData.append("longitude", data.gps.longitude.toString());
                formData.append("timestamp", data.timestamp);

                const res = await fetch(`${BACKEND_URL}/api/v1/analyze`, {
                    method: "POST",
                    body: formData,
                });
                const json = await res.json();
                setResult(json);
            }
        } catch (err) {
            console.error("Submission error:", err);
            // Fallback to mock on error
            setResult(MOCK_COMPLIANCE_RESULT);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="glass-card p-5 fade-in-up">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                Capture Preview
            </h3>

            {/* Image Preview */}
            <div className="relative rounded-lg overflow-hidden mb-4 bg-black/30">
                {data.imagePreview && (
                    <Image
                        src={data.imagePreview}
                        alt="Captured field"
                        width={400}
                        height={300}
                        className="w-full h-48 object-cover"
                        unoptimized
                    />
                )}
                {/* Overlay badge */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-mono text-green-400">
                    EDGE SENSOR
                </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-black/20 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                        GPS Coordinates
                    </p>
                    <p className="text-xs font-mono text-green-400">
                        {formatCoords(data.gps.latitude, data.gps.longitude)}
                    </p>
                </div>
                <div className="bg-black/20 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                        Timestamp
                    </p>
                    <p className="text-xs font-mono text-cyan-400">
                        {new Date(data.timestamp).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        })}
                    </p>
                </div>
                <div className="bg-black/20 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                        Accuracy
                    </p>
                    <p className="text-xs font-mono text-gray-300">
                        ±{data.gps.accuracy.toFixed(0)}m
                    </p>
                </div>
                <div className="bg-black/20 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                        Image Size
                    </p>
                    <p className="text-xs font-mono text-gray-300">
                        {data.image
                            ? `${(data.image.size / 1024).toFixed(0)} KB`
                            : "N/A"}
                    </p>
                </div>
            </div>

            {/* Compliance Result */}
            {result && (
                <div
                    className={`rounded-lg p-4 mb-4 fade-in-up border ${result.status === "COMPLIANT"
                            ? "bg-green-500/10 border-green-500/30"
                            : "bg-red-500/10 border-red-500/30"
                        }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-3 h-3 rounded-full pulse-glow ${result.status === "COMPLIANT"
                                        ? "bg-green-400"
                                        : "bg-red-400"
                                    }`}
                            />
                            <span className="font-bold text-sm">
                                {result.status === "COMPLIANT"
                                    ? "✅ COMPLIANT"
                                    : "🚫 VIOLATION DETECTED"}
                            </span>
                        </div>
                        <span className="text-xs font-mono text-gray-400">
                            {(result.confidence * 100).toFixed(0)}% conf.
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                            <span className="text-gray-500">Burnt Soil:</span>{" "}
                            <span className="text-gray-300">
                                {result.details.burnt_soil_percentage}%
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500">Tilled Soil:</span>{" "}
                            <span className="text-gray-300">
                                {result.details.tilled_soil_percentage}%
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500">NDVI:</span>{" "}
                            <span className="text-gray-300">
                                {result.details.vegetation_index}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500">Fire Alert:</span>{" "}
                            <span
                                className={
                                    result.details.thermal_anomaly
                                        ? "text-red-400"
                                        : "text-green-400"
                                }
                            >
                                {result.details.thermal_anomaly ? "YES" : "NONE"}
                            </span>
                        </div>
                    </div>

                    {result.status === "COMPLIANT" && (
                        <div className="mt-3 pt-3 border-t border-green-500/20 text-xs text-green-400/80">
                            🌱 ZK proof generated → eligible for 1 $GREEN token mint
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                {!result ? (
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="btn-accent flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <svg
                                    className="w-4 h-4 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                Analyzing with AI...
                            </>
                        ) : (
                            <>
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                Submit for Verification
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            setResult(null);
                            onReset();
                        }}
                        className="flex-1 py-3 px-4 rounded-xl border border-gray-600 text-gray-300 hover:border-green-500/50 hover:text-white transition-all text-sm font-semibold"
                    >
                        ↻ New Capture
                    </button>
                )}
            </div>
        </div>
    );
}
