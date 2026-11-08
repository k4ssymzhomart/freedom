import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const c = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: c("--bg"),
        surface: c("--surface"),
        "surface-2": c("--surface-2"),
        line: c("--line"),
        "line-strong": c("--line-strong"),
        text: c("--text"),
        "text-2": c("--text-2"),
        "text-inverse": c("--text-inverse"),
        accent: c("--accent"),
        "accent-hover": c("--accent-hover"),
        "accent-subtle": c("--accent-subtle"),
        "accent-fg": c("--accent-fg"),
        brand: c("--brand"),
        "brand-ink": c("--brand-ink"),
        selection: c("--selection"),
        deep: c("--deep"),
        tint: c("--tint"),
        success: c("--success"),
        warning: c("--warning"),
        critical: c("--critical"),
        info: c("--info"),
        "dot-ok": c("--dot-ok"),
        "dot-warn": c("--dot-warn"),
        "dot-flag": c("--dot-flag"),
        "dot-info": c("--dot-info"),
      },
      fontFamily: {
        sans: ['"Geist"', "-apple-system", '"SF Pro Text"', "system-ui", "sans-serif"],
        display: ['"Geist"', "-apple-system", '"SF Pro Display"', "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', '"SF Mono"', "ui-monospace", "Menlo", "monospace"],
      },
      // Kit radii: sm 12 · md 16 · card 24 · pill 999
      borderRadius: { xs: "8px", sm: "12px", DEFAULT: "12px", md: "16px", lg: "24px", xl: "28px" },
      fontSize: {
        display: ["40px", { lineHeight: "1.1", fontWeight: "600", letterSpacing: "-0.03em" }],
        h1: ["32px", { lineHeight: "1.2", fontWeight: "600", letterSpacing: "-0.02em" }],
        h2: ["26px", { lineHeight: "1.2", fontWeight: "600", letterSpacing: "-0.015em" }],
        h3: ["17px", { lineHeight: "1.3", fontWeight: "600", letterSpacing: "-0.005em" }],
        body: ["15px", { lineHeight: "1.5" }],
        caption: ["13px", { lineHeight: "1.4" }],
        small: ["12px", { lineHeight: "1.4" }],
        label: ["11px", { lineHeight: "1.2", fontWeight: "500", letterSpacing: "0.06em" }],
        mono: ["13px", { lineHeight: "1.4" }],
      },
      boxShadow: {
        float: "0 20px 48px -16px rgb(var(--shadow-color) / 0.22), 0 0 0 1px rgb(var(--line))",
        soft: "0 1px 2px rgb(var(--shadow-color) / 0.05)",
        glow: "none",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(2px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        pulseSoft: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.45" } },
      },
      animation: { "fade-in": "fade-in 160ms ease-out", "pulse-soft": "pulseSoft 1.6s ease-in-out infinite" },
    },
  },
  plugins: [animate],
} satisfies Config;
