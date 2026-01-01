// src/stores/notificationStore.ts
import { create } from "zustand";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = persistent
  createdAt: number;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "createdAt">) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

let notificationId = 0;

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = `notification-${++notificationId}`;
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: Date.now(),
      duration: notification.duration ?? 5000, // Default 5 seconds
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-remove after duration (if not persistent)
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, newNotification.duration);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },
}));

// Convenience functions for common notification types
export function showSuccess(title: string, message?: string) {
  return useNotificationStore.getState().addNotification({
    type: "success",
    title,
    message,
  });
}

export function showError(title: string, message?: string) {
  return useNotificationStore.getState().addNotification({
    type: "error",
    title,
    message,
    duration: 8000, // Errors stay longer
  });
}

export function showWarning(title: string, message?: string) {
  return useNotificationStore.getState().addNotification({
    type: "warning",
    title,
    message,
  });
}

export function showInfo(title: string, message?: string) {
  return useNotificationStore.getState().addNotification({
    type: "info",
    title,
    message,
  });
}

