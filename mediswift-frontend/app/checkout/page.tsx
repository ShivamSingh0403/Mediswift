'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { formatINR } from '@/lib/currency';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Truck,
  Lock,
} from 'lucide-react';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const isSuccess = searchParams.get('success') === 'true';
  const isCancelled = searchParams.get('cancelled') === 'true';
  const orderId = searchParams.get('order_id');

  const { items, clearCart, getTotalPrice } = useCartStore();
  const { user } = useAuthStore();

  const [shippingAddress, setShippingAddress] = useState(user?.address || '');
  const [contactPhone, setContactPhone] = useState(user?.phone_number || '');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto clear cart if redirected back from a successful Stripe checkout
  useEffect(() => {
    if (isSuccess) {
      clearCart();
    }
  }, [isSuccess, clearCart]);

  // Update initial fields from user profile if loaded
  useEffect(() => {
    if (user) {
      if (user.address && !shippingAddress) setShippingAddress(user.address);
      if (user.phone_number && !contactPhone) setContactPhone(user.phone_number);
    }
  }, [user]);

  const subtotal = getTotalPrice();
  const shippingFee = subtotal > 499 || subtotal === 0 ? 0 : 49.0;
  const grandTotal = subtotal + shippingFee;

  const handleInitiateStripeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (items.length === 0) {
      setErrorMessage('Your cart is empty. Please add items before proceeding.');
      return;
    }

    if (!shippingAddress.trim() || !contactPhone.trim()) {
      setErrorMessage('Please provide your delivery address and contact phone number.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        items: items.map((i) => ({
          medicine_id: i.id,
          quantity: i.quantity,
        })),
        shipping_address: shippingAddress,
        contact_phone: contactPhone,
      };

      const response = await api.post('/checkout/create-session/', payload);

      if (response.data?.session_url) {
        // Redirect directly to Stripe Hosted Checkout
        window.location.href = response.data.session_url;
      } else {
        throw new Error('Stripe session URL was not returned by the server.');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        'Failed to initialize Stripe checkout. Please try again.';
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  // SUCCESS VIEW
  if (isSuccess) {
    return (
      <ProtectedRoute>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wider">
              Payment Verified
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Order Confirmed & Paid!
            </h1>
            <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
              Your Stripe payment was completed successfully. Our licensed dispensary is preparing your pharmaceuticals for rapid delivery.
            </p>
          </div>

          {orderId && (
            <div className="inline-block bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-xs">
              <div className="text-xs text-slate-400 font-semibold uppercase">Tracking Reference</div>
              <div className="text-xl font-mono font-bold text-slate-900 mt-0.5">
                #MEDISWIFT-{orderId}
              </div>
            </div>
          )}

          <div className="pt-6 flex justify-center gap-4">
            <Link
              href="/medicines"
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              Order More Medicines
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded-xl transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute fallbackMessage="Sign in to your patient profile to proceed with encrypted checkout.">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="pb-6 border-b border-slate-200 mb-8">
          <div className="inline-flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Lock className="w-4 h-4" /> 256-Bit SSL Encrypted Checkout
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Review Order & Payment
          </h1>
        </div>

        {isCancelled && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
            <div>
              Payment session was cancelled. You can review your details below and retry anytime.
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <div>{errorMessage}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Delivery details form */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleInitiateStripeCheckout} id="stripe-checkout-form" className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-brand-600" /> Delivery Address & Contact
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street Address & Apartment *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="742 Evergreen Terrace, Springfield, IL 62704"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 (555) 234-5678"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Stripe Guarantee Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                    Stripe Checkout Gateway
                  </span>
                  <CreditCard className="w-6 h-6 text-teal-400" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You will be securely redirected to Stripe's hosted checkout to enter your card or digital wallet credentials. Mediswift never stores your raw financial information.
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> PCI-DSS Level 1 Certified Compliance
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || items.length === 0}
                className="w-full py-4 px-6 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-base hover:scale-[1.01]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Redirecting to Stripe...
                  </>
                ) : (
                  <>
                    Pay with Stripe ({formatINR(grandTotal)}) <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Order Items Summary */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Items in Cart ({items.reduce((s, i) => s + i.quantity, 0)})
              </h3>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=60'}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                      />
                      <div>
                        <h4 className="font-semibold text-slate-800 text-xs">{item.name}</h4>
                        <span className="text-[11px] text-slate-400">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatINR(Number(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery</span>
                  <span className="font-semibold text-slate-900">
                    {shippingFee === 0 ? 'FREE' : formatINR(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total Due</span>
                  <span className="text-brand-700">{formatINR(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
