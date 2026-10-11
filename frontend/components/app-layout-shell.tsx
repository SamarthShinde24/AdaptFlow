"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/header";
import { useSidebar } from "@/hooks/useSidebar";
import { PageTransition } from "@/components/page-transition";
import { cn } from "@/lib/utils";

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth") || pathname === "/";
  const { isExpanded } = useSidebar();

  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-[#0D0D1A] text-gray-900 dark:text-gray-100">
        <PageTransition>{children}</PageTransition>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0D0D1A] text-gray-900 dark:text-gray-100">
      {/* Sidebar: Desktop Rail / Expanded Sidebar and Mobile Bottom Navigation */}
      <Sidebar />

      {/* Main Content Area: padded for mobile bottom nav, responsive desktop sidebar transition */}
      <div
        className={cn(
          "flex flex-1 flex-col w-full min-w-0 transition-all duration-200 ease-in-out pb-20 md:pb-0",
          isExpanded ? "md:pl-60" : "md:pl-14"
        )}
      >
        <Header />
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 bg-gray-50/60 dark:bg-[#0D0D1A]/80 min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] relative w-full min-w-0 overflow-x-hidden">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
