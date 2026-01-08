/**
 * Environment Variable Validation Utility
 *
 * Validates required environment variables at application startup
 * and provides type-safe access to environment configuration.
 */

/**
 * Environment configuration schema
 */
interface EnvironmentConfig {
  /** Log level for application logging */
  logLevel: "debug" | "info" | "warn" | "error";
  /** Whether the app is running in production mode */
  isProduction: boolean;
  /** Whether the app is running in development mode */
  isDevelopment: boolean;
  /** Whether the app is running in test mode */
  isTest: boolean;
}

/**
 * Environment variable validation errors
 */
export class EnvironmentValidationError extends Error {
  constructor(
    message: string,
    public readonly missingVars: string[] = [],
    public readonly invalidVars: string[] = []
  ) {
    super(message);
    this.name = "EnvironmentValidationError";
  }
}

/**
 * Validate log level value
 */
function validateLogLevel(
  level: string | undefined
): "debug" | "info" | "warn" | "error" {
  const validLevels = ["debug", "info", "warn", "error"];
  const defaultLevel = "info";

  if (!level) {
    return defaultLevel;
  }

  const normalized = level.toLowerCase();
  if (!validLevels.includes(normalized)) {
    console.warn(
      `Invalid log level "${level}". Must be one of: ${validLevels.join(", ")}. Using default: ${defaultLevel}`
    );
    return defaultLevel;
  }

  return normalized as "debug" | "info" | "warn" | "error";
}

/**
 * Detect environment mode
 */
function getMode(): "production" | "development" | "test" {
  const mode = import.meta.env.MODE;

  if (mode === "test") return "test";
  if (mode === "production") return "production";
  return "development";
}

/**
 * Validate all environment variables and return configuration
 *
 * @throws {EnvironmentValidationError} If validation fails
 */
export function validateEnvironment(): EnvironmentConfig {
  const mode = getMode();
  const logLevel = validateLogLevel(import.meta.env.VITE_LOG_LEVEL);

  const config: EnvironmentConfig = {
    logLevel,
    isProduction: mode === "production",
    isDevelopment: mode === "development",
    isTest: mode === "test",
  };

  return config;
}

/**
 * Get environment configuration (validates on first call)
 *
 * @throws {EnvironmentValidationError} If validation fails
 */
let cachedConfig: EnvironmentConfig | null = null;

export function getEnvironment(): EnvironmentConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnvironment();
  }
  return cachedConfig;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getEnvironment().isProduction;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getEnvironment().isDevelopment;
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return getEnvironment().isTest;
}

/**
 * Get log level configuration
 */
export function getLogLevel(): "debug" | "info" | "warn" | "error" {
  return getEnvironment().logLevel;
}

/**
 * Log environment configuration summary
 */
export function logEnvironmentInfo(): void {
  const config = getEnvironment();
  console.log("Environment Configuration:", {
    mode: config.isProduction
      ? "production"
      : config.isDevelopment
        ? "development"
        : "test",
    logLevel: config.logLevel,
  });
}
