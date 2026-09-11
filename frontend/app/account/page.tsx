'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth-service';
import { orderService } from '@/services/order-service';
import { prescriptionService } from '@/services/prescription-service';
import { productService } from '@/services/product-service';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useCartStore } from '@/store/cart-store';
import { useUiStore } from '@/store/ui-store';
import { Order, Prescription, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/product-card';
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
} from 'lucide-react';

import { Suspense } from 'react';

function AccountDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';

  const { user, isAuthenticated, setAuth, logout } = useAuthStore();
  const { addToast } = useNotificationStore();
  const { productIds, toggleProduct } = useWishlistStore();
  const { addItem } = useCartStore();
  const { setPrescriptionModalOpen, setCartDrawerOpen } = useUiStore();

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // Dashboard state
  const [orders, setOrders] = useState<Order[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);

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

  // Fetch dashboard data
  useEffect(() => {
    if (isAuthenticated) {
      async function loadUserData() {
        try {
          const [orderRes, rxRes] = await Promise.all([
            orderService.getOrders(),
            prescriptionService.getPrescriptions(),
          ]);
          if (orderRes?.data) {
            const list = Array.isArray(orderRes.data) ? orderRes.data : (orderRes.data as any).results || [];
            setOrders(list);
          }
          if (rxRes?.data) {
            const list = Array.isArray(rxRes.data) ? rxRes.data : (rxRes.data as any).results || [];
            setPrescriptions(list);
          }
        } catch {
          // Ignore
        }
      }
      loadUserData();
    }
  }, [isAuthenticated]);

  // Load wishlist products
  useEffect(() => {
    async function loadWishlistItems() {
      if (productIds.length === 0) {
        setWishlistProducts([]);
        return;
      }
      try {
        const res = await productService.getProducts({ page_size: 40 });
        if (res?.data?.results) {
          const matching = res.data.results.filter((p) => productIds.includes(p.id));
          setWishlistProducts(matching);
        }
      } catch {
        // Ignore
      }
    }
    loadWishlistItems();
  }, [productIds]);

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
        title: 'Account Created',
        message: 'You can now sign in with your credentials.',
      });
      setAuthTab('login');
      setLoginEmail(regEmail);
    } catch {
      addToast({
        type: 'error',
        title: 'Registration Error',
        message: 'Could not create account with provided information.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0A2540] to-[#00A896] text-white flex items-center justify-center font-bold text-2xl mx-auto mb-3 shadow-md">
            +
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540]">MediSwift Account</h1>
          <p className="text-xs text-slate-500 mt-1">Manage medicines, prescription uploads, and telehealth.</p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl">
          <div className="flex border-b border-slate-100 mb-6">
            <button
              onClick={() => setAuthTab('login')}
              className={`flex-1 pb-3 text-xs font-bold transition-colors ${
                authTab === 'login'
                  ? 'border-b-2 border-[#00A896] text-[#00A896]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthTab('register')}
              className={`flex-1 pb-3 text-xs font-bold transition-colors ${
                authTab === 'register'
                  ? 'border-b-2 border-[#00A896] text-[#00A896]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Account
            </button>
          </div>

          {authTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="rounded-xl text-xs"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full rounded-xl font-bold mt-2"
              >
                {loading ? 'Signing in...' : 'Sign In to Account'}
              </Button>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-slate-400">
                  Demo credentials: <strong className="text-slate-700">customer@mediswift.in</strong> / <strong className="text-slate-700">Customer@12345</strong>
                </span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">First Name</label>
                  <Input
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    required
                    className="rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Last Name</label>
                  <Input
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    required
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <Input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  className="rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
                <Input
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
                <Input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  className="rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Confirm Password</label>
                <Input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                  className="rounded-xl text-xs"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full rounded-xl font-bold mt-3"
              >
                {loading ? 'Creating account...' : 'Register Account'}
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      {/* Greeting Header & Profile Strip */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0A2540] to-[#00A896] text-white flex items-center justify-center font-black text-2xl shadow-md">
              {user.first_name?.[0] || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#0A2540]">
                  Hello, {user.first_name} {user.last_name}!
                </h1>
                <Badge variant="accent">{user.role}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
              {user.phone_number && <p className="text-xs text-slate-400">{user.phone_number}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Metric Counter Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Orders</span>
              <Package className="h-4 w-4 text-[#00A896]" />
            </div>
            <div className="text-2xl font-black text-[#0A2540] mt-1">{orders.length}</div>
            <div className="text-[10px] text-slate-400">Past purchases</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Prescriptions</span>
              <FileText className="h-4 w-4 text-[#00A896]" />
            </div>
            <div className="text-2xl font-black text-[#0A2540] mt-1">{prescriptions.length}</div>
            <div className="text-[10px] text-slate-400">In digital vault</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Saved Items</span>
              <Heart className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-[#0A2540] mt-1">{productIds.length}</div>
            <div className="text-[10px] text-slate-400">In your wishlist</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Express Delivery</span>
              <ShieldCheck className="h-4 w-4 text-[#00A896]" />
            </div>
            <div className="text-2xl font-black text-[#00A896] mt-1">Active</div>
            <div className="text-[10px] text-slate-400">2-hour guarantee</div>
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
          { id: 'addresses', label: 'Saved Addresses' },
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
          <span>My Doctor Appointments</span>
        </Link>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Quick Actions Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/medicines">
              <Card className="p-5 rounded-3xl glass-card-hover flex items-center gap-4 bg-white border border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Order Medicines</h3>
                  <p className="text-xs text-slate-400">260+ products available</p>
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
                  <p className="text-xs text-slate-400">Fast pharmacist review</p>
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
                  <p className="text-xs text-slate-400">500+ verified specialists</p>
                </div>
              </Card>
            </Link>
          </div>

          {/* Recent Orders Overview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#0A2540]">Recent Medicine Orders</h3>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-[#00A896] hover:underline"
              >
                View all orders →
              </button>
            </div>

            {orders.length === 0 ? (
              <Card className="p-8 text-center bg-white rounded-3xl border border-slate-200">
                <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">You haven&apos;t placed any orders yet.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 3).map((order) => (
                  <Card key={order.id} className="p-5 rounded-3xl border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{order.order_number}</span>
                        <Badge variant="success" className="text-[10px]">{order.status_display}</Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Placed on {formatDate(order.created_at)} • {order.items?.length || 1} items
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-black text-sm text-[#0A2540]">{formatCurrency(order.total_amount)}</span>
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs">
                          Track Order
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-base text-[#0A2540]">Your Order History</h3>
            <Link href="/medicines">
              <Button variant="outline" size="sm" className="rounded-xl text-xs">
                New Order
              </Button>
            </Link>
          </div>

          {orders.length === 0 ? (
            <Card className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800">No orders placed yet</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">Start browsing genuine pharmaceuticals.</p>
              <Link href="/medicines">
                <Button variant="primary" size="sm" className="rounded-xl">Browse Catalog</Button>
              </Link>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="p-5 rounded-3xl border border-slate-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-900">{order.order_number}</span>
                    <Badge variant="success">{order.status_display}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    Placed on {formatDate(order.created_at)} • Tracking ID: <span className="font-mono">{order.tracking_number}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 block">Total</span>
                    <span className="font-black text-base text-[#0A2540]">{formatCurrency(order.total_amount)}</span>
                  </div>
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="primary" size="sm" className="rounded-xl font-bold">
                      Track Order
                    </Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-base text-[#0A2540]">Your Uploaded Prescriptions</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPrescriptionModalOpen(true)}
              className="rounded-xl font-bold"
            >
              <UploadCloud className="h-4 w-4 mr-1.5" />
              <span>Upload New</span>
            </Button>
          </div>

          <Link href="/prescriptions" className="block text-xs font-semibold text-[#00A896] hover:underline mb-4">
            Open Full Prescription Vault →
          </Link>

          {prescriptions.length === 0 ? (
            <Card className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800">No prescriptions found</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">Upload a prescription to unlock Rx-restricted medications.</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setPrescriptionModalOpen(true)}
                className="rounded-xl"
              >
                Upload Prescription
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prescriptions.map((rx) => (
                <Card key={rx.id} className="p-5 rounded-3xl border border-slate-200 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-xs text-slate-900 truncate max-w-[200px]">{rx.original_filename}</span>
                    <Badge variant="default">{rx.status}</Badge>
                  </div>
                  {rx.doctor_name && <p className="text-xs text-[#00A896]">Dr. {rx.doctor_name}</p>}
                  <p className="text-[11px] text-slate-400 mt-2">Uploaded {formatDate(rx.created_at)}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'wishlist' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-base text-[#0A2540]">Your Saved Products</h3>
            <span className="text-xs text-slate-400">{productIds.length} items saved</span>
          </div>

          {wishlistProducts.length === 0 ? (
            <Card className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <Heart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800">Your wishlist is empty</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">Save products while browsing to view or buy later.</p>
              <Link href="/medicines">
                <Button variant="primary" size="sm" className="rounded-xl">Explore Medicines</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlistProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-base text-[#0A2540]">Saved Delivery Addresses</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5 rounded-3xl border border-teal-200 bg-teal-50/40 relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#00A896]" />
                  <span className="font-bold text-xs text-slate-900">Home Address (Default)</span>
                </div>
                <Badge variant="success" className="text-[9px]">Verified Pincode</Badge>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {user.first_name} {user.last_name} <br />
                Flat 402, Shivalik Highstreet, SG Highway <br />
                Ahmedabad, Gujarat - 380054 <br />
                Phone: {user.phone_number || '+91 9876543210'}
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading account dashboard...</div>}>
      <AccountDashboardContent />
    </Suspense>
  );
}
