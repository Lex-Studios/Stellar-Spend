"use client";

import { useEffect } from "react";
import type { Shortcut } from "@/hooks/useKeyboardShortcuts";

interface Props {
  open: boolean;
  shortcuts: Shortcut[];
  onClose: () => void;
}

function isMac() {
  if (typeof navigator === "undefined") return false;
  return navigator.platform.toUpperCase().includes("MAC");
}

function formatKey(shortcut: Shortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push(isMac() ? "⌘" : "Ctrl");
  if (shortcut.shift) parts.push("Shift");
  parts.push(shortcut.key.toUpperCase());
  return parts.join(" + ");
}

export function KeyboardShortcutsModal({ open, shortcuts, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm border border-[#333] bg-[#111] p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-medium text-sm">Keyboard shortcuts</h2>
          <button
            onClick={onClose}
            aria-label="Close shortcuts modal"
            className="text-[#555] hover:text-[#888] transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {shortcuts.map((s) => (
            <li key={s.key + String(s.ctrl) + String(s.shift)} className="flex items-center justify-between gap-4">
              <span className="text-[#aaa] text-sm">{s.description}</span>
              <kbd className="shrink-0 px-2 py-0.5 text-xs border border-[#333] text-[#888] font-mono">
                {formatKey(s)}
              </kbd>
            </li>
          ))}
        </ul>

        <p className="text-[#555] text-xs">
          Shortcuts are disabled when a form field is focused.
        </p>
      </div>
    </div>
  );
}
