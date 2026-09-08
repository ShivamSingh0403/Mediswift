import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-200/80 bg-[length:200%_100%] ${className}`}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
      <div>
        <Skeleton className="w-full aspect-square rounded-xl mb-4" />
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-4 w-12 rounded-md" />
        </div>
        <Skeleton className="h-5 w-4/5 rounded-md mb-2" />
        <Skeleton className="h-3 w-3/5 rounded-md mb-3" />
        <Skeleton className="h-4 w-24 rounded-md" />
      </div>
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-xl" />
      </div>
    </div>
  );
}

export function ProductListRowSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center gap-4">
      <Skeleton className="w-24 h-24 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
        <Skeleton className="h-5 w-1/2 rounded-md" />
        <Skeleton className="h-3 w-1/3 rounded-md" />
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <Skeleton className="h-6 w-24 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
    </div>
  );
}

export function DoctorCardSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
          <Skeleton className="h-4 w-1/3 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-2xl mt-2" />
    </div>
  );
}
