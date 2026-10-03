import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090d16",
        foreground: "#f8fafc",
        card: {
          DEFAULT: "#0f172a",
          foreground: "#f8fafc",
          hover: "#172033",
          border: "#1e293b",
        },
        popover: {
          DEFAULT: "#0f172a",
          foreground: "#f8fafc",
        },
        primary: {
          DEFAULT: "#6366f1", // Indigo 500
          foreground: "#ffffff",
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        secondary: {
          DEFAULT: "#1e293b",
          foreground: "#f8fafc",
        },
        muted: {
          DEFAULT: "#1e293b",
          foreground: "#94a3b8",
        },
        accent: {
          DEFAULT: "#06b6d4", // Cyan
          foreground: "#090d16",
        },
        success: {
          DEFAULT: "#10b981", // Emerald
          foreground: "#ffffff",
          glow: "rgba(16, 185, 129, 0.2)",
        },
        destructive: {
          DEFAULT: "#f43f5e", // Rose
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#f59e0b", // Amber
          foreground: "#ffffff",
        },
        border: "#1e293b",
        input: "#1e293b",
        ring: "#6366f1",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(99, 102, 241, 0.25)",
        "glow-emerald": "0 0 25px -5px rgba(16, 185, 129, 0.25)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
