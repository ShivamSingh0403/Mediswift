'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth-service';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Package, FileText, Calendar, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();
  const { addToast } = useNotificationStore();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // Login inputs
  const [loginEmail, setLoginEmail] = useState('customer@mediswift.in');
  const [loginPassword, setLoginPassword] = useState('Customer@12345');

  // Register inputs
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.login({ email: loginEmail, password: loginPassword });
      if (res?.data) {
        setAuth(res.data.user, res.data.access, res.data.refresh);
        addToast({
          type: 'success',
          title: 'Welcome back!',
          message: `Logged in as ${res.data.user.email}`,
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Authentication Failed',
        message: 'Invalid email address or password.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      addToast({ type: 'warning', message: 'Passwords do not match.' });
      return;
    }
    setLoading(true);
    try {
      await authService.register({
        email: regEmail,
        password: regPassword,
        password_confirm: regConfirmPassword,
        first_name: regFirstName,
        last_name: regLastName,
        phone_number: regPhone,
      });

      addToast({
        type: 'success',
        title: 'Registration Complete',
        message: 'Account created! Signing you in...',
      });

      // Auto login
      const loginRes = await authService.login({ email: regEmail, password: regPassword });
      if (loginRes?.data) {
        setAuth(loginRes.data.user, loginRes.data.access, loginRes.data.refresh);
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Registration Failed',
        message: 'Could not create account. Please check inputs.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Profile Card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#0A2540] text-[#00A896] font-bold text-2xl flex items-center justify-center">
                {user.first_name ? user.first_name.charAt(0) : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-[#0A2540]">
                    {user.first_name} {user.last_name}
                  </h1>
                  <Badge variant="accent">{user.role}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                {user.phone_number && <p className="text-xs text-slate-400">{user.phone_number}</p>}
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={logout} className="text-rose-600 border-rose-200 hover:bg-rose-50">
              <LogOut className="h-4 w-4 mr-1.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Account Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/orders">
            <Card className="p-5 glass-card-hover flex items-center gap-4">
              <div className="p-3 rounded-xl bg-teal-50 text-[#00A896]">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">My Orders</h3>
                <p className="text-xs text-slate-400 mt-0.5">Track packages & history</p>
              </div>
            </Card>
          </Link>

          <Link href="/prescriptions">
            <Card className="p-5 glass-card-hover flex items-center gap-4">
              <div className="p-3 rounded-xl bg-teal-50 text-[#00A896]">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Prescriptions</h3>
                <p className="text-xs text-slate-400 mt-0.5">Encrypted document vault</p>
              </div>
            </Card>
          </Link>

          <Link href="/appointments">
            <Card className="p-5 glass-card-hover flex items-center gap-4">
              <div className="p-3 rounded-xl bg-teal-50 text-[#00A896]">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Appointments</h3>
                <p className="text-xs text-slate-400 mt-0.5">Telehealth sessions</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0A2540] to-[#00A896] text-white flex items-center justify-center font-bold text-xl mx-auto mb-3">
          +
        </div>
        <h1 className="text-2xl font-black text-[#0A2540]">MediSwift Account</h1>
        <p className="text-xs text-slate-500 mt-1">Manage medicines, prescription uploads, and telehealth.</p>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md">
        <div className="flex border-b border-slate-100 mb-6">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 pb-3 text-xs font-bold transition-colors ${
              tab === 'login'
                ? 'border-b-2 border-[#00A896] text-[#00A896]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 pb-3 text-xs font-bold transition-colors ${
              tab === 'register'
                ? 'border-b-2 border-[#00A896] text-[#00A896]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Create Account
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" size="md" className="w-full" isLoading={loading}>
              Sign In
            </Button>

            <p className="text-[11px] text-slate-400 text-center pt-2">
              Demo credentials prefilled for instant testing.
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                value={regFirstName}
                onChange={(e) => setRegFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                value={regLastName}
                onChange={(e) => setRegLastName(e.target.value)}
                required
              />
            </div>
            <Input
              label="Email Address"
              type="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              required
            />
            <Input
              label="Phone Number"
              value={regPhone}
              onChange={(e) => setRegPhone(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              value={regConfirmPassword}
              onChange={(e) => setRegConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" variant="secondary" size="md" className="w-full" isLoading={loading}>
              Register Account
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
