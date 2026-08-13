import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: "KnotCall — Free Video Meetings",
    template: "%s · KnotCall",
  },
  description:
    "Free peer-to-peer video meetings in your browser. Waiting room, host controls, screen share, and chat. Works in Chrome, Brave, Opera, Edge, Firefox, and Safari.",
  icons: {
    icon: "/favicon.svg",
  },
  keywords: ["video call", "video meeting", "webrtc", "peer to peer", "free meet", "knotcall"],
  authors: [{ name: "KnotCall" }],
  openGraph: {
    title: "KnotCall — Free Video Meetings",
    description: "Instant peer-to-peer video meetings with waiting room and host controls.",
    type: "website",
    siteName: "KnotCall",
    ...(siteUrl ? { url: siteUrl } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: "KnotCall — Free Video Meetings",
    description: "Instant peer-to-peer video meetings with waiting room and host controls.",
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
