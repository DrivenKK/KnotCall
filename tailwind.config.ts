import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        meet: {
          bg: "#131314",
          surface: "#1e1f20",
          hover: "#2d2e30",
          accent: "#8ab4f8",
          green: "#34a853",
          red: "#ea4335",
          yellow: "#fbbc04",
        },
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          500: "#4285f4",
          600: "#1a73e8",
          700: "#1557b0",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(138, 180, 248, 0.15)",
        "glow-green": "0 0 32px rgba(52, 168, 83, 0.25)",
        float: "0 8px 32px rgba(0, 0, 0, 0.4)",
        card: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.45s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "pulse-ring": "pulseRing 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0px)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0px)" },
        },
        pulseRing: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.4" },
          "50%": { transform: "scale(1.08)", opacity: "0.8" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
