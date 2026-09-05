'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Address } from '@/types';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { MapPin, ShieldCheck, CheckCircle2, Plus } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useNotificationStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Address form fields
  const [fullName, setFullName] = useState('Aarav Patel');
  const [phone, setPhone] = useState('+91 9876543210');
  const [addressLine1, setAddressLine1] = useState('Flat 402, Lotus Residency');
  const [city, setCity] = useState('Ahmedabad');
  const [state, setState] = useState('Gujarat');
  const [postalCode, setPostalCode] = useState('380054');

  const deliveryFee = subtotal >= 500 ? 0 : 49;
  const grandTotal = subtotal + deliveryFee;

  useEffect(() => {
    if (!isAuthenticated) {
      addToast({
        type: 'warning',
        title: 'Sign in to complete order',
        message: 'Please sign in or register to place your medicine delivery.',
      });
      router.push('/account');
      return;
    }

    async function loadAddresses() {
      try {
        const res = await apiClient.get('/users/addresses/');
        if (res?.data?.data) {
          setAddresses(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedAddressId(res.data.data[0].id);
          } else {
            setShowAddressForm(true);
          }
        }
      } catch {
        // Handle error
      }
    }
    loadAddresses();
  }, [isAuthenticated, router, addToast]);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/users/addresses/', {
        full_name: fullName,
        phone,
        address_line1: addressLine1,
        city,
        state,
        postal_code: postalCode,
        is_default: true,
      });
      if (res?.data?.data) {
        setAddresses([...addresses, res.data.data]);
        setSelectedAddressId(res.data.data.id);
        setShowAddressForm(false);
        addToast({ type: 'success', message: 'Delivery address saved.' });
      }
    } catch {
      addToast({ type: 'error', message: 'Could not save address.' });
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      addToast({ type: 'warning', message: 'Please select a delivery address.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create backend order
      const res = await apiClient.post('/orders/checkout/', {
        shipping_address_id: selectedAddressId,
      });

      if (res?.data?.data) {
        const createdOrder = res.data.data;
        clearCart();
        addToast({
          type: 'success',
          title: 'Order Placed!',
          message: `Order #${createdOrder.order_number} confirmed. Express dispatch initiated.`,
        });
        router.push(`/orders/${createdOrder.id}`);
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Order Placement Error',
        message: 'Unable to place order. Please review prescription requirements or address.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-[#0A2540] mb-8">Secure Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Address & Delivery Details */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0A2540] text-base flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#00A896]" />
                <span>Delivery Address</span>
              </h3>
              {!showAddressForm && (
                <Button variant="outline" size="sm" onClick={() => setShowAddressForm(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  <span>Add New</span>
                </Button>
              )}
            </div>

            {/* Saved Addresses List */}
            {!showAddressForm && addresses.length > 0 && (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between ${
                      selectedAddressId === addr.id
                        ? 'border-[#00A896] bg-teal-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{addr.full_name}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{addr.address_line1}</div>
                      <div className="text-xs text-slate-500">
                        {addr.city}, {addr.state} - {addr.postal_code}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Phone: {addr.phone}</div>
                    </div>
                    {selectedAddressId === addr.id && (
                      <CheckCircle2 className="h-5 w-5 text-[#00A896] shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Inline New Address Form */}
            {showAddressForm && (
              <form onSubmit={handleCreateAddress} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                  <Input
                    label="Contact Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Street Address / Flat / Building"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  required
                />
                <div className="grid grid-cols-3 gap-4">
                  <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} required />
                  <Input label="State" value={state} onChange={(e) => setState(e.target.value)} required />
                  <Input
                    label="Pincode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" variant="secondary" size="sm">
                    Save Address
                  </Button>
                  {addresses.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddressForm(false)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Right Order Summary & Confirm */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md space-y-4">
            <h3 className="font-bold text-[#0A2540] text-base">Payment Summary</h3>

            <div className="space-y-2.5 text-xs text-slate-600 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <span>Total Items</span>
                <span className="font-semibold text-slate-900">{items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery Charge</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="font-bold text-emerald-600">FREE</span>
                  ) : (
                    formatCurrency(deliveryFee)
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-base font-black text-[#0A2540] pt-1">
              <span>Grand Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
              onClick={handlePlaceOrder}
            >
              Place Order (Express Delivery)
            </Button>

            <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
              <ShieldCheck className="h-4 w-4 text-[#00A896] shrink-0" />
              <span>Cash on Delivery / UPI / Online Payment supported</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
