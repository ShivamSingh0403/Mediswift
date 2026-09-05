'use client';

import React from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart-store';
import { useUiStore } from '@/store/ui-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, UploadCloud, AlertCircle, ShieldCheck } from 'lucide-react';

export default function CartPage() {
  const { items, totalItems, subtotal, requiresPrescription, updateQuantity, removeItem } = useCartStore();
  const { setPrescriptionModalOpen } = useUiStore();

  const deliveryFee = subtotal >= 500 || totalItems === 0 ? 0 : 49;
  const grandTotal = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-teal-50 text-[#00A896] flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#0A2540]">Your Shopping Cart is Empty</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          Add your monthly medicine prescriptions, healthcare products, or wellness essentials.
        </p>
        <Link href="/medicines">
          <Button variant="primary">Browse Medicines</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-[#0A2540] mb-8">Shopping Basket ({totalItems} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Rx Warning Banner if applicable */}
          {requiresPrescription && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-amber-950">Prescription Required for this order</div>
                  <p className="text-amber-700 mt-0.5">
                    Your cart contains medicines requiring doctor verification. Upload your prescription now or upload later in your order history.
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPrescriptionModalOpen(true)}
                className="shrink-0"
              >
                <UploadCloud className="h-4 w-4 mr-1.5" />
                <span>Upload</span>
              </Button>
            </div>
          )}

          {items.map((item) => (
            <Card key={item.product.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{item.product.name}</h3>
                  {item.product.prescription_required && <Badge variant="rx">Rx</Badge>}
                </div>
                <p className="text-xs text-[#00A896] mt-0.5">{item.product.generic_name}</p>
                <p className="text-xs text-slate-400 mt-1">{item.product.pack_size}</p>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                {/* Quantity Controls */}
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="p-1.5 text-slate-600 hover:text-slate-900"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-slate-800">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="p-1.5 text-slate-600 hover:text-slate-900"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="text-right min-w-[80px]">
                  <div className="text-sm font-bold text-[#0A2540]">
                    {formatCurrency(
                      parseFloat(item.product.discounted_price || item.product.price) * item.quantity
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {formatCurrency(item.product.discounted_price)} each
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.product.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary & Checkout Card */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md space-y-4">
            <h3 className="font-bold text-[#0A2540] text-base">Order Summary</h3>

            <div className="space-y-2.5 text-xs text-slate-600 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Estimated Delivery Fee</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="font-bold text-emerald-600">FREE</span>
                  ) : (
                    formatCurrency(deliveryFee)
                  )}
                </span>
              </div>
              {deliveryFee > 0 && (
                <div className="text-[11px] text-[#00A896]">
                  Add {formatCurrency(500 - subtotal)} more for FREE Delivery!
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-base font-black text-[#0A2540] pt-1">
              <span>To Pay</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>

            <Link href="/checkout">
              <Button variant="primary" size="lg" className="w-full mt-2">
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>

            <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
              <ShieldCheck className="h-4 w-4 text-[#00A896] shrink-0" />
              <span>Safe & Secure 256-bit encrypted checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
