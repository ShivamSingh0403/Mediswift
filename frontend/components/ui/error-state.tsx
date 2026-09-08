import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Failed to load information',
  message = 'We encountered an unexpected error while retrieving this healthcare data. Please check your connection and try again.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`py-14 px-6 text-center rounded-3xl border border-rose-100 bg-rose-50/50 shadow-xs max-w-lg mx-auto ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="h-7 w-7 stroke-[1.75]" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-100/80 inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Operation</span>
          </Button>
        </div>
      )}
    </div>
  );
}
