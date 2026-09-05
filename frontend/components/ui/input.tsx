import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && <div className="absolute left-3.5 text-slate-400 pointer-events-none">{icon}</div>}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-[#00A896] focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 disabled:bg-slate-50 disabled:text-slate-500',
              icon && 'pl-10',
              error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
