import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#111827",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#111827",
          hover: "#f9fafb",
          border: "#e5e7eb",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#111827",
        },
        primary: {
          DEFAULT: "#6C63FF", // AdaptFlow Brand Purple
          foreground: "#ffffff",
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#6C63FF",
          600: "#5b52e0",
          700: "#4d44c7",
          800: "#3f36a8",
          900: "#322b82",
        },
        secondary: {
          DEFAULT: "#f3f4f6",
          foreground: "#1f2937",
        },
        muted: {
          DEFAULT: "#f3f4f6",
          foreground: "#6b7280",
        },
        accent: {
          DEFAULT: "#6C63FF",
          foreground: "#ffffff",
        },
        success: {
          DEFAULT: "#10b981",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#f59e0b",
          foreground: "#ffffff",
        },
        border: "#e5e7eb",
        input: "#ffffff",
        ring: "#6C63FF",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        xs: "0 1px 1px 0 rgba(0, 0, 0, 0.04)",
        glow: "0 0 20px -3px rgba(108, 99, 255, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
