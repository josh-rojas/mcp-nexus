# Development Guide

<cite>
**Referenced Files in This Document**   
- [README.md](file://README.md)
- [CONTRIBUTING.md](file://CONTRIBUTING.md)
- [package.json](file://package.json)
- [eslint.config.js](file://eslint.config.js)
- [.prettierrc](file://.prettierrc)
- [vite.config.ts](file://vite.config.ts)
- [vitest.config.ts](file://vitest.config.ts)
- [Cargo.toml](file://Cargo.toml)
- [src-tauri/Cargo.toml](file://src-tauri/Cargo.toml)
- [src-tauri/tauri.conf.json](file://src-tauri/tauri.conf.json)
- [src/main.tsx](file://src/main.tsx)
- [src/App.tsx](file://src/App.tsx)
- [src/lib/tauri.ts](file://src/lib/tauri.ts)
- [src/hooks/index.ts](file://src/hooks/index.ts)
- [src/stores/appStore.ts](file://src/stores/appStore.ts)
- [src-tauri/src/main.rs](file://src-tauri/src/main.rs)
</cite>

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Coding Standards and Code Quality](#coding-standards-and-code-quality)
3. [Testing Strategy](#testing-strategy)
4. [Running and Debugging the Application](#running-and-debugging-the-application)
5. [Building Release Artifacts](#building-release-artifacts)
6. [Contribution Workflow](#contribution-workflow)
7. [Common Development Pitfalls](#common-development-pitfalls)
8. [Performance Optimization Techniques](#performance-optimization-techniques)

## Development Environment Setup

To contribute to the MCP Nexus codebase, you need to set up a development environment with the required tools and dependencies. The project uses a Tauri-based architecture with a React frontend and Rust backend, requiring specific tooling for both.

First, ensure you have Node.js installed (version 18 or higher recommended) as it's required for the frontend build system and NPM-based server installations. Install the Tauri CLI globally using npm:

```bash
npm install -g @tauri-apps/cli
```

The project also requires Rust and Cargo for the backend development. Install Rust via rustup if you haven't already:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

After cloning the repository, install JavaScript dependencies:

```bash
git clone https://github.com/yourusername/mcp-nexus.git
cd mcp-nexus
npm install
```

For IDE configuration, we recommend using Visual Studio Code with the following extensions:

- **rust-analyzer** for Rust code intelligence
- **ESLint** for TypeScript linting feedback
- **Prettier - Code formatter** for consistent code style
- **Tauri** for framework-specific support

Configure your IDE to use the project's ESLint and Prettier configurations automatically. The Vite development server is configured to run on port 1420, and the Tauri application is set up to communicate with this development server during development.

**Section sources**

- [README.md](file://README.md#L140-L156)
- [CONTRIBUTING.md](file://CONTRIBUTING.md#L5-L13)
- [package.json](file://package.json#L1-L52)
- [vite.config.ts](file://vite.config.ts#L1-L34)
- [src-tauri/tauri.conf.json](file://src-tauri/tauri.conf.json#L1-L36)

## Coding Standards and Code Quality

MCP Nexus enforces strict coding standards through ESLint and Prettier to maintain code quality and consistency across the codebase. The frontend code follows TypeScript strict mode with specific rules configured in `eslint.config.js`.

The ESLint configuration extends the recommended rules from both `@eslint/js` and `typescript-eslint`, with additional rules from `eslint-plugin-react-hooks` to enforce proper React hook usage. Key rules include:

- `@typescript-eslint/no-unused-vars` with error level, allowing underscore-prefixed variables to be ignored
- React hooks rules to prevent invalid hook usage patterns
- React refresh plugin for Vite integration

Prettier is configured with the following formatting rules in `.prettierrc`:

- Use double quotes for strings
- Semi-colons at the end of statements
- 2-space indentation
- Trailing commas in ES5 style
- Print width of 80 characters

To run the linters and formatters, use the npm scripts defined in `package.json`:

- `npm run lint` - Run ESLint on all TypeScript files
- `npm run lint:fix` - Run ESLint and automatically fix fixable issues
- `npm run format` - Run Prettier to format all TypeScript and TSX files
- `npm run format:check` - Check if files are properly formatted without making changes
- `npm run typecheck` - Run TypeScript type checking

These tools are integrated into the development workflow and should be run before committing code. The configuration ignores the `dist` and `src-tauri` directories, focusing linting efforts on the frontend codebase.

**Section sources**

- [eslint.config.js](file://eslint.config.js#L1-L28)
- [.prettierrc](file://.prettierrc#L1-L8)
- [package.json](file://package.json#L14-L18)
- [CONTRIBUTING.md](file://CONTRIBUTING.md#L43-L48)

## Testing Strategy

MCP Nexus employs a comprehensive testing strategy using Vitest for unit tests, React Testing Library for component tests, and integration tests for Tauri commands. The test configuration is defined in `vitest.config.ts`, which sets up the testing environment with JSDOM for browser-like DOM manipulation.

Unit tests are written using Vitest's testing API and are located alongside the source files they test. The configuration enables global test functions, uses JSDOM as the testing environment, and runs setup files from `src/test/setup.ts` before each test. Test coverage is measured using the V8 engine and reported in text, JSON, and HTML formats.

Component tests leverage React Testing Library to test UI components in isolation, focusing on user behavior rather than implementation details. Tests are written to simulate user interactions and verify the resulting UI changes. The setup ensures that React components can be rendered and interacted with in a controlled environment.

Integration tests focus on the Tauri command interface between the frontend and backend. These tests verify that the `invoke` calls from the frontend properly communicate with the Rust backend commands defined in `src-tauri/src/commands/`. The tests validate both successful command execution and proper error handling.

To run the tests, use the following npm scripts:

- `npm run test` - Run all tests
- `npm run test:ui` - Run tests with a web-based UI for interactive testing
- `npm run test:coverage` - Run tests with coverage reporting

The test configuration excludes node_modules, test files, and specification files from coverage reporting to focus on application code.

**Section sources**

- [vitest.config.ts](file://vitest.config.ts#L1-L23)
- [package.json](file://package.json#L11-L13)
- [src/test/setup.ts](file://src/test/setup.ts)
- [src/lib/tauri.ts](file://src/lib/tauri.ts#L1-L364)

## Running and Debugging the Application

To run MCP Nexus in development mode, use the Tauri development command which starts both the Vite development server and the Tauri application:

```bash
npm run tauri dev
```

This command launches the application with hot reloading enabled for the frontend code. The Vite server runs on port 1420 as specified in `vite.config.ts`, and the Tauri application connects to this development server during development. Any changes to the frontend code will be automatically reflected in the running application.

For debugging, the application provides multiple entry points for inspection. Frontend code can be debugged using browser developer tools within the Tauri window. The React Developer Tools extension can be used to inspect component state and props. For Rust backend debugging, standard Rust debugging techniques apply, with logs and error messages forwarded to the frontend for display.

The application architecture separates concerns between frontend and backend through well-defined Tauri commands. The `src/lib/tauri.ts` file exports TypeScript functions that wrap `invoke` calls to the Rust backend, providing type safety and a clean interface. These functions correspond to command handlers in `src-tauri/src/commands/` which implement the actual business logic.

When debugging issues, start by checking the console output from both the Vite server and the Tauri application. For issues related to client detection or configuration sync, the `runDoctor` function in `src/lib/tauri.ts` can be used to diagnose environment issues. For credential management problems, verify the keychain integration through the `saveCredential`, `getCredentialValue`, and related functions.

**Section sources**

- [README.md](file://README.md#L146-L147)
- [vite.config.ts](file://vite.config.ts#L1-L34)
- [src-tauri/tauri.conf.json](file://src-tauri/tauri.conf.json#L7-L9)
- [src/lib/tauri.ts](file://src/lib/tauri.ts#L1-L364)
- [src-tauri/src/main.rs](file://src-tauri/src/main.rs#L1-L7)

## Building Release Artifacts

To build production-ready release artifacts for MCP Nexus, use the Tauri build command:

```bash
npm run tauri build
```

This command triggers a production build of the frontend assets using Vite (via the `npm run build` script defined in `package.json`), then packages these assets with the compiled Rust binary into a distributable application. The build process is configured in `src-tauri/tauri.conf.json`, which specifies the frontend distribution directory as `../dist` and sets up the application metadata.

The Rust backend is configured in `src-tauri/Cargo.toml` with dependencies for Tauri, serde for serialization, reqwest for HTTP requests, tokio for async operations, and keyring for secure credential storage. The build process compiles the Rust code into a native binary optimized for the target platform.

The resulting application is a standalone desktop application that bundles the frontend assets and backend logic. For macOS, this produces a `.app` bundle that can be packaged into a `.dmg` installer. The application includes devtools in the debug build (enabled by the "devtools" feature in the Tauri dependency) but these are typically disabled in production releases.

The build process also handles code signing and notarization for macOS, ensuring the application can be distributed outside the App Store. The Tauri configuration includes icon assets in various sizes for different display contexts.

**Section sources**

- [README.md](file://README.md#L149-L150)
- [package.json](file://package.json#L8-L9)
- [src-tauri/Cargo.toml](file://src-tauri/Cargo.toml#L1-L37)
- [src-tauri/tauri.conf.json](file://src-tauri/tauri.conf.json#L1-L36)

## Contribution Workflow

The contribution workflow for MCP Nexus follows a standard Git branching model with specific guidelines outlined in `CONTRIBUTING.md`. To contribute, start by creating a feature branch from the main branch:

```bash
git checkout -b feat/your-feature
```

After making changes, ensure your code adheres to the project's coding standards by running the linting and type checking scripts:

```bash
npm run lint
npm run typecheck
```

For Rust code changes, run the backend tests:

```bash
cd src-tauri && cargo test
```

Commit your changes with a clear message following the conventional commits format, such as `feat: add server health check` or `fix: resolve credential storage issue`. Push your branch to the remote repository and open a pull request through GitHub.

Pull requests require approval from at least one core maintainer before merging. The PR should include a description of the changes, any relevant screenshots for UI changes, and references to related issues. Large changes should be discussed in an issue before implementation to ensure alignment with the project roadmap.

Code review guidelines emphasize maintaining the existing code patterns, ensuring type safety, and preserving the separation of concerns between frontend and backend. Business logic should reside in the Rust backend (`src-tauri/src/services/`) while the frontend focuses on presentation and user interaction.

**Section sources**

- [CONTRIBUTING.md](file://CONTRIBUTING.md#L51-L57)
- [README.md](file://README.md#L199-L201)
- [package.json](file://package.json#L14-L16)
- [src-tauri/Cargo.toml](file://src-tauri/Cargo.toml#L34-L36)

## Common Development Pitfalls

Developers contributing to MCP Nexus may encounter several common pitfalls related to the Tauri architecture and cross-platform development. One frequent issue is improper handling of asynchronous operations between the frontend and backend. Since Tauri commands are inherently asynchronous, ensure that all `invoke` calls are properly awaited and error-handled.

Another common pitfall involves state management inconsistencies between the frontend and backend. The application uses Zustand for global state in `src/stores/appStore.ts`, but this state must remain synchronized with the central configuration managed by the Rust backend. Always use the Tauri command interface to modify persistent state rather than directly mutating the store.

Platform-specific issues can arise when testing on different operating systems. While the application currently targets macOS, the code should avoid macOS-specific assumptions when possible to facilitate future Linux and Windows support. Use the `dirs` crate for cross-platform directory paths rather than hardcoding paths.

Type inconsistencies between TypeScript and Rust can cause runtime errors. Ensure that data structures defined in `src/types/index.ts` match their Rust counterparts in `src-tauri/src/models/`. The serde serialization framework helps maintain this consistency, but manual verification is recommended when modifying data models.

Finally, be cautious with credential handling and security. Credentials are stored securely in the macOS Keychain through the `keyring` crate, and should never be logged or exposed in client configurations. The `validateCredentialReferences` function should be used to verify credential references before use.

**Section sources**

- [src/lib/tauri.ts](file://src/lib/tauri.ts#L1-L364)
- [src/stores/appStore.ts](file://src/stores/appStore.ts#L1-L118)
- [src-tauri/Cargo.toml](file://src-tauri/Cargo.toml#L32)
- [src/types/index.ts](file://src/types/index.ts)

## Performance Optimization Techniques

Performance optimization in MCP Nexus involves both React frontend optimizations and Rust backend efficiency improvements. For React components, leverage React Query (imported from `@tanstack/react-query` in `src/App.tsx`) for efficient data fetching and caching. This reduces unnecessary network requests and provides a seamless user experience with background updates.

In the component structure, ensure that heavy rendering operations are optimized through React's memoization features. Use `React.memo` for components that receive the same props frequently, and leverage the `useCallback` and `useMemo` hooks in custom hooks like those in `src/hooks/` to prevent unnecessary re-renders.

For the Rust backend, the application uses async/await patterns with tokio for non-blocking operations. When implementing new services in `src-tauri/src/services/`, ensure that CPU-intensive operations are properly async and don't block the event loop. Use tokio's spawn and join handles for parallel operations when appropriate.

Data fetching operations, such as marketplace searches and update checks, should implement caching strategies to minimize network requests. The `clearMarketplaceCache` and `checkMarketplaceCache` functions in `src/lib/tauri.ts` demonstrate this pattern for the marketplace functionality.

Minimize the data transferred between frontend and backend by only requesting necessary fields. The Tauri command interface allows for fine-grained data transfer, so avoid sending entire configuration objects when only specific fields are needed.

Finally, optimize startup performance by lazy-loading non-essential components and deferring non-critical operations. The application's initialization sequence in `src/main.tsx` and the store setup in `src/stores/appStore.ts` should be reviewed to ensure efficient startup without blocking the main thread.

**Section sources**

- [src/App.tsx](file://src/App.tsx#L1-L58)
- [src/lib/tauri.ts](file://src/lib/tauri.ts#L1-L364)
- [src/hooks/index.ts](file://src/hooks/index.ts#L1-L9)
- [src/stores/appStore.ts](file://src/stores/appStore.ts#L1-L118)
- [src-tauri/Cargo.toml](file://src-tauri/Cargo.toml#L30)
