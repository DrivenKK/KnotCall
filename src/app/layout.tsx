import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "KnotCall — Free Video Meetings",
    template: "%s · KnotCall",
  },
  description:
    "Start free peer-to-peer video meetings instantly. No signup, no API keys, no server costs. Waiting room, screen share, and chat included.",
  icons: {
    icon: "/favicon.svg",
  },
  keywords: ["video call", "video meeting", "webrtc", "peer to peer", "free meet", "knotcall"],
  authors: [{ name: "KnotCall" }],
  openGraph: {
    title: "KnotCall — Free Video Meetings",
    description: "Instant peer-to-peer video meetings. No signup required.",
    type: "website",
    siteName: "KnotCall",
  },
  twitter: {
    card: "summary_large_image",
    title: "KnotCall — Free Video Meetings",
    description: "Instant peer-to-peer video meetings. No signup required.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#1a73e8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
