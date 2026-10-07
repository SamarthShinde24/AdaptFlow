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
      <main className="min-h-screen bg-gray-50">
        <PageTransition>{children}</PageTransition>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar: Collapsed 56px rail (w-14) vs Expanded 240px (w-60) */}
      <Sidebar />

      {/* Main Content Area - padded to match sidebar width with smooth 200ms transition */}
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-200 ease-in-out",
          isExpanded ? "pl-60" : "pl-14"
        )}
      >
        <Header />
        <main className="flex-1 p-6 md:p-8 bg-gray-50/50 min-h-[calc(100vh-4rem)] relative">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
