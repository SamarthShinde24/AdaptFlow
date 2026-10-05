"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  MessageSquare,
  GraduationCap,
  Settings,
  School,
  FileText,
  Film,
  Presentation,
  Palette,
  User,
  Trash2,
  ShieldCheck,
  Bell,
  X,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Material } from "@/lib/types";

interface SearchItem {
  id: string;
  scope: "Tools & Pages" | "Uploaded Documents" | "Settings";
  title: string;
  subtitle: string;
  badge?: string;
  icon: React.ElementType;
  onSelect: () => void;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export function GlobalSearch({
  isOpen,
  onClose,
  onOpenSettings,
}: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch uploaded documents from GET /api/materials on mount or when opened
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingMaterials(true);

    fetch("/api/materials")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.materials) {
          setMaterials(data.materials);
        }
      })
      .catch((err) => {
        console.warn("GlobalSearch: fallback materials loading", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingMaterials(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Focus input and reset query on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Define static search items for Tools & Pages and Settings
  const allItems = useMemo<SearchItem[]>(() => {
    const items: SearchItem[] = [
      // Scope 1: Tools & Pages
      {
        id: "tool-dashboard",
        scope: "Tools & Pages",
        title: "Dashboard",
        subtitle: "Multimodal Library & Ingestion management",
        badge: "Page",
        icon: LayoutDashboard,
        onSelect: () => {
          onClose();
          router.push("/dashboard");
        },
      },
      {
        id: "tool-chat",
        scope: "Tools & Pages",
        title: "Source Chat",
        subtitle: "AI Tutor with verified page & timestamp citations",
        badge: "Tutor",
        icon: MessageSquare,
        onSelect: () => {
          onClose();
          router.push("/chat");
        },
      },
      {
        id: "tool-quiz",
        scope: "Tools & Pages",
        title: "Adaptive Quiz",
        subtitle: "Adaptive knowledge assessment & mastery tests",
        badge: "Quiz",
        icon: GraduationCap,
        onSelect: () => {
          onClose();
          router.push("/quiz");
        },
      },
      {
        id: "tool-instructor",
        scope: "Tools & Pages",
        title: "Instructor Portal",
        subtitle: "Curriculum assignment & cohort performance analytics",
        badge: "Faculty",
        icon: School,
        onSelect: () => {
          onClose();
          router.push("/instructor/dashboard");
        },
      },
      {
        id: "tool-settings",
        scope: "Tools & Pages",
        title: "Settings",
        subtitle: "Workspace preferences, profile & themes",
        badge: "Modal",
        icon: Settings,
        onSelect: () => {
          onClose();
          onOpenSettings?.();
        },
      },

      // Scope 2: Uploaded Documents (From GET /api/materials)
      ...materials.map((m) => {
        let IconComp = FileText;
        if (m.material_type === "lecture_video") IconComp = Film;
        if (m.material_type === "slide_deck") IconComp = Presentation;

        return {
          id: `mat-${m.id}`,
          scope: "Uploaded Documents" as const,
          title: m.title,
          subtitle: `[${m.material_type.toUpperCase()}] · ${m.total_units_extracted} verified units`,
          badge: m.subject || "Study Material",
          icon: IconComp,
          onSelect: () => {
            onClose();
            router.push(`/chat?materialId=${m.id}`);
          },
        };
      }),

      // Scope 3: Settings (Static list)
      {
        id: "set-theme",
        scope: "Settings",
        title: "Theme Appearance",
        subtitle: "Pure White Light Mode (#FFFFFF) with brand purple accents",
        badge: "Appearance",
        icon: Palette,
        onSelect: () => {
          onClose();
          onOpenSettings?.();
        },
      },
      {
        id: "set-account",
        scope: "Settings",
        title: "Account Profile & Role",
        subtitle: "Student credentials, email, and enrolled curriculum subjects",
        badge: "Security",
        icon: User,
        onSelect: () => {
          onClose();
          onOpenSettings?.();
        },
      },
      {
        id: "set-clear-history",
        scope: "Settings",
        title: "Clear Conversation History",
        subtitle: "Reset current dialogue thread and cached citations",
        badge: "Storage",
        icon: Trash2,
        onSelect: () => {
          onClose();
          router.push("/chat?session=new");
        },
      },
      {
        id: "set-citations",
        scope: "Settings",
        title: "Citation Confidence Threshold",
        subtitle: "High precision source-grounding filter (100% verified)",
        badge: "Tutor AI",
        icon: ShieldCheck,
        onSelect: () => {
          onClose();
          onOpenSettings?.();
        },
      },
      {
        id: "set-reminders",
        scope: "Settings",
        title: "Study Goal Notifications",
        subtitle: "Daily revision schedule and retention benchmarks",
        badge: "Alerts",
        icon: Bell,
        onSelect: () => {
          onClose();
          onOpenSettings?.();
        },
      },
    ];

    return items;
  }, [materials, router, onClose, onOpenSettings]);

  // Filter items matching query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q))
    );
  }, [allItems, query]);

  // Group items by scope
  const scopes: Array<"Tools & Pages" | "Uploaded Documents" | "Settings"> = [
    "Tools & Pages",
    "Uploaded Documents",
    "Settings",
  ];

  // Keep selected index within bounds when query changes
  useEffect(() => {
    setSelectedIndex(0);
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [query]);

  // Scroll active item into view when navigating via keyboard
  useEffect(() => {
    if (!isOpen || !listRef.current) return;

    const container = listRef.current;
    if (selectedIndex === 0) {
      container.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (selectedIndex === filteredItems.length - 1) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      return;
    }

    const targetEl = container.querySelector(
      `[data-item-index="${selectedIndex}"]`
    ) as HTMLElement | null;

    if (!targetEl) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    // If item is above visible area (leaving 36px room for section header)
    if (targetRect.top < containerRect.top + 36) {
      const diff = containerRect.top + 36 - targetRect.top;
      container.scrollBy({ top: -diff, behavior: "smooth" });
    }
    // If item is below visible area (leaving 16px bottom breathing room)
    else if (targetRect.bottom > containerRect.bottom - 16) {
      const diff = targetRect.bottom - (containerRect.bottom - 16);
      container.scrollBy({ top: diff, behavior: "smooth" });
    }
  }, [selectedIndex, isOpen, filteredItems.length]);

  // Keyboard navigation: Escape, Up, Down, PageUp, PageDown, Home, End, Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (filteredItems.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredItems.length) % filteredItems.length
        );
      } else if (e.key === "PageDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(filteredItems.length - 1, prev + 5));
      } else if (e.key === "PageUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 5));
      } else if (e.key === "Home" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSelectedIndex(0);
      } else if (e.key === "End" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSelectedIndex(filteredItems.length - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        filteredItems[selectedIndex]?.onSelect();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 backdrop-blur-[2px] p-4 sm:pt-20 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex h-14 items-center gap-3 border-b border-gray-100 px-4">
          <Search className="h-5 w-5 text-[#6C63FF] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools, uploaded documents, and settings..."
            className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="pointer-events-none rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-mono text-gray-400 border border-gray-200">
              Esc
            </kbd>
          )}
        </div>

        {/* Grouped Results Container */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-gray-50 scroll-smooth scrollbar-thin scrollbar-thumb-gray-300"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No matching tools, study documents, or settings found.
            </div>
          ) : (
            scopes.map((scope) => {
              const scopeItems = filteredItems.filter(
                (item) => item.scope === scope
              );
              if (scopeItems.length === 0) return null;

              return (
                <div key={scope} className="py-1.5 first:pt-0">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {scope}
                  </div>
                  <div className="space-y-0.5">
                    {scopeItems.map((item) => {
                      const itemIndex = filteredItems.findIndex(
                        (fi) => fi.id === item.id
                      );
                      const isSelected = itemIndex === selectedIndex;
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.id}
                          data-item-index={itemIndex}
                          id={`search-item-${itemIndex}`}
                          role="option"
                          aria-selected={isSelected}
                          onClick={item.onSelect}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={cn(
                            "group flex items-center justify-between rounded-xl px-3 py-2 text-xs cursor-pointer transition-colors",
                            isSelected
                              ? "bg-indigo-50/80 text-gray-900"
                              : "text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors shrink-0",
                                isSelected
                                  ? "bg-[#6C63FF] text-white"
                                  : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col min-w-0 pr-2">
                              <span
                                className={cn(
                                  "font-medium truncate",
                                  isSelected
                                    ? "text-[#6C63FF] font-semibold"
                                    : "text-gray-900"
                                )}
                              >
                                {item.title}
                              </span>
                              <span className="text-[11px] text-gray-400 truncate">
                                {item.subtitle}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.badge && (
                              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                                {item.badge}
                              </span>
                            )}
                            {isSelected && (
                              <ArrowRight className="h-3.5 w-3.5 text-[#6C63FF]" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Shortcuts */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/70 px-4 py-2.5 text-[11px] text-gray-400">
          <div className="flex items-center gap-2">
            <span>Navigate:</span>
            <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-gray-600 border border-gray-200 shadow-xs">
              ↑
            </kbd>
            <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-gray-600 border border-gray-200 shadow-xs">
              ↓
            </kbd>
            <span className="ml-2">Select:</span>
            <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-gray-600 border border-gray-200 shadow-xs">
              Enter
            </kbd>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Close:</span>
            <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-gray-600 border border-gray-200 shadow-xs">
              Esc
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
