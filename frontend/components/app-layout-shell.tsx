"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/header";

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  if (isAuthPage) {
    return <main className="min-h-screen bg-gray-50">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* 56px fixed icon-only rail */}
      <Sidebar />

      {/* Main Content Area - padded by 56px (pl-14) so sidebar never pushes content */}
      <div className="flex flex-1 flex-col pl-14 transition-all">
        <Header />
        <main className="flex-1 p-6 md:p-8 bg-gray-50/50 min-h-[calc(100vh-4rem)] relative">
          {children}
        </main>
      </div>
    </div>
  );
}
