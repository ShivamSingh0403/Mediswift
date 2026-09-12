'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MediSwiftLogo } from '@/components/brand/MediSwiftLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    // Simulate real reset trigger safely
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
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
            Password Recovery
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Enter your account email to receive a secure password reset link.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-slate-900/5">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 text-[#00A896] flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-bold text-[#0A2540]">Check Your Email</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                If an account exists for <strong className="text-slate-800">{email}</strong>, you will receive password reset instructions shortly.
              </p>
              <div className="pt-4">
                <Link href="/login">
                  <Button variant="primary" className="w-full rounded-2xl font-bold text-xs h-10">
                    Return to Sign In
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
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Account Email Address
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="rounded-2xl pl-10 text-sm h-11 border-slate-200 focus:border-[#00A896]"
                  />
                  <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full rounded-2xl font-bold h-11 shadow-md shadow-teal-500/10 text-sm flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Sending link...' : 'Send Recovery Link'}
              </Button>

              <div className="text-center pt-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="h-4 w-4 text-[#00A896]" />
            <span>Secure account verification</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
