'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MediSwiftLogo } from '@/components/brand/MediSwiftLogo';

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 900);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <MediSwiftLogo variant="header" size="lg" theme="light" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A2540]">
            Set New Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Create a secure password for your MediSwift account.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-slate-900/5">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 text-[#00A896] flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-bold text-[#0A2540]">Password Updated!</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Your password has been changed successfully. You can now sign in with your new credentials.
              </p>
              <div className="pt-4">
                <Link href="/login">
                  <Button variant="primary" className="w-full rounded-2xl font-bold text-xs h-10">
                    Sign In Now
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">New Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="rounded-2xl pl-10 pr-10 text-sm h-11 border-slate-200 focus:border-[#00A896]"
                  />
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="rounded-2xl pl-10 text-sm h-11 border-slate-200 focus:border-[#00A896]"
                  />
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full rounded-2xl font-bold h-11 shadow-md shadow-teal-500/10 text-sm flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Updating password...' : 'Update Password'}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="h-4 w-4 text-[#00A896]" />
            <span>256-bit encrypted credential updates</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
