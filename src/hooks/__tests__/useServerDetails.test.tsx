import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useServerDetails } from "../useServerDetails";
import { createWrapper } from "../../test/utils";
import * as tauriLib from "../../lib/tauri";

// Mock Tauri library
vi.mock("../../lib/tauri", () => ({
  getServerDetails: vi.fn(),
}));

describe("useServerDetails", () => {
  const mockServer = {
    name: "Test Server",
    url: "http://example.com",
    short_description: "Description",
    remotes: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns initial data immediately", () => {
    const { result } = renderHook(
      () => useServerDetails("Test Server", mockServer),
      { wrapper: createWrapper() }
    );

    expect(result.current.data).toEqual(mockServer);
  });

  it("fetches details when name provided", async () => {
    vi.mocked(tauriLib.getServerDetails).mockResolvedValue(mockServer);

    const { result } = renderHook(
      () => useServerDetails("Test Server"),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(tauriLib.getServerDetails).toHaveBeenCalledWith("Test Server");
    expect(result.current.data).toEqual(mockServer);
  });

  it("does not fetch if name is null", () => {
    renderHook(
      () => useServerDetails(null),
      { wrapper: createWrapper() }
    );

    expect(tauriLib.getServerDetails).not.toHaveBeenCalled();
  });
});
