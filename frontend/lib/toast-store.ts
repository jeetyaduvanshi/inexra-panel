import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
    id     : string;
    message: string;
    type   : ToastType;
}

interface ToastStore {
    toasts    : ToastItem[];
    addToast  : (message: string, type?: ToastType) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (message, type = 'success') => {
        const id = `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => {
            set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, 4500);
    },
    removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Imperative API — safe to call outside React components
export const toast = {
    success: (msg: string) => useToastStore.getState().addToast(msg, 'success'),
    error  : (msg: string) => useToastStore.getState().addToast(msg, 'error'),
    warning: (msg: string) => useToastStore.getState().addToast(msg, 'warning'),
    info   : (msg: string) => useToastStore.getState().addToast(msg, 'info'),
};
