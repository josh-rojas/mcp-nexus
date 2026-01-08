import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconBgColor: string;
  link?: string;
  linkLabel?: string;
  isLoading?: boolean;
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  iconBgColor,
  link,
  linkLabel,
  isLoading = false,
}: SummaryCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </h3>
          {isLoading ? (
            <div className="mt-2 h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {value}
            </p>
          )}
          {subtitle && !isLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconBgColor}`}>{icon}</div>
      </div>
      {link && linkLabel && (
        <Link
          to={link}
          className="mt-4 inline-flex items-center text-sm font-medium text-system-accent dark:text-system-accent hover:text-blue-800 dark:hover:text-blue-300"
        >
          {linkLabel}
          <svg
            className="ml-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      )}
    </div>
  );
}
