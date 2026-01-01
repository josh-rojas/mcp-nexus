// src/components/common/Toast.tsx
import { useNotificationStore, type Notification, type NotificationType } from "../../stores/notificationStore";

const typeStyles: Record<NotificationType, { bg: string; icon: string; iconColor: string }> = {
  success: {
    bg: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800",
    icon: "✓",
    iconColor: "text-green-500",
  },
  error: {
    bg: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800",
    icon: "✕",
    iconColor: "text-red-500",
  },
  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800",
    icon: "⚠",
    iconColor: "text-yellow-500",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
    icon: "ℹ",
    iconColor: "text-blue-500",
  },
};

function ToastItem({ notification }: { notification: Notification }) {
  const { removeNotification } = useNotificationStore();
  const styles = typeStyles[notification.type];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${styles.bg} animate-slide-in`}
      role="alert"
    >
      <span className={`text-lg font-bold ${styles.iconColor}`}>{styles.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white">{notification.title}</p>
        {notification.message && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
        )}
      </div>
      <button
        onClick={() => removeNotification(notification.id)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { notifications } = useNotificationStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <ToastItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}

