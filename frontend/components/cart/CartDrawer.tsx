'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cart-store';
import { useUiStore } from '@/store/ui-store';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { MedicineImage } from '@/components/ui/medicine-image';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Truck,
  Sparkles,
  Pill,
} from 'lucide-react';

const FREE_SHIPPING_THRESHOLD = 500;

export function CartDrawer() {
  const router = useRouter();
  const { isCartDrawerOpen, setCartDrawerOpen, setPrescriptionModalOpen } = useUiStore();
  const { items, totalItems, subtotal, requiresPrescription, updateQuantity, removeItem } = useCartStore();

  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const remainingForFreeDelivery = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const deliveryFee = subtotal >= FREE_SHIPPING_THRESHOLD || totalItems === 0 ? 0 : 49;
  const grandTotal = subtotal + deliveryFee;

  if (!isCartDrawerOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setCartDrawerOpen(false)}
          className="fixed inset-0 bg-[#0A2540]/50 backdrop-blur-xs transition-opacity"
        />

        {/* Drawer container */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#00A896] flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0A2540]">Shopping Basket</h2>
                  <p className="text-xs text-slate-500">{totalItems} {totalItems === 1 ? 'item' : 'items'} in cart</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCartDrawerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Free Shipping Progress Meter */}
            {totalItems > 0 && (
              <div className="p-4 bg-teal-50/60 border-b border-teal-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-[#00A896]" />
                    {remainingForFreeDelivery === 0 ? (
                      <strong className="text-emerald-700">Free Express Delivery Unlocked!</strong>
                    ) : (
                      <>Add <strong>{formatCurrency(remainingForFreeDelivery)}</strong> for Free Delivery</>
                    )}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">{progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-teal-100/70 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-[#00A896] transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Prescription Advisory Notice */}
            {requiresPrescription && totalItems > 0 && (
              <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-amber-800 text-[11px]">Valid doctor&apos;s prescription required for some items.</span>
                </div>
                <button
                  onClick={() => {
                    setCartDrawerOpen(false);
                    setPrescriptionModalOpen(true);
                  }}
                  className="text-[11px] font-bold text-[#00A896] hover:underline shrink-0"
                >
                  Upload
                </button>
              </div>
            )}

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="h-8 w-8 stroke-1" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">Your basket is empty</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto mb-6">
                    Add doctor prescriptions, daily vitamins, or healthcare essentials.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setCartDrawerOpen(false);
                      router.push('/medicines');
                    }}
                    className="rounded-xl shadow-xs"
                  >
                    Browse Medicines
                  </Button>
                </div>
              ) : (
                items.map((item) => {
                  const prod = item.product;
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3.5 p-3 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-16 h-16 rounded-xl bg-white border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                        <MedicineImage
                          product={prod}
                          className="w-full h-full"
                          sizes="64px"
                          compact={true}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <Link
                            href={`/medicines/${prod.slug}`}
                            onClick={() => setCartDrawerOpen(false)}
                            className="font-bold text-xs text-slate-900 hover:text-[#00A896] line-clamp-1 transition-colors"
                          >
                            {prod.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeItem(prod.id)}
                            className="text-slate-300 hover:text-rose-500 transition-colors p-0.5"
                            title="Remove item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {prod.dosage_form} • {prod.pack_size}
                        </p>

                        <div className="flex items-center justify-between mt-2.5">
                          {/* Quantity Stepper */}
                          <div className="flex items-center rounded-lg border border-slate-200 bg-white">
                            <button
                              type="button"
                              onClick={() => updateQuantity(prod.id, item.quantity - 1)}
                              className="p-1 text-slate-500 hover:text-slate-900"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(prod.id, item.quantity + 1)}
                              className="p-1 text-slate-500 hover:text-slate-900"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Price */}
                          <span className="text-xs font-black text-[#0A2540]">
                            {formatCurrency(parseFloat(prod.discounted_price || prod.price) * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {items.length > 0 && (
              <div className="p-5 border-t border-slate-100 bg-white space-y-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Express Delivery (2 hr)</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <strong className="text-emerald-600 font-bold">FREE</strong>
                      ) : (
                        formatCurrency(deliveryFee)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-[#0A2540] pt-2 border-t border-slate-100">
                    <span>Estimated Total</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => {
                      setCartDrawerOpen(false);
                      router.push('/checkout');
                    }}
                    className="w-full rounded-2xl font-bold shadow-md shadow-[#00A896]/20 h-11"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setCartDrawerOpen(false);
                      router.push('/cart');
                    }}
                    className="w-full rounded-2xl text-xs font-semibold"
                  >
                    View Full Cart
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                  <ShieldCheck className="h-3 w-3 text-[#00A896]" />
                  <span>256-Bit SSL Encrypted Healthcare Checkout</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
