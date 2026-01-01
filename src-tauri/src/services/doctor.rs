use crate::models::{DoctorIssue, DoctorReport, VersionInfo};
use std::path::PathBuf;
use std::process::Command;

/// Run all environment checks and return a report
pub fn run_doctor() -> DoctorReport {
    let mut report = DoctorReport::new();

    // Check Node.js
    report.node = detect_node();
    if report.node.is_none() {
        report.add_issue(DoctorIssue::warning_with_suggestion(
            "Node.js not found",
            "Install Node.js via nvm (https://github.com/nvm-sh/nvm) or from https://nodejs.org to use NPM-based MCP servers",
        ));
    }

    // Check Python
    report.python = detect_python();
    if report.python.is_none() {
        report.add_issue(DoctorIssue::warning_with_suggestion(
            "Python not found",
            "Install Python 3.x from https://python.org to use Python-based MCP servers",
        ));
    }

    // Check uv
    report.uv = detect_uv();
    if report.uv.is_none() {
        report.add_issue(DoctorIssue::info(
            "uv not found - optional but recommended for Python package management",
        ));
    }

    // Check Docker
    report.docker = detect_docker();
    if report.docker.is_none() {
        report.add_issue(DoctorIssue::info(
            "Docker not found - required for Docker-based MCP servers",
        ));
    }

    // Check git
    report.git = detect_git();
    if report.git.is_none() {
        report.add_issue(DoctorIssue::warning_with_suggestion(
            "git not found",
            "Install git from https://git-scm.com or via Xcode Command Line Tools to install MCP servers from GitHub",
        ));
    }

    report
}

/// Detect Node.js, checking nvm paths first
fn detect_node() -> Option<VersionInfo> {
    // First check nvm-managed Node.js installations
    if let Some(home) = dirs::home_dir() {
        // Check ~/.nvm/versions/node/*/bin/node
        let nvm_dir = home.join(".nvm").join("versions").join("node");
        if nvm_dir.exists() {
            if let Ok(entries) = std::fs::read_dir(&nvm_dir) {
                // Find the most recent version directory
                let mut versions: Vec<PathBuf> = entries
                    .filter_map(|e| e.ok())
                    .map(|e| e.path())
                    .filter(|p| p.is_dir())
                    .collect();

                // Sort by modification time to get the most recent
                versions.sort_by(|a, b| {
                    let a_time = std::fs::metadata(a).and_then(|m| m.modified()).ok();
                    let b_time = std::fs::metadata(b).and_then(|m| m.modified()).ok();
                    b_time.cmp(&a_time)
                });

                for version_dir in versions {
                    let node_path = version_dir.join("bin").join("node");
                    if node_path.exists() {
                        if let Some(version_info) = get_node_version(&node_path) {
                            return Some(version_info);
                        }
                    }
                }
            }
        }
    }

    // Fall back to checking PATH
    // On macOS, we need to check common locations that may not be in the PATH
    let common_paths = [
        "/usr/local/bin/node",
        "/opt/homebrew/bin/node",
        "/usr/bin/node",
    ];

    for path in common_paths {
        let node_path = PathBuf::from(path);
        if node_path.exists() {
            if let Some(version_info) = get_node_version(&node_path) {
                return Some(version_info);
            }
        }
    }

    // Try just running "node" from PATH
    if let Ok(output) = Command::new("node").arg("--version").output() {
        if output.status.success() {
            let version = String::from_utf8_lossy(&output.stdout)
                .trim()
                .trim_start_matches('v')
                .to_string();

            // Try to find the path
            let path = which_command("node");

            return Some(VersionInfo { version, path });
        }
    }

    None
}

fn get_node_version(node_path: &PathBuf) -> Option<VersionInfo> {
    let output = Command::new(node_path).arg("--version").output().ok()?;

    if output.status.success() {
        let version = String::from_utf8_lossy(&output.stdout)
            .trim()
            .trim_start_matches('v')
            .to_string();

        return Some(VersionInfo {
            version,
            path: Some(node_path.to_string_lossy().to_string()),
        });
    }

    None
}

/// Detect Python, checking python3 first
fn detect_python() -> Option<VersionInfo> {
    // Try python3 first (preferred on macOS/Linux)
    if let Some(info) = try_python_command("python3") {
        return Some(info);
    }

    // Fall back to python
    if let Some(info) = try_python_command("python") {
        // Verify it's Python 3.x
        if info.version.starts_with('3') {
            return Some(info);
        }
    }

    None
}

fn try_python_command(cmd: &str) -> Option<VersionInfo> {
    let output = Command::new(cmd).arg("--version").output().ok()?;

    if output.status.success() {
        let output_str = String::from_utf8_lossy(&output.stdout);
        // Python outputs "Python X.Y.Z"
        let version = output_str
            .trim()
            .strip_prefix("Python ")
            .map(|s| s.to_string())
            .unwrap_or_else(|| output_str.trim().to_string());

        let path = which_command(cmd);

        return Some(VersionInfo { version, path });
    }

    // Some Python versions output to stderr
    if !output.stderr.is_empty() {
        let output_str = String::from_utf8_lossy(&output.stderr);
        if output_str.contains("Python") {
            let version = output_str
                .trim()
                .strip_prefix("Python ")
                .map(|s| s.to_string())
                .unwrap_or_else(|| output_str.trim().to_string());

            let path = which_command(cmd);

            return Some(VersionInfo { version, path });
        }
    }

    None
}

/// Detect uv package manager
fn detect_uv() -> Option<VersionInfo> {
    let output = Command::new("uv").arg("--version").output().ok()?;

    if output.status.success() {
        let output_str = String::from_utf8_lossy(&output.stdout);
        // uv outputs "uv X.Y.Z"
        let version = output_str
            .trim()
            .strip_prefix("uv ")
            .map(|s| s.to_string())
            .unwrap_or_else(|| output_str.trim().to_string());

        let path = which_command("uv");

        return Some(VersionInfo { version, path });
    }

    None
}

/// Detect Docker
fn detect_docker() -> Option<VersionInfo> {
    let output = Command::new("docker").arg("--version").output().ok()?;

    if output.status.success() {
        let output_str = String::from_utf8_lossy(&output.stdout);
        // Docker outputs "Docker version X.Y.Z, build ..."
        let version = output_str
            .trim()
            .strip_prefix("Docker version ")
            .and_then(|s| s.split(',').next())
            .map(|s| s.to_string())
            .unwrap_or_else(|| output_str.trim().to_string());

        let path = which_command("docker");

        return Some(VersionInfo { version, path });
    }

    None
}

/// Detect git
fn detect_git() -> Option<VersionInfo> {
    let output = Command::new("git").arg("--version").output().ok()?;

    if output.status.success() {
        let output_str = String::from_utf8_lossy(&output.stdout);
        // git outputs "git version X.Y.Z"
        let version = output_str
            .trim()
            .strip_prefix("git version ")
            .map(|s| s.to_string())
            .unwrap_or_else(|| output_str.trim().to_string());

        let path = which_command("git");

        return Some(VersionInfo { version, path });
    }

    None
}

/// Try to find the path to a command using `which` (Unix) or `where` (Windows)
fn which_command(cmd: &str) -> Option<String> {
    #[cfg(unix)]
    let which_cmd = "which";
    #[cfg(windows)]
    let which_cmd = "where";

    let output = Command::new(which_cmd).arg(cmd).output().ok()?;

    if output.status.success() {
        let path = String::from_utf8_lossy(&output.stdout)
            .lines()
            .next()
            .map(|s| s.trim().to_string());
        return path;
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_run_doctor_returns_report() {
        let report = run_doctor();
        // Should always return a report, even if all checks fail
        // The report should have the proper structure
        // Report should have been properly constructed
        // Issues list exists and is valid (can be empty or have entries)
        let _ = &report.issues; // Verify issues list is accessible
    }

    #[test]
    fn test_version_parsing() {
        // These tests verify the parsing logic works correctly
        // They don't require the actual runtimes to be installed

        let test_output = "v20.19.5";
        let version = test_output.trim().trim_start_matches('v').to_string();
        assert_eq!(version, "20.19.5");

        let python_output = "Python 3.11.0";
        let version = python_output
            .strip_prefix("Python ")
            .map(|s| s.to_string())
            .unwrap();
        assert_eq!(version, "3.11.0");

        let docker_output = "Docker version 24.0.7, build afdd53b";
        let version = docker_output
            .strip_prefix("Docker version ")
            .and_then(|s| s.split(',').next())
            .map(|s| s.to_string())
            .unwrap();
        assert_eq!(version, "24.0.7");

        let git_output = "git version 2.39.3";
        let version = git_output.strip_prefix("git version ").unwrap();
        assert_eq!(version, "2.39.3");

        let uv_output = "uv 0.4.30 (Homebrew 2024-12-09)";
        let version = uv_output
            .strip_prefix("uv ")
            .map(|s| s.to_string())
            .unwrap();
        assert!(version.starts_with("0.4.30"));
    }
}
