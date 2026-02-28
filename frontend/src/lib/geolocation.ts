// ============================================================
// Kisan-DePIN — Geolocation Wrapper with Mock Fallback
// ============================================================

import { MOCK_GPS, USE_MOCK } from "./mock-data";

export interface GeoPosition {
    latitude: number;
    longitude: number;
    accuracy: number;
}

/**
 * Get current GPS coordinates. Returns mock data if:
 *   - USE_MOCK is true
 *   - Geolocation API is unavailable
 *   - User denies permission
 *   - Request times out (5s)
 */
export async function getCurrentPosition(): Promise<GeoPosition> {
    if (USE_MOCK) {
        // Simulate a tiny network delay for realism
        await new Promise((r) => setTimeout(r, 800));
        return {
            latitude: MOCK_GPS.latitude,
            longitude: MOCK_GPS.longitude,
            accuracy: MOCK_GPS.accuracy,
        };
    }

    if (!("geolocation" in navigator)) {
        console.warn("Geolocation API not available — using mock GPS");
        return {
            latitude: MOCK_GPS.latitude,
            longitude: MOCK_GPS.longitude,
            accuracy: MOCK_GPS.accuracy,
        };
    }

    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                });
            },
            (err) => {
                console.warn("Geolocation error:", err.message, "— using mock GPS");
                resolve({
                    latitude: MOCK_GPS.latitude,
                    longitude: MOCK_GPS.longitude,
                    accuracy: MOCK_GPS.accuracy,
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
            }
        );
    });
}

/**
 * Format coordinates for display
 */
export function formatCoords(lat: number, lng: number): string {
    const latDir = lat >= 0 ? "N" : "S";
    const lngDir = lng >= 0 ? "E" : "W";
    return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}
