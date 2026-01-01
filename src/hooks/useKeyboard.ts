import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

/**
 * Hook for registering keyboard shortcuts
 * Uses Cmd on Mac, Ctrl on Windows/Linux
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const modifierMatch =
          (shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey) &&
          (shortcut.metaKey === undefined || shortcut.metaKey === event.metaKey) &&
          (shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey);

        if (event.key === shortcut.key && modifierMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
}

/**
 * Global keyboard shortcuts for the app
 */
export function useGlobalKeyboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: "k",
      metaKey: true,
      action: () => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        } else {
          navigate("/marketplace");
        }
      },
      description: "Open search (Cmd+K)",
    },
    {
      key: "1",
      metaKey: true,
      action: () => navigate("/"),
      description: "Go to Dashboard (Cmd+1)",
    },
    {
      key: "2",
      metaKey: true,
      action: () => navigate("/marketplace"),
      description: "Go to Marketplace (Cmd+2)",
    },
    {
      key: "3",
      metaKey: true,
      action: () => navigate("/servers"),
      description: "Go to Servers (Cmd+3)",
    },
    {
      key: "4",
      metaKey: true,
      action: () => navigate("/clients"),
      description: "Go to Clients (Cmd+4)",
    },
    {
      key: "5",
      metaKey: true,
      action: () => navigate("/settings"),
      description: "Go to Settings (Cmd+5)",
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}
