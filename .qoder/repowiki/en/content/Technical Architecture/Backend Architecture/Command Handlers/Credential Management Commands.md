# Credential Management Commands

<cite>
**Referenced Files in This Document**   
- [keychain.rs](file://src-tauri/src/commands/keychain.rs)
- [keychain.rs](file://src-tauri/src/services/keychain.rs)
- [tauri.ts](file://src/lib/tauri.ts)
- [CredentialManager.tsx](file://src/components/settings/CredentialManager.tsx)
- [CredentialInput.tsx](file://src/components/common/CredentialInput.tsx)
- [index.ts](file://src/types/index.ts)
- [lib.rs](file://src-tauri/src/lib.rs)
</cite>

## Table of Contents

1. [Introduction](#introduction)
2. [Core Command Handlers](#core-command-handlers)
3. [Keychain Service Architecture](#keychain-service-architecture)
4. [Frontend Integration](#frontend-integration)
5. [Security Implementation](#security-implementation)
6. [Usage in Server Configuration](#usage-in-server-configuration)
7. [Error Handling](#error-handling)
8. [API Reference](#api-reference)

## Introduction

The MCP Nexus credential management system provides secure storage and retrieval of sensitive credentials through integration with the operating system's keychain services. This documentation details the command handlers for storing, retrieving, and deleting credentials, with a focus on macOS Keychain integration. The system enables secure reference of credentials in server environment variables while maintaining strict access controls and audit capabilities.

**Section sources**

- [keychain.rs](file://src-tauri/src/commands/keychain.rs#L1-L144)
- [keychain.rs](file://src-tauri/src/services/keychain.rs#L1-L438)

## Core Command Handlers

The credential management system exposes three primary command handlers through the Tauri backend: `save_credential`, `get_credential_value`, and `delete_credential`. These commands form the core API for secure credential operations, interfacing with the underlying KeychainService to provide encrypted storage.

```mermaid
sequenceDiagram
participant Frontend
participant TauriCommand
participant KeychainService
participant OSKeychain
Frontend->>TauriCommand : save_credential(name, value)
TauriCommand->>KeychainService : store_credential(name, value)
KeychainService->>OSKeychain : Store encrypted credential
OSKeychain-->>KeychainService : Confirmation
KeychainService->>KeychainService : Update credential keys file
KeychainService-->>TauriCommand : StoreCredentialResult
TauriCommand-->>Frontend : KeychainResponse
Frontend->>TauriCommand : get_credential_value(name)
TauriCommand->>KeychainService : get_credential(name)
KeychainService->>OSKeychain : Retrieve credential
OSKeychain-->>KeychainService : Decrypted value
KeychainService-->>TauriCommand : Secret value
TauriCommand-->>Frontend : KeychainResponse
Frontend->>TauriCommand : delete_credential(name)
TauriCommand->>KeychainService : delete_credential(name)
KeychainService->>OSKeychain : Remove credential
OSKeychain-->>KeychainService : Confirmation
KeychainService->>KeychainService : Update credential keys file
KeychainService-->>TauriCommand : Deletion status
TauriCommand-->>Frontend : KeychainResponse
```

**Diagram sources**

- [keychain.rs](file://src-tauri/src/commands/keychain.rs#L47-L78)
- [keychain.rs](file://src-tauri/src/services/keychain.rs#L162-L235)

**Section sources**

- [keychain.rs](file://src-tauri/src/commands/keychain.rs#L47-L78)
- [keychain.rs](file://src-tauri/src/services/keychain.rs#L162-L235)

## Keychain Service Architecture

The KeychainService implements a dual-layer storage approach, combining OS-level keychain encryption with application-level credential tracking. Credentials are stored in the macOS Keychain under the service identifier "com.mcp-manager.credentials", while credential names are tracked in a local JSON file with restricted permissions.

```mermaid
classDiagram
class KeychainService {
+KEYCHAIN_SERVICE : str
+CREDENTIAL_KEYS_FILE : str
+store_credential(name, value)
+get_credential(name)
+delete_credential(name)
+list_credentials()
+credential_exists(name)
+resolve_keychain_reference(value)
}
class KeychainError {
+KeyringError
+NotFound
+KeysFileReadError
+KeysFileWriteError
+InvalidName
+HomeNotFound
}
class StoreCredentialResult {
+name : String
+success : bool
+is_update : bool
}
class KeychainResponse~T~ {
+success : bool
+data : Option~T~
+error : Option~String~
}
KeychainService --> KeychainError : "returns"
KeychainService --> StoreCredentialResult : "returns"
KeychainService --> KeychainResponse : "wraps"
KeychainResponse --> StoreCredentialResult : "contains"
KeychainResponse --> KeychainError : "contains"
```

**Diagram sources**

- [keychain.rs](file://src-tauri/src/services/keychain.rs#L14-L40)
- [keychain.rs](file://src-tauri/src/services/keychain.rs#L50-L57)
- [keychain.rs](file://src-tauri/src/commands/keychain.rs#L10-L17)

**Section sources**

- [keychain.rs](file://src-tauri/src/services/keychain.rs#L14-L40)
- [keychain.rs](file://src-tauri/src/services/keychain.rs#L50-L57)

## Frontend Integration

The credential management commands are integrated into the frontend through React components and hooks. The CredentialManager component provides a user interface for managing credentials, while the CredentialInput component enables keychain reference insertion in server configuration fields.

```mermaid
flowchart TD
A[CredentialManager] --> B[useCredentials Hook]
B --> C[saveCredential]
B --> D[deleteCredential]
B --> E[listCredentials]
C --> F[tauri.invoke save_credential]
D --> G[tauri.invoke delete_credential]
E --> H[tauri.invoke list_credentials]
I[CredentialInput] --> J[useCredentials Hook]
J --> K[showDropdown]
K --> L[Select from Keychain]
L --> M[Insert keychain:ref]
F --> N[OS Keychain]
G --> N
H --> O[Credential Keys File]
```

**Diagram sources**

- [CredentialManager.tsx](file://src/components/settings/CredentialManager.tsx#L1-L347)
- [CredentialInput.tsx](file://src/components/common/CredentialInput.tsx#L1-L192)
- [useCredentials.ts](file://src/hooks/useCredentials.ts#L1-L63)

**Section sources**

- [CredentialManager.tsx](file://src/components/settings/CredentialManager.tsx#L1-L347)
- [CredentialInput.tsx](file://src/components/common/CredentialInput.tsx#L1-L192)

## Security Implementation

The credential management system implements multiple security layers to protect sensitive data. Credentials are encrypted using the operating system's keychain services, with additional application-level controls for access and auditing. The system enforces strict validation rules for credential names and implements secure file handling practices.

```mermaid
flowchart TD
A[Store Credential] --> B[Validate Name]
B --> C{Valid?}
C --> |Yes| D[Encrypt with OS Keychain]
C --> |No| E[Return InvalidName Error]
D --> F[Update credential_keys.json]
F --> G[Set 0600 Permissions]
G --> H[Atomic Write]
I[Retrieve Credential] --> J[Validate Name]
J --> K{Exists?}
K --> |Yes| L[Decrypt from OS Keychain]
K --> |No| M[Return NotFound Error]
L --> N[Return Value]
O[Delete Credential] --> P[Remove from OS Keychain]
P --> Q[Update credential_keys.json]
Q --> R[Atomic Write]
```

**Diagram sources**

- [keychain.rs](file://src-tauri/src/services/keychain.rs#L129-L154)
- [keychain.rs](file://src-tauri/src/services/keychain.rs#L170-L192)
- [keychain.rs](file://src-tauri/src/services/keychain.rs#L215-L235)

**Section sources**

- [keychain.rs](file://src-tauri/src/services/keychain.rs#L129-L154)
- [keychain.rs](file://src-tauri/src/services/keychain.rs#L170-L192)

## Usage in Server Configuration

Credentials stored in the keychain can be referenced in server environment variables using two formats: `keychain:credential-name` or `${keychain:credential-name}`. The system automatically resolves these references when server configurations are processed, retrieving the actual credential values from the keychain.

```mermaid
sequenceDiagram
participant ServerConfig
participant ConfigManager
participant KeychainService
ServerConfig->>ConfigManager : Load server configuration
ConfigManager->>KeychainService : resolve_keychain_reference(value)
KeychainService->>KeychainService : is_keychain_reference(value)
KeychainService->>KeychainService : extract_credential_name(value)
KeychainService->>OSKeychain : get_credential(name)
OSKeychain-->>KeychainService : Decrypted value
KeychainService-->>ConfigManager : Resolved value
ConfigManager-->>ServerConfig : Configuration with resolved values
```

**Diagram sources**

- [keychain.rs](file://src-tauri/src/services/keychain.rs#L262-L303)
- [config_manager.rs](file://src-tauri/src/services/config_manager.rs#L1-L427)

**Section sources**

- [keychain.rs](file://src-tauri/src/services/keychain.rs#L262-L303)
- [config_manager.rs](file://src-tauri/src/services/config_manager.rs#L1-L427)

## Error Handling

The credential management system implements comprehensive error handling to address various failure scenarios. Errors are categorized and reported through the KeychainResponse structure, providing clear feedback to the frontend about the nature of any issues encountered during credential operations.

```mermaid
flowchart TD
A[Operation Failed] --> B{Error Type}
B --> C[KeyringError]
B --> D[NotFound]
B --> E[KeysFileReadError]
B --> F[KeysFileWriteError]
B --> G[InvalidName]
B --> H[HomeNotFound]
C --> I[OS Keychain Access Issue]
D --> J[Credential Does Not Exist]
E --> K[Failed to Read Keys File]
F --> L[Failed to Write Keys File]
G --> M[Invalid Credential Name]
H --> N[Home Directory Not Found]
I --> O[Return KeychainResponse with error]
J --> O
E --> O
F --> O
G --> O
H --> O
```

**Diagram sources**

- [keychain.rs](file://src-tauri/src/services/keychain.rs#L20-L39)
- [keychain.rs](file://src-tauri/src/commands/keychain.rs#L10-L17)

**Section sources**

- [keychain.rs](file://src-tauri/src/services/keychain.rs#L20-L39)
- [keychain.rs](file://src-tauri/src/commands/keychain.rs#L10-L17)

## API Reference

The credential management API provides three primary functions for secure credential operations. Each function follows a consistent response pattern using the KeychainResponse structure to communicate success status, data, and error information.

### store_credential

Stores a credential securely in the OS keychain.

**Parameters**

- `name`: Credential identifier (string)
- `value`: Secret value to store (string)

**Returns**

- `KeychainResponse<StoreCredentialResult>` with:
  - `success`: Boolean indicating operation success
  - `data`: StoreCredentialResult containing name, success status, and update flag
  - `error`: Error message if operation failed

**Section sources**

- [keychain.rs](file://src-tauri/src/commands/keychain.rs#L47-L57)
- [keychain.rs](file://src-tauri/src/services/keychain.rs#L162-L192)

### get_credential_value

Retrieves a credential from the OS keychain.

**Parameters**

- `name`: Credential identifier (string)

**Returns**

- `KeychainResponse<String>` with:
  - `success`: Boolean indicating operation success
  - `data`: The secret value (only on success)
  - `error`: Error message if operation failed

**Section sources**

- [keychain.rs](file://src-tauri/src/commands/keychain.rs#L59-L69)
- [keychain.rs](file://src-tauri/src/services/keychain.rs#L194-L206)

### delete_credential

Deletes a credential from the OS keychain.

**Parameters**

- `name`: Credential identifier (string)

**Returns**

- `KeychainResponse<bool>` with:
  - `success`: Boolean indicating operation success
  - `data`: Boolean indicating whether a credential was deleted
  - `error`: Error message if operation failed

**Section sources**

- [keychain.rs](file://src-tauri/src/commands/keychain.rs#L71-L78)
- [keychain.rs](file://src-tauri/src/services/keychain.rs#L208-L235)
