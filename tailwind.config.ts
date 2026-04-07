import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "var(--ink)",
          muted: "var(--ink-muted)",
          faint: "var(--ink-faint)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          card: "var(--surface-card)",
          raised: "var(--surface-raised)",
        },
        accent: {
          gold: {
            DEFAULT: "var(--accent-gold)",
            dark: "var(--accent-gold-dark)",
          },
          jade: "var(--accent-jade)",
          crimson: "var(--accent-crimson)",
          sky: "var(--accent-sky)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', "serif"],
        body: ['"Outfit"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      fontSize: {
        hero: ["72px", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        h1: ["48px", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
        h2: ["36px", { lineHeight: "1.2" }],
        h3: ["24px", { lineHeight: "1.3" }],
        body: ["16px", { lineHeight: "1.6" }],
        sm: ["14px", { lineHeight: "1.5" }],
        xs: ["12px", { lineHeight: "1.4" }],
      },
      borderRadius: {
        card: "16px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.06)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.10)",
        gold: "0 4px 24px rgba(201,168,76,0.25)",
        subtle: "0 1px 4px rgba(0,0,0,0.04)",
      },
      spacing: {
        section: "96px",
        "section-mobile": "64px",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
