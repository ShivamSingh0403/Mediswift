'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { authService } from '@/services/auth-service';
import { orderService } from '@/services/order-service';
import { prescriptionService } from '@/services/prescription-service';
import { productService } from '@/services/product-service';
import { addressService } from '@/services/address-service';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useCartStore } from '@/store/cart-store';
import { useUiStore } from '@/store/ui-store';
import { Order, Prescription, Product, Address } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/product-card';
import { EmptyState } from '@/components/ui/empty-state';
import { MediSwiftLogo } from '@/components/brand/MediSwiftLogo';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  User,
  LogOut,
  Package,
  FileText,
  Calendar,
  Heart,
  MapPin,
  ShieldCheck,
  UploadCloud,
  ChevronRight,
  Clock,
  Sparkles,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowRight,
  Phone,
  Mail,
  Lock,
  Stethoscope,
  ShoppingBag,
} from 'lucide-react';

function AccountDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';

  const { user, isAuthenticated, logout } = useAuthStore();
  const { addToast } = useNotificationStore();
  const { productIds, toggleProduct } = useWishlistStore();
  const { addItem } = useCartStore();
  const { setPrescriptionModalOpen } = useUiStore();

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [loading, setLoading] = useState(false);

  // Authenticated User Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  // New Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressForm, setAddressForm] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    landmark: '',
    city: '',
    state: '',
    postal_code: '',
    address_type: 'HOME' as 'HOME' | 'WORK' | 'OTHER',
    is_default: false,
  });

  // Fetch live user data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      async function loadUserData() {
        setLoading(true);
        try {
          const [orderRes, rxRes, addrRes] = await Promise.all([
            orderService.getOrders().catch(() => null),
            prescriptionService.getPrescriptions().catch(() => null),
            addressService.getAddresses().catch(() => null),
          ]);

          if (orderRes?.data) {
            const list = Array.isArray(orderRes.data)
              ? orderRes.data
              : (orderRes.data as any).results || [];
            setOrders(list);
          }
          if (rxRes?.data) {
            const list = Array.isArray(rxRes.data)
              ? rxRes.data
              : (rxRes.data as any).results || [];
            setPrescriptions(list);
          }
          if (addrRes?.data) {
            const list = Array.isArray(addrRes.data)
              ? addrRes.data
              : (addrRes.data as any).results || [];
            setAddresses(list);
          }
        } finally {
          setLoading(false);
        }
      }
      loadUserData();
    }
  }, [isAuthenticated]);

  // Load wishlist products
  useEffect(() => {
    if (isAuthenticated && productIds.length > 0) {
      async function loadWishlist() {
        try {
          const products = await Promise.all(
            productIds.map(async (id) => {
              try {
                const res = await productService.getProduct(id);
                return res.data;
              } catch {
                return null;
              }
            })
          );
          setWishlistProducts(products.filter(Boolean) as Product[]);
        } catch {
          // Ignore
        }
      }
      loadWishlist();
    } else {
      setWishlistProducts([]);
    }
  }, [isAuthenticated, productIds]);

  const handleLogout = () => {
    logout();
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been signed out of your MediSwift account.',
    });
    router.push('/login');
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.full_name || !addressForm.phone || !addressForm.address_line1 || !addressForm.postal_code) {
      addToast({
        type: 'error',
        title: 'Incomplete Address',
        message: 'Please complete all required fields.',
      });
      return;
    }

    setAddressLoading(true);
    try {
      const res = await addressService.createAddress(addressForm);
      if (res?.data) {
        setAddresses((prev) => [...prev, res.data]);
        setShowAddressModal(false);
        setAddressForm({
          full_name: '',
          phone: '',
          address_line1: '',
          address_line2: '',
          landmark: '',
          city: '',
          state: '',
          postal_code: '',
          address_type: 'HOME',
          is_default: false,
        });
        addToast({
          type: 'success',
          title: 'Address Saved',
          message: 'Your delivery address has been saved.',
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Could not save address. Please try again.',
      });
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await addressService.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      addToast({
        type: 'info',
        title: 'Address Removed',
        message: 'Delivery address deleted.',
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete address.',
      });
    }
  };

  // =========================================================================
  // UNAUTHENTICATED GUEST PORTAL
  // =========================================================================
  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="flex justify-center mb-5">
            <MediSwiftLogo variant="header" size="lg" theme="light" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A2540]">
            MediSwift Patient Portal
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Sign in to view your orders, prescription vault, doctor appointments, and saved delivery addresses.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-48 rounded-2xl font-bold h-12 text-sm shadow-md">
                <span>Sign In to Account</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="/signup" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-48 rounded-2xl font-bold h-12 text-sm border-slate-300">
                <span>Create New Account</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Discovery Grid for Unauthenticated Visitors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          <Link href="/medicines" className="group">
            <Card className="p-6 rounded-3xl border border-slate-200/80 bg-white hover:border-[#00A896]/50 hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-base text-[#0A2540] mb-1">Browse Medicines</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Explore over 260+ genuine medicines across fever, cardiac, diabetes, and wellness.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#00A896]">
                <span>Shop Catalog</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Card>
          </Link>

          <Link href="/doctors" className="group">
            <Card className="p-6 rounded-3xl border border-slate-200/80 bg-white hover:border-[#00A896]/50 hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0A2540] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Stethoscope className="h-6 w-6 text-[#00A896]" />
                </div>
                <h3 className="font-bold text-base text-[#0A2540] mb-1">Explore Doctors</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Book encrypted video consultations with verified specialists from AIIMS, Apollo, and Fortis.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#00A896]">
                <span>Find Specialists</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Card>
          </Link>

          <button
            type="button"
            onClick={() => setPrescriptionModalOpen(true)}
            className="text-left group w-full"
          >
            <Card className="p-6 rounded-3xl border border-slate-200/80 bg-white hover:border-[#00A896]/50 hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-base text-[#0A2540] mb-1">Upload Prescription</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Quick upload for certified pharmacist verification and automated cart creation.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#00A896]">
                <span>Upload Now</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Card>
          </button>

          <Link href="/login?redirect=/orders" className="group">
            <Card className="p-6 rounded-3xl border border-slate-200/80 bg-white hover:border-[#00A896]/50 hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Package className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-base text-[#0A2540] mb-1">Track Delivery</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Real-time status updates on medicine dispatches with our express 2-hour delivery fleet.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-600">
                <span>Track Orders</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Card>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 p-6 rounded-3xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-around gap-4 text-center">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <ShieldCheck className="h-5 w-5 text-[#00A896]" />
            <span>100% CDSCO Licensed Medicines</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Clock className="h-5 w-5 text-[#00A896]" />
            <span>Express 2-Hour Delivery</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Lock className="h-5 w-5 text-[#00A896]" />
            <span>End-to-End Encrypted Health Records</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED USER DASHBOARD
  // =========================================================================
  const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
  const initialLetter = user.first_name ? user.first_name[0].toUpperCase() : 'U';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      {/* Profile Header Strip */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0A2540] to-[#00A896] text-white flex items-center justify-center font-black text-2xl shadow-md">
              {initialLetter}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#0A2540]">
                  Hello, {displayName}!
                </h1>
                <Badge variant="accent">{user.role || 'CUSTOMER'}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
              {user.phone_number && (
                <p className="text-xs text-slate-400 mt-0.5">{user.phone_number}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Live Metric Counter Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Orders</span>
              <Package className="h-4 w-4 text-[#00A896]" />
            </div>
            <div className="text-2xl font-black text-[#0A2540] mt-1">{orders.length}</div>
            <div className="text-[10px] text-slate-400">Total purchases</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Prescriptions</span>
              <FileText className="h-4 w-4 text-[#00A896]" />
            </div>
            <div className="text-2xl font-black text-[#0A2540] mt-1">{prescriptions.length}</div>
            <div className="text-[10px] text-slate-400">Digital vault</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Wishlist</span>
              <Heart className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-[#0A2540] mt-1">{productIds.length}</div>
            <div className="text-[10px] text-slate-400">Saved medicines</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Addresses</span>
              <MapPin className="h-4 w-4 text-[#00A896]" />
            </div>
            <div className="text-2xl font-black text-[#0A2540] mt-1">{addresses.length}</div>
            <div className="text-[10px] text-slate-400">Delivery locations</div>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-200 overflow-x-auto mb-8 gap-2">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'orders', label: `My Orders (${orders.length})` },
          { id: 'prescriptions', label: `Prescriptions (${prescriptions.length})` },
          { id: 'wishlist', label: `Wishlist (${productIds.length})` },
          { id: 'addresses', label: `Saved Addresses (${addresses.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#00A896] text-[#00A896]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <Link
          href="/account/appointments"
          className="pb-3 px-4 text-xs font-bold transition-all border-b-2 border-transparent text-slate-500 hover:text-[#00A896] hover:border-[#00A896] whitespace-nowrap flex items-center gap-1.5"
        >
          <Calendar className="h-3.5 w-3.5 text-[#00A896]" />
          <span>Doctor Appointments</span>
        </Link>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/medicines">
              <Card className="p-5 rounded-3xl glass-card-hover flex items-center gap-4 bg-white border border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Order Medicines</h3>
                  <p className="text-xs text-slate-400">Browse 260+ genuine items</p>
                </div>
              </Card>
            </Link>

            <button
              type="button"
              onClick={() => setPrescriptionModalOpen(true)}
              className="text-left"
            >
              <Card className="p-5 rounded-3xl glass-card-hover flex items-center gap-4 bg-white border border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Upload Prescription</h3>
                  <p className="text-xs text-slate-400">Pharmacist review</p>
                </div>
              </Card>
            </button>

            <Link href="/doctors">
              <Card className="p-5 rounded-3xl glass-card-hover flex items-center gap-4 bg-white border border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Consult Doctors</h3>
                  <p className="text-xs text-slate-400">Verified specialists</p>
                </div>
              </Card>
            </Link>
          </div>

          {/* Recent Orders Overview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#0A2540]">Recent Medicine Orders</h3>
              {orders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-[#00A896] hover:underline"
                >
                  View all orders &rarr;
                </button>
              )}
            </div>

            {orders.length === 0 ? (
              <Card className="p-8 text-center bg-white rounded-3xl border border-slate-200">
                <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-sm">No orders yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  When you purchase medicines or wellness devices, they will appear here with live tracking.
                </p>
                <Link href="/medicines" className="inline-block mt-4">
                  <Button variant="primary" size="sm" className="rounded-xl font-bold">
                    Start Shopping
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900">{order.order_number}</span>
                        <Badge variant="accent">{order.status}</Badge>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Placed on {formatDate(order.created_at)} &bull; {order.items?.length || 0} items
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-sm text-[#0A2540]">
                        {formatCurrency(order.total_amount)}
                      </span>
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Orders */}
      {activeTab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <Card className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-base text-[#0A2540]">No Past Orders Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                You haven&apos;t placed any medicine orders yet. Explore our genuine pharmacy catalog for 2-hour express delivery.
              </p>
              <div className="mt-5">
                <Link href="/medicines">
                  <Button variant="primary" className="rounded-2xl font-bold px-6">
                    Browse Medicines
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-[#0A2540]">
                          Order {order.order_number}
                        </span>
                        <Badge variant="accent">{order.status}</Badge>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {formatDate(order.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-[#0A2540]">
                        {formatCurrency(order.total_amount)}
                      </span>
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs">
                          Track Order
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="pt-3">
                    <span className="text-xs text-slate-500">
                      Order Status:{' '}
                      <strong className="text-slate-800">{order.status_display || order.status}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-[#0A2540]">Your Digital Prescription Vault</h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setPrescriptionModalOpen(true)}
              className="rounded-xl font-bold text-xs"
            >
              <UploadCloud className="h-4 w-4 mr-1.5" />
              <span>Upload New</span>
            </Button>
          </div>

          {prescriptions.length === 0 ? (
            <Card className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-base text-[#0A2540]">No Prescriptions Uploaded</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Securely store your medical prescriptions for fast 1-tap reorders and pharmacist review.
              </p>
              <div className="mt-5">
                <Button
                  variant="primary"
                  onClick={() => setPrescriptionModalOpen(true)}
                  className="rounded-2xl font-bold px-6"
                >
                  Upload Prescription
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-800">Prescription Record</span>
                      <Badge variant="accent">{rx.status}</Badge>
                    </div>
                    <div className="text-xs text-slate-400">
                      Uploaded on {formatDate(rx.created_at)}
                    </div>
                    {(rx.doctor_name || rx.patient_notes) && (
                      <div className="text-xs font-semibold text-slate-700 mt-2">
                        {rx.doctor_name ? `Prescribed by: ${rx.doctor_name}` : rx.patient_notes}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Private &amp; Encrypted</span>
                    <Link href={`/prescriptions`} className="text-[#00A896] font-bold hover:underline">
                      View Details &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Wishlist */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlistProducts.length === 0 ? (
            <Card className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <Heart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-base text-[#0A2540]">Your Wishlist is Empty</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Save essential medicines and wellness products to your wishlist for fast access.
              </p>
              <div className="mt-5">
                <Link href="/medicines">
                  <Button variant="primary" className="rounded-2xl font-bold px-6">
                    Discover Medicines
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {wishlistProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Saved Addresses */}
      {activeTab === 'addresses' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-[#0A2540]">Saved Delivery Addresses</h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddressModal(true)}
              className="rounded-xl font-bold text-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span>Add New Address</span>
            </Button>
          </div>

          {addresses.length === 0 ? (
            <Card className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-base text-[#0A2540]">No Saved Addresses</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Add your home or office address for fast 2-hour doorstep deliveries.
              </p>
              <div className="mt-5">
                <Button
                  variant="primary"
                  onClick={() => setShowAddressModal(true)}
                  className="rounded-2xl font-bold px-6"
                >
                  Add Address
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900">{addr.full_name}</span>
                      <Badge variant={addr.is_default ? 'accent' : 'default'}>
                        {addr.address_type || 'HOME'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {addr.address_line1}
                      {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                      {addr.landmark ? ` (Near ${addr.landmark})` : ''}
                    </p>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      {addr.city}, {addr.state} - {addr.postal_code}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Phone: {addr.phone}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {addr.is_default ? (
                      <span className="text-[11px] font-bold text-[#00A896]">Default Address</span>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await addressService.setDefaultAddress(addr.id);
                            setAddresses((prev) =>
                              prev.map((a) => ({ ...a, is_default: a.id === addr.id }))
                            );
                            addToast({
                              type: 'success',
                              title: 'Default Updated',
                              message: 'Primary address updated.',
                            });
                          } catch {
                            // ignore
                          }
                        }}
                        className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete address"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Address Modal */}
          {showAddressModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-[#0A2540] mb-4">Add Delivery Address</h3>
                <form onSubmit={handleSaveAddress} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                    <Input
                      placeholder="Receiver name"
                      value={addressForm.full_name}
                      onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                      required
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
                    <Input
                      placeholder="+91 98765 43210"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      required
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Address Line 1</label>
                    <Input
                      placeholder="Flat, House No, Building, Street"
                      value={addressForm.address_line1}
                      onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                      required
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
                      <Input
                        placeholder="City"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        required
                        className="rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Pincode</label>
                      <Input
                        placeholder="e.g. 380054"
                        value={addressForm.postal_code}
                        onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                        required
                        className="rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={addressLoading}
                      className="flex-1 rounded-xl font-bold text-xs h-10"
                    >
                      {addressLoading ? 'Saving...' : 'Save Address'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddressModal(false)}
                      className="rounded-xl text-xs h-10"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-xs text-slate-400">Loading MediSwift Portal...</div>}>
      <AccountDashboardContent />
    </Suspense>
  );
}
