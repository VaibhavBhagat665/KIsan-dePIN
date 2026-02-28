// ============================================================
// Kisan-DePIN — Mock Data for Hackathon Demo Reliability
// Toggle USE_MOCK to true for guaranteed fallback data
// ============================================================

export const USE_MOCK = true;

export const MOCK_GPS = {
    latitude: 28.6139,
    longitude: 77.209,
    accuracy: 12.5,
    label: "New Delhi, India",
};

export const MOCK_COMPLIANCE_RESULT = {
    status: "COMPLIANT" as const,
    confidence: 0.94,
    timestamp: new Date().toISOString(),
    details: {
        burnt_soil_percentage: 2.1,
        tilled_soil_percentage: 89.4,
        vegetation_index: 0.72,
        thermal_anomaly: false,
    },
};

export const MOCK_VIOLATION_RESULT = {
    status: "VIOLATION" as const,
    confidence: 0.88,
    timestamp: new Date().toISOString(),
    details: {
        burnt_soil_percentage: 34.7,
        tilled_soil_percentage: 41.2,
        vegetation_index: 0.31,
        thermal_anomaly: true,
    },
};

export const MOCK_GREEN_BALANCE = 42.0;

export const MOCK_WALLET_ADDRESS = "7xKX...q3Bv";

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export type ComplianceStatus = "COMPLIANT" | "VIOLATION" | "PENDING" | null;

export interface CaptureData {
    image: File | null;
    imagePreview: string | null;
    gps: {
        latitude: number;
        longitude: number;
        accuracy: number;
    };
    timestamp: string;
}

export interface ComplianceResult {
    status: ComplianceStatus;
    confidence: number;
    timestamp: string;
    details: {
        burnt_soil_percentage: number;
        tilled_soil_percentage: number;
        vegetation_index: number;
        thermal_anomaly: boolean;
    };
}
