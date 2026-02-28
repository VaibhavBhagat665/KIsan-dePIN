import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow any image source for demo flexibility
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: true,
  },
  // Turbopack config (Next.js 16+ uses Turbopack by default)
  turbopack: {},
};

export default nextConfig;
