'use client';

import React from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToastStore, type ToastType } from '@/frontend/lib/toast-store';
import { cn } from '@/frontend/lib/utils';

const META: Record<ToastType, { Icon: React.ElementType; bar: string; icon: string; bg: string }> = {
    success: { Icon: CheckCircle2,  bar: 'bg-green-500', icon: 'text-green-600', bg: 'bg-white border-green-200' },
    error  : { Icon: AlertCircle,   bar: 'bg-red-500',   icon: 'text-red-600',   bg: 'bg-white border-red-200'   },
    warning: { Icon: AlertTriangle, bar: 'bg-amber-400', icon: 'text-amber-600', bg: 'bg-white border-amber-200' },
    info   : { Icon: Info,          bar: 'bg-blue-500',  icon: 'text-blue-600',  bg: 'bg-white border-blue-200'  },
};

export function Toaster() {
    const { toasts, removeToast } = useToastStore();

    return (
        <div
            aria-live="polite"
            className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-[360px] max-w-[calc(100vw-2rem)] pointer-events-none"
        >
            {toasts.map((t) => {
                const { Icon, bar, icon, bg } = META[t.type];
                return (
                    <div
                        key={t.id}
                        className={cn(
                            'flex items-start gap-3 rounded-lg border shadow-lg overflow-hidden pointer-events-auto',
                            'animate-in slide-in-from-right-8 fade-in-0 duration-300',
                            bg
                        )}
                    >
                        {/* Colored left bar */}
                        <div className={cn('w-1 self-stretch flex-shrink-0', bar)} />
                        <Icon className={cn('w-5 h-5 mt-3 flex-shrink-0', icon)} />
                        <p className="flex-1 text-sm font-medium text-gray-800 py-3 pr-2 leading-snug">
                            {t.message}
                        </p>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="mt-3 mr-3 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
