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
  Clock,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/hooks/useSidebar";
import {
  ChatSession,
  getStoredChatSessions,
  deleteChatSession,
  HISTORY_UPDATE_EVENT,
  createNewChatSession,
} from "@/lib/chat-history";
import { GlobalSearch } from "@/components/GlobalSearch";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isExpanded, toggleSidebar } = useSidebar();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyItems, setHistoryItems] = useState<ChatSession[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [pendingAssignmentsCount, setPendingAssignmentsCount] = useState<number>(2);

  const historyPanelRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Synchronize pending assignments count
  useEffect(() => {
    const fetchPendingAssignments = async () => {
      try {
        const studentId = user?.id || "student_demo_1";
        const res = await fetch(`/api/assignments?student_id=${studentId}`);
        if (res.ok) {
          const data = await res.json();
          const pending = (data.assignments || []).filter(
            (a: any) => a.status === "pending" || a.status === "in_progress"
          );
          setPendingAssignmentsCount(pending.length);
        }
      } catch {
        // Fall back to default
      }
    };

    fetchPendingAssignments();
    window.addEventListener("assignments_updated", fetchPendingAssignments);
    return () => {
      window.removeEventListener("assignments_updated", fetchPendingAssignments);
    };
  }, [user?.id]);

  // Synchronize history items from persistent storage & reactive events
  useEffect(() => {
    const syncSessions = () => {
      setHistoryItems(getStoredChatSessions());
    };
    syncSessions();

    window.addEventListener(HISTORY_UPDATE_EVENT, syncSessions);
    window.addEventListener("storage", syncSessions);
    return () => {
      window.removeEventListener(HISTORY_UPDATE_EVENT, syncSessions);
      window.removeEventListener("storage", syncSessions);
    };
  }, []);

  // Close history drawer when navigating to different route
  useEffect(() => {
    setIsHistoryOpen(false);
  }, [pathname]);

  // Handle global keyboard shortcut: Ctrl+K / Cmd+K opens Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

  const isDashboardActive =
    pathname === "/dashboard" ||
    pathname === "/instructor/dashboard" ||
    pathname.startsWith("/dashboard");
  const isChatActive = pathname === "/chat" || pathname.startsWith("/chat");
  const isQuizActive = pathname === "/quiz" || pathname.startsWith("/quiz");
  const isAssignmentsActive =
    pathname === "/assignments" || pathname.startsWith("/assignments");

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
    deleteChatSession(id);
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSelectHistorySession = (session: ChatSession) => {
    setIsHistoryOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("adaptflow:select-session", { detail: { sessionId: session.id } })
      );
    }
    router.push(`/chat?session=${session.id}`);
  };

  const displayName = user?.name || user?.full_name || "AF";
  const userInitials = displayName
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {/* ========================================================================= */}
      {/* PRIMARY SIDEBAR: COLLAPSED RAIL (56px / w-14) VS EXPANDED (240px / w-60)  */}
      {/* ========================================================================= */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col justify-between border-r border-gray-200 bg-gray-100/90 backdrop-blur-md select-none transition-all duration-200 ease-in-out shadow-xs",
          isExpanded ? "w-60 p-3" : "w-14 py-3 px-2"
        )}
      >
        {/* Top: Header / Logo + Nav Items + History Section */}
        <div className="flex flex-col min-h-0 flex-1">
          {/* Header Row */}
          {isExpanded ? (
            <div className="flex items-center justify-between px-1 pb-3 border-b border-gray-200/80">
              <Link
                href={user?.role === "instructor" ? "/instructor/dashboard" : "/dashboard"}
                className="flex items-center gap-2.5 group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6C63FF] to-blue-500 text-white shadow-md group-hover:scale-105 transition-all shrink-0">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900 tracking-tight leading-none">
                    AdaptFlow
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium mt-0.5">
                    AI Learning v2.0
                  </span>
                </div>
              </Link>

              {/* Collapse Sidebar Toggle Button (PanelLeftClose) */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSidebar();
                }}
                className="group relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-white hover:text-gray-900 transition-colors cursor-pointer border border-transparent hover:border-gray-200 hover:shadow-xs z-10"
                aria-label="Hide sidebar"
                title="Hide sidebar"
              >
                <PanelLeftClose className="h-4.5 w-4.5" />
                {/* Floating Tooltip */}
                <span className="pointer-events-none absolute right-0 top-full mt-1.5 z-50 hidden group-hover:flex items-center gap-1.5 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-md">
                  <span>Hide sidebar</span>
                  <kbd className="rounded bg-gray-700 px-1 py-0.5 text-[10px] text-gray-300 font-mono">
                    Ctrl+B
                  </kbd>
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 pb-2">
              {/* Expand Sidebar Toggle Button (PanelLeftOpen) */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSidebar();
                }}
                className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-xs hover:bg-gray-50 hover:text-gray-900 hover:border-[#6C63FF]/30 transition-all cursor-pointer z-10"
                aria-label="Show sidebar"
                title="Show sidebar"
              >
                <PanelLeftOpen className="h-4.5 w-4.5" />
                {/* Floating Tooltip */}
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 flex items-center gap-1.5 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  <span>Show sidebar</span>
                  <kbd className="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-300 font-mono">
                    Ctrl+B
                  </kbd>
                </span>
              </button>

              {/* Home Icon */}
              <Link
                href={user?.role === "instructor" ? "/instructor/dashboard" : "/dashboard"}
                className="group relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#6C63FF] to-blue-500 text-white shadow-xs hover:scale-105 transition-all"
                aria-label="AdaptFlow Home"
              >
                <Sparkles className="h-4.5 w-4.5" />
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  AdaptFlow Home
                </span>
              </Link>

              <div className="h-[1px] w-6 bg-gray-200 my-0.5" />
            </div>
          )}

          {/* Navigation Items */}
          <nav className={cn("flex flex-col gap-1 mt-2", isExpanded ? "px-0" : "items-center")}>
            {/* 1. Dashboard */}
            <Link
              href={user?.role === "instructor" ? "/instructor/dashboard" : "/dashboard"}
              className={cn(
                "group relative flex items-center transition-all duration-150",
                isExpanded
                  ? "w-full gap-3 px-3 py-2 rounded-xl text-xs font-medium"
                  : "h-10 w-10 justify-center rounded-xl",
                isDashboardActive
                  ? "bg-white text-[#6C63FF] shadow-xs font-semibold"
                  : "text-gray-600 hover:bg-white/80 hover:text-gray-900"
              )}
              aria-label="Dashboard"
            >
              <LayoutDashboard className="h-4.5 w-4.5 shrink-0" />
              {isExpanded && <span>Dashboard</span>}
              {!isExpanded && isDashboardActive && (
                <span className="absolute left-0 h-4 w-1 rounded-r-full bg-[#6C63FF]" />
              )}
              {!isExpanded && (
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  Dashboard
                </span>
              )}
            </Link>

            {/* 2. Global Search Nav Item (Positioned between Dashboard and Source Chat) */}
            <button
              type="button"
              onClick={() => setIsGlobalSearchOpen(true)}
              className={cn(
                "group relative flex items-center transition-all duration-150 cursor-pointer",
                isExpanded
                  ? "w-full justify-between px-3 py-2 rounded-xl text-xs font-medium bg-gray-200/50 hover:bg-white text-gray-600 hover:text-gray-900 border border-transparent hover:border-gray-200 shadow-xs"
                  : "h-10 w-10 justify-center rounded-xl bg-gray-200/60 hover:bg-white text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200"
              )}
              aria-label="Global Search"
            >
              <div className="flex items-center gap-3">
                <Search className="h-4.5 w-4.5 shrink-0" />
                {isExpanded && <span>Search</span>}
              </div>

              {isExpanded ? (
                <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-gray-500 border border-gray-200 shadow-xs">
                  Ctrl+K
                </kbd>
              ) : (
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 flex items-center gap-1.5 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  <span>Search</span>
                  <kbd className="rounded bg-gray-700 px-1 py-0.5 text-[10px] text-gray-300 font-mono">
                    Ctrl+K
                  </kbd>
                </span>
              )}
            </button>

            {/* 3. Source Chat */}
            <Link
              href="/chat"
              className={cn(
                "group relative flex items-center transition-all duration-150",
                isExpanded
                  ? "w-full gap-3 px-3 py-2 rounded-xl text-xs font-medium"
                  : "h-10 w-10 justify-center rounded-xl",
                isChatActive
                  ? "bg-white text-[#6C63FF] shadow-xs font-semibold"
                  : "text-gray-600 hover:bg-white/80 hover:text-gray-900"
              )}
              aria-label="Source Chat"
            >
              <MessageSquare className="h-4.5 w-4.5 shrink-0" />
              {isExpanded && <span>Source Chat</span>}
              {!isExpanded && isChatActive && (
                <span className="absolute left-0 h-4 w-1 rounded-r-full bg-[#6C63FF]" />
              )}
              {!isExpanded && (
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  Source Chat
                </span>
              )}
            </Link>

            {/* 4. Adaptive Quiz */}
            <Link
              href="/quiz"
              className={cn(
                "group relative flex items-center transition-all duration-150",
                isExpanded
                  ? "w-full gap-3 px-3 py-2 rounded-xl text-xs font-medium"
                  : "h-10 w-10 justify-center rounded-xl",
                isQuizActive
                  ? "bg-white text-[#6C63FF] shadow-xs font-semibold"
                  : "text-gray-600 hover:bg-white/80 hover:text-gray-900"
              )}
              aria-label="Adaptive Quiz"
            >
              <GraduationCap className="h-4.5 w-4.5 shrink-0" />
              {isExpanded && <span>Adaptive Quiz</span>}
              {!isExpanded && isQuizActive && (
                <span className="absolute left-0 h-4 w-1 rounded-r-full bg-[#6C63FF]" />
              )}
              {!isExpanded && (
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  Adaptive Quiz
                </span>
              )}
            </Link>

            {/* 5. Assignments Nav Item */}
            <Link
              href="/assignments"
              className={cn(
                "group relative flex items-center transition-all duration-150",
                isExpanded
                  ? "w-full justify-between px-3 py-2 rounded-xl text-xs font-medium"
                  : "h-10 w-10 justify-center rounded-xl",
                isAssignmentsActive
                  ? "bg-white text-[#6C63FF] shadow-xs font-semibold"
                  : "text-gray-600 hover:bg-white/80 hover:text-gray-900"
              )}
              aria-label="Assignments"
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="h-4.5 w-4.5 shrink-0" />
                {isExpanded && <span>Assignments</span>}
              </div>

              {isExpanded ? (
                pendingAssignmentsCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 shadow-2xs">
                    {pendingAssignmentsCount}
                  </span>
                )
              ) : (
                <>
                  {pendingAssignmentsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
                  )}
                  {isAssignmentsActive && (
                    <span className="absolute left-0 h-4 w-1 rounded-r-full bg-[#6C63FF]" />
                  )}
                  <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                    Assignments
                  </span>
                </>
              )}
            </Link>

            {/* 6. Dialogue History (in collapsed rail mode) */}
            {!isExpanded && (
              <button
                type="button"
                onClick={() => setIsHistoryOpen((prev) => !prev)}
                className={cn(
                  "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150",
                  isHistoryOpen
                    ? "bg-white text-[#6C63FF] shadow-xs font-semibold"
                    : "text-gray-600 hover:bg-white/80 hover:text-gray-900"
                )}
                aria-label="Dialogue History"
                title="Dialogue History"
              >
                <History className="h-4.5 w-4.5 shrink-0" />
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  Dialogue History
                </span>
              </button>
            )}
          </nav>

          {/* Expanded State: Grouped History Section directly below nav items */}
          {isExpanded && (
            <div className="flex-1 flex flex-col min-h-0 mt-4 pt-3 border-t border-gray-200/80">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Dialogue History
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newSession = createNewChatSession();
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(
                        new CustomEvent("adaptflow:select-session", { detail: { sessionId: newSession.id } })
                      );
                    }
                    router.push(`/chat?session=${newSession.id}`);
                  }}
                  className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold text-[#6C63FF] hover:bg-white transition-colors cursor-pointer"
                  title="Create new dialogue"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New</span>
                </button>
              </div>

              {/* History Search Bar (Preserved inside history section) */}
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search past conversations..."
                  className="w-full rounded-xl border border-gray-200 bg-white/80 pl-8 pr-2.5 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#6C63FF] focus:outline-none focus:ring-1 focus:ring-indigo-100 transition-all"
                />
              </div>

              {/* Grouped History Sessions List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-gray-300">
                {dateGroups.map((group) => {
                  const itemsInGroup = filteredHistory.filter(
                    (item) => item.dateGroup === group
                  );
                  if (itemsInGroup.length === 0) return null;

                  return (
                    <div key={group} className="space-y-1">
                      <div className="px-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {group}
                      </div>
                      {itemsInGroup.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => handleSelectHistorySession(session)}
                          className="group relative flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-xs cursor-pointer transition-all"
                        >
                          <div className="flex flex-col min-w-0 pr-1">
                            <span className="font-medium truncate group-hover:text-[#6C63FF] transition-colors">
                              {session.title}
                            </span>
                            <span className="text-[10px] text-gray-400 truncate">
                              {session.timestamp} · {session.sourcePreview}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteHistoryItem(session.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-opacity"
                            title="Delete dialogue"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}

                {filteredHistory.length === 0 && (
                  <div className="py-6 text-center text-xs text-gray-400">
                    No conversations found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: Settings & User Profile */}
        <div className="pt-2 border-t border-gray-200/80 relative" ref={profileMenuRef}>
          {isExpanded ? (
            <div className="flex items-center justify-between px-1">
              {/* User Avatar + Name */}
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 text-left rounded-xl p-1.5 hover:bg-white transition-colors min-w-0 flex-1 cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#6C63FF] to-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {userInitials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-gray-900 truncate">
                    {user?.name || "Student"}
                  </span>
                  <span className="text-[10px] text-gray-500 capitalize truncate">
                    {user?.role || "Student"}
                  </span>
                </div>
              </button>

              {/* Settings Gear Button */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Settings & Preferences"
              >
                <Settings className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {/* Settings Gear Button */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-white/80 hover:text-gray-900 transition-all cursor-pointer"
                aria-label="Settings"
              >
                <Settings className="h-4.5 w-4.5" />
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  Settings & Preferences
                </span>
              </button>

              {/* User Avatar Button */}
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="group relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#6C63FF] to-blue-500 text-white text-xs font-bold shadow-xs hover:ring-2 hover:ring-[#6C63FF]/30 transition-all cursor-pointer"
                aria-label="User Profile"
              >
                <span>{userInitials}</span>
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  {user?.name || "Account Profile"}
                </span>
              </button>
            </div>
          )}

          {/* Profile Menu Popover */}
          {isProfileMenuOpen && (
            <div
              className={cn(
                "absolute bottom-full mb-2 z-50 w-64 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl animate-in fade-in zoom-in-95 duration-150",
                isExpanded ? "left-0" : "left-14"
              )}
            >
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100 px-1">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#6C63FF] to-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
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
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
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
                  <span>Switch Role / Account</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-gray-100">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
      {/* SLIDING HISTORY DRAWER (WHEN IN COLLAPSED RAIL MODE)                      */}
      {/* ========================================================================= */}
      {!isExpanded && isHistoryOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px] transition-opacity"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}

      {!isExpanded && (
        <div
          ref={historyPanelRef}
          className={cn(
            "fixed top-0 z-40 h-screen w-80 border-r border-gray-200 bg-white shadow-xl transition-all duration-300 ease-in-out flex flex-col",
            isHistoryOpen
              ? "left-14 translate-x-0 opacity-100 visible pointer-events-auto"
              : "left-14 -translate-x-[calc(100%+4rem)] opacity-0 invisible pointer-events-none"
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
            <button
              type="button"
              onClick={() => {
                const newSession = createNewChatSession();
                setIsHistoryOpen(false);
                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("adaptflow:select-session", { detail: { sessionId: newSession.id } })
                  );
                }
                router.push(`/chat?session=${newSession.id}`);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-[1.02] active:scale-[0.98] text-white py-2 px-3 text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New AI Dialogue</span>
            </button>

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
          <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-gray-300">
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
      )}

      {/* ========================================================================= */}
      {/* GLOBAL SEARCH COMMAND PALETTE MODAL                                       */}
      {/* ========================================================================= */}
      <GlobalSearch
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* ========================================================================= */}
      {/* SETTINGS MODAL                                                            */}
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
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
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

              {/* Interface Shortcuts & Tips */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-2">
                <div className="text-gray-900 font-semibold text-xs">Keyboard Shortcuts</div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Toggle Sidebar (Hide / Show)</span>
                  <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] text-gray-700 font-mono border border-gray-200 shadow-xs">
                    Ctrl + B
                  </kbd>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Global Search (Command Palette)</span>
                  <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] text-gray-700 font-mono border border-gray-200 shadow-xs">
                    Ctrl + K
                  </kbd>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Send Chat Message</span>
                  <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] text-gray-700 font-mono border border-gray-200 shadow-xs">
                    Enter
                  </kbd>
                </div>
              </div>

              {/* Theme & Palette info */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="font-medium text-gray-900">Theme Appearance</div>
                  <div className="text-[11px] text-gray-500">Pure White Light Mode (#FFFFFF)</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-full bg-[#6C63FF]" title="Brand Purple Accent" />
                  <span className="h-3.5 w-3.5 rounded-full bg-white border border-gray-300" title="Pure White" />
                  <span className="h-3.5 w-3.5 rounded-full bg-gray-100 border border-gray-200" title="Sidebar Gray" />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-2 text-xs font-semibold text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
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
