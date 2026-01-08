import { toast } from "sonner";

export function showSuccess(title: string, message?: string) {
  toast.success(title, { description: message });
}

export function showError(title: string, message?: string) {
  toast.error(title, { description: message, duration: 8000 });
}

export function showWarning(title: string, message?: string) {
  toast.warning(title, { description: message });
}

export function showInfo(title: string, message?: string) {
  toast.info(title, { description: message });
}