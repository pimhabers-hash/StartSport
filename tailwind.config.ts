import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black:   "#0A0B0D",
          surface: "#16181C",
          card:    "#1E2126",
          border:  "#2A2D34",
          gold:    "#C6A15B",
          "gold-light": "#E8C87A",
          ivory:   "#F2EFE9",
          muted:   "#9B9DA3",
        },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "check-in": {
          "0%":   { opacity: "0", transform: "scale(0.5)" },
          "60%":  { transform: "scale(1.15)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "promo-voortgang": {
          "0%":   { width: "0%" },
          "100%": { width: "100%" },
        },
        "bg-drift": {
          "0%, 100%": { transform: "scale(1) translate(0, 0)" },
          "50%":      { transform: "scale(1.08) translate(-2%, 2%)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(198,161,91,0.28)" },
          "50%":      { boxShadow: "0 0 0 8px rgba(198,161,91,0)" },
        },
        "cursor-tik": {
          "0%":   { opacity: "0", transform: "translate(28px, 28px) scale(0.85)" },
          "35%":  { opacity: "1", transform: "translate(0, 0) scale(1)" },
          "48%":  { transform: "translate(0, 0) scale(0.8)" },
          "60%":  { transform: "translate(0, 0) scale(1)" },
          "100%": { opacity: "1", transform: "translate(0, 0) scale(1)" },
        },
        "ripple": {
          "0%":   { opacity: "0.6", transform: "scale(0.3)" },
          "100%": { opacity: "0", transform: "scale(2.2)" },
        },
      },
      animation: {
        "fade-up":         "fade-up 0.6s ease-out both",
        "check-in":        "check-in 0.35s ease-out forwards",
        "shimmer":         "shimmer 3s linear infinite",
        "promo-voortgang": "promo-voortgang 1s linear forwards",
        "bg-drift":        "bg-drift 14s ease-in-out infinite",
        "glow-pulse":      "glow-pulse 2.2s ease-out infinite",
        "cursor-tik":      "cursor-tik 1.8s cubic-bezier(0.22,1,0.36,1) both",
        "ripple":          "ripple 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
