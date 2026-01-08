/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders, screen, fireEvent } from "../../test/utils";
import { Settings } from "../Settings";
import { vi, describe, it, expect, beforeEach } from "vitest";
import * as useConfigHook from "../../hooks/useConfig";
import * as useUpdatesHook from "../../hooks/useUpdates";
import * as useThemeHook from "../../hooks/useTheme";

// Mock hooks
vi.mock("../../hooks/useConfig", () => ({
  useConfig: vi.fn(),
  useUpdatePreferences: vi.fn(),
}));

vi.mock("../../hooks/useUpdates", () => ({
  useServersWithUpdates: vi.fn(),
  useRefreshUpdates: vi.fn(),
}));

vi.mock("../../hooks/useTheme", () => ({
  useTheme: vi.fn(),
}));

// Mock components
vi.mock("../../components/settings/EnvironmentStatus", () => ({
  EnvironmentStatus: () => <div>EnvironmentStatus</div>,
}));

vi.mock("../../components/settings/CredentialManager", () => ({
  CredentialManager: () => <div>CredentialManager</div>,
}));

// Mock layout
vi.mock("../../components/layout/Header", () => ({
  Header: ({ title }: any) => <h1>{title}</h1>,
}));

describe("Settings Page", () => {
  const defaultHookReturn = {
    data: { preferences: { autoSyncOnChanges: true } },
    isLoading: false,
    error: null,
  };

  const defaultUpdatePrefs = {
    mutate: vi.fn(),
    isPending: false,
  };

  const defaultUpdates = {
    data: [],
    count: 0,
    checkedAt: new Date(),
    isLoading: false,
  };

  const defaultRefresh = {
    mutate: vi.fn(),
    isPending: false,
  };

  const defaultTheme = {
    theme: "system",
    setTheme: vi.fn(),
    resolvedTheme: "light",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useConfigHook.useConfig).mockReturnValue(defaultHookReturn as any);
    vi.mocked(useConfigHook.useUpdatePreferences).mockReturnValue(defaultUpdatePrefs as any);
    vi.mocked(useUpdatesHook.useServersWithUpdates).mockReturnValue(defaultUpdates as any);
    vi.mocked(useUpdatesHook.useRefreshUpdates).mockReturnValue(defaultRefresh as any);
    vi.mocked(useThemeHook.useTheme).mockReturnValue(defaultTheme as any);
  });

  it("renders settings sections", () => {
    renderWithProviders(<Settings />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("EnvironmentStatus")).toBeInTheDocument();
    expect(screen.getByText("CredentialManager")).toBeInTheDocument();
    expect(screen.getByText("Appearance")).toBeInTheDocument();
  });

  it("toggles auto-sync", () => {
    const mutateMock = vi.fn();
    vi.mocked(useConfigHook.useUpdatePreferences).mockReturnValue({
      ...defaultUpdatePrefs,
      mutate: mutateMock,
    } as any);

    renderWithProviders(<Settings />);
    // Using simple label text matcher since label wraps input
    const input = screen.getByLabelText(/Auto-sync on changes/i);
    fireEvent.click(input);
    
    expect(mutateMock).toHaveBeenCalledWith({ autoSyncOnChanges: false });
  });

  it("checks for updates", () => {
    const refreshMock = vi.fn();
    vi.mocked(useUpdatesHook.useRefreshUpdates).mockReturnValue({
      ...defaultRefresh,
      mutate: refreshMock,
    } as any);

    renderWithProviders(<Settings />);
    // The button has "Check Now" text or "Checking..."
    // Since we provided checkedAt, it should show "Check Now"
    // But check the logic:
    // !isPending ? "Check Now" : "Checking..."
    // Also logic depends on checkedAt.
    const btn = screen.getByText("Check Now");
    fireEvent.click(btn);

    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows current theme", () => {
    vi.mocked(useThemeHook.useTheme).mockReturnValue({
      ...defaultTheme,
      theme: "dark",
    } as any);
    
    renderWithProviders(<Settings />);
    // Select trigger displays the value label
    expect(screen.getByText("Dark")).toBeInTheDocument();
  });
});
