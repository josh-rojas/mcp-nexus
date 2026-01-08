import { renderWithProviders, screen } from "../../../test/utils";
import { ServerDetailModal } from "../ServerDetailModal";
import { vi, describe, it, expect, beforeEach } from "vitest";
import * as useServerDetailsHook from "../../../hooks/useServerDetails";

// Mock hook
vi.mock("../../../hooks/useServerDetails", () => ({
  useServerDetails: vi.fn(),
}));

// Mock Clients hook
vi.mock("../../../hooks/useClients", () => ({
  useDetectedClients: vi.fn().mockReturnValue({ data: [], isLoading: false }),
}));

describe("ServerDetailModal", () => {
  const mockServer = {
    name: "Test Server",
    url: "http://example.com",
    short_description: "Initial Description",
    remotes: [],
  };

  const detailedServer = {
    ...mockServer,
    short_description: "Detailed Description",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with initial data", () => {
    // Mock hook to return initial data but loading
    vi.mocked(useServerDetailsHook.useServerDetails).mockReturnValue({
      data: mockServer,
      isLoading: true,
    } as any);

    renderWithProviders(
      <ServerDetailModal
        server={mockServer}
        onClose={vi.fn()}
        onInstall={vi.fn()}
      />
    );

    expect(screen.getByText("Test Server")).toBeInTheDocument();
    expect(screen.getByText("Initial Description")).toBeInTheDocument();
  });

  it("updates with detailed data", () => {
    // Mock hook to return detailed data
    vi.mocked(useServerDetailsHook.useServerDetails).mockReturnValue({
      data: detailedServer,
      isLoading: false,
    } as any);

    renderWithProviders(
      <ServerDetailModal
        server={mockServer}
        onClose={vi.fn()}
        onInstall={vi.fn()}
      />
    );

    expect(screen.getByText("Detailed Description")).toBeInTheDocument();
  });
});
