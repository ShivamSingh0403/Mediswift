'use client';

import React from 'react';
import { useNotificationStore } from '@/store/notification-store';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const { toasts, removeToast } = useNotificationStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
          error: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
          warning: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
          info: <Info className="h-5 w-5 text-[#00A896] shrink-0" />,
        };

        const bg = {
          success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
          error: 'border-rose-200 bg-rose-50 text-rose-950',
          warning: 'border-amber-200 bg-amber-50 text-amber-950',
          info: 'border-cyan-200 bg-cyan-50 text-cyan-950',
        };

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2',
              bg[toast.type]
            )}
          >
            {icons[toast.type]}
            <div className="flex-1 text-xs">
              {toast.title && <div className="font-semibold">{toast.title}</div>}
              <div>{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="rounded p-1 text-slate-400 hover:text-slate-600 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
