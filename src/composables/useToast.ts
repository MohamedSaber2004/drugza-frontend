import { ref } from 'vue';
import type { ToastMessage } from '@/types';

const toasts = ref<ToastMessage[]>([]);

export function useToast() {
  function show(message: string, type: ToastMessage['type'] = 'info', title?: string, duration = 4000) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const toast: ToastMessage = { id, message, type, title, duration };
    toasts.value.push(toast);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  }

  function success(message: string, title?: string) {
    show(message, 'success', title || 'Success');
  }

  function error(message: string, title?: string) {
    show(message, 'error', title || 'Notice');
  }

  function info(message: string, title?: string) {
    show(message, 'info', title || 'Information');
  }

  function warning(message: string, title?: string) {
    show(message, 'warning', title || 'Warning');
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  return {
    toasts,
    show,
    success,
    error,
    info,
    warning,
    dismiss
  };
}
