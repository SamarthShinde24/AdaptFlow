"use client";

import { useEffect, useCallback, useSyncExternalStore } from "react";

export type SidebarState = "expanded" | "collapsed";

const SIDEBAR_STORAGE_KEY = "adaptflow_sidebar_state_v2";

// In-memory singleton state shared across all components
let memoryState: SidebarState = "expanded";
let isInitialized = false;
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function setSidebarState(next: SidebarState) {
  if (memoryState !== next) {
    memoryState = next;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, next);
      }
    } catch (e) {
      console.warn("Failed saving sidebar state to localStorage", e);
    }
    emitChange();
  }
}

function initFromStorage() {
  if (isInitialized || typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === "expanded" || stored === "collapsed") {
      memoryState = stored;
    } else {
      // Legacy fallback
      const legacy = localStorage.getItem("adaptflow_sidebar_open");
      if (legacy === "false") {
        memoryState = "collapsed";
      } else {
        memoryState = "expanded";
      }
    }
  } catch (e) {
    console.warn("Failed reading sidebar state from localStorage", e);
  }
  isInitialized = true;
}

export function useSidebar() {
  // Initialize from storage on first client hook execution
  useEffect(() => {
    if (!isInitialized) {
      initFromStorage();
      emitChange();
    }
  }, []);

  const state = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      const handleStorage = (e: StorageEvent) => {
        if (
          e.key === SIDEBAR_STORAGE_KEY &&
          (e.newValue === "expanded" || e.newValue === "collapsed")
        ) {
          memoryState = e.newValue as SidebarState;
          emitChange();
        }
      };
      if (typeof window !== "undefined") {
        window.addEventListener("storage", handleStorage);
      }
      return () => {
        listeners.delete(callback);
        if (typeof window !== "undefined") {
          window.removeEventListener("storage", handleStorage);
        }
      };
    },
    () => memoryState,
    () => "expanded" // Server snapshot
  );

  const toggleSidebar = useCallback(() => {
    setSidebarState(memoryState === "expanded" ? "collapsed" : "expanded");
  }, []);

  const expand = useCallback(() => {
    setSidebarState("expanded");
  }, []);

  const collapse = useCallback(() => {
    setSidebarState("collapsed");
  }, []);

  // Global keyboard shortcut: Ctrl+B or Cmd+B toggles sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggleSidebar]);

  return {
    state,
    isExpanded: state === "expanded",
    isCollapsed: state === "collapsed",
    isOpen: state === "expanded",
    toggle: toggleSidebar,
    toggleSidebar,
    expand,
    collapse,
  };
}
