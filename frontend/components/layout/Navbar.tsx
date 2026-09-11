'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sparkles,
  Grid,
  Heart,
  Package,
  FileText,
  LogOut,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { useUiStore } from '@/store/ui-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from '@/components/layout/NotificationCenter';

const ALL_CATEGORIES = [
  { name: 'Pain Relief', slug: 'pain-relief', icon: '⚡' },
  { name: 'Fever & Cold', slug: 'fever-cold', icon: '🌡️' },
  { name: 'Cough & Respiratory', slug: 'cough-respiratory', icon: '🫁' },
  { name: 'Digestive Health', slug: 'digestive-health', icon: '🥗' },
  { name: 'Diabetes Care', slug: 'diabetes-care', icon: '🩸' },
  { name: 'Heart Care', slug: 'heart-care', icon: '❤️' },
  { name: 'Vitamins & Supplements', slug: 'vitamins-supplements', icon: '🌿' },
  { name: 'Immunity Support', slug: 'immunity-support', icon: '🛡️' },
  { name: 'Skin Care', slug: 'skin-care', icon: '✨' },
  { name: 'Hair Care', slug: 'hair-care', icon: '💇' },
  { name: 'Baby Care', slug: 'baby-care', icon: '👶' },
  { name: "Women's Health", slug: 'womens-health', icon: '🌸' },
  { name: 'Personal Care', slug: 'personal-care', icon: '🧴' },
  { name: 'First Aid', slug: 'first-aid', icon: '🩹' },
  { name: 'Medical Devices', slug: 'medical-devices', icon: '🩺' },
  { name: 'Ayurvedic Products', slug: 'ayurvedic-products', icon: '🍃' },
  { name: 'Nutrition', slug: 'nutrition', icon: '🥑' },
  { name: 'Fitness & Wellness', slug: 'fitness-wellness', icon: '🏋️' },
  { name: 'Oral Care', slug: 'oral-care', icon: '🪥' },
  { name: 'Eye Care', slug: 'eye-care', icon: '👁️' },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems } = useCartStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const {
    activePincode,
    cityName,
    setPrescriptionModalOpen,
    setCartDrawerOpen,
    setSearchOverlayOpen,
    isMobileMenuOpen,
    setMobileMenuOpen,
  } = useUiStore();
  const { productIds } = useWishlistStore();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md shadow-slate-900/5 border-b border-slate-200/80'
          : 'bg-white/90 backdrop-blur-xs border-b border-slate-200/70'
      }`}
    >
      {/* Top Banner: Emergency helpline & express delivery note */}
      <div className="bg-[#0A2540] text-white py-1.5 px-4 sm:px-6 lg:px-8 xl:px-10 text-xs">
        <div className="max-w-[1536px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-bold text-[#00A896]">
              <Zap className="h-3 w-3 fill-[#00A896]" /> Express Delivery:
            </span>
            <span className="hidden sm:inline text-slate-300">
              Medicines delivered in under 2 hours across verified Indian pincodes.
            </span>
            <span className="sm:hidden text-slate-300">Under 2 hr delivery</span>
          </div>

          <div className="flex items-center gap-4 text-slate-300 text-[11px]">
            <span className="hidden md:inline hover:text-white transition-colors cursor-pointer">
              24x7 Doctor Helpline: 1800-MEDISWIFT
            </span>
            <span className="text-[#00A896] font-semibold">100% Genuine Guarantee</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-3 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex flex-col group select-none">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0A2540] via-[#0D3B66] to-[#00A896] flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                +
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0A2540]">
                MEDI<span className="text-[#00A896]">SWIFT</span>
              </span>
            </div>
            <span className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase hidden sm:block">
              Healthcare Technology
            </span>
          </Link>

          {/* Delivery Location Pincode Pill */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-700 hover:border-[#00A896] transition-colors cursor-pointer">
            <MapPin className="h-4 w-4 text-[#00A896] shrink-0" />
            <div>
              <div className="font-semibold text-slate-900 flex items-center gap-1 leading-tight">
                Deliver to: <span className="font-bold">{activePincode}</span>
              </div>
              <div className="text-[10px] text-slate-400">{cityName}</div>
            </div>
          </div>
        </div>

        {/* Global Search Bar (opens SearchOverlay) */}
        <div className="flex-1 max-w-xl hidden md:block">
          <button
            type="button"
            onClick={() => setSearchOverlayOpen(true)}
            className="w-full flex items-center justify-between rounded-full border border-slate-200 bg-slate-50/70 hover:bg-white pl-4 pr-3 py-2 text-xs text-slate-400 shadow-2xs hover:border-[#00A896] hover:shadow-xs transition-all cursor-text group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="h-4 w-4 text-slate-400 group-hover:text-[#00A896] transition-colors" />
              <span className="truncate">Search 250+ genuine medicines, salts, or devices...</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
              Ctrl + K
            </span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={() => setSearchOverlayOpen(true)}
            className="md:hidden p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            aria-label="Open search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Quick Prescription Upload CTA */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPrescriptionModalOpen(true)}
            className="hidden lg:inline-flex rounded-xl font-bold shadow-xs hover:shadow-teal-500/20"
          >
            <UploadCloud className="h-4 w-4 mr-1.5" />
            <span>Upload Rx</span>
          </Button>

          {/* Wishlist Icon */}
          <Link href="/account?tab=wishlist" className="hidden sm:block">
            <button
              type="button"
              className="relative p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition-colors"
              title="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {productIds.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-xs">
                  {productIds.length}
                </span>
              )}
            </button>
          </Link>

          {/* In-App Notifications */}
          <NotificationCenter />

          {/* User Account Dropdown */}
          <div className="relative">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-teal-50 text-[#00A896] flex items-center justify-center font-bold">
                  {user?.first_name?.[0] || 'U'}
                </div>
                <span className="max-w-[90px] truncate hidden sm:inline">
                  {user?.first_name || 'Account'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            ) : (
              <Link href="/account">
                <Button variant="outline" size="sm" className="rounded-xl">
                  <UserIcon className="h-4 w-4 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </Link>
            )}

            {/* Account dropdown */}
            {isUserMenuOpen && isAuthenticated && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100 text-slate-500">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Signed In As</span>
                  <span className="font-semibold text-slate-800 block truncate">{user?.email}</span>
                </div>
                <Link
                  href="/account"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 font-medium"
                >
                  <UserIcon className="h-4 w-4 text-slate-400" /> My Profile
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 font-medium"
                >
                  <Package className="h-4 w-4 text-slate-400" /> My Orders
                </Link>
                <Link
                  href="/prescriptions"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 font-medium"
                >
                  <FileText className="h-4 w-4 text-slate-400" /> Prescriptions
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold mt-1 border-t border-slate-100"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Cart Icon with bouncing count badge */}
          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            className="relative p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#00A896] transition-colors cursor-pointer"
            aria-label="View Shopping Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#00A896] text-white text-[10px] font-black h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                {totalItems}
              </span>
            )}
          </button>

          {/* Mobile menu hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Secondary Category & Services Bar with Mega Menu */}
      <nav className="border-t border-slate-200/60 bg-white/70 px-4 sm:px-6 lg:px-8 xl:px-10 py-2 hidden md:block">
        <div className="max-w-[1536px] mx-auto flex items-center justify-between text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-6">
            {/* Mega Categories Dropdown Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                onMouseEnter={() => setIsCategoryMenuOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all ${
                  isCategoryMenuOpen
                    ? 'bg-[#00A896] text-white'
                    : 'bg-slate-100/80 text-slate-800 hover:bg-slate-200'
                }`}
              >
                <Grid className="h-3.5 w-3.5" />
                <span>All Categories</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mega Categories Menu Overlay */}
              {isCategoryMenuOpen && (
                <div
                  onMouseLeave={() => setIsCategoryMenuOpen(false)}
                  className="absolute left-0 top-full mt-2 w-[720px] bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 z-50 grid grid-cols-4 gap-3 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="col-span-4 flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      20 Specialized Healthcare Categories
                    </span>
                    <Link
                      href="/medicines"
                      onClick={() => setIsCategoryMenuOpen(false)}
                      className="text-xs font-bold text-[#00A896] hover:underline"
                    >
                      View All Products →
                    </Link>
                  </div>

                  {ALL_CATEGORIES.map((cat, idx) => (
                    <Link
                      key={idx}
                      href={`/categories/${cat.slug}`}
                      onClick={() => setIsCategoryMenuOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-xl hover:bg-teal-50/70 hover:text-[#00A896] text-slate-700 text-xs font-medium transition-colors"
                    >
                      <span className="text-base shrink-0">{cat.icon}</span>
                      <span className="truncate">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/medicines"
              className={`flex items-center gap-1.5 hover:text-[#00A896] transition-colors ${
                pathname === '/medicines' ? 'text-[#00A896] font-bold' : ''
              }`}
            >
              <Pill className="h-3.5 w-3.5 text-[#00A896]" />
              <span>Medicines & Pharmacy</span>
            </Link>

            <Link
              href="/doctors"
              className={`flex items-center gap-1.5 hover:text-[#00A896] transition-colors ${
                pathname === '/doctors' ? 'text-[#00A896] font-bold' : ''
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5 text-[#00A896]" />
              <span>Doctor Telehealth</span>
            </Link>

            <Link
              href="/categories/medical-devices"
              className="hover:text-[#00A896] transition-colors"
            >
              Medical Devices
            </Link>

            <Link
              href="/categories/vitamins-supplements"
              className="hover:text-[#00A896] transition-colors"
            >
              Vitamins & Wellness
            </Link>

            <Link
              href="/categories/ayurvedic-products"
              className="hover:text-[#00A896] transition-colors"
            >
              Ayurveda
            </Link>

            <Link
              href="/prescriptions"
              className={`hover:text-[#00A896] transition-colors ${
                pathname === '/prescriptions' ? 'text-[#00A896] font-bold' : ''
              }`}
            >
              Prescription Vault
            </Link>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-normal">
            <Link href="/orders" className="hover:text-slate-800 transition-colors">
              Track Orders
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <Link
            href="/medicines"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 py-2.5 text-sm font-bold text-slate-800 border-b border-slate-100"
          >
            <Pill className="h-4 w-4 text-[#00A896]" /> Order Medicines
          </Link>
          <Link
            href="/doctors"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 py-2.5 text-sm font-bold text-slate-800 border-b border-slate-100"
          >
            <Stethoscope className="h-4 w-4 text-[#00A896]" /> Consult Doctors (Telehealth)
          </Link>
          <Link
            href="/prescriptions"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 py-2.5 text-sm font-bold text-slate-800 border-b border-slate-100"
          >
            <UploadCloud className="h-4 w-4 text-[#00A896]" /> Upload Prescription
          </Link>
          <Link
            href="/orders"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 py-2.5 text-sm font-bold text-slate-800 border-b border-slate-100"
          >
            <Package className="h-4 w-4 text-[#00A896]" /> Track Orders
          </Link>
          <Link
            href="/account"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 py-2.5 text-sm font-bold text-slate-800"
          >
            <UserIcon className="h-4 w-4 text-[#00A896]" /> My Account
          </Link>
        </div>
      )}
    </header>
  );
}
