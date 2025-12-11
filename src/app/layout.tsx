import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NSS 2025",
  description:
    "National Sugar Summit 2025 di Ballroom Grand City Surabaya. Forum nasional untuk memperkuat ketahanan pangan dan energi melalui transformasi industri gula Indonesia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}

        {/* Midtrans Snap JS */}
        <Script
          src="https://app.midtrans.com/snap/snap.js"
          // src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} // PROD client key
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
