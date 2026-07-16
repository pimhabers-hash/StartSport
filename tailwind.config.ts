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
      },
      animation: {
        "fade-up":  "fade-up 0.6s ease-out forwards",
        "check-in": "check-in 0.35s ease-out forwards",
        "shimmer":  "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
