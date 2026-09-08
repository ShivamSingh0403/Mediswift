import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LucideIcon, Search, Package, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`py-16 px-4 text-center rounded-3xl border border-slate-200/80 bg-white shadow-xs max-w-lg mx-auto ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center mx-auto mb-4 shadow-inner">
        <Icon className="h-8 w-8 stroke-[1.5]" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-[#0A2540]">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      {(actionLabel && (actionHref || onAction)) && (
        <div className="mt-6">
          {actionHref ? (
            <Link href={actionHref}>
              <Button variant="primary" size="md" className="rounded-xl shadow-md shadow-[#00A896]/20">
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={onAction}
              className="rounded-xl shadow-md shadow-[#00A896]/20"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
