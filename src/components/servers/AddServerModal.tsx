import { useState, useCallback } from "react";
import type { ClientId, InstallSource } from "../../types";
import { useClients } from "../../hooks/useClients";

interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: (
    name: string,
    description: string,
    source: InstallSource,
    enabledClients: ClientId[],
    env?: Record<string, string>
  ) => void;
  isInstalling: boolean;
}

type SourceType = "local" | "remote" | "npm" | "uvx" | "docker" | "github";

const SOURCE_OPTIONS: { value: SourceType; label: string; description: string }[] = [
  { value: "local", label: "Local Path", description: "A command or script on your local machine" },
  { value: "remote", label: "SSE/Remote URL", description: "An SSE-based server accessible via URL" },
  { value: "npm", label: "NPM Package", description: "Install from npm registry" },
  { value: "uvx", label: "Python/uvx", description: "Install from PyPI using uvx" },
  { value: "docker", label: "Docker", description: "Run as a Docker container" },
  { value: "github", label: "GitHub Repository", description: "Clone and run from GitHub" },
];

export function AddServerModal({
  isOpen,
  onClose,
  onInstall,
  isInstalling,
}: AddServerModalProps) {
  const { clients } = useClients();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("local");
  const [selectedClients, setSelectedClients] = useState<ClientId[]>([]);
  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([]);

  // Source-specific fields
  const [localPath, setLocalPath] = useState("");
  const [localCommand, setLocalCommand] = useState("");
  const [localArgs, setLocalArgs] = useState("");
  const [remoteUrl, setRemoteUrl] = useState("");
  const [npmPackage, setNpmPackage] = useState("");
  const [npmArgs, setNpmArgs] = useState("");
  const [uvxPackage, setUvxPackage] = useState("");
  const [uvxArgs, setUvxArgs] = useState("");
  const [dockerImage, setDockerImage] = useState("");
  const [dockerArgs, setDockerArgs] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubBranch, setGithubBranch] = useState("");

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setSourceType("local");
    setSelectedClients([]);
    setEnvVars([]);
    setLocalPath("");
    setLocalCommand("");
    setLocalArgs("");
    setRemoteUrl("");
    setNpmPackage("");
    setNpmArgs("");
    setUvxPackage("");
    setUvxArgs("");
    setDockerImage("");
    setDockerArgs("");
    setGithubRepo("");
    setGithubBranch("");
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      let source: InstallSource;
      switch (sourceType) {
        case "local":
          source = {
            type: "local",
            path: localPath,
            command: localCommand || undefined,
            args: localArgs ? localArgs.split(" ").filter(Boolean) : undefined,
          };
          break;
        case "remote":
          source = {
            type: "remote",
            url: remoteUrl,
          };
          break;
        case "npm":
          source = {
            type: "npm",
            package: npmPackage,
            args: npmArgs ? npmArgs.split(" ").filter(Boolean) : undefined,
          };
          break;
        case "uvx":
          source = {
            type: "uvx",
            package: uvxPackage,
            args: uvxArgs ? uvxArgs.split(" ").filter(Boolean) : undefined,
          };
          break;
        case "docker":
          source = {
            type: "docker",
            image: dockerImage,
            dockerArgs: dockerArgs ? dockerArgs.split(" ").filter(Boolean) : undefined,
          };
          break;
        case "github":
          source = {
            type: "github",
            repo: githubRepo,
            branch: githubBranch || undefined,
          };
          break;
      }

      // Build env vars object
      const env: Record<string, string> = {};
      envVars.forEach(({ key, value }) => {
        if (key && value) {
          env[key] = value;
        }
      });

      onInstall(name, description, source, selectedClients, Object.keys(env).length > 0 ? env : undefined);
    },
    [
      sourceType,
      name,
      description,
      selectedClients,
      envVars,
      localPath,
      localCommand,
      localArgs,
      remoteUrl,
      npmPackage,
      npmArgs,
      uvxPackage,
      uvxArgs,
      dockerImage,
      dockerArgs,
      githubRepo,
      githubBranch,
      onInstall,
    ]
  );

  const toggleClient = useCallback((clientId: ClientId) => {
    setSelectedClients((prev) =>
      prev.includes(clientId) ? prev.filter((c) => c !== clientId) : [...prev, clientId]
    );
  }, []);

  const selectAllClients = useCallback(() => {
    const allClientIds =
      clients
        ?.filter((c) => c.detected)
        .map((c) => c.id) ?? [];
    setSelectedClients(allClientIds);
  }, [clients]);

  const deselectAllClients = useCallback(() => {
    setSelectedClients([]);
  }, []);

  const addEnvVar = useCallback(() => {
    setEnvVars((prev) => [...prev, { key: "", value: "" }]);
  }, []);

  const updateEnvVar = useCallback((index: number, field: "key" | "value", value: string) => {
    setEnvVars((prev) =>
      prev.map((ev, i) => (i === index ? { ...ev, [field]: value } : ev))
    );
  }, []);

  const removeEnvVar = useCallback((index: number) => {
    setEnvVars((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const isFormValid = () => {
    if (!name.trim()) return false;

    switch (sourceType) {
      case "local":
        return !!localPath.trim();
      case "remote":
        return !!remoteUrl.trim();
      case "npm":
        return !!npmPackage.trim();
      case "uvx":
        return !!uvxPackage.trim();
      case "docker":
        return !!dockerImage.trim();
      case "github":
        return !!githubRepo.trim();
    }
  };

  if (!isOpen) return null;

  const detectedClients = clients?.filter((c) => c.detected) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Add Server Manually
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Server Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My MCP Server"
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this server do?"
                rows={2}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Source type selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Source Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SOURCE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSourceType(option.value)}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    sourceType === option.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <div className={`text-sm font-medium ${
                    sourceType === option.value
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-gray-900 dark:text-white"
                  }`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Source-specific fields */}
          <div className="space-y-4">
            {sourceType === "local" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Path to Script/Command *
                  </label>
                  <input
                    type="text"
                    value={localPath}
                    onChange={(e) => setLocalPath(e.target.value)}
                    placeholder="/path/to/server.py or npx"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Command (optional)
                  </label>
                  <input
                    type="text"
                    value={localCommand}
                    onChange={(e) => setLocalCommand(e.target.value)}
                    placeholder="python, node, etc."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Arguments (optional)
                  </label>
                  <input
                    type="text"
                    value={localArgs}
                    onChange={(e) => setLocalArgs(e.target.value)}
                    placeholder="--port 8080 --debug"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {sourceType === "remote" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SSE URL *
                </label>
                <input
                  type="url"
                  value={remoteUrl}
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  placeholder="https://api.example.com/mcp/sse"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter the SSE endpoint URL for the remote MCP server
                </p>
              </div>
            )}

            {sourceType === "npm" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    NPM Package *
                  </label>
                  <input
                    type="text"
                    value={npmPackage}
                    onChange={(e) => setNpmPackage(e.target.value)}
                    placeholder="@modelcontextprotocol/server-filesystem"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Arguments (optional)
                  </label>
                  <input
                    type="text"
                    value={npmArgs}
                    onChange={(e) => setNpmArgs(e.target.value)}
                    placeholder="/path/to/allowed/directory"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {sourceType === "uvx" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Python Package *
                  </label>
                  <input
                    type="text"
                    value={uvxPackage}
                    onChange={(e) => setUvxPackage(e.target.value)}
                    placeholder="mcp-server-git"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Arguments (optional)
                  </label>
                  <input
                    type="text"
                    value={uvxArgs}
                    onChange={(e) => setUvxArgs(e.target.value)}
                    placeholder="--repo /path/to/repo"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {sourceType === "docker" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Docker Image *
                  </label>
                  <input
                    type="text"
                    value={dockerImage}
                    onChange={(e) => setDockerImage(e.target.value)}
                    placeholder="mcp/server:latest"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Docker Arguments (optional)
                  </label>
                  <input
                    type="text"
                    value={dockerArgs}
                    onChange={(e) => setDockerArgs(e.target.value)}
                    placeholder="-v /host/path:/container/path"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {sourceType === "github" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Repository *
                  </label>
                  <input
                    type="text"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    placeholder="owner/repository"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Branch (optional)
                  </label>
                  <input
                    type="text"
                    value={githubBranch}
                    onChange={(e) => setGithubBranch(e.target.value)}
                    placeholder="main"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>

          {/* Environment variables */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Environment Variables
              </label>
              <button
                type="button"
                onClick={addEnvVar}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                + Add Variable
              </button>
            </div>
            {envVars.length > 0 ? (
              <div className="space-y-2">
                {envVars.map((envVar, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={envVar.key}
                      onChange={(e) => updateEnvVar(index, "key", e.target.value)}
                      placeholder="KEY"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="password"
                      value={envVar.value}
                      onChange={(e) => updateEnvVar(index, "value", e.target.value)}
                      placeholder="value"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => removeEnvVar(index)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No environment variables configured
              </p>
            )}
          </div>

          {/* Client selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable for Clients
              </label>
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  onClick={selectAllClients}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Select All
                </button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button
                  type="button"
                  onClick={deselectAllClients}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {detectedClients.map((client) => (
                <label
                  key={client.id}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedClients.includes(client.id)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(client.id)}
                    onChange={() => toggleClient(client.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {client.name}
                    </span>
                    {client.syncMode === "manualOnly" && (
                      <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">
                        (manual)
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
            {detectedClients.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No clients detected. The server will be added but not synced to any client.
              </p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isInstalling}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!isFormValid() || isInstalling}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isInstalling ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Adding...
              </>
            ) : (
              "Add Server"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
