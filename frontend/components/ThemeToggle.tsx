"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = true, className = "" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Before hydration, render a graceful placeholder with exact dimensions to avoid layout shift
  if (!mounted) {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        {showLabel && (
          <span className="text-xs font-semibold text-gray-500 min-w-[36px] text-right">
            ...
          </span>
        )}
        <div className="relative inline-flex h-7 w-13 shrink-0 rounded-full bg-gray-200 opacity-60" />
      </div>
    );
  }

  const isDark = theme === "dark" || (theme === "system" && resolvedTheme === "dark");

  const toggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {showLabel && (
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 min-w-[36px] text-right select-none">
          {isDark ? "Dark" : "Light"}
        </span>
      )}

      {/* Accessible animated switch */}
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        onClick={toggle}
        className={`group relative inline-flex h-7 w-13 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus-visible:ring-offset-2 ${
          isDark
            ? "bg-gradient-to-r from-purple-700 to-indigo-700 shadow-inner"
            : "bg-gray-200 border border-gray-300 shadow-inner"
        }`}
      >
        <span className="sr-only">Toggle theme</span>

        {/* Sliding circular knob with 300ms ease */}
        <span
          className={`pointer-events-none flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-transform duration-300 ease-in-out ${
            isDark
              ? "translate-x-6 bg-gray-900 text-indigo-300"
              : "translate-x-0 bg-white text-amber-500"
          }`}
        >
          {isDark ? (
            <Moon className="h-3.5 w-3.5 fill-current text-indigo-300 animate-in zoom-in-75 duration-200" />
          ) : (
            <Sun className="h-3.5 w-3.5 fill-current text-amber-500 animate-in zoom-in-75 duration-200" />
          )}
        </span>
      </button>
    </div>
  );
}
