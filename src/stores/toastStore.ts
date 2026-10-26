import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
  showToast: (message: string, variant?: ToastVariant, durationMs?: number) => void;
  dismissToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  showToast: (message, variant = "info", durationMs) => {
    const id = crypto.randomUUID();
    // Errors stay up longer so there's time to read them; at most 4 on screen.
    const ms = durationMs ?? (variant === "error" ? 6000 : 3500);
    set({ toasts: [...get().toasts, { id, message, variant }].slice(-4) });
    setTimeout(() => get().dismissToast(id), ms);
  },
  dismissToast: (id) => {
    set({ toasts: get().toasts.filter((toast) => toast.id !== id) });
  },
}));
