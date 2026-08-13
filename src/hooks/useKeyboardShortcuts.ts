"use client";

import { useEffect } from "react";

interface ShortcutHandlers {
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
  onToggleChat?: () => void;
  onCopyLink?: () => void;
  onLeave?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const key = event.key.toLowerCase();

      switch (key) {
        case "m":
          event.preventDefault();
          handlers.onToggleAudio?.();
          break;
        case "v":
          event.preventDefault();
          handlers.onToggleVideo?.();
          break;
        case "c":
          event.preventDefault();
          handlers.onToggleChat?.();
          break;
        case "l":
          if (event.shiftKey) {
            event.preventDefault();
            handlers.onCopyLink?.();
          }
          break;
        case "escape":
          handlers.onLeave?.();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handlers]);
}
