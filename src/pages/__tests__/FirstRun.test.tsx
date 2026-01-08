/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders, screen, fireEvent, waitFor } from "../../test/utils";
import { FirstRunWelcome } from "../../components/dashboard/FirstRunWelcome";
import { vi, describe, it, expect, beforeEach } from "vitest";
import * as useClientsHook from "../../hooks/useClients";

vi.mock("../../hooks/useClients", () => ({
  useDetectedClients: vi.fn(),
  useImportClientServers: vi.fn(),
}));

describe("FirstRunWelcome", () => {
  const mockClients = [
    { id: "c1", name: "Client A", detected: true, serverCount: 2 },
    { id: "c2", name: "Client B", detected: true, serverCount: 0 },
  ];

  const defaultImport = {
    mutateAsync: vi.fn().mockResolvedValue({}),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useClientsHook.useImportClientServers).mockReturnValue(defaultImport as any);
  });

  it("renders welcome message", () => {
    vi.mocked(useClientsHook.useDetectedClients).mockReturnValue({ data: [] } as any);
    renderWithProviders(<FirstRunWelcome />);
    expect(screen.getByText("Welcome to MCP Nexus")).toBeInTheDocument();
  });

  it("shows clients with servers to import", () => {
    vi.mocked(useClientsHook.useDetectedClients).mockReturnValue({ data: mockClients } as any);
    renderWithProviders(<FirstRunWelcome />);
    expect(screen.getByText(/Client A/)).toBeInTheDocument();
    // Only shows clients with servers
    expect(screen.queryByText("Client B")).not.toBeInTheDocument(); 
  });

  it("allows importing servers", async () => {
    const importMock = vi.fn().mockResolvedValue({});
    vi.mocked(useClientsHook.useImportClientServers).mockReturnValue({
      mutateAsync: importMock,
    } as any);
    vi.mocked(useClientsHook.useDetectedClients).mockReturnValue({ data: mockClients } as any);

    renderWithProviders(<FirstRunWelcome />);
    
    // Select client (unchecked by default)
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const btn = screen.getByText("Import Selected");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(importMock).toHaveBeenCalledWith({ clientId: "c1", overwriteExisting: false });
    });

    expect(screen.getByText("Import Complete")).toBeInTheDocument();
  });
});
