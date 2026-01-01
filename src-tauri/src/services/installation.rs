use crate::models::{DoctorReport, McpServer, ServerSource, Transport};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Command;
use thiserror::Error;
use uuid::Uuid;

/// Errors that can occur during server installation
#[derive(Error, Debug)]
pub enum InstallationError {
    #[error("Missing required runtime: {0}. {1}")]
    MissingRuntime(String, String),
    #[error("Failed to validate local path: {0}")]
    InvalidLocalPath(String),
    #[error("Failed to clone repository: {0}")]
    GitCloneError(String),
    #[error("Failed to execute setup command: {0}")]
    SetupError(String),
    #[allow(dead_code)]
    #[error("Docker not available: {0}")]
    #[allow(dead_code)]
    DockerError(String),
    #[error("Invalid URL: {0}")]
    InvalidUrl(String),
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    #[error("Home directory not found")]
    HomeNotFound,
    #[allow(dead_code)]
    #[error("Failed to parse package info: {0}")]
    #[allow(dead_code)]
    ParseError(String),
}

/// Request to install a server
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallServerRequest {
    /// Display name for the server
    pub name: String,
    /// Optional description
    pub description: Option<String>,
    /// Source type for installation
    pub source: InstallSource,
    /// List of client IDs to enable this server for
    pub enabled_clients: Vec<String>,
    /// Optional source URL (repository, documentation, etc.)
    pub source_url: Option<String>,
    /// Environment variables for the server
    #[serde(default)]
    pub env: HashMap<String, String>,
}

/// Source type for installation request
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum InstallSource {
    /// NPM package
    Npm {
        package: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        version: Option<String>,
        /// Additional args to pass after the package name
        #[serde(default)]
        args: Vec<String>,
    },
    /// Python package via uvx
    Uvx {
        package: String,
        /// Additional args to pass after the package name
        #[serde(default)]
        args: Vec<String>,
    },
    /// Local file system path
    Local {
        path: String,
        /// Command to run (defaults to "node" for JS, "python" for Python)
        #[serde(skip_serializing_if = "Option::is_none")]
        command: Option<String>,
        /// Arguments to pass to the command
        #[serde(default)]
        args: Vec<String>,
    },
    /// GitHub repository
    Github {
        repo: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        branch: Option<String>,
        /// Command to run after cloning (e.g., "npm start")
        #[serde(skip_serializing_if = "Option::is_none")]
        run_command: Option<String>,
    },
    /// Docker image
    Docker {
        image: String,
        /// Additional docker run arguments
        #[serde(default)]
        docker_args: Vec<String>,
    },
    /// Remote SSE server (no local installation needed)
    Remote {
        url: String,
        /// Headers to send with SSE requests
        #[serde(default)]
        headers: HashMap<String, String>,
    },
}

/// Result of server installation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallResult {
    /// Whether installation succeeded
    pub success: bool,
    /// The installed server (if successful)
    pub server: Option<McpServer>,
    /// Error message (if failed)
    pub error: Option<String>,
    /// Warnings during installation
    pub warnings: Vec<String>,
}

/// Validate that required runtime is available for the install source
pub fn validate_runtime(
    source: &InstallSource,
    doctor_report: &DoctorReport,
) -> Result<(), InstallationError> {
    match source {
        InstallSource::Npm { .. } => {
            if doctor_report.node.is_none() {
                return Err(InstallationError::MissingRuntime(
                    "Node.js".to_string(),
                    "Install Node.js via nvm (https://github.com/nvm-sh/nvm) or from https://nodejs.org".to_string(),
                ));
            }
        }
        InstallSource::Uvx { .. } => {
            if doctor_report.uv.is_none() && doctor_report.python.is_none() {
                return Err(InstallationError::MissingRuntime(
                    "Python or uv".to_string(),
                    "Install Python from https://python.org or uv from https://github.com/astral-sh/uv".to_string(),
                ));
            }
        }
        InstallSource::Local { path, .. } => {
            let path_buf = PathBuf::from(path);
            if !path_buf.exists() {
                return Err(InstallationError::InvalidLocalPath(format!(
                    "Path does not exist: {}",
                    path
                )));
            }
        }
        InstallSource::Github { .. } => {
            if doctor_report.git.is_none() {
                return Err(InstallationError::MissingRuntime(
                    "git".to_string(),
                    "Install git from https://git-scm.com or via Xcode Command Line Tools"
                        .to_string(),
                ));
            }
        }
        InstallSource::Docker { .. } => {
            if doctor_report.docker.is_none() {
                return Err(InstallationError::MissingRuntime(
                    "Docker".to_string(),
                    "Install Docker from https://docker.com".to_string(),
                ));
            }
        }
        InstallSource::Remote { url, .. } => {
            // Validate URL format
            if !url.starts_with("http://") && !url.starts_with("https://") {
                return Err(InstallationError::InvalidUrl(format!(
                    "URL must start with http:// or https://: {}",
                    url
                )));
            }
        }
    }
    Ok(())
}

/// Get the repos directory for GitHub clones
pub fn get_repos_dir() -> Result<PathBuf, InstallationError> {
    let home = dirs::home_dir().ok_or(InstallationError::HomeNotFound)?;
    Ok(home.join(".mcp-nexus").join("repos"))
}

/// Clone a GitHub repository
pub fn clone_github_repo(repo: &str, branch: Option<&str>) -> Result<PathBuf, InstallationError> {
    let repos_dir = get_repos_dir()?;
    std::fs::create_dir_all(&repos_dir)?;

    // Extract repo name from URL or owner/repo format
    let repo_name = repo
        .trim_end_matches('/')
        .split('/')
        .next_back()
        .unwrap_or("unknown")
        .trim_end_matches(".git");

    let target_dir = repos_dir.join(repo_name);

    // If directory exists, update it instead of cloning
    if target_dir.exists() {
        // Try to pull latest changes
        let mut cmd = Command::new("git");
        cmd.current_dir(&target_dir).arg("pull");

        let output = cmd.output()?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(InstallationError::GitCloneError(format!(
                "Failed to update repository: {}",
                stderr
            )));
        }
    } else {
        // Build the clone URL
        let clone_url = if repo.starts_with("http://")
            || repo.starts_with("https://")
            || repo.starts_with("git@")
        {
            repo.to_string()
        } else {
            format!("https://github.com/{}.git", repo)
        };

        let mut cmd = Command::new("git");
        cmd.arg("clone");

        if let Some(b) = branch {
            cmd.arg("--branch").arg(b);
        }

        cmd.arg("--depth").arg("1"); // Shallow clone for faster download
        cmd.arg(&clone_url).arg(&target_dir);

        let output = cmd.output()?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(InstallationError::GitCloneError(format!(
                "Failed to clone repository: {}",
                stderr
            )));
        }
    }

    Ok(target_dir)
}

/// Run setup commands for a cloned repository
pub fn run_repo_setup(repo_dir: &PathBuf) -> Result<(), InstallationError> {
    // Check for package.json (Node.js project)
    let package_json = repo_dir.join("package.json");
    if package_json.exists() {
        // Check for package-lock.json or yarn.lock to determine package manager
        let has_yarn_lock = repo_dir.join("yarn.lock").exists();
        let has_pnpm_lock = repo_dir.join("pnpm-lock.yaml").exists();

        let (cmd_name, install_arg) = if has_pnpm_lock {
            ("pnpm", "install")
        } else if has_yarn_lock {
            ("yarn", "install")
        } else {
            ("npm", "install")
        };

        let output = Command::new(cmd_name)
            .current_dir(repo_dir)
            .arg(install_arg)
            .output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(InstallationError::SetupError(format!(
                "{} install failed: {}",
                cmd_name, stderr
            )));
        }

        return Ok(());
    }

    // Check for pyproject.toml or requirements.txt (Python project)
    let pyproject = repo_dir.join("pyproject.toml");
    let requirements = repo_dir.join("requirements.txt");

    if pyproject.exists() {
        // Use uv if available, otherwise pip
        let output = Command::new("uv")
            .current_dir(repo_dir)
            .args(["pip", "install", "-e", "."])
            .output();

        match output {
            Ok(out) if out.status.success() => return Ok(()),
            _ => {
                // Fall back to pip
                let output = Command::new("pip")
                    .current_dir(repo_dir)
                    .args(["install", "-e", "."])
                    .output()?;

                if !output.status.success() {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    return Err(InstallationError::SetupError(format!(
                        "pip install failed: {}",
                        stderr
                    )));
                }
            }
        }
    } else if requirements.exists() {
        let output = Command::new("pip")
            .current_dir(repo_dir)
            .args(["install", "-r", "requirements.txt"])
            .output()?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(InstallationError::SetupError(format!(
                "pip install failed: {}",
                stderr
            )));
        }
    }

    Ok(())
}

/// Build the transport configuration for a server based on its source
pub fn build_transport(source: &InstallSource, env: &HashMap<String, String>) -> Transport {
    match source {
        InstallSource::Npm { package, args, .. } => {
            let mut cmd_args = vec!["-y".to_string(), package.clone()];
            cmd_args.extend(args.clone());

            Transport::Stdio {
                command: "npx".to_string(),
                args: cmd_args,
                env: env.clone(),
            }
        }
        InstallSource::Uvx { package, args } => {
            let mut cmd_args = vec![package.clone()];
            cmd_args.extend(args.clone());

            Transport::Stdio {
                command: "uvx".to_string(),
                args: cmd_args,
                env: env.clone(),
            }
        }
        InstallSource::Local {
            path,
            command,
            args,
        } => {
            let cmd = command.clone().unwrap_or_else(|| {
                // Try to detect command based on file extension
                if path.ends_with(".py") {
                    "python3".to_string()
                } else if path.ends_with(".js") || path.ends_with(".mjs") {
                    "node".to_string()
                } else {
                    // Assume it's an executable
                    path.clone()
                }
            });

            let cmd_args = if command.is_some()
                || path.ends_with(".py")
                || path.ends_with(".js")
                || path.ends_with(".mjs")
            {
                let mut a = vec![path.clone()];
                a.extend(args.clone());
                a
            } else {
                args.clone()
            };

            Transport::Stdio {
                command: cmd,
                args: cmd_args,
                env: env.clone(),
            }
        }
        InstallSource::Github {
            repo, run_command, ..
        } => {
            // Get the repo directory
            let repos_dir = get_repos_dir().unwrap_or_else(|_| PathBuf::from("~/.mcp-nexus/repos"));
            let repo_name = repo
                .trim_end_matches('/')
                .split('/')
                .next_back()
                .unwrap_or("unknown")
                .trim_end_matches(".git");
            let repo_dir = repos_dir.join(repo_name);

            if let Some(cmd) = run_command {
                // Parse the run command
                let parts: Vec<&str> = cmd.split_whitespace().collect();
                if let Some((cmd_name, args)) = parts.split_first() {
                    Transport::Stdio {
                        command: cmd_name.to_string(),
                        args: args.iter().map(|s| s.to_string()).collect(),
                        env: {
                            let mut e = env.clone();
                            e.insert(
                                "MCP_SERVER_DIR".to_string(),
                                repo_dir.to_string_lossy().to_string(),
                            );
                            e
                        },
                    }
                } else {
                    Transport::Stdio {
                        command: "node".to_string(),
                        args: vec!["index.js".to_string()],
                        env: env.clone(),
                    }
                }
            } else {
                // Default: try node index.js
                Transport::Stdio {
                    command: "node".to_string(),
                    args: vec![repo_dir.join("index.js").to_string_lossy().to_string()],
                    env: env.clone(),
                }
            }
        }
        InstallSource::Docker { image, docker_args } => {
            let mut args = vec!["run".to_string(), "-i".to_string(), "--rm".to_string()];
            args.extend(docker_args.clone());
            args.push(image.clone());

            Transport::Stdio {
                command: "docker".to_string(),
                args,
                env: env.clone(),
            }
        }
        InstallSource::Remote { url, headers } => Transport::Sse {
            url: url.clone(),
            headers: headers.clone(),
        },
    }
}

/// Build the ServerSource from InstallSource
pub fn build_server_source(source: &InstallSource) -> ServerSource {
    match source {
        InstallSource::Npm {
            package, version, ..
        } => ServerSource::Npm {
            package: package.clone(),
            version: version.clone(),
        },
        InstallSource::Uvx { package, .. } => ServerSource::Uvx {
            package: package.clone(),
        },
        InstallSource::Local { path, .. } => ServerSource::Local { path: path.clone() },
        InstallSource::Github { repo, branch, .. } => ServerSource::Github {
            repo: repo.clone(),
            branch: branch.clone(),
        },
        InstallSource::Docker { image, .. } => ServerSource::Docker {
            image: image.clone(),
        },
        InstallSource::Remote { url, .. } => ServerSource::Remote { url: url.clone() },
    }
}

/// Install a server and return the McpServer object
pub fn install_server(
    request: &InstallServerRequest,
    doctor_report: &DoctorReport,
) -> Result<McpServer, InstallationError> {
    // Validate runtime requirements
    validate_runtime(&request.source, doctor_report)?;

    // For GitHub sources, clone the repository
    if let InstallSource::Github { repo, branch, .. } = &request.source {
        let repo_dir = clone_github_repo(repo, branch.as_deref())?;
        run_repo_setup(&repo_dir)?;
    }

    // Build transport and source
    let transport = build_transport(&request.source, &request.env);
    let source = build_server_source(&request.source);

    // Create the server
    let now = chrono::Utc::now().to_rfc3339();
    let mut server = McpServer {
        id: Uuid::new_v4(),
        name: request.name.clone(),
        description: request.description.clone(),
        source,
        transport,
        enabled: true,
        enabled_clients: request.enabled_clients.clone(),
        installed_at: now.clone(),
        updated_at: now,
        installed_version: extract_version(&request.source),
        source_url: request.source_url.clone(),
        tags: vec![],
    };

    // Enable for specified clients
    for client_id in &request.enabled_clients {
        server.enable_for_client(client_id);
    }

    Ok(server)
}

/// Extract version from install source if available
fn extract_version(source: &InstallSource) -> Option<String> {
    match source {
        InstallSource::Npm { version, .. } => version.clone(),
        _ => None,
    }
}

/// Cleanup resources when uninstalling a server
pub fn cleanup_server(server: &McpServer) -> Result<(), InstallationError> {
    // For GitHub sources, optionally remove the cloned repository
    if let ServerSource::Github { repo, .. } = &server.source {
        let repos_dir = get_repos_dir()?;
        let repo_name = repo
            .trim_end_matches('/')
            .split('/')
            .next_back()
            .unwrap_or("unknown")
            .trim_end_matches(".git");
        let repo_dir = repos_dir.join(repo_name);

        if repo_dir.exists() {
            // Only remove if it's in our managed repos directory
            if repo_dir.starts_with(&repos_dir) {
                std::fs::remove_dir_all(&repo_dir)?;
            }
        }
    }

    // For Docker images, we don't remove the image as it might be used elsewhere
    // The user can run `docker image prune` if they want to clean up

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::doctor::run_doctor;

    #[test]
    fn test_build_transport_npm() {
        let source = InstallSource::Npm {
            package: "@modelcontextprotocol/server-filesystem".to_string(),
            version: Some("1.0.0".to_string()),
            args: vec!["/tmp".to_string()],
        };
        let env = HashMap::new();

        let transport = build_transport(&source, &env);

        match transport {
            Transport::Stdio { command, args, .. } => {
                assert_eq!(command, "npx");
                assert!(args.contains(&"-y".to_string()));
                assert!(args.contains(&"@modelcontextprotocol/server-filesystem".to_string()));
                assert!(args.contains(&"/tmp".to_string()));
            }
            _ => panic!("Expected Stdio transport"),
        }
    }

    #[test]
    fn test_build_transport_uvx() {
        let source = InstallSource::Uvx {
            package: "mcp-server-git".to_string(),
            args: vec!["--repo".to_string(), "/path/to/repo".to_string()],
        };
        let env = HashMap::new();

        let transport = build_transport(&source, &env);

        match transport {
            Transport::Stdio { command, args, .. } => {
                assert_eq!(command, "uvx");
                assert!(args.contains(&"mcp-server-git".to_string()));
                assert!(args.contains(&"--repo".to_string()));
            }
            _ => panic!("Expected Stdio transport"),
        }
    }

    #[test]
    fn test_build_transport_local() {
        let source = InstallSource::Local {
            path: "/path/to/server.js".to_string(),
            command: None,
            args: vec!["--port".to_string(), "3000".to_string()],
        };
        let env = HashMap::new();

        let transport = build_transport(&source, &env);

        match transport {
            Transport::Stdio { command, args, .. } => {
                assert_eq!(command, "node");
                assert!(args.contains(&"/path/to/server.js".to_string()));
                assert!(args.contains(&"--port".to_string()));
            }
            _ => panic!("Expected Stdio transport"),
        }
    }

    #[test]
    fn test_build_transport_local_python() {
        let source = InstallSource::Local {
            path: "/path/to/server.py".to_string(),
            command: None,
            args: vec![],
        };
        let env = HashMap::new();

        let transport = build_transport(&source, &env);

        match transport {
            Transport::Stdio { command, args, .. } => {
                assert_eq!(command, "python3");
                assert!(args.contains(&"/path/to/server.py".to_string()));
            }
            _ => panic!("Expected Stdio transport"),
        }
    }

    #[test]
    fn test_build_transport_docker() {
        let source = InstallSource::Docker {
            image: "mcp/filesystem:latest".to_string(),
            docker_args: vec!["-v".to_string(), "/tmp:/data".to_string()],
        };
        let env = HashMap::new();

        let transport = build_transport(&source, &env);

        match transport {
            Transport::Stdio { command, args, .. } => {
                assert_eq!(command, "docker");
                assert!(args.contains(&"run".to_string()));
                assert!(args.contains(&"-i".to_string()));
                assert!(args.contains(&"--rm".to_string()));
                assert!(args.contains(&"-v".to_string()));
                assert!(args.contains(&"/tmp:/data".to_string()));
                assert!(args.contains(&"mcp/filesystem:latest".to_string()));
            }
            _ => panic!("Expected Stdio transport"),
        }
    }

    #[test]
    fn test_build_transport_remote() {
        let mut headers = HashMap::new();
        headers.insert("Authorization".to_string(), "Bearer token123".to_string());

        let source = InstallSource::Remote {
            url: "https://api.example.com/mcp".to_string(),
            headers: headers.clone(),
        };
        let env = HashMap::new();

        let transport = build_transport(&source, &env);

        match transport {
            Transport::Sse { url, headers: h } => {
                assert_eq!(url, "https://api.example.com/mcp");
                assert_eq!(h.get("Authorization").unwrap(), "Bearer token123");
            }
            _ => panic!("Expected Sse transport"),
        }
    }

    #[test]
    fn test_build_server_source() {
        let npm_source = InstallSource::Npm {
            package: "@test/pkg".to_string(),
            version: Some("1.0.0".to_string()),
            args: vec![],
        };

        let server_source = build_server_source(&npm_source);

        match server_source {
            ServerSource::Npm { package, version } => {
                assert_eq!(package, "@test/pkg");
                assert_eq!(version, Some("1.0.0".to_string()));
            }
            _ => panic!("Expected Npm source"),
        }
    }

    #[test]
    fn test_validate_runtime_remote() {
        let source = InstallSource::Remote {
            url: "https://api.example.com/mcp".to_string(),
            headers: HashMap::new(),
        };

        let report = run_doctor();

        // Remote sources should always validate (no runtime needed)
        assert!(validate_runtime(&source, &report).is_ok());
    }

    #[test]
    fn test_validate_runtime_invalid_url() {
        let source = InstallSource::Remote {
            url: "not-a-valid-url".to_string(),
            headers: HashMap::new(),
        };

        let report = run_doctor();

        let result = validate_runtime(&source, &report);
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("URL must start with"));
    }

    #[test]
    fn test_validate_runtime_invalid_local_path() {
        let source = InstallSource::Local {
            path: "/nonexistent/path/to/server.js".to_string(),
            command: None,
            args: vec![],
        };

        let report = run_doctor();

        let result = validate_runtime(&source, &report);
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("Path does not exist"));
    }

    #[test]
    fn test_extract_version() {
        let npm_source = InstallSource::Npm {
            package: "@test/pkg".to_string(),
            version: Some("2.0.0".to_string()),
            args: vec![],
        };

        assert_eq!(extract_version(&npm_source), Some("2.0.0".to_string()));

        let uvx_source = InstallSource::Uvx {
            package: "test".to_string(),
            args: vec![],
        };

        assert_eq!(extract_version(&uvx_source), None);
    }

    #[test]
    fn test_get_repos_dir() {
        let result = get_repos_dir();
        assert!(result.is_ok());

        let path = result.unwrap();
        assert!(path.to_string_lossy().contains(".mcp-nexus"));
        assert!(path.to_string_lossy().contains("repos"));
    }

    #[test]
    fn test_install_request_serialization() {
        let request = InstallServerRequest {
            name: "test-server".to_string(),
            description: Some("A test server".to_string()),
            source: InstallSource::Npm {
                package: "@test/server".to_string(),
                version: Some("1.0.0".to_string()),
                args: vec!["--arg1".to_string()],
            },
            enabled_clients: vec!["claude-code".to_string(), "cursor".to_string()],
            source_url: Some("https://github.com/test/server".to_string()),
            env: HashMap::from([("API_KEY".to_string(), "secret".to_string())]),
        };

        let json = serde_json::to_string(&request).unwrap();
        let parsed: InstallServerRequest = serde_json::from_str(&json).unwrap();

        assert_eq!(parsed.name, "test-server");
        assert_eq!(parsed.enabled_clients.len(), 2);
    }

    #[test]
    fn test_install_result_serialization() {
        let result = InstallResult {
            success: true,
            server: None,
            error: None,
            warnings: vec!["Some warning".to_string()],
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"success\":true"));
        assert!(json.contains("\"warnings\""));
    }
}
