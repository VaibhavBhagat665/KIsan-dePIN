import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0e17",
};

export const metadata: Metadata = {
  title: "Kisan-DePIN — Decentralized MRV for Agriculture",
  description:
    "A 100% software-based Digital Measurement, Reporting, and Verification system using smartphones as edge sensors, cross-verified by satellite imagery and secured by Zero-Knowledge Proofs on Solana.",
  keywords: [
    "DePIN",
    "MRV",
    "Solana",
    "agriculture",
    "carbon credits",
    "zk-SNARK",
    "satellite",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
