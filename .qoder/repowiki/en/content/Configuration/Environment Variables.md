# Environment Variables

<cite>
**Referenced Files in This Document**   
- [vite.config.ts](file://vite.config.ts)
- [tauri.conf.json](file://src-tauri/tauri.conf.json)
- [env.ts](file://src/lib/env.ts)
- [utils.ts](file://src/lib/utils.ts)
- [useConfig.ts](file://src/hooks/useConfig.ts)
</cite>

## Update Summary

**Changes Made**

- Added new section on Environment Variable Validation System to document the enhanced validation in src/lib/env.ts
- Updated Accessing Environment Variables section to reflect the new type-safe access pattern
- Enhanced Configuration Processing section with details about the new validation functions
- Added comprehensive details about VITE_DEBUG_TAURI, VITE_API_TIMEOUT, and VITE_MARKETPLACE_URL validation
- Updated Security Considerations with new best practices from the validation system

## Table of Contents

1. [Introduction](#introduction)
2. [Environment Variable Injection](#environment-variable-injection)
3. [Build-time vs Runtime Variables](#build-time-vs-runtime-variables)
4. [Accessing Environment Variables](#accessing-environment-variables)
5. [Environment Variable Validation System](#environment-variable-validation-system)
6. [Configuration Processing](#configuration-processing)
7. [Security Considerations](#security-considerations)
8. [Troubleshooting](#troubleshooting)
9. [Conclusion](#conclusion)

## Introduction

Environment variables in MCP Nexus provide a flexible mechanism for configuring application behavior across different environments. The application leverages both Tauri and Vite to manage environment variables for both frontend and backend components. This documentation explains the complete environment variable handling system, including injection mechanisms, access patterns, security considerations, and best practices for configuration management. Recent enhancements have introduced a robust validation system in `src/lib/env.ts` that provides type-safe access, runtime validation, default values, and error messages for critical environment variables.

## Environment Variable Injection

### Frontend Injection via Vite

MCP Nexus uses Vite as its frontend build tool, which handles environment variable injection through the `vite.config.ts` file. Vite automatically exposes environment variables prefixed with `VITE_` to the frontend code via `import.meta.env`. The configuration in `vite.config.ts` sets up the development server and build process, ensuring that environment variables are properly injected during both development and production builds.

The Vite configuration establishes a fixed port (1420) for development and configures hot module replacement for efficient development. During the build process, Vite processes environment variables and embeds them directly into the client-side bundle at build time. The `vite.config.ts` file also configures path aliases (like `@` for `src/`) and sets up the Tauri development environment with proper HMR (Hot Module Replacement) settings.

### Backend Injection via Tauri

The backend environment variables are managed through Tauri's configuration system in `tauri.conf.json`. Tauri provides a secure way to access environment variables from the Rust backend code. The configuration file defines application metadata, build settings, and bundling options, but does not directly contain environment variables. Instead, it configures how the application interacts with the system environment.

Tauri applications can access environment variables through the standard Rust `std::env` module, allowing the backend to read system environment variables at runtime. This separation ensures that sensitive configuration can be managed externally from the application code. The `tauri.conf.json` file specifies the development URL (`http://localhost:1420`), build commands, and frontend distribution directory, creating a seamless integration between the frontend and backend environments.

**Section sources**

- [vite.config.ts](file://vite.config.ts#L1-L42)
- [tauri.conf.json](file://src-tauri/tauri.conf.json#L1-L36)

## Build-time vs Runtime Variables

### Build-time Environment Variables

Build-time environment variables are embedded into the application code during the build process and cannot be changed without rebuilding the application. In MCP Nexus, these variables are primarily used for configuration that should remain consistent across all instances of the application.

Frontend build-time variables are prefixed with `VITE_` and accessed via `import.meta.env`. These variables are processed by Vite during the build and become static values in the compiled JavaScript. Examples include API endpoints, feature flags, and application metadata that should be consistent across all deployments. The `vite-env.d.ts` file defines the TypeScript interface for these environment variables, providing type safety and autocompletion.

### Runtime Environment Variables

Runtime environment variables are read by the application when it starts and can be changed without rebuilding the code. The Rust backend accesses these variables using `std::env::var()` or similar functions from the standard library. This approach allows for dynamic configuration based on the deployment environment.

Runtime variables are particularly useful for sensitive information like API keys, database credentials, or environment-specific settings that should not be hardcoded into the application. They can be set through the operating system's environment, configuration files, or deployment platforms. The distinction between build-time and runtime variables is crucial for security and flexibility. Build-time variables provide performance benefits as they are resolved at compile time, while runtime variables offer greater flexibility for environment-specific configuration.

**Section sources**

- [vite.config.ts](file://vite.config.ts#L1-L42)
- [src-tauri/src/lib.rs](file://src-tauri/src/lib.rs#L1-L89)

## Accessing Environment Variables

### Frontend Access with import.meta.env

In the TypeScript frontend code, environment variables are accessed through the `import.meta.env` object. Variables prefixed with `VITE_` in the environment are automatically exposed through this interface. For example, a variable named `VITE_API_URL` can be accessed as `import.meta.env.VITE_API_URL`.

This mechanism is implemented by Vite's build system, which replaces references to `import.meta.env` with the actual values during the build process. This ensures that only the necessary environment variables are included in the client bundle, reducing bundle size and preventing accidental exposure of sensitive variables. The `vite-env.d.ts` file provides TypeScript typing for these variables, enhancing developer experience with type checking and autocompletion.

### Backend Access with std::env

The Rust backend accesses environment variables using the standard library's `std::env` module. This provides several functions for reading environment variables, including `std::env::var()` for retrieving variable values and `std::env::vars()` for iterating over all environment variables.

The backend code can use pattern matching and error handling to manage missing or invalid environment variables gracefully. This approach allows for robust configuration management, with fallback values and validation logic to ensure the application can start even if some configuration is missing. Security-sensitive variables should be accessed exclusively through the backend, never exposed to the frontend, to prevent client-side access to sensitive information.

**Section sources**

- [vite.config.ts](file://vite.config.ts#L1-L42)
- [src-tauri/src/lib.rs](file://src-tauri/src/lib.rs#L1-L89)

## Environment Variable Validation System

### Type-safe Environment Access

MCP Nexus now features a comprehensive environment variable validation system implemented in `src/lib/env.ts`. This system provides type-safe access to environment variables with runtime validation, default values, and error messages. The `env` object exports a set of validated and typed environment variables that should be used throughout the application instead of direct access to `import.meta.env`.

The validation system uses specialized parsing functions for different data types:

- `parseBoolean()` for boolean values (supports true/false/1/0/yes/no)
- `parseNumber()` for numeric values with range validation
- `parseUrl()` for URL validation

These functions ensure that environment variables are correctly typed and within acceptable ranges, providing sensible defaults when variables are missing or invalid.

### Validation for Key Environment Variables

The system specifically validates three critical environment variables:

**VITE_DEBUG_TAURI**: Controls Tauri debug logging with boolean parsing. Accepts `true`, `false`, `1`, `0`, `yes`, `no` (case-insensitive). Defaults to `false` if not set.

**VITE_API_TIMEOUT**: Configures API request timeout in milliseconds with range validation (1000-120000ms). Defaults to 30000ms (30 seconds). Invalid values trigger warnings and use of defaults or boundary values.

**VITE_MARKETPLACE_URL**: Validates the PulseMCP Marketplace API base URL format. Defaults to `https://registry.pulsemcp.com`. Invalid URLs trigger warnings and fallback to the default.

### Validation Process and Error Handling

The validation system automatically runs on application startup through the `validateEnvironment()` function. This function performs comprehensive validation and logs the configuration in development mode. If critical variables are missing or invalid, it throws descriptive error messages to alert developers during development.

The system includes graceful error handling with console warnings for invalid configurations, allowing the application to continue with safe defaults. This prevents application crashes due to configuration issues while still alerting developers to problems that should be addressed.

### Usage Pattern

Applications should import and use the validated environment variables as follows:

```typescript
import { env, validateEnvironment } from "@/lib/env";

// Validate environment on app startup
validateEnvironment();

// Access validated environment variables
const debugEnabled = env.debugTauri;
const timeout = env.apiTimeout;
const marketplaceUrl = env.marketplaceUrl;

// Check environment mode
if (env.isDev) {
  // Development-specific code
}
```

This pattern ensures consistent, type-safe access to environment variables throughout the codebase.

**Section sources**

- [src/lib/env.ts](file://src/lib/env.ts#L1-L134)
- [docs/environment-setup.md](file://docs/environment-setup.md#L1-L315)

## Configuration Processing

### env.ts Processing Functions

The `env.ts` file contains the core environment variable processing functions that provide type-safe access and validation. These functions include `parseBoolean()`, `parseNumber()`, and `parseUrl()`, which handle the parsing and validation of different data types with appropriate defaults and error handling.

The `env` object centralizes all environment variable access, providing a single source of truth for configuration. It also includes runtime detection properties like `isDev`, `isProd`, and `isTauri` that help components adapt their behavior based on the current environment.

### utils.ts Processing Functions

The `utils.ts` file contains utility functions that may process or transform environment variables for use in the application. These functions provide a layer of abstraction between raw environment variables and the application logic, allowing for validation, transformation, and default value assignment.

Utility functions can parse string environment variables into appropriate data types (numbers, booleans, JSON objects), apply formatting, or combine multiple variables into a single configuration object. This processing ensures that the rest of the application receives consistently formatted and validated configuration data.

The use of utility functions also centralizes configuration logic, making it easier to modify how environment variables are interpreted without changing multiple parts of the codebase.

### useConfig.ts Configuration Hook

The `useConfig.ts` file implements a React hook that manages application configuration, potentially incorporating environment variables into the application state. This hook provides a reactive interface for components to access configuration data, automatically updating when configuration changes.

The configuration system may merge environment variables with user preferences and other configuration sources, creating a unified configuration object. This approach allows for hierarchical configuration where environment variables provide defaults that can be overridden by user settings.

The hook implementation includes error handling and fallback mechanisms to ensure the application remains functional even if configuration is incomplete or invalid.

**Section sources**

- [src/lib/env.ts](file://src/lib/env.ts#L1-L134)
- [src/lib/utils.ts](file://src/lib/utils.ts#L1-L43)
- [src/hooks/useConfig.ts](file://src/hooks/useConfig.ts#L1-L42)

## Security Considerations

### Preventing Client-side Leakage

A critical security consideration is preventing sensitive environment variables from being exposed in client-side bundles. Vite's environment variable system automatically excludes variables not prefixed with `VITE_` from the client bundle, but developers must be careful not to inadvertently expose sensitive information.

Best practices include:

- Never prefix sensitive variables (like API keys or database credentials) with `VITE_`
- Use environment variables exclusively in backend code for sensitive configuration
- Implement server-side validation for any configuration that affects security
- Regularly audit the build output to ensure no sensitive information is embedded

The application should assume that any data included in the client bundle is potentially accessible to users, so sensitive configuration must be handled exclusively by the backend.

### Managing Environment-specific Configurations

MCP Nexus should support different configuration profiles for development, testing, and production environments. This can be achieved through:

- Separate environment variable files (.env.development, .env.production)
- Environment-specific variable prefixes
- Configuration fallback chains

The enhanced validation system in `env.ts` provides additional security by validating URL formats and numeric ranges, preventing configuration injection attacks. The system also includes automatic masking of sensitive data in logs, protecting credentials and tokens from accidental exposure.

**Section sources**

- [vite.config.ts](file://vite.config.ts#L1-L42)
- [tauri.conf.json](file://src-tauri/tauri.conf.json#L1-L36)
- [src/lib/env.ts](file://src/lib/env.ts#L1-L134)

## Troubleshooting

### Missing Environment Variables

When environment variables are missing, the application may fail to start or exhibit unexpected behavior. Common symptoms include:

- Connection errors to external services
- Missing feature flags
- Incorrect API endpoints
- Authentication failures

To troubleshoot missing environment variables:

1. Verify that required variables are set in the environment
2. Check that variable names match exactly (including case)
3. Ensure variables are properly prefixed for frontend access
4. Review build logs for warnings about undefined variables
5. Use debugging tools to inspect the actual values being used

The enhanced validation system in `env.ts` provides clear console warnings when variables are missing or invalid, helping users resolve issues quickly. The `validateEnvironment()` function also logs the complete configuration in development mode, making it easy to verify settings.

### Incorrect Variable Values

Incorrect environment variable values can cause subtle bugs that are difficult to diagnose. To identify and fix these issues:

- Validate variable values at startup using the `env.ts` validation system
- Implement logging to show configuration values
- Use type checking to catch format errors
- Provide default values for non-critical configuration
- Include validation feedback in the user interface

The `parseNumber()`, `parseBoolean()`, and `parseUrl()` functions in `env.ts` provide built-in validation with range checking, format validation, and descriptive error messages, preventing many configuration-related issues before they affect application behavior.

**Section sources**

- [vite.config.ts](file://vite.config.ts#L1-L42)
- [src-tauri/src/lib.rs](file://src-tauri/src/lib.rs#L1-L89)
- [src/lib/env.ts](file://src/lib/env.ts#L1-L134)

## Conclusion

MCP Nexus employs a comprehensive environment variable handling system that leverages both Vite and Tauri to provide flexible configuration options for both frontend and backend components. The recent enhancement with the `src/lib/env.ts` validation system adds robust type-safe access, runtime validation, default values, and error messages for critical environment variables like `VITE_DEBUG_TAURI`, `VITE_API_TIMEOUT`, and `VITE_MARKETPLACE_URL`.

By understanding the distinction between build-time and runtime variables, and following security best practices, developers can effectively configure the application for different environments while protecting sensitive information. The combination of Vite's frontend environment variable system and Tauri's backend capabilities provides a robust foundation for environment-specific configuration. Proper use of these systems ensures that MCP Nexus can adapt to different deployment scenarios while maintaining security and reliability.
