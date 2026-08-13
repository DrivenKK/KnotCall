import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Netlify injects URL during builds; used for share links and metadata.
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || "",
  },
};

export default nextConfig;