/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders, screen, fireEvent } from "../../test/utils";
import { Servers } from "../Servers";
import { vi, describe, it, expect, beforeEach } from "vitest";
import * as useServersHook from "../../hooks/useServers";

// Mock useServers hook
vi.mock("../../hooks/useServers", () => ({
  useServers: vi.fn(),
}));

// Mock notifications
vi.mock("../../lib/notifications", () => ({
  notifySyncAllSuccess: vi.fn(),
  notifySyncAllError: vi.fn(),
  notifyServerInstallSuccess: vi.fn(),
  notifyServerInstallError: vi.fn(),
  notifyServerUninstallSuccess: vi.fn(),
  notifyServerUninstallError: vi.fn(),
}));

// Mock AddServerModal to avoid complex portal/form testing
vi.mock("../../components/servers/AddServerModal", () => ({
  AddServerModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div role="dialog">
        <h1>Add New Server Modal</h1>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

// Mock ServerList
vi.mock("../../components/servers/ServerList", () => ({
  ServerList: ({ servers }: { servers: any[] }) => (
    <ul>
      {servers.map((s) => (
        <li key={s.id}>{s.name}</li>
      ))}
    </ul>
  ),
}));

describe("Servers Page", () => {
  const mockServers = [
    {
      id: "server-1",
      name: "Test Server",
      description: "A test server",
      transport: { type: "stdio", command: "node", args: [] },
      clients: {},
      version: "1.0.0",
      source: { type: "npm", package: "test-pkg" },
    },
  ];

  const defaultHookReturn = {
    servers: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    toggleClient: vi.fn(),
    isTogglingClient: false,
    uninstall: vi.fn(),
    isRemoving: false,
    install: vi.fn(),
    isInstalling: false,
    sync: vi.fn(),
    isSyncing: false,
    remove: vi.fn(),
    installAsync: vi.fn(),
    installError: null,
    syncError: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", () => {
    vi.mocked(useServersHook.useServers).mockReturnValue({
      ...defaultHookReturn,
      isLoading: true,
    });

    renderWithProviders(<Servers />);
    // Check for loading spinner (svg with animate-spin class)
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    vi.mocked(useServersHook.useServers).mockReturnValue({
      ...defaultHookReturn,
      servers: [],
    });

    renderWithProviders(<Servers />);
    expect(screen.getByText("No servers installed")).toBeInTheDocument();
    expect(screen.getByText("Add Server Manually")).toBeInTheDocument();
  });

  it("renders server list", () => {
    vi.mocked(useServersHook.useServers).mockReturnValue({
      ...defaultHookReturn,
      servers: mockServers as any,
    });

    renderWithProviders(<Servers />);
    expect(screen.getByText("Test Server")).toBeInTheDocument();
  });

  it("opens add server modal", () => {
    vi.mocked(useServersHook.useServers).mockReturnValue({
      ...defaultHookReturn,
      servers: [],
    });

    renderWithProviders(<Servers />);
    const addBtn = screen.getByText("Add Server Manually");
    fireEvent.click(addBtn);
    
    expect(screen.getByText("Add New Server Modal")).toBeInTheDocument();
  });

  it("triggers sync", () => {
    const mockSync = vi.fn();
    vi.mocked(useServersHook.useServers).mockReturnValue({
      ...defaultHookReturn,
      servers: mockServers as any,
      sync: mockSync,
    });

    renderWithProviders(<Servers />);
    const syncBtn = screen.getByText("Sync All");
    fireEvent.click(syncBtn);

    expect(mockSync).toHaveBeenCalled();
  });
});
