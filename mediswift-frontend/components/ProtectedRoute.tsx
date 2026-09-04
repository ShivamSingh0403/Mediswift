'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import AuthForm from './AuthForm';
import { ShieldCheck, Lock, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

export default function ProtectedRoute({
  children,
  fallbackMessage = 'Please sign in or register to access this protected area.',
}: ProtectedRouteProps) {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, initializeAuth } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    initializeAuth();
  }, [initializeAuth]);

  if (!mounted) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center max-w-md mx-auto mb-8 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Protected Patient Area</h2>
          <p className="text-sm text-slate-500 leading-relaxed">{fallbackMessage}</p>
        </div>

        <AuthForm />
      </div>
    );
  }

  return <>{children}</>;
}
