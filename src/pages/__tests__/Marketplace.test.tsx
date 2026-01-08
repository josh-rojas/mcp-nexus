/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders, screen, fireEvent } from "../../test/utils";
import { Marketplace } from "../Marketplace";
import { vi, describe, it, expect, beforeEach } from "vitest";
import * as useMarketplaceHook from "../../hooks/useMarketplace";

// Mock useMarketplace
vi.mock("../../hooks/useMarketplace", () => ({
  useMarketplace: vi.fn(),
}));

// Mock notifications
vi.mock("../../lib/notifications", () => ({
  notifyServerInstallSuccess: vi.fn(),
  notifyServerInstallError: vi.fn(),
}));

// Mock components
vi.mock("../../components/marketplace/SearchBar", () => ({
  SearchBar: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

vi.mock("../../components/marketplace/MarketplaceCard", () => ({
  MarketplaceCard: ({ server, onSelect }: any) => (
    <div onClick={() => onSelect(server)} data-testid="marketplace-card">
      {server.name}
    </div>
  ),
  MarketplaceCardSkeleton: () => <div data-testid="skeleton" />,
}));

vi.mock("../../components/marketplace/ServerDetailModal", () => ({
  ServerDetailModal: ({ server }: any) => (
    server ? <div data-testid="detail-modal">{server.name} Details</div> : null
  ),
}));

vi.mock("../../components/marketplace/SortDropdown", () => ({ SortDropdown: () => <div>Sort</div> }));
vi.mock("../../components/marketplace/FilterChips", () => ({ FilterChips: () => <div>Filters</div> }));

describe("Marketplace Page", () => {
  const mockServers = [
    {
      name: "mcp-server-test",
      description: "Test description",
      author: "tester",
      version: "1.0.0",
      downloads: 100,
    },
  ];

  const defaultHookReturn = {
    servers: [],
    totalCount: 0,
    isLoading: false,
    isLoadingMore: false,
    error: null,
    hasMore: false,
    loadMore: vi.fn(),
    refresh: vi.fn(),
    isRefreshing: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", () => {
    vi.mocked(useMarketplaceHook.useMarketplace).mockReturnValue({
      ...defaultHookReturn,
      isLoading: true,
    });

    renderWithProviders(<Marketplace />);
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("renders server list", () => {
    vi.mocked(useMarketplaceHook.useMarketplace).mockReturnValue({
      ...defaultHookReturn,
      servers: mockServers as any,
      totalCount: 1,
    });

    renderWithProviders(<Marketplace />);
    expect(screen.getByText("mcp-server-test")).toBeInTheDocument();
  });

  it("opens details modal on click", () => {
    vi.mocked(useMarketplaceHook.useMarketplace).mockReturnValue({
      ...defaultHookReturn,
      servers: mockServers as any,
      totalCount: 1,
    });

    renderWithProviders(<Marketplace />);
    const card = screen.getByText("mcp-server-test");
    fireEvent.click(card);

    expect(screen.getByTestId("detail-modal")).toBeInTheDocument();
    expect(screen.getByText("mcp-server-test Details")).toBeInTheDocument();
  });

  it("updates search query", () => {
    const useMarketplaceSpy = vi.mocked(useMarketplaceHook.useMarketplace);
    useMarketplaceSpy.mockReturnValue(defaultHookReturn);

    renderWithProviders(<Marketplace />);
    const input = screen.getByTestId("search-input");
    fireEvent.change(input, { target: { value: "query" } });

    expect(useMarketplaceSpy).toHaveBeenLastCalledWith(expect.objectContaining({
      query: "query",
    }));
  });
});
