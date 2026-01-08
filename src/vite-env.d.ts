/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Development
  readonly VITE_DEBUG_TAURI?: string;
  readonly VITE_API_TIMEOUT?: string;
  readonly VITE_MARKETPLACE_URL?: string;
  readonly VITE_ENABLE_DEVTOOLS?: string;

  // Build
  readonly VITE_APP_VERSION?: string;
  readonly VITE_BUILD_DATE?: string;
  readonly VITE_SENTRY_DSN?: string;

  // Runtime
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
