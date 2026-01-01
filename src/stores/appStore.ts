import { create } from "zustand";
import type {
  McpServer,
  McpHubConfig,
  DetectedClient,
  DoctorReport,
  UserPreferences,
} from "../types";

interface AppState {
  // Config state
  config: McpHubConfig | null;
  isConfigLoaded: boolean;

  // Servers (derived from config for convenience)
  servers: McpServer[];

  // Client detection
  detectedClients: DetectedClient[];

  // Environment doctor
  doctorReport: DoctorReport | null;

  // UI state
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // Actions
  setConfig: (config: McpHubConfig) => void;
  setServers: (servers: McpServer[]) => void;
  setDetectedClients: (clients: DetectedClient[]) => void;
  setDoctorReport: (report: DoctorReport) => void;
  setLoading: (loading: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setError: (error: string | null) => void;
  addServer: (server: McpServer) => void;
  removeServer: (serverId: string) => void;
  updateServer: (serverId: string, updates: Partial<McpServer>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  config: null,
  isConfigLoaded: false,
  servers: [],
  detectedClients: [],
  doctorReport: null,
  isLoading: false,
  isSyncing: false,
  error: null,

  setConfig: (config) =>
    set({
      config,
      servers: config.servers,
      isConfigLoaded: true,
    }),

  setServers: (servers) =>
    set((state) => ({
      servers,
      config: state.config ? { ...state.config, servers } : null,
    })),

  setDetectedClients: (detectedClients) => set({ detectedClients }),

  setDoctorReport: (doctorReport) => set({ doctorReport }),

  setLoading: (isLoading) => set({ isLoading }),

  setSyncing: (isSyncing) => set({ isSyncing }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  addServer: (server) =>
    set((state) => {
      const servers = [...state.servers, server];
      return {
        servers,
        config: state.config ? { ...state.config, servers } : null,
      };
    }),

  removeServer: (serverId) =>
    set((state) => {
      const servers = state.servers.filter((s) => s.id !== serverId);
      return {
        servers,
        config: state.config ? { ...state.config, servers } : null,
      };
    }),

  updateServer: (serverId, updates) =>
    set((state) => {
      const servers = state.servers.map((s) =>
        s.id === serverId ? { ...s, ...updates } : s
      );
      return {
        servers,
        config: state.config ? { ...state.config, servers } : null,
      };
    }),

  updatePreferences: (updates) =>
    set((state) => ({
      config: state.config
        ? {
            ...state.config,
            preferences: { ...state.config.preferences, ...updates },
          }
        : null,
    })),
}));
