/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders, screen, waitFor } from "../../test/utils";
import { Dashboard } from "../Dashboard";
import { vi, describe, it, expect, beforeEach } from "vitest";
import * as useServersHook from "../../hooks/useServers";
import * as useClientsHook from "../../hooks/useClients";
import * as tauriLib from "../../lib/tauri";

// Mock hooks
vi.mock("../../hooks/useServers", () => ({
  useServerList: vi.fn(),
}));

vi.mock("../../hooks/useClients", () => ({
  useDetectedClients: vi.fn(),
}));

vi.mock("../../lib/tauri", () => ({
  initializeConfig: vi.fn(),
}));

// Mock sub-components
vi.mock("../../components/dashboard/FirstRunWelcome", () => ({
  FirstRunWelcome: () => <div data-testid="first-run">First Run Welcome</div>,
}));

vi.mock("../../components/dashboard/QuickActions", () => ({
  QuickActions: () => <div>Quick Actions</div>,
}));

vi.mock("../../components/dashboard/ServerSummary", () => ({
  ServerSummary: () => <div>Server Summary</div>,
}));

vi.mock("../../components/dashboard/ClientSummary", () => ({
  ClientSummary: () => <div>Client Summary</div>,
}));

vi.mock("../../components/dashboard/EnvironmentSummary", () => ({
  EnvironmentSummary: () => <div>Environment Summary</div>,
}));

vi.mock("../../components/dashboard/RecentActivity", () => ({
  RecentActivity: () => <div>Recent Activity</div>,
}));

vi.mock("../../components/dashboard/UpdateSummary", () => ({
  UpdateSummary: () => <div>Update Summary</div>,
}));

describe("Dashboard Page", () => {
  const defaultServers = { data: [], isLoading: false };
  const defaultClients = { data: [] };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useServersHook.useServerList).mockReturnValue(defaultServers as any);
    vi.mocked(useClientsHook.useDetectedClients).mockReturnValue(defaultClients as any);
    vi.mocked(tauriLib.initializeConfig).mockResolvedValue({ firstRun: false } as any);
  });

  it("renders dashboard components", () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
  });

  it("shows first run welcome if firstRun is true", async () => {
    vi.mocked(tauriLib.initializeConfig).mockResolvedValue({ firstRun: true } as any);
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByTestId("first-run")).toBeInTheDocument();
    });
  });

  it("shows initialization error", async () => {
    vi.mocked(tauriLib.initializeConfig).mockRejectedValue(new Error("Init failed"));
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText("Initialization Error")).toBeInTheDocument();
      expect(screen.getByText("Init failed")).toBeInTheDocument();
    });
  });
});
