'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { ShoppingBag, HeartPulse, Stethoscope, Pill, ShieldCheck, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const { user, isAuthenticated, logout, initializeAuth } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    initializeAuth();
  }, [initializeAuth]);

  const totalItems = mounted ? getTotalItems() : 0;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Mediswift <span className="text-brand-600">Pro</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 font-medium text-slate-600 text-sm">
            <Link href="/" className="hover:text-brand-600 transition-colors">
              Home
            </Link>
            <Link href="/medicines" className="flex items-center gap-1.5 hover:text-brand-600 transition-colors">
              <Pill className="w-4 h-4 text-brand-600" />
              Medicines & Pharmacy
            </Link>
            <Link href="/upload-prescription" className="flex items-center gap-1.5 hover:text-brand-600 transition-colors">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              Upload Rx
            </Link>
            <Link href="/consultation" className="flex items-center gap-1.5 hover:text-brand-600 transition-colors">
              <Stethoscope className="w-4 h-4 text-brand-600" />
              Telehealth Doctors
            </Link>
            <Link href="/cart" className="hover:text-brand-600 transition-colors">
              Cart & Orders
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/cart"
              className="relative p-2.5 rounded-full text-slate-700 hover:text-brand-600 hover:bg-slate-100 transition-colors flex items-center"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {mounted && isAuthenticated && user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {user.first_name || user.username}
                  </div>
                  <div className="text-[10px] text-brand-600 font-semibold uppercase tracking-wider">
                    {user.role || 'Patient'}
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/cart"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                <User className="w-3.5 h-3.5 text-brand-600" />
                Sign In
              </Link>
            )}

            <Link
              href="/medicines"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-brand-600 hover:bg-brand-700 shadow-sm hover:shadow transition-all"
            >
              Order Now
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
