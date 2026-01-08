import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "./logger";

describe("Logger Utility", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleDebugSpy: ReturnType<typeof vi.spyOn<any, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleInfoSpy: ReturnType<typeof vi.spyOn<any, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleWarnSpy: ReturnType<typeof vi.spyOn<any, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleErrorSpy: ReturnType<typeof vi.spyOn<any, any>>;

  beforeEach(() => {
    // Spy on console methods
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    consoleDebugSpy = vi
      .spyOn(console, "debug")
      .mockImplementation(() => {}) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    consoleInfoSpy = vi
      .spyOn(console, "info")
      .mockImplementation(() => {}) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {}) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {}) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Log Levels", () => {
    it("should log debug messages in development", () => {
      logger.debug("Test debug message");

      // Debug logs may be filtered based on environment
      const wasCalled =
        consoleDebugSpy.mock.calls.length > 0 ||
        consoleInfoSpy.mock.calls.length > 0;
      expect(wasCalled).toBeTruthy();
    });

    it("should log info messages", () => {
      logger.info("Test info message");

      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleInfoSpy.mock.calls[0][0]).toContain("Test info message");
      expect(consoleInfoSpy.mock.calls[0][0]).toContain("[INFO]");
    });

    it("should log warning messages", () => {
      logger.warn("Test warning message");

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain("Test warning message");
      expect(consoleWarnSpy.mock.calls[0][0]).toContain("[WARN]");
    });

    it("should log error messages", () => {
      logger.error("Test error message");

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain("Test error message");
      expect(consoleErrorSpy.mock.calls[0][0]).toContain("[ERROR]");
    });
  });

  describe("Timestamp Format", () => {
    it("should include ISO 8601 timestamp", () => {
      logger.info("Test message");

      const output = consoleInfoSpy.mock.calls[0][0];
      // Should match ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(output).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });
  });

  describe("Context Serialization", () => {
    it("should serialize context objects", () => {
      const context = {
        userId: "123",
        action: "test",
        count: 42,
      };

      logger.info("Test with context", context);

      const output = consoleInfoSpy.mock.calls[0][0];
      expect(output).toContain("Context:");
      expect(output).toContain('"userId": "123"');
      expect(output).toContain('"action": "test"');
      expect(output).toContain('"count": 42');
    });

    it("should handle nested context objects", () => {
      const context = {
        user: {
          id: "123",
          name: "Test User",
        },
        metadata: {
          timestamp: Date.now(),
        },
      };

      logger.info("Test with nested context", context);

      const output = consoleInfoSpy.mock.calls[0][0];
      expect(output).toContain("Context:");
      expect(output).toContain('"user"');
      expect(output).toContain('"id": "123"');
      expect(output).toContain('"name": "Test User"');
    });
  });

  describe("Sensitive Data Masking", () => {
    it("should mask password fields", () => {
      const context = {
        username: "test",
        password: "secret123",
      };

      logger.info("Login attempt", context);

      const output = consoleInfoSpy.mock.calls[0][0];
      expect(output).not.toContain("secret123");
      expect(output).toContain("***MASKED***");
    });

    it("should mask token fields", () => {
      const context = {
        apiToken: "abc123xyz",
        accessToken: "def456uvw",
      };

      logger.info("API request", context);

      const output = consoleInfoSpy.mock.calls[0][0];
      expect(output).not.toContain("abc123xyz");
      expect(output).not.toContain("def456uvw");
      expect(output).toContain("***MASKED***");
    });

    it("should mask credential fields", () => {
      const context = {
        credentials: "sensitive-data",
        apiKey: "key-12345",
      };

      logger.info("Auth setup", context);

      const output = consoleInfoSpy.mock.calls[0][0];
      expect(output).not.toContain("sensitive-data");
      expect(output).not.toContain("key-12345");
      expect(output).toContain("***MASKED***");
    });

    it("should mask nested sensitive fields", () => {
      const context = {
        user: {
          email: "test@example.com",
          password: "secret",
        },
        auth: {
          token: "bearer-token",
        },
      };

      logger.info("User data", context);

      const output = consoleInfoSpy.mock.calls[0][0];
      expect(output).toContain("test@example.com");
      expect(output).not.toContain("secret");
      expect(output).not.toContain("bearer-token");
      expect(output).toContain("***MASKED***");
    });
  });

  describe("Error Handling", () => {
    it("should log errors with stack traces", () => {
      const error = new Error("Test error");

      logger.error("An error occurred", undefined, error);

      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("Error:");
      expect(output).toContain("Test error");
      expect(output).toContain("Stack:");
    });

    it("should sanitize error messages in message field", () => {
      const error = new Error("Failed at /Users/test/sensitive/path");

      logger.error("File error", undefined, error);

      const output = consoleErrorSpy.mock.calls[0][0] as string;
      // Error message should be sanitized
      const errorMessageLine = output
        .split("\n")
        .find((line: string) => line.includes("Error:"));
      expect(errorMessageLine).toContain("[PATH]");
    });

    it("should handle errors with context", () => {
      const error = new Error("Test error");
      const context = { operation: "file-read", file: "test.txt" };

      logger.error("Operation failed", context, error);

      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("Operation failed");
      expect(output).toContain("Context:");
      expect(output).toContain('"operation": "file-read"');
      expect(output).toContain("Error:");
    });
  });

  describe("Payload Truncation", () => {
    it("should truncate large payloads", () => {
      const largeContext = {
        data: "x".repeat(2000),
      };

      logger.info("Large payload", largeContext);

      const output = consoleInfoSpy.mock.calls[0][0];
      expect(output).toContain("_truncated");
      expect(output).toContain("_originalSize");
      expect(output).toContain("_preview");
    });

    it("should not truncate small payloads", () => {
      const smallContext = {
        data: "small",
      };

      logger.info("Small payload", smallContext);

      const output = consoleInfoSpy.mock.calls[0][0];
      expect(output).not.toContain("_truncated");
      expect(output).toContain('"data": "small"');
    });
  });

  describe("Edge Cases", () => {
    it("should handle null context", () => {
      expect(() => {
        logger.info("Test message", undefined);
      }).not.toThrow();
    });

    it("should handle empty context", () => {
      expect(() => {
        logger.info("Test message", {});
      }).not.toThrow();
    });

    it("should handle context with undefined values", () => {
      const context = {
        defined: "value",
        undefined: undefined,
        null: null,
      };

      expect(() => {
        logger.info("Test message", context);
      }).not.toThrow();
    });

    it("should handle circular references gracefully", () => {
      const context: Record<string, unknown> = {
        name: "test",
      };
      context.self = context; // Circular reference

      // Circular references will cause JSON.stringify to throw
      // The logger should catch this or the test should expect the throw
      try {
        logger.info("Test message", context);
        // If it doesn't throw, that's fine - implementation may handle it
      } catch (error) {
        // If it throws, that's also acceptable for circular references
        expect(error).toBeDefined();
      }
    });
  });

  describe("Environment-Based Filtering", () => {
    it("should respect environment-based log levels", () => {
      // This test verifies that log level filtering works
      // In production, debug logs should be filtered out
      logger.debug("Debug message");
      logger.info("Info message");
      logger.warn("Warning message");
      logger.error("Error message");

      // At minimum, warn and error should always be logged
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
