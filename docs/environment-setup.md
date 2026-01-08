# Environment Setup Guide

## Overview

MCP Nexus uses environment variables for configuration. This guide explains how to set up your environment correctly.

## Environment Variables

### Development

Create a `.env.local` file in the project root for local development:

```bash
# Copy the example file
cp .env.example .env.local
```

### Available Variables

#### VITE_DEBUG_TAURI

Enables detailed Tauri debug logging.

**Accepted values:** `true`, `false`, `1`, `0`, `yes`, `no`  
**Default:** `false`

```bash
# Enable Tauri debug logging
VITE_DEBUG_TAURI=true

# Disable Tauri debug logging (default)
VITE_DEBUG_TAURI=false
```

#### VITE_API_TIMEOUT

API request timeout in milliseconds.

**Range:** 1000-120000 (1 second to 2 minutes)  
**Default:** `30000` (30 seconds)

```bash
# Default timeout
VITE_API_TIMEOUT=30000

# Shorter timeout for faster failures
VITE_API_TIMEOUT=10000

# Longer timeout for slow connections
VITE_API_TIMEOUT=60000
```

#### VITE_MARKETPLACE_URL

PulseMCP Marketplace API base URL.

**Default:** `https://registry.pulsemcp.com`

```bash
# Use production marketplace (default)
VITE_MARKETPLACE_URL=https://registry.pulsemcp.com

# Use custom marketplace for testing
VITE_MARKETPLACE_URL=http://localhost:8080
```

#### VITE_ENABLE_DEVTOOLS

Enable React Query DevTools in development.

**Accepted values:** `true`, `false`, `1`, `0`, `yes`, `no`  
**Default:** `true` in development, `false` in production

```bash
# Enable DevTools (default in dev)
VITE_ENABLE_DEVTOOLS=true

# Disable DevTools
VITE_ENABLE_DEVTOOLS=false
```

#### VITE_APP_VERSION

Application version for display purposes.

**Default:** Version from package.json (`0.1.0`)

```bash
VITE_APP_VERSION=0.1.0
```

#### VITE_BUILD_DATE

Build timestamp (automatically set during build).

**Default:** Current date/time in ISO 8601 format

```bash
VITE_BUILD_DATE=2024-01-08T00:00:00.000Z
```

#### VITE_SENTRY_DSN (Optional)

Sentry DSN for error reporting (not yet implemented).

**Default:** Not set

```bash
VITE_SENTRY_DSN=https://your-sentry-dsn
```

## Environment Validation

The application automatically validates environment variables on startup using the `env.ts` utility.

### Validation Features

1. **Type Checking**: Ensures log level is valid
2. **Default Values**: Applies sensible defaults if variables are missing
3. **Error Reporting**: Warns about invalid configurations

### Using the Environment Utility

```typescript
import { env, validateEnvironment } from "@/lib/env";

// Validate environment on app startup
validateEnvironment();

// Access environment variables
const debugEnabled = env.debugTauri;
const timeout = env.apiTimeout;
const marketplaceUrl = env.marketplaceUrl;

// Check environment mode
if (env.isDev) {
  // Development-specific code
}

if (env.isProd) {
  // Production-specific code
}

if (env.isTauri) {
  // Tauri-specific code
}
```

## Logger Configuration

The structured logger automatically adjusts log levels based on the environment and `VITE_DEBUG_TAURI` setting.

### Log Level Behavior

- **Development mode with DEBUG_TAURI=true**: All logs (debug, info, warn, error)
- **Development mode (default)**: Info, warn, and error logs
- **Production mode**: Only warn and error logs

### Example Usage

```typescript
import { logger } from "@/lib/logger";

// Debug logs (only shown in development with DEBUG_TAURI=true)
logger.debug("Detailed diagnostic information", { userId: 123 });

// Info logs (shown in development)
logger.info("Server started successfully", { port: 3000 });

// Warning logs (always shown except in production info mode)
logger.warn("API rate limit approaching", { remaining: 10 });

// Error logs (always shown)
logger.error("Failed to connect to database", { host: "localhost" }, error);
```

### Log Features

- **Automatic Timestamp**: ISO 8601 format
- **Component Inference**: Automatically detects calling component
- **Sensitive Data Masking**: Masks passwords, tokens, API keys
- **Context Serialization**: Structured data logging
- **Error Stack Traces**: Full error information

## Development Setup

### Prerequisites

- Node.js 20+
- npm or yarn
- Rust (for Tauri development)

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/mcp-nexus.git
   cd mcp-nexus
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

4. **Configure environment (optional)**

   Edit `.env.local` to customize settings:

   ```bash
   # Enable debug logging
   VITE_DEBUG_TAURI=true

   # Adjust API timeout
   VITE_API_TIMEOUT=60000

   # Use custom marketplace
   VITE_MARKETPLACE_URL=http://localhost:8080
   ```

5. **Start development server**
   ```bash
   npm run tauri dev
   ```

## Production Build

### Environment Configuration

For production builds, environment variables are set to production defaults:

- Debug logging is disabled
- Log level is set to `warn` (warnings and errors only)
- DevTools are disabled

You can override these with build-time environment variables if needed.

### Build Commands

```bash
# Build the application
npm run tauri build

# The build will automatically use production mode
# and apply the appropriate log level
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### Test Environment

Tests run with `MODE=test` and use appropriate mocked values.

## Troubleshooting

### Issue: Environment variables not loading

**Solution:** Ensure your `.env.local` file is in the project root and not inside `src-tauri`. Vite only loads `.env` files from the root.

### Issue: Debug logs not appearing

**Solution:** Set `VITE_DEBUG_TAURI=true` in your `.env.local` file. Debug logs are disabled by default.

### Issue: API timeouts

**Solution:** Increase `VITE_API_TIMEOUT` value. Default is 30 seconds, but slow connections may need 60 seconds or more.

### Issue: Cannot connect to marketplace

**Solution:** Check `VITE_MARKETPLACE_URL` is set correctly. Ensure you have internet connectivity and the marketplace API is accessible.

## Best Practices

1. **Never commit `.env.local`**: Keep your local configuration private
2. **Use `.env.example` as template**: Document all available variables
3. **Set appropriate timeouts**: Balance between user experience and slow connections
4. **Enable debug logging sparingly**: Only when actively troubleshooting
5. **Validate environment early**: Call `validateEnvironment()` on app startup
6. **Mask sensitive data**: The logger automatically masks passwords and tokens

## Security Notes

- Environment variables are embedded in the build at compile time
- Do not store secrets in environment variables for production
- Use Tauri's secure storage for sensitive data
- Review logs before sharing for debugging

## Additional Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Tauri Configuration](https://tauri.app/v1/api/config/)
- [Logger Utility Documentation](../src/lib/logger.ts)
- [Environment Utility Documentation](../src/lib/env.ts)
