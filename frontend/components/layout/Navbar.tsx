'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  UploadCloud,
  MapPin,
  Search,
  User as UserIcon,
  Menu,
  X,
  Stethoscope,
  Pill,
  ChevronDown,
} from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { useUiStore } from '@/store/ui-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Navbar() {
  const router = useRouter();
  const { totalItems } = useCartStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { activePincode, cityName, setPrescriptionModalOpen, isMobileMenuOpen, setMobileMenuOpen } = useUiStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/medicines?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-nav transition-all">
      {/* Top Banner: Emergency helpline & quick delivery notice */}
      <div className="bg-[#0A2540] text-white py-1.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#00A896]">Express Delivery:</span>
            <span className="hidden sm:inline">Medicines delivered in under 2 hours across verified pincodes.</span>
            <span className="sm:hidden">Under 2 hr delivery</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <span className="hover:text-white transition-colors cursor-pointer">24x7 Doctor Support: 1800-MEDISWIFT</span>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex flex-col group">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0A2540] to-[#00A896] flex items-center justify-center text-white font-black text-lg shadow-sm">
                +
              </div>
              <span className="text-2xl font-black tracking-tight text-[#0A2540]">
                MEDI<span className="text-[#00A896]">SWIFT</span>
              </span>
            </div>
            <span className="text-[10px] font-medium tracking-wide text-slate-500 hidden sm:block">
              Your Health, Delivered Smarter.
            </span>
          </Link>

          {/* Delivery Location Pincode */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white/70 text-xs text-slate-700 shadow-2xs hover:border-[#00A896] cursor-pointer transition-colors">
            <MapPin className="h-4 w-4 text-[#00A896] shrink-0" />
            <div>
              <div className="font-medium text-slate-900 flex items-center gap-1">
                Deliver to: <span className="font-bold">{activePincode}</span>
              </div>
              <div className="text-[11px] text-slate-500">{cityName}</div>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medicines, salt compositions, health products, or doctors..."
              className="w-full rounded-full border border-slate-200 bg-white/90 pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-2xs focus:border-[#00A896] focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 transition-all"
            />
          </div>
        </form>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Quick Prescription Upload CTA */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPrescriptionModalOpen(true)}
            className="hidden sm:inline-flex"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Prescription</span>
          </Button>

          {/* User Account Dropdown */}
          <div className="relative">
            {isAuthenticated ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                  <UserIcon className="h-3.5 w-3.5" />
                </div>
                <span className="max-w-[100px] truncate">{user?.first_name || 'Account'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            ) : (
              <Link href="/account">
                <Button variant="outline" size="sm">
                  <UserIcon className="h-4 w-4" />
                  <span>Login / Register</span>
                </Button>
              </Link>
            )}

            {isUserMenuOpen && isAuthenticated && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-100 bg-white p-2 shadow-xl z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100 text-slate-500">
                  Signed in as <span className="font-semibold text-slate-800 block truncate">{user?.email}</span>
                </div>
                <Link
                  href="/account"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700"
                >
                  My Profile
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700"
                >
                  My Orders
                </Link>
                <Link
                  href="/prescriptions"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700"
                >
                  My Prescriptions
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 font-medium"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Cart Icon with badge */}
          <Link href="/cart">
            <button className="relative p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#0A2540] transition-colors cursor-pointer">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#00A896] text-white text-[10px] font-bold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center shadow-xs">
                  {totalItems}
                </span>
              )}
            </button>
          </Link>

          {/* Mobile menu hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Secondary Category Navigation */}
      <nav className="border-t border-slate-200/60 bg-white/60 px-4 py-2 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center gap-8 text-xs font-medium text-slate-600">
          <Link href="/medicines" className="flex items-center gap-1.5 hover:text-[#0A2540] transition-colors">
            <Pill className="h-3.5 w-3.5 text-[#00A896]" />
            <span>Order Medicines</span>
          </Link>
          <Link href="/doctors" className="flex items-center gap-1.5 hover:text-[#0A2540] transition-colors">
            <Stethoscope className="h-3.5 w-3.5 text-[#00A896]" />
            <span>Consult Doctors & Telehealth</span>
          </Link>
          <Link href="/categories/prescription-medicines" className="hover:text-[#0A2540] transition-colors">
            Prescription Drugs
          </Link>
          <Link href="/categories/otc-first-aid" className="hover:text-[#0A2540] transition-colors">
            OTC & First Aid
          </Link>
          <Link href="/categories/vitamins-supplements" className="hover:text-[#0A2540] transition-colors">
            Vitamins & Wellness
          </Link>
          <Link href="/prescriptions" className="hover:text-[#0A2540] transition-colors">
            Prescription Vault
          </Link>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <form onSubmit={handleSearch} className="mb-3">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicines or doctors..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-800"
              />
            </div>
          </form>
          <Link
            href="/medicines"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-medium text-slate-800 border-b border-slate-100"
          >
            <Pill className="h-4 w-4 text-[#00A896]" /> Order Medicines
          </Link>
          <Link
            href="/doctors"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-medium text-slate-800 border-b border-slate-100"
          >
            <Stethoscope className="h-4 w-4 text-[#00A896]" /> Consult Doctors (Telehealth)
          </Link>
          <Link
            href="/prescriptions"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-medium text-slate-800 border-b border-slate-100"
          >
            <UploadCloud className="h-4 w-4 text-[#00A896]" /> Upload & View Prescriptions
          </Link>
          <Link
            href="/orders"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-medium text-slate-800"
          >
            <ShoppingBag className="h-4 w-4 text-[#00A896]" /> Order History & Tracking
          </Link>
        </div>
      )}
    </header>
  );
}
