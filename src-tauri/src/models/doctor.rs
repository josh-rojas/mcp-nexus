use serde::{Deserialize, Serialize};

/// Version information for a detected runtime
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VersionInfo {
    /// The version string (e.g., "20.19.5", "3.11.0")
    pub version: String,
    /// The path to the executable, if known
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
}

/// Severity level for doctor issues
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum IssueSeverity {
    /// Critical issue that will prevent functionality
    Error,
    /// Issue that may cause problems
    Warning,
    /// Informational message
    Info,
}

/// An issue detected by the doctor check
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DoctorIssue {
    /// Severity of the issue
    pub severity: IssueSeverity,
    /// Description of the issue
    pub message: String,
    /// Suggested action to resolve the issue
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suggestion: Option<String>,
}

impl DoctorIssue {
    #[allow(dead_code)]
    pub fn error(message: impl Into<String>) -> Self {
        Self {
            severity: IssueSeverity::Error,
            message: message.into(),
            suggestion: None,
        }
    }

    #[allow(dead_code)]
    pub fn error_with_suggestion(message: impl Into<String>, suggestion: impl Into<String>) -> Self {
        Self {
            severity: IssueSeverity::Error,
            message: message.into(),
            suggestion: Some(suggestion.into()),
        }
    }

    #[allow(dead_code)]
    pub fn warning(message: impl Into<String>) -> Self {
        Self {
            severity: IssueSeverity::Warning,
            message: message.into(),
            suggestion: None,
        }
    }

    pub fn warning_with_suggestion(message: impl Into<String>, suggestion: impl Into<String>) -> Self {
        Self {
            severity: IssueSeverity::Warning,
            message: message.into(),
            suggestion: Some(suggestion.into()),
        }
    }

    pub fn info(message: impl Into<String>) -> Self {
        Self {
            severity: IssueSeverity::Info,
            message: message.into(),
            suggestion: None,
        }
    }
}

/// Result of the doctor check
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DoctorReport {
    /// Detected Node.js version
    #[serde(skip_serializing_if = "Option::is_none")]
    pub node: Option<VersionInfo>,
    /// Detected Python version
    #[serde(skip_serializing_if = "Option::is_none")]
    pub python: Option<VersionInfo>,
    /// Detected uv version
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uv: Option<VersionInfo>,
    /// Detected Docker version
    #[serde(skip_serializing_if = "Option::is_none")]
    pub docker: Option<VersionInfo>,
    /// Detected git version
    #[serde(skip_serializing_if = "Option::is_none")]
    pub git: Option<VersionInfo>,
    /// Issues found during the check
    pub issues: Vec<DoctorIssue>,
}

impl DoctorReport {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add_issue(&mut self, issue: DoctorIssue) {
        self.issues.push(issue);
    }

    /// Check if there are any error-level issues
    #[allow(dead_code)]
    pub fn has_errors(&self) -> bool {
        self.issues.iter().any(|i| i.severity == IssueSeverity::Error)
    }

    /// Check if there are any warning-level issues
    #[allow(dead_code)]
    pub fn has_warnings(&self) -> bool {
        self.issues.iter().any(|i| i.severity == IssueSeverity::Warning)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_doctor_report_serialization() {
        let mut report = DoctorReport::new();
        report.node = Some(VersionInfo {
            version: "20.19.5".to_string(),
            path: Some("/usr/local/bin/node".to_string()),
        });
        report.add_issue(DoctorIssue::warning_with_suggestion(
            "Python not found",
            "Install Python 3.x to use Python-based MCP servers",
        ));

        let json = serde_json::to_string_pretty(&report).unwrap();
        assert!(json.contains("\"node\""));
        assert!(json.contains("20.19.5"));
        assert!(json.contains("warning"));
    }

    #[test]
    fn test_issue_helpers() {
        let error = DoctorIssue::error("Something broke");
        assert_eq!(error.severity, IssueSeverity::Error);
        assert!(error.suggestion.is_none());

        let warning_with_suggestion = DoctorIssue::warning_with_suggestion(
            "Missing runtime",
            "Install the runtime",
        );
        assert_eq!(warning_with_suggestion.severity, IssueSeverity::Warning);
        assert!(warning_with_suggestion.suggestion.is_some());
    }

    #[test]
    fn test_has_errors_and_warnings() {
        let mut report = DoctorReport::new();
        assert!(!report.has_errors());
        assert!(!report.has_warnings());

        report.add_issue(DoctorIssue::info("Info message"));
        assert!(!report.has_errors());
        assert!(!report.has_warnings());

        report.add_issue(DoctorIssue::warning("Warning message"));
        assert!(!report.has_errors());
        assert!(report.has_warnings());

        report.add_issue(DoctorIssue::error("Error message"));
        assert!(report.has_errors());
        assert!(report.has_warnings());
    }
}
