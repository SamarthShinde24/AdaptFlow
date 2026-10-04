"use client";

import { useState, useEffect, useCallback } from "react";

export type SidebarState = "expanded" | "collapsed";

const SIDEBAR_STORAGE_KEY = "adaptflow_sidebar_state_v2";
const SIDEBAR_EVENT = "adaptflow:sidebar-state-change";

export function useSidebar() {
  const [state, setState] = useState<SidebarState>("collapsed");
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Initialize from localStorage on client mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored === "expanded" || stored === "collapsed") {
        setState(stored);
      } else {
        // Migration from legacy boolean if present
        const legacy = localStorage.getItem("adaptflow_sidebar_open");
        if (legacy === "false") {
          setState("collapsed");
        }
      }
    } catch (e) {
      console.warn("Failed reading sidebar state from localStorage", e);
    }
  }, []);

  const setSidebarState = useCallback((nextState: SidebarState) => {
    setState(nextState);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, nextState);
    } catch (e) {
      console.warn("Failed saving sidebar state to localStorage", e);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(SIDEBAR_EVENT, { detail: { state: nextState } })
      );
    }
  }, []);

  const toggle = useCallback(() => {
    setState((prev) => {
      const next: SidebarState = prev === "expanded" ? "collapsed" : "expanded";
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, next);
      } catch (e) {
        console.warn(e);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(SIDEBAR_EVENT, { detail: { state: next } })
        );
      }
      return next;
    });
  }, []);

  const expand = useCallback(() => {
    setSidebarState("expanded");
  }, [setSidebarState]);

  const collapse = useCallback(() => {
    setSidebarState("collapsed");
  }, [setSidebarState]);

  // Synchronize state across multiple hook instances via CustomEvent & storage
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ state: SidebarState }>;
      if (
        customEvent.detail &&
        (customEvent.detail.state === "expanded" ||
          customEvent.detail.state === "collapsed")
      ) {
        setState(customEvent.detail.state);
      }
    };

    window.addEventListener(SIDEBAR_EVENT, handleSync);
    window.addEventListener("storage", (e) => {
      if (
        e.key === SIDEBAR_STORAGE_KEY &&
        (e.newValue === "expanded" || e.newValue === "collapsed")
      ) {
        setState(e.newValue);
      }
    });

    return () => {
      window.removeEventListener(SIDEBAR_EVENT, handleSync);
    };
  }, []);

  // Keyboard shortcut listener: Ctrl+B or Cmd+B toggles between expanded and collapsed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setState((prev) => {
          const next: SidebarState =
            prev === "expanded" ? "collapsed" : "expanded";
          try {
            localStorage.setItem(SIDEBAR_STORAGE_KEY, next);
          } catch (err) {
            console.warn(err);
          }
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent(SIDEBAR_EVENT, { detail: { state: next } })
            );
          }
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isExpanded = isMounted ? state === "expanded" : false;
  const isCollapsed = isMounted ? state === "collapsed" : true;

  return {
    state: isMounted ? state : "collapsed",
    isExpanded,
    isCollapsed,
    isOpen: isExpanded, // alias for backwards compatibility
    toggle,
    expand,
    collapse,
  };
}
