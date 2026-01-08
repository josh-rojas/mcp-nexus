import { describe, it, expect } from "vitest";
import { mockTauriCommand, clearMocks } from "./setup";

describe("Tauri Mock Setup", () => {
  it("should mock a Tauri command successfully", async () => {
    mockTauriCommand("list_servers", [
      { id: "1", name: "test-server", enabled: true },
    ]);

    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke("list_servers");

    expect(result).toEqual([
      { id: "1", name: "test-server", enabled: true },
    ]);
  });

  it("should throw on unmocked commands", async () => {
    clearMocks();
    const { invoke } = await import("@tauri-apps/api/core");

    await expect(invoke("nonexistent_command")).rejects.toThrow(
      "Unmocked Tauri command: nonexistent_command"
    );
  });

  it("should handle error responses", async () => {
    const testError = new Error("Command failed");
    mockTauriCommand("failing_command", testError);

    const { invoke } = await import("@tauri-apps/api/core");

    await expect(invoke("failing_command")).rejects.toThrow("Command failed");
  });

  it("should support dynamic mock functions", async () => {
    clearMocks();
    mockTauriCommand("get_server", (args: unknown) => ({
      id: (args as { id: string }).id,
      name: "dynamic-server",
    }));

    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke("get_server", { id: "test-123" });

    expect(result).toEqual({
      id: "test-123",
      name: "dynamic-server",
    });
  });
});
