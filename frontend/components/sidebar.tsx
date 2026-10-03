"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquareText,
  GraduationCap,
  Sparkles,
  Layers,
  Activity,
  FolderGit2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Upload & Multimodal Library",
  },
  {
    name: "Source Chat",
    href: "/chat",
    icon: MessageSquareText,
    description: "Source-grounded AI dialogue",
  },
  {
    name: "Adaptive Quiz",
    href: "/quiz",
    icon: GraduationCap,
    description: "Targeted skill assessments",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card/90 backdrop-blur-xl transition-all">
      {/* Brand header */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent shadow-glow">
          <Layers className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold tracking-tight text-white">
              AdaptFlow
            </span>
            <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary-300">
              AI 2.0
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">Adaptive Learning Engine</p>
        </div>
      </div>

      {/* Navigation items */}
      <div className="flex-1 space-y-1.5 px-3 py-4">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Core Workspaces
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/15 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-white shadow-glow"
                    : "bg-secondary/60 text-muted-foreground group-hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="leading-snug">{item.name}</span>
                <span className="text-[11px] text-muted-foreground group-hover:text-muted-foreground/80">
                  {item.description}
                </span>
              </div>

              {isActive && (
                <div className="absolute right-2 h-5 w-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Backend Status & System Meta */}
      <div className="border-t border-border p-4">
        <div className="rounded-xl border border-border bg-secondary/40 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              FastAPI Engine
            </span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              Online
            </span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
            <FolderGit2 className="h-3 w-3" />
            <span>Port 8000 · REST + SSE</span>
          </div>
        </div>

        {/* User Workspace Info */}
        <div className="mt-3 flex items-center gap-2.5 px-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary-300">
            AF
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-foreground">AdaptFlow Student</span>
            <span className="text-[10px] text-muted-foreground">Biology & CS Track</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
