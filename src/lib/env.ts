/**
 * Environment variable validation and type-safe access
 * Validates environment variables on application startup
 */

/**
 * Parse boolean from string (supports true/false/1/0/yes/no)
 */
function parseBoolean(
  value: string | undefined,
  defaultValue: boolean
): boolean {
  if (value === undefined) return defaultValue;
  const normalized = value.toLowerCase().trim();
  return ["true", "1", "yes"].includes(normalized);
}

/**
 * Parse number from string with validation
 */
function parseNumber(
  value: string | undefined,
  defaultValue: number,
  min?: number,
  max?: number
): number {
  if (value === undefined) return defaultValue;
  const parsed = Number(value);

  if (isNaN(parsed)) {
    console.warn(
      `Invalid number value: ${value}, using default: ${defaultValue}`
    );
    return defaultValue;
  }

  if (min !== undefined && parsed < min) {
    console.warn(`Value ${parsed} below minimum ${min}, using minimum`);
    return min;
  }

  if (max !== undefined && parsed > max) {
    console.warn(`Value ${parsed} above maximum ${max}, using maximum`);
    return max;
  }

  return parsed;
}

/**
 * Validate URL format
 */
function parseUrl(value: string | undefined, defaultValue: string): string {
  if (value === undefined) return defaultValue;

  try {
    new URL(value);
    return value;
  } catch {
    console.warn(`Invalid URL: ${value}, using default: ${defaultValue}`);
    return defaultValue;
  }
}

/**
 * Validated and typed environment variables
 */
export const env = {
  // Development variables
  debugTauri: parseBoolean(import.meta.env.VITE_DEBUG_TAURI, false),
  apiTimeout: parseNumber(
    import.meta.env.VITE_API_TIMEOUT,
    30000,
    1000,
    120000
  ),
  marketplaceUrl: parseUrl(
    import.meta.env.VITE_MARKETPLACE_URL,
    "https://registry.pulsemcp.com"
  ),
  enableDevtools: parseBoolean(
    import.meta.env.VITE_ENABLE_DEVTOOLS,
    import.meta.env.DEV
  ),

  // Build variables
  appVersion: import.meta.env.VITE_APP_VERSION || "0.1.0",
  buildDate: import.meta.env.VITE_BUILD_DATE || new Date().toISOString(),
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,

  // Runtime detection
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  isTauri: "__TAURI__" in window,
} as const;

/**
 * Log environment configuration on startup (development only)
 */
export function logEnvironment(): void {
  if (!env.isDev) return;

  console.log("🔧 Environment Configuration:", {
    mode: env.mode,
    debugTauri: env.debugTauri,
    apiTimeout: env.apiTimeout,
    marketplaceUrl: env.marketplaceUrl,
    enableDevtools: env.enableDevtools,
    appVersion: env.appVersion,
    isTauri: env.isTauri,
  });
}

/**
 * Validate required environment variables
 * Throws error if critical variables are missing or invalid
 */
export function validateEnvironment(): void {
  const errors: string[] = [];

  // Add required variable checks here if needed
  // Currently all variables have defaults, so no required validation

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`
    );
  }

  // Log configuration in development
  logEnvironment();
}
