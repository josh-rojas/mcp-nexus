/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders, screen, fireEvent } from "../../test/utils";
import { Clients } from "../Clients";
import { vi, describe, it, expect, beforeEach } from "vitest";
import * as useClientsHook from "../../hooks/useClients";

// Mock hooks
vi.mock("../../hooks/useClients", () => ({
  useClients: vi.fn(),
  useSyncClient: vi.fn(),
  useSyncAllClients: vi.fn(),
  useSetClientSyncEnabled: vi.fn(),
  useManualConfig: vi.fn(),
}));

// Mock notifications
vi.mock("../../lib/notifications", () => ({
  notifyClientSyncSuccess: vi.fn(),
  notifyClientSyncError: vi.fn(),
  notifySyncAllSuccess: vi.fn(),
  notifySyncAllError: vi.fn(),
}));

// Mock components
vi.mock("../../components/clients/ClientCard", () => ({
  ClientCard: ({ client, onSync }: any) => (
    <div data-testid="client-card">
      <span>{client.name}</span>
      <button onClick={() => onSync(client.id)}>Sync Client</button>
    </div>
  ),
}));

vi.mock("../../components/clients/SyncStatus", () => ({
  SyncStatus: () => <div data-testid="sync-status">Sync Status</div>,
}));

vi.mock("../../components/clients/ManualConfigModal", () => ({
  ManualConfigModal: () => <div data-testid="manual-config-modal" />,
}));

describe("Clients Page", () => {
  const mockClients = [
    {
      id: "claude",
      name: "Claude Desktop",
      detected: true,
      syncEnabled: true,
      path: "/path/to/claude",
    },
  ];

  const defaultHookReturn = {
    clients: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  };

  const defaultMutationReturn = {
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useClientsHook.useSyncClient).mockReturnValue(defaultMutationReturn as any);
    vi.mocked(useClientsHook.useSyncAllClients).mockReturnValue(defaultMutationReturn as any);
    vi.mocked(useClientsHook.useSetClientSyncEnabled).mockReturnValue(defaultMutationReturn as any);
    vi.mocked(useClientsHook.useManualConfig).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as any);
  });

  it("renders loading state", () => {
    vi.mocked(useClientsHook.useClients).mockReturnValue({
      ...defaultHookReturn,
      isLoading: true,
    });

    renderWithProviders(<Clients />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders client list", () => {
    vi.mocked(useClientsHook.useClients).mockReturnValue({
      ...defaultHookReturn,
      clients: mockClients as any,
    });

    renderWithProviders(<Clients />);
    expect(screen.getByText("Claude Desktop")).toBeInTheDocument();
  });

  it("triggers sync all", () => {
    const syncAllMock = vi.fn().mockResolvedValue({ failed: 0 });
    vi.mocked(useClientsHook.useSyncAllClients).mockReturnValue({
      ...defaultMutationReturn,
      mutateAsync: syncAllMock,
    } as any);

    vi.mocked(useClientsHook.useClients).mockReturnValue({
      ...defaultHookReturn,
      clients: mockClients as any,
    });

    renderWithProviders(<Clients />);
    const syncBtn = screen.getByText("Sync All");
    fireEvent.click(syncBtn);

    expect(syncAllMock).toHaveBeenCalled();
  });

  it("triggers individual sync", () => {
     const syncClientMock = vi.fn().mockResolvedValue({ success: true });
     vi.mocked(useClientsHook.useSyncClient).mockReturnValue({
      ...defaultMutationReturn,
      mutateAsync: syncClientMock,
    } as any);

    vi.mocked(useClientsHook.useClients).mockReturnValue({
      ...defaultHookReturn,
      clients: mockClients as any,
    });

    renderWithProviders(<Clients />);
    const syncBtn = screen.getByText("Sync Client");
    fireEvent.click(syncBtn);

    expect(syncClientMock).toHaveBeenCalledWith("claude");
  });
});
