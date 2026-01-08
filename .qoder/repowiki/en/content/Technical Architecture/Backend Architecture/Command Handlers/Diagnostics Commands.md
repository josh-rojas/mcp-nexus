# Diagnostics Commands

<cite>
**Referenced Files in This Document**   
- [doctor.rs](file://src-tauri/src/commands/doctor.rs)
- [doctor.rs](file://src-tauri/src/models/doctor.rs)
- [useDoctor.ts](file://src/hooks/useDoctor.ts)
- [EnvironmentSummary.tsx](file://src/components/dashboard/EnvironmentSummary.tsx)
- [FirstRunWelcome.tsx](file://src/components/dashboard/FirstRunWelcome.tsx)
- [HealthIndicator.tsx](file://src/components/common/HealthIndicator.tsx)
- [tauri.ts](file://src/lib/tauri.ts)
- [index.ts](file://src/types/index.ts)
</cite>

## Table of Contents

1. [Introduction](#introduction)
2. [Core Diagnostic Functions](#core-diagnostic-functions)
3. [Doctor Service Architecture](#doctor-service-architecture)
4. [Inspection Process](#inspection-process)
5. [Frontend Integration](#frontend-integration)
6. [System Readiness Assessment](#system-readiness-assessment)
7. [Privacy Considerations](#privacy-considerations)
8. [Troubleshooting Workflows](#troubleshooting-workflows)
9. [Interpreting Diagnostic Results](#interpreting-diagnostic-results)

## Introduction

The diagnostics command handlers in MCP Nexus provide a comprehensive environment inspection system that analyzes the local development environment for required runtimes and dependencies. The system centers around the Doctor service, which performs automated checks and generates detailed reports about the system's readiness for MCP server management. This documentation details the `run_diagnostics` and `get_system_info` functions, their integration with frontend components, and their role in ensuring a functional development environment.

## Core Diagnostic Functions

The diagnostics functionality is implemented through two primary functions: `run_doctor` (the backend command) and `runDoctor` (the frontend API). These functions work together to analyze the local environment and return structured diagnostic information.

```mermaid
sequenceDiagram
participant Frontend as Frontend (React)
participant Tauri as Tauri Bridge
participant Backend as Rust Backend
Frontend->>Tauri : runDoctor()
Tauri->>Backend : invoke("run_doctor")
Backend->>Backend : run_doctor_service()
Backend->>Backend : detect_node(), detect_python(), etc.
Backend-->>Tauri : DoctorReport
Tauri-->>Frontend : Promise<DoctorReport>
```

**Section sources**

- [doctor.rs](file://src-tauri/src/commands/doctor.rs#L4-L8)
- [tauri.ts](file://src/lib/tauri.ts#L146-L148)

### run_diagnostics Function

The `run_diagnostics` function (exposed as `run_doctor` in Rust and `runDoctor` in TypeScript) is the primary diagnostic command that performs comprehensive environment inspection.

**Parameters**: This function does not accept parameters, as it performs a standardized inspection of the development environment.

**Return Type**: The function returns a `DoctorReport` object containing:

- Detected runtime versions (Node.js, Python, uv, Docker, git)
- A list of `DoctorIssue` objects identifying problems and recommendations
- Comprehensive system environment details

**Error Cases**: The function itself does not throw errors but returns a complete report even when inspection fails for specific components. Individual inspection failures are represented as `DoctorIssue` entries in the report.

```mermaid
classDiagram
class DoctorReport {
+node : VersionInfo | null
+python : VersionInfo | null
+uv : VersionInfo | null
+docker : VersionInfo | null
+git : VersionInfo | null
+issues : DoctorIssue[]
+add_issue(issue : DoctorIssue) : void
+has_errors() : boolean
+has_warnings() : boolean
}
class VersionInfo {
+version : string
+path : string | null
}
class DoctorIssue {
+severity : IssueSeverity
+message : string
+suggestion : string | null
}
class IssueSeverity {
<<enumeration>>
Error
Warning
Info
}
DoctorReport --> VersionInfo : "has"
DoctorReport --> DoctorIssue : "contains"
DoctorIssue --> IssueSeverity : "has"
```

**Diagram sources**

- [doctor.rs](file://src-tauri/src/models/doctor.rs#L85-L105)
- [doctor.rs](file://src-tauri/src/models/doctor.rs#L3-12)
- [doctor.rs](file://src-tauri/src/models/doctor.rs#L15-L24)
- [doctor.rs](file://src-tauri/src/models/doctor.rs#L27-L37)

**Section sources**

- [doctor.rs](file://src-tauri/src/commands/doctor.rs#L4-L8)
- [doctor.rs](file://src-tauri/src/services/doctor.rs#L5-L52)
- [index.ts](file://src/types/index.ts#L134-L141)

## Doctor Service Architecture

The Doctor service follows a layered architecture that separates command handling, business logic, and data modeling. This design enables clean integration between the frontend and backend while maintaining comprehensive diagnostic capabilities.

```mermaid
graph TB
subgraph Frontend
A[useDoctor Hook]
B[EnvironmentSummary]
C[FirstRunWelcome]
end
subgraph TauriBridge
D[Tauri invoke]
end
subgraph Backend
E[run_doctor Command]
F[run_doctor_service]
G[Runtime Detectors]
end
A --> D
B --> A
C --> A
D --> E
E --> F
F --> G
G --> F
F --> E
style A fill:#f9f,stroke:#333
style B fill:#f9f,stroke:#333
style C fill:#f9f,stroke:#333
style D fill:#bbf,stroke:#333
style E fill:#ff9,stroke:#333
style F fill:#ff9,stroke:#333
style G fill:#ff9,stroke:#333
```

**Diagram sources**

- [doctor.rs](file://src-tauri/src/commands/doctor.rs)
- [doctor.rs](file://src-tauri/src/services/doctor.rs)
- [useDoctor.ts](file://src/hooks/useDoctor.ts)
- [EnvironmentSummary.tsx](file://src/components/dashboard/EnvironmentSummary.tsx)

**Section sources**

- [doctor.rs](file://src-tauri/src/commands/doctor.rs#L1-L8)
- [doctor.rs](file://src-tauri/src/services/doctor.rs#L1-L52)
- [useDoctor.ts](file://src/hooks/useDoctor.ts#L1-L38)

### Runtime Detection Strategy

The Doctor service employs a sophisticated detection strategy for each runtime, prioritizing common installation methods and paths. For Node.js, it first checks nvm-managed installations before falling back to system PATH and common installation locations.

```mermaid
flowchart TD
Start([Detect Node.js]) --> CheckNVM["Check ~/.nvm/versions/node/*/bin/node"]
CheckNVM --> Exists1{Exists?}
Exists1 --> |Yes| GetVersion1["Get version from most recent directory"]
Exists1 --> |No| CheckCommonPaths["Check /usr/local/bin/node, /opt/homebrew/bin/node, /usr/bin/node"]
CheckCommonPaths --> Exists2{Exists?}
Exists2 --> |Yes| GetVersion2["Get version from found path"]
Exists2 --> |No| CheckPATH["Run 'node --version' from PATH"]
CheckPATH --> Exists3{Success?}
Exists3 --> |Yes| ExtractVersion["Extract version and path"]
Exists3 --> |No| ReturnNull["Return null"]
GetVersion1 --> ReturnVersion
GetVersion2 --> ReturnVersion
ExtractVersion --> ReturnVersion
ReturnVersion([Return VersionInfo]) --> End
ReturnNull --> End
```

**Diagram sources**

- [doctor.rs](file://src-tauri/src/services/doctor.rs#L55-L121)

**Section sources**

- [doctor.rs](file://src-tauri/src/services/doctor.rs#L55-L121)

## Inspection Process

The inspection process systematically checks for required runtimes and dependencies, providing detailed information about their availability and version. The process is designed to be comprehensive yet efficient, with specific detection logic for each runtime.

### Runtime Inspection Details

The Doctor service inspects the following key components of the development environment:

**Node.js Inspection**: The service first checks for nvm-managed Node.js installations in the user's home directory, then falls back to common installation paths and finally attempts to execute `node --version` from the system PATH. This multi-layered approach ensures detection across different installation methods.

**Python Inspection**: The service attempts to detect Python by first trying `python3` (preferred on macOS/Linux) and then falling back to `python`. It verifies that the detected version is Python 3.x, as Python 2.x is not supported.

**uv Inspection**: The uv package manager is checked by running `uv --version`. While not required, its presence is recommended for Python package management.

**Docker Inspection**: Docker is detected by running `docker --version`. This is required for Docker-based MCP servers.

**git Inspection**: git is detected by running `git --version`. This is required for installing MCP servers from GitHub repositories.

```mermaid
flowchart TD
A[Run Doctor Check] --> B[Check Node.js]
B --> C{Found?}
C --> |No| D[Add Warning: Install Node.js]
C --> |Yes| E[Record Version and Path]
A --> F[Check Python]
F --> G{Found?}
G --> |No| H[Add Warning: Install Python 3.x]
G --> |Yes| I[Record Version and Path]
A --> J[Check uv]
J --> K{Found?}
K --> |No| L[Add Info: uv recommended]
K --> |Yes| M[Record Version and Path]
A --> N[Check Docker]
N --> O{Found?}
O --> |No| P[Add Info: Required for Docker servers]
O --> |Yes| Q[Record Version and Path]
A --> R[Check git]
R --> S{Found?}
S --> |No| T[Add Warning: Install git]
S --> |Yes| U[Record Version and Path]
A --> V[Return DoctorReport]
```

**Diagram sources**

- [doctor.rs](file://src-tauri/src/services/doctor.rs#L6-L52)

**Section sources**

- [doctor.rs](file://src-tauri/src/services/doctor.rs#L6-L52)

## Frontend Integration

The diagnostic functions are integrated into the frontend through the `useDoctor` hook, which provides a clean API for components to access diagnostic information and trigger environment checks.

### useDoctor Hook

The `useDoctor` hook manages the state and lifecycle of diagnostic checks, providing a consistent interface for components to access diagnostic information.

```mermaid
classDiagram
class UseDoctorResult {
+report : DoctorReport | null
+isLoading : boolean
+error : string | null
+refresh : () => Promise<void>
+hasChecked : boolean
}
class useDoctor {
+autoCheck : boolean
+refresh() : Promise<void>
+report : DoctorReport | null
+isLoading : boolean
+error : string | null
+hasChecked : boolean
}
useDoctor --> UseDoctorResult : "returns"
```

**Diagram sources**

- [useDoctor.ts](file://src/hooks/useDoctor.ts#L5-L11)

**Section sources**

- [useDoctor.ts](file://src/hooks/useDoctor.ts#L1-L57)

### FirstRunWelcome Integration

The `FirstRunWelcome` component uses the diagnostic system to guide users through the initial setup process, though it does not directly call the doctor service. Instead, it relies on client detection to identify existing MCP servers.

```mermaid
sequenceDiagram
participant FirstRunWelcome
participant useDetectedClients
participant useImportClientServers
FirstRunWelcome->>useDetectedClients : Fetch detected clients
useDetectedClients-->>FirstRunWelcome : Return clients with servers
FirstRunWelcome->>User : Display import options
User->>FirstRunWelcome : Select clients to import
FirstRunWelcome->>useImportClientServers : Import selected servers
useImportClientServers-->>FirstRunWelcome : Import complete
```

**Diagram sources**

- [FirstRunWelcome.tsx](file://src/components/dashboard/FirstRunWelcome.tsx)

**Section sources**

- [FirstRunWelcome.tsx](file://src/components/dashboard/FirstRunWelcome.tsx)

## System Readiness Assessment

The diagnostic system integrates with the `EnvironmentSummary` and `HealthIndicator` components to provide visual feedback on system readiness, transforming raw diagnostic data into actionable insights.

### EnvironmentSummary Component

The `EnvironmentSummary` component displays a high-level overview of the system's health based on the diagnostic report, using visual indicators to communicate status.

```mermaid
flowchart TD
A[EnvironmentSummary] --> B[useDoctor(true)]
B --> C{Report Available?}
C --> |No| D[Display Loading/Not Checked]
C --> |Yes| E[Count Errors and Warnings]
E --> F{Errors > 0?}
F --> |Yes| G[Display Error Count in Red]
F --> |No| H{Warnings > 0?}
H --> |Yes| I[Display Warning Count in Amber]
H --> |No| J[Display OK in Green]
G --> K[Show Run Doctor Button]
I --> K
J --> K
K --> L[User Clicks Button]
L --> M[refresh() called]
M --> B
```

**Diagram sources**

- [EnvironmentSummary.tsx](file://src/components/dashboard/EnvironmentSummary.tsx)

**Section sources**

- [EnvironmentSummary.tsx](file://src/components/dashboard/EnvironmentSummary.tsx)

### HealthIndicator Component

The `HealthIndicator` component provides a reusable visual indicator for system health, used throughout the application to display status information.

```mermaid
classDiagram
class HealthIndicator {
+status : HealthStatus
+message? : string
+responseTimeMs? : number
+className? : string
}
class HealthStatus {
<<enumeration>>
healthy
unhealthy
running
stopped
unknown
}
HealthIndicator --> HealthStatus : "uses"
```

**Diagram sources**

- [HealthIndicator.tsx](file://src/components/common/HealthIndicator.tsx#L4-L29)

**Section sources**

- [HealthIndicator.tsx](file://src/components/common/HealthIndicator.tsx#L1-L84)

## Privacy Considerations

The diagnostic system is designed with privacy in mind, collecting only essential information about the local development environment without transmitting sensitive data externally.

The collected information is limited to:

- Runtime names and version numbers
- Executable paths (when available)
- General system capability information

No personal data, project-specific information, or sensitive system details are collected or transmitted. All diagnostic processing occurs locally within the application, and the diagnostic report is not sent to any external servers unless explicitly initiated by the user for support purposes.

**Section sources**

- [doctor.rs](file://src-tauri/src/services/doctor.rs)
- [doctor.rs](file://src-tauri/src/models/doctor.rs)

## Troubleshooting Workflows

The diagnostic system supports several troubleshooting workflows that help users identify and resolve issues with their development environment.

### Runtime Requirement Mapping

The system includes a helper function that determines the runtime requirements for different server sources, enabling proactive validation before installation.

```mermaid
flowchart TD
A[Server Source Type] --> B{Source Type}
B --> |npm| C[Requires Node.js]
B --> |uvx| D[Requires Python]
B --> |docker| E[Requires Docker]
B --> |local| F[No Specific Runtime]
B --> |remote| G[No Specific Runtime]
B --> |github| H[Requires git]
```

**Section sources**

- [useDoctor.ts](file://src/hooks/useDoctor.ts#L60-L78)

### Validation Before Installation

Before installing a new MCP server, the system can validate that the required runtimes are available, preventing failed installations due to missing dependencies.

```mermaid
sequenceDiagram
participant User
participant UI
participant validateInstall
participant checkRuntimeForRegistry
User->>UI : Attempt to install server
UI->>validateInstall : Validate installation
validateInstall->>checkRuntimeForRegistry : Check required runtime
checkRuntimeForRegistry-->>validateInstall : Return validation result
validateInstall-->>UI : Return validation result
alt Valid
UI->>User : Proceed with installation
else Invalid
UI->>User : Display missing dependency error
end
```

**Section sources**

- [tauri.ts](file://src/lib/tauri.ts#L268-L283)

## Interpreting Diagnostic Results

Understanding the diagnostic report is crucial for maintaining a healthy development environment. The report categorizes issues by severity, providing clear guidance on necessary actions.

### Issue Severity Levels

The diagnostic system uses three severity levels to classify issues:

- **Error**: Critical issues that will prevent functionality
- **Warning**: Issues that may cause problems or limit functionality
- **Info**: Informational messages about optional but recommended components

### Common Diagnostic Scenarios

**Missing Node.js**: When Node.js is not found, the system generates a warning with a suggestion to install Node.js via nvm or from the official website. This is required for NPM-based MCP servers.

**Missing Python**: When Python is not found, the system generates a warning with a suggestion to install Python 3.x. This is required for Python-based MCP servers.

**Missing git**: When git is not found, the system generates a warning with a suggestion to install git. This is required for installing MCP servers from GitHub repositories.

**Missing Docker**: When Docker is not found, the system generates an informational message noting that Docker is required for Docker-based MCP servers.

The diagnostic system provides a comprehensive view of the development environment, enabling users to ensure their system is properly configured for MCP server management.

**Section sources**

- [doctor.rs](file://src-tauri/src/services/doctor.rs#L9-L52)
- [doctor.rs](file://src-tauri/src/models/doctor.rs#L15-L24)
