"use client";

import React, { useRef, useState } from "react";
import { getCurrentPosition, formatCoords } from "@/lib/geolocation";
import type { CaptureData } from "@/lib/mock-data";

interface FieldCaptureProps {
    onCapture: (data: CaptureData) => void;
}

export default function FieldCapture({ onCapture }: FieldCaptureProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [gpsStatus, setGpsStatus] = useState<string>("");

    const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsCapturing(true);
        setGpsStatus("Acquiring GPS coordinates...");

        try {
            const gps = await getCurrentPosition();
            const timestamp = new Date().toISOString();
            const imagePreview = URL.createObjectURL(file);

            setGpsStatus(
                `📍 ${formatCoords(gps.latitude, gps.longitude)} (±${gps.accuracy.toFixed(0)}m)`
            );

            onCapture({
                image: file,
                imagePreview,
                gps: {
                    latitude: gps.latitude,
                    longitude: gps.longitude,
                    accuracy: gps.accuracy,
                },
                timestamp,
            });
        } catch (err) {
            console.error("Capture error:", err);
            setGpsStatus("⚠️ GPS unavailable — using fallback");
        } finally {
            setIsCapturing(false);
        }
    };

    return (
        <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Field Capture
            </h3>
            <p className="text-xs text-gray-500 mb-4">
                Capture a photo of your field to begin D-MRV verification
            </p>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCapture}
                className="hidden"
                id="field-capture-input"
            />

            {/* Capture Button */}
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isCapturing}
                className="btn-accent w-full flex items-center justify-center gap-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isCapturing ? (
                    <>
                        <svg
                            className="w-5 h-5 animate-spin"
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
                        Processing...
                    </>
                ) : (
                    <>
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                        Capture Field Photo
                    </>
                )}
            </button>

            {/* GPS Status */}
            {gpsStatus && (
                <p className="mt-3 text-xs text-gray-400 text-center fade-in-up">
                    {gpsStatus}
                </p>
            )}
        </div>
    );
}
