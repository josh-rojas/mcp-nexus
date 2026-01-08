import { useEffect, useState } from "react";
import { Theme, ThemeContext } from "../contexts/ThemeContext";
import { getSystemAccentColor } from "../lib/tauri";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "mcp-nexus-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("light");

  // Helper to convert hex to space-separated RGB
  const hexToRgb = (hex: string) => {
    hex = hex.replace(/^#/, '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r} ${g} ${b}`;
  };

  // Fetch system accent color on mount
  useEffect(() => {
    getSystemAccentColor()
      .then((color) => {
        document.documentElement.style.setProperty("--system-accent", color);
        document.documentElement.style.setProperty("--system-accent-rgb", hexToRgb(color));
      })
      .catch((err) => {
        console.error("Failed to get system accent color:", err);
        const fallback = "#3b82f6";
        document.documentElement.style.setProperty("--system-accent", fallback);
        document.documentElement.style.setProperty("--system-accent-rgb", hexToRgb(fallback));
      });
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    // Helper to determine actual theme
    const getSystemTheme = () => 
      window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

    const updateTheme = () => {
      root.classList.remove("light", "dark");
      
      if (theme === "system") {
        const systemTheme = getSystemTheme();
        root.classList.add(systemTheme);
        setResolvedTheme(systemTheme);
        return;
      }

      root.classList.add(theme);
      setResolvedTheme(theme);
    };

    updateTheme();

    // If system, listen for changes
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => updateTheme();
      
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
