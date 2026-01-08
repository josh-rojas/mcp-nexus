import { env } from "./env";

/**
 * Structured Logger Utility
 *
 * Provides consistent logging across the application with:
 * - Automatic timestamp generation
 * - Component name inference from call stack
 * - Context object serialization
 * - Error stack trace formatting
 * - Sensitive data detection and masking
 * - Environment-based filtering
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  component?: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
  };
}

/**
 * Sensitive data patterns to mask in logs
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /auth/i,
  /credential/i,
  /bearer/i,
];

/**
 * Large payload size threshold (characters)
 */
const MAX_PAYLOAD_SIZE = 1000;

/**
 * Get the current log level from environment
 */
function getConfiguredLogLevel(): LogLevel {
  // Debug logs only in development
  if (env.isDev && env.debugTauri) {
    return "debug";
  }
  return env.isDev ? "info" : "warn";
}

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  const levels: LogLevel[] = ["debug", "info", "warn", "error"];
  const currentLevel = getConfiguredLogLevel();
  const currentIndex = levels.indexOf(currentLevel);
  const messageIndex = levels.indexOf(level);
  return messageIndex >= currentIndex;
}

/**
 * Infer component name from call stack
 */
function inferComponentName(): string | undefined {
  try {
    const stack = new Error().stack;
    if (!stack) return undefined;

    const lines = stack.split("\n");
    // Skip the first few lines (Error, inferComponentName, log function)
    for (let i = 3; i < Math.min(lines.length, 10); i++) {
      const line = lines[i];
      // Look for React component patterns
      const match = line.match(/at (\w+)/);
      if (match && match[1] && match[1] !== "Object") {
        return match[1];
      }
    }
  } catch {
    // Silently fail if stack parsing doesn't work
  }
  return undefined;
}

/**
 * Mask sensitive data in objects
 */
function maskSensitiveData(data: unknown): LogContext | unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    // Don't mask strings directly, only object keys
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item));
  }

  if (typeof data === "object") {
    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const isSensitive = SENSITIVE_PATTERNS.some((pattern) =>
        pattern.test(key)
      );
      if (isSensitive) {
        masked[key] = "***MASKED***";
      } else if (typeof value === "object") {
        masked[key] = maskSensitiveData(value);
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }

  return data;
}

/**
 * Truncate large payloads
 */
function truncatePayload(data: LogContext | unknown): LogContext {
  const serialized = JSON.stringify(data);
  if (serialized.length > MAX_PAYLOAD_SIZE) {
    return {
      _truncated: true,
      _originalSize: serialized.length,
      _preview: serialized.substring(0, MAX_PAYLOAD_SIZE) + "...",
    };
  }
  return data as LogContext;
}

/**
 * Sanitize error messages to remove sensitive information
 */
function sanitizeErrorMessage(message: string): string {
  let sanitized = message;

  // Remove potential file paths
  sanitized = sanitized.replace(/\/[^\s]+/g, "[PATH]");

  // Remove potential tokens
  sanitized = sanitized.replace(/[a-zA-Z0-9]{32,}/g, "[TOKEN]");

  return sanitized;
}

/**
 * Format a log entry
 */
function formatLogEntry(entry: LogEntry): string {
  const parts = [`[${entry.timestamp}]`, `[${entry.level.toUpperCase()}]`];

  if (entry.component) {
    parts.push(`[${entry.component}]`);
  }

  parts.push(entry.message);

  if (entry.context) {
    parts.push("\n  Context:", JSON.stringify(entry.context, null, 2));
  }

  if (entry.error) {
    parts.push("\n  Error:", entry.error.message);
    if (entry.error.stack) {
      parts.push("\n  Stack:", entry.error.stack);
    }
  }

  return parts.join(" ");
}

/**
 * Output a log entry
 */
function output(entry: LogEntry): void {
  const formatted = formatLogEntry(entry);

  switch (entry.level) {
    case "debug":
      console.debug(formatted);
      break;
    case "info":
      console.info(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }
}

/**
 * Create a log entry
 */
function log(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): void {
  if (!shouldLog(level)) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    component: inferComponentName(),
  };

  if (context) {
    const sanitized = maskSensitiveData(context);
    entry.context = truncatePayload(sanitized);
  }

  if (error) {
    entry.error = {
      message: sanitizeErrorMessage(error.message),
      stack: error.stack,
    };
  }

  output(entry);
}

/**
 * Logger interface
 */
export const logger = {
  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    log("debug", message, context);
  },

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    log("info", message, context);
  },

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    log("warn", message, context);
  },

  /**
   * Log an error message
   */
  error(message: string, context?: LogContext, error?: Error): void {
    log("error", message, context, error);
  },
};
