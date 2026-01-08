import { render, screen, act } from "@testing-library/react";
import { ThemeProvider } from "../ThemeProvider";
import { useTheme } from "../../hooks/useTheme";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Helper component to expose hook
const TestComponent = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
      <button onClick={() => setTheme("light")}>Set Light</button>
      <button onClick={() => setTheme("system")}>Set System</button>
    </div>
  );
};

describe("ThemeProvider", () => {
  let mediaQueryList: {
    matches: boolean;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Reset DOM
    document.documentElement.classList.remove("light", "dark");
    localStorage.clear();

    // Mock matchMedia
    mediaQueryList = {
      matches: false, // Default to light
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue(mediaQueryList),
    });
  });

  it("renders with default theme (system)", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme-value")).toHaveTextContent("system");
    // Should apply light class because matchMedia matches is false
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
  });

  it("changes theme and persists to localStorage", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const setDarkBtn = screen.getByText("Set Dark");
    act(() => {
      setDarkBtn.click();
    });

    expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("mcp-nexus-theme")).toBe("dark");
  });

  it("reads from localStorage on mount", () => {
    localStorage.setItem("mcp-nexus-theme", "dark");
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("listens to system changes when in system mode", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should add listener
    expect(mediaQueryList.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );

    // Simulate system change to dark
    const listener = mediaQueryList.addEventListener.mock.calls[0][1];
    mediaQueryList.matches = true; // Update mock state
    
    act(() => {
      listener();
    });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
  });
  
  it("removes listener on unmount", () => {
    const { unmount } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    unmount();
    expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function)
    );
  });
});
