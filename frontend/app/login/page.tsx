'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '@/services/auth-service';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MediSwiftLogo } from '@/components/brand/MediSwiftLogo';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';

  const { setAuth, isAuthenticated } = useAuthStore();
  const { addToast } = useNotificationStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter both email address and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login({ email: trimmedEmail, password });
      if (res && res.data) {
        setAuth(res.data.user, res.data.access, res.data.refresh);
        addToast({
          type: 'success',
          title: 'Welcome Back!',
          message: `Signed in successfully as ${res.data.user.first_name || res.data.user.email}.`,
        });
        router.push(redirectUrl);
      } else {
        setErrorMessage('Authentication response was invalid. Please try again.');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        (err?.response?.data?.error && typeof err.response.data.error === 'string'
          ? err.response.data.error
          : null) ||
        'Invalid email address or password. Please check your credentials.';
      setErrorMessage(msg);
      addToast({
        type: 'error',
        title: 'Login Failed',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <MediSwiftLogo variant="header" size="lg" theme="light" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A2540]">
            Sign In to MediSwift
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Access genuine medicines, your digital prescription vault, and telehealth appointments.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-slate-900/5">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                  className="rounded-2xl pl-10 text-sm h-11 border-slate-200 focus:border-[#00A896]"
                />
                <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#00A896] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="rounded-2xl pl-10 pr-10 text-sm h-11 border-slate-200 focus:border-[#00A896]"
                />
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full rounded-2xl font-bold h-11 shadow-md shadow-teal-500/10 text-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Security Assurance */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="h-4 w-4 text-[#00A896]" />
            <span>256-bit encrypted authentication &bull; HIPAA &amp; CDSCO compliant</span>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Don&apos;t have an account yet?{' '}
          <Link href="/signup" className="font-bold text-[#00A896] hover:underline">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
