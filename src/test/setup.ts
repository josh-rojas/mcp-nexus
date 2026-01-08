import { afterEach, vi } from "vitest";
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const tauriInvokeMocks: Record<string, unknown> = {};

const mockInvoke = vi.fn(async (command: string, args?: unknown) => {
  if (command in tauriInvokeMocks) {
    const mockValue = tauriInvokeMocks[command];
    if (mockValue instanceof Error) {
      throw mockValue;
    }
    if (typeof mockValue === "function") {
      return (mockValue as (args: unknown) => unknown)(args);
    }
    return mockValue;
  }
  throw new Error(`Unmocked Tauri command: ${command}`);
});

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}));

vi.mock("@tauri-apps/api", () => ({
  invoke: mockInvoke,
}));

vi.mock("@tauri-apps/plugin-opener", () => ({
  open: vi.fn(async (_path: string) => undefined),
}));

export { mockInvoke, tauriInvokeMocks };

export function mockTauriCommand(command: string, response: unknown): void {
  tauriInvokeMocks[command] = response;
}

export function mockTauriCommandFn(
  command: string,
  fn: (args: unknown) => unknown
): void {
  tauriInvokeMocks[command] = fn;
}

export function clearMocks(): void {
  Object.keys(tauriInvokeMocks).forEach((key) => {
    delete tauriInvokeMocks[key];
  });
  mockInvoke.mockClear();
}
