'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { authService } from '@/services/auth-service';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MediSwiftLogo } from '@/components/brand/MediSwiftLogo';

function SignupFormContent() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();
  const { addToast } = useNotificationStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/account');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Please enter both your first name and last name.');
      return;
    }

    if (!email.trim() || !password) {
      setErrorMessage('Please enter a valid email and password.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    try {
      // 1. Register with backend
      const res = await authService.register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone_number: phone.trim(),
        password,
        password_confirm: confirmPassword,
      });

      if (res) {
        addToast({
          type: 'success',
          title: 'Account Created!',
          message: 'Your account has been registered successfully. Logging you in...',
        });

        // 2. Automatically log in with the new credentials
        try {
          const loginRes = await authService.login({
            email: email.trim().toLowerCase(),
            password,
          });
          if (loginRes?.data) {
            setAuth(loginRes.data.user, loginRes.data.access, loginRes.data.refresh);
            router.push('/account');
            return;
          }
        } catch {
          // If auto-login fails, redirect to /login
          router.push('/login');
          return;
        }

        router.push('/account');
      }
    } catch (err: any) {
      const respData = err?.response?.data;
      let msg = 'Registration failed. Please check your information.';
      if (respData) {
        if (respData.message) msg = respData.message;
        else if (respData.email) msg = Array.isArray(respData.email) ? respData.email[0] : respData.email;
        else if (respData.password) msg = Array.isArray(respData.password) ? respData.password[0] : respData.password;
        else if (respData.detail) msg = respData.detail;
      }
      setErrorMessage(msg);
      addToast({
        type: 'error',
        title: 'Registration Error',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <MediSwiftLogo variant="header" size="lg" theme="light" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A2540]">
            Create MediSwift Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Join India&apos;s smarter healthcare platform for fast 2-hour medicine delivery and verified doctors.
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
            {/* Full Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="e.g. Ramesh"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoFocus
                    className="rounded-2xl pl-10 text-sm h-11 border-slate-200 focus:border-[#00A896]"
                  />
                  <User className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="e.g. Kumar"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="rounded-2xl pl-10 text-sm h-11 border-slate-200 focus:border-[#00A896]"
                  />
                  <User className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="rounded-2xl pl-10 text-sm h-11 border-slate-200 focus:border-[#00A896]"
                />
                <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Mobile Number <span className="text-slate-400 font-normal">(for delivery tracking)</span>
              </label>
              <div className="relative">
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-2xl pl-10 text-sm h-11 border-slate-200 focus:border-[#00A896]"
                />
                <Phone className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="rounded-2xl pl-10 pr-10 text-sm h-11 border-slate-200 focus:border-[#00A896]"
                  />
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="rounded-2xl pl-10 text-sm h-11 border-slate-200 focus:border-[#00A896]"
                  />
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>

            {/* Terms Consent */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 leading-snug">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  required
                  className="mt-0.5 rounded text-[#00A896] focus:ring-[#00A896]"
                />
                <span>
                  I agree to MediSwift&apos;s{' '}
                  <span className="font-semibold text-[#00A896]">Terms of Service</span> and{' '}
                  <span className="font-semibold text-[#00A896]">Privacy Policy</span>, and consent to receiving health order updates.
                </span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full rounded-2xl font-bold h-11 shadow-md shadow-teal-500/10 text-sm flex items-center justify-center gap-2 mt-3"
            >
              {loading ? (
                <span>Registering account...</span>
              ) : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Security Assurance */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="h-4 w-4 text-[#00A896]" />
            <span>Encrypted patient confidentiality &bull; No spam guaranteed</span>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[#00A896] hover:underline">
            Sign in here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <SignupFormContent />
    </Suspense>
  );
}
