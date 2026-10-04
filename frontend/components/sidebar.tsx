"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  GraduationCap,
  History,
  Settings,
  Sparkles,
  X,
  Plus,
  Search,
  LogOut,
  User as UserIcon,
  School,
  Clock,
  Trash2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface HistorySession {
  id: string;
  title: string;
  dateGroup: "Today" | "Yesterday" | "Last 7 Days";
  timestamp: string;
  sourcePreview: string;
}

const DEFAULT_HISTORY: HistorySession[] = [
  {
    id: "hist_1",
    title: "Cellular Respiration & ATP Synthesis",
    dateGroup: "Today",
    timestamp: "10:45 AM",
    sourcePreview: "[PDF p.42 · Biology]",
  },
  {
    id: "hist_2",
    title: "Hawa Mahal Architectural History",
    dateGroup: "Today",
    timestamp: "9:15 AM",
    sourcePreview: "[PDF p.1 · Heritage]",
  },
  {
    id: "hist_3",
    title: "Glycolysis Net ATP & NADH Reaction",
    dateGroup: "Yesterday",
    timestamp: "Yesterday, 3:20 PM",
    sourcePreview: "[Slide 4 · Bioenergetics]",
  },
  {
    id: "hist_4",
    title: "Binary Search Trees & Complexity",
    dateGroup: "Yesterday",
    timestamp: "Yesterday, 1:10 PM",
    sourcePreview: "[CS201 · Slide 12]",
  },
  {
    id: "hist_5",
    title: "Photosynthesis Light-Dependent Reactions",
    dateGroup: "Last 7 Days",
    timestamp: "Oct 1, 4:40 PM",
    sourcePreview: "[PDF p.88 · Biology]",
  },
  {
    id: "hist_6",
    title: "Laws of Thermodynamics & Equilibrium",
    dateGroup: "Last 7 Days",
    timestamp: "Sep 29, 11:15 AM",
    sourcePreview: "[Lecture Video 12:30]",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyItems, setHistoryItems] = useState<HistorySession[]>(DEFAULT_HISTORY);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const historyPanelRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close history drawer when navigating to different route
  useEffect(() => {
    setIsHistoryOpen(false);
  }, [pathname]);

  // Handle click outside history drawer & profile menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        historyPanelRef.current &&
        !historyPanelRef.current.contains(event.target as Node)
      ) {
        setIsHistoryOpen(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }

    if (isHistoryOpen || isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isHistoryOpen, isProfileMenuOpen]);

  const navItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      href: user?.role === "instructor" ? "/instructor/dashboard" : "/dashboard",
      icon: LayoutDashboard,
      isActive:
        pathname === "/dashboard" ||
        pathname === "/instructor/dashboard" ||
        pathname.startsWith("/dashboard"),
    },
    {
      id: "chat",
      name: "Source Chat",
      href: "/chat",
      icon: MessageSquare,
      isActive: pathname === "/chat" || pathname.startsWith("/chat"),
    },
    {
      id: "quiz",
      name: "Adaptive Quiz",
      href: "/quiz",
      icon: GraduationCap,
      isActive: pathname === "/quiz" || pathname.startsWith("/quiz"),
    },
  ];

  const filteredHistory = historyItems.filter((item) =>
    item.title.toLowerCase().includes(historySearch.toLowerCase())
  );

  const dateGroups: Array<"Today" | "Yesterday" | "Last 7 Days"> = [
    "Today",
    "Yesterday",
    "Last 7 Days",
  ];

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSelectHistorySession = (session: HistorySession) => {
    setIsHistoryOpen(false);
    router.push("/chat");
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AF";

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. COLLAPSED ICON-ONLY RAIL (56px / w-14)                                */}
      {/* ========================================================================= */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-14 flex-col justify-between border-r border-gray-200 bg-gray-100 py-3 select-none">
        {/* Top: Logo / Home */}
        <div className="flex flex-col items-center gap-4">
          <Link
            href={user?.role === "instructor" ? "/instructor/dashboard" : "/dashboard"}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6C63FF] to-indigo-500 text-white shadow-sm hover:scale-105 transition-all"
            aria-label="AdaptFlow Home"
          >
            <Sparkles className="h-5 w-5" />
            {/* Tooltip */}
            <span className="pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              AdaptFlow AI 2.0
            </span>
          </Link>

          <div className="h-[1px] w-8 bg-gray-200" />

          {/* Navigation Links */}
          <nav className="flex flex-col items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150",
                    item.isActive
                      ? "bg-white text-[#6C63FF] shadow-xs font-semibold"
                      : "text-gray-500 hover:bg-white/80 hover:text-gray-900"
                  )}
                  aria-label={item.name}
                >
                  <Icon className="h-5 w-5" />
                  {/* Active Indicator Bar */}
                  {item.isActive && (
                    <span className="absolute left-0 h-4 w-1 rounded-r-full bg-[#6C63FF]" />
                  )}
                  {/* Floating Tooltip */}
                  <span className="pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    {item.name}
                  </span>
                </Link>
              );
            })}

            {/* History Toggle Button */}
            <button
              type="button"
              onClick={() => setIsHistoryOpen((prev) => !prev)}
              className={cn(
                "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 cursor-pointer",
                isHistoryOpen
                  ? "bg-white text-[#6C63FF] shadow-xs"
                  : "text-gray-500 hover:bg-white/80 hover:text-gray-900"
              )}
              aria-label="Chat History"
            >
              <History className="h-5 w-5" />
              {isHistoryOpen && (
                <span className="absolute left-0 h-4 w-1 rounded-r-full bg-[#6C63FF]" />
              )}
              {/* Floating Tooltip */}
              <span className="pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {isHistoryOpen ? "Close History" : "Chat History"}
              </span>
            </button>
          </nav>
        </div>

        {/* Bottom: Settings & User Profile Avatar */}
        <div className="flex flex-col items-center gap-2 relative" ref={profileMenuRef}>
          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-white/80 hover:text-gray-900 transition-all cursor-pointer"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
            <span className="pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              Settings & Preferences
            </span>
          </button>

          <div className="h-[1px] w-8 bg-gray-200 my-1" />

          {/* User Avatar Button */}
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-[#6C63FF] text-white text-xs font-bold shadow-xs hover:ring-2 hover:ring-[#6C63FF]/30 transition-all cursor-pointer"
            aria-label="User Profile"
          >
            <span>{userInitials}</span>
            <span className="pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {user?.name || "Account Profile"} ({user?.role === "instructor" ? "Instructor" : "Student"})
            </span>
          </button>

          {/* User Profile Popover Menu */}
          {isProfileMenuOpen && (
            <div className="absolute left-16 bottom-0 z-50 w-64 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100 px-1">
                <div className="h-9 w-9 rounded-full bg-[#6C63FF] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {userInitials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-gray-900 truncate">
                    {user?.name || "AdaptFlow User"}
                  </span>
                  <span className="text-[11px] text-gray-500 truncate">
                    {user?.email || "user@adaptflow.edu"}
                  </span>
                  <span className="inline-block mt-0.5 w-fit rounded-full bg-indigo-50 px-2 py-0.2 text-[10px] font-semibold text-[#6C63FF] capitalize">
                    {user?.role || "Student"}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 text-gray-400" />
                  <span>Workspace Preferences</span>
                </button>
                <Link
                  href="/auth"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                  <span>Switch Workspace Role</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-gray-100">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. HISTORY SLIDING PANEL (GEMINI-STYLE DRAWER)                             */}
      {/* ========================================================================= */}
      {/* Backdrop overlay for quick dismissal */}
      {isHistoryOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/5 backdrop-blur-[1px] transition-opacity"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}

      <div
        ref={historyPanelRef}
        className={cn(
          "fixed left-14 top-0 z-40 h-screen w-80 border-r border-gray-200 bg-white shadow-lg transition-transform duration-200 ease-in-out flex flex-col",
          isHistoryOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
      >
        {/* History Drawer Header */}
        <div className="flex h-14 items-center justify-between border-b border-gray-100 px-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#6C63FF]" />
            <h3 className="text-sm font-bold text-gray-900">Dialogue History</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsHistoryOpen(false)}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
            aria-label="Close History"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* New Chat Button & Search Bar */}
        <div className="p-3 space-y-2 border-b border-gray-100">
          <Link
            href="/chat"
            onClick={() => setIsHistoryOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6C63FF] hover:bg-[#5a51e0] text-white py-2 px-3 text-xs font-semibold shadow-xs transition-all active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            <span>New AI Dialogue</span>
          </Link>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search past conversations..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#6C63FF] focus:outline-none focus:ring-1 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>

        {/* Grouped History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {dateGroups.map((group) => {
            const itemsInGroup = filteredHistory.filter((item) => item.dateGroup === group);
            if (itemsInGroup.length === 0) return null;

            return (
              <div key={group} className="space-y-1">
                <div className="px-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {group}
                </div>
                {itemsInGroup.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectHistorySession(session)}
                    className="group relative flex items-center justify-between rounded-xl px-2.5 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition-colors"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-medium truncate text-gray-900 group-hover:text-[#6C63FF] transition-colors">
                        {session.title}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>{session.timestamp}</span>
                        <span>·</span>
                        <span className="text-gray-500 truncate">{session.sourcePreview}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteHistoryItem(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-opacity"
                      title="Delete session"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}

          {filteredHistory.length === 0 && (
            <div className="py-8 text-center text-xs text-gray-400">
              No matching conversation records found.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SETTINGS MODAL                                                         */}
      {/* ========================================================================= */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#6C63FF]" />
                <h3 className="text-base font-bold text-gray-900">AdaptFlow Preferences</h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Account Details */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-1.5">
                <div className="text-gray-500 font-medium">Logged in account</div>
                <div className="font-bold text-gray-900 text-sm">{user?.name || "Student"}</div>
                <div className="text-gray-600">{user?.email || "student@adaptflow.edu"}</div>
                <div className="pt-1">
                  <span className="inline-block rounded-md bg-[#6C63FF]/10 text-[#6C63FF] px-2 py-0.5 text-[10px] font-bold uppercase">
                    Role: {user?.role || "Student"}
                  </span>
                </div>
              </div>

              {/* Theme Settings */}
              <div>
                <div className="font-semibold text-gray-800 mb-1.5">Visual Mode</div>
                <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3 bg-white">
                  <div>
                    <div className="font-medium text-gray-900">Light Mode (Default)</div>
                    <div className="text-[11px] text-gray-500">
                      High-legibility white theme with AdaptFlow purple accent
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                    <Check className="h-4 w-4" />
                    <span>Active</span>
                  </span>
                </div>
              </div>

              {/* API Connection */}
              <div>
                <div className="font-semibold text-gray-800 mb-1.5">FastAPI Backend Engine</div>
                <div className="rounded-xl border border-gray-200 p-3 bg-gray-50 text-[11px] text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>REST & SSE Engine:</span>
                    <span className="font-mono text-emerald-600 font-bold">127.0.0.1:8000 (Online)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Source Grounding:</span>
                    <span className="font-medium text-gray-800">Chunk & Provenance Linked</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
