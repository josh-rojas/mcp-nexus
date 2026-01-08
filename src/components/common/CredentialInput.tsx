import { useState, useRef, useEffect } from "react";
import { Key, X, Eye, EyeOff } from "lucide-react";
import { useCredentials } from "../../hooks/useCredentials";

interface CredentialInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CredentialInput({
  value,
  onChange,
  placeholder = "Value or keychain:ref",
  className = "",
}: CredentialInputProps) {
  const { credentials, isLoading } = useCredentials();
  const [showPassword, setShowPassword] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isKeychainRef = value.startsWith("keychain:");
  const credentialName = isKeychainRef ? value.substring(9) : "";

  const handleSelectCredential = (name: string) => {
    onChange(`keychain:${name}`);
    setShowDropdown(false);
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex gap-2">
        {isKeychainRef ? (
          <div className="flex-1 flex items-center justify-between px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              <span className="font-medium text-sm">{credentialName}</span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative flex-1">
            <input
              type={showPassword ? "text" : "password"}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className={`p-2 border rounded-lg transition-colors ${
              showDropdown
                ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400"
                : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
            title="Insert from Keychain"
          >
            <Key className="w-5 h-5" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Select Credential
                </h4>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {isLoading ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Loading...
                  </div>
                ) : credentials.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No credentials found. Add them in Settings.
                  </div>
                ) : (
                  credentials.map((cred: string) => (
                    <button
                      key={cred}
                      type="button"
                      onClick={() => handleSelectCredential(cred)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Key className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{cred}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
