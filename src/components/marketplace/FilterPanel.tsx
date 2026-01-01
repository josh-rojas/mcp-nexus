interface FilterPanelProps {
  officialOnly: boolean;
  communityOnly: boolean;
  remoteAvailable: boolean;
  onOfficialChange: (checked: boolean) => void;
  onCommunityChange: (checked: boolean) => void;
  onRemoteChange: (checked: boolean) => void;
}

function FilterCheckbox({
  id,
  label,
  checked,
  onChange,
  description,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group">
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
        />
      </div>
      <div className="flex-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
          {label}
        </span>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
    </label>
  );
}

export function FilterPanel({
  officialOnly,
  communityOnly,
  remoteAvailable,
  onOfficialChange,
  onCommunityChange,
  onRemoteChange,
}: FilterPanelProps) {
  // If official is selected, deselect community and vice versa
  const handleOfficialChange = (checked: boolean) => {
    if (checked && communityOnly) {
      onCommunityChange(false);
    }
    onOfficialChange(checked);
  };

  const handleCommunityChange = (checked: boolean) => {
    if (checked && officialOnly) {
      onOfficialChange(false);
    }
    onCommunityChange(checked);
  };

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
        Filters:
      </span>
      <FilterCheckbox
        id="filter-official"
        label="Official"
        checked={officialOnly}
        onChange={handleOfficialChange}
        description="Verified by MCP maintainers"
      />
      <FilterCheckbox
        id="filter-community"
        label="Community"
        checked={communityOnly}
        onChange={handleCommunityChange}
        description="Created by the community"
      />
      <FilterCheckbox
        id="filter-remote"
        label="Remote Available"
        checked={remoteAvailable}
        onChange={onRemoteChange}
        description="Supports SSE/remote connection"
      />
    </div>
  );
}

/** Compact horizontal filter for mobile/narrow layouts */
export function FilterChips({
  officialOnly,
  communityOnly,
  remoteAvailable,
  onOfficialChange,
  onCommunityChange,
  onRemoteChange,
}: FilterPanelProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => {
          if (!officialOnly && communityOnly) {
            onCommunityChange(false);
          }
          onOfficialChange(!officialOnly);
        }}
        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
          officialOnly
            ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
      >
        Official
      </button>
      <button
        onClick={() => {
          if (!communityOnly && officialOnly) {
            onOfficialChange(false);
          }
          onCommunityChange(!communityOnly);
        }}
        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
          communityOnly
            ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
      >
        Community
      </button>
      <button
        onClick={() => onRemoteChange(!remoteAvailable)}
        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
          remoteAvailable
            ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
      >
        Remote
      </button>
    </div>
  );
}
