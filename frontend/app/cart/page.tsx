'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart-store';
import { useUiStore } from '@/store/ui-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useNotificationStore } from '@/store/notification-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  UploadCloud,
  AlertCircle,
  ShieldCheck,
  Truck,
  Heart,
  Pill,
  Sparkles,
} from 'lucide-react';

const FREE_SHIPPING_THRESHOLD = 500;

export default function CartPage() {
  const router = useRouter();
  const { items, totalItems, subtotal, requiresPrescription, updateQuantity, removeItem } = useCartStore();
  const { setPrescriptionModalOpen, activePincode } = useUiStore();
  const { toggleProduct, hasProduct } = useWishlistStore();
  const { addToast } = useNotificationStore();

  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const remainingForFreeDelivery = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const deliveryFee = subtotal >= FREE_SHIPPING_THRESHOLD || totalItems === 0 ? 0 : 49;
  const grandTotal = subtotal + deliveryFee;

  const handleSaveForLater = (productId: string, productName: string) => {
    if (!hasProduct(productId)) {
      toggleProduct(productId);
    }
    removeItem(productId);
    addToast({
      type: 'info',
      title: 'Moved to Wishlist',
      message: `${productName} moved to your saved items.`,
    });
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-3xl bg-teal-50 text-[#00A896] flex items-center justify-center mx-auto mb-4 shadow-xs">
          <ShoppingBag className="h-10 w-10 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0A2540]">Your Shopping Basket is Empty</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-8 max-w-md mx-auto leading-relaxed">
          Looks like you haven&apos;t added any medicines or healthcare products yet. Explore our genuine pharmacy catalog.
        </p>
        <Link href="/medicines">
          <Button variant="primary" size="lg" className="rounded-2xl font-bold shadow-md shadow-[#00A896]/20">
            Browse 250+ Medicines
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-10">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540]">
          Shopping Basket ({totalItems} {totalItems === 1 ? 'item' : 'items'})
        </h1>
        <div className="text-xs text-slate-500">
          Delivering to Pincode: <strong className="text-slate-800">{activePincode}</strong>
        </div>
      </div>

      {/* Free Delivery Banner */}
      <div className="mb-6 p-4 rounded-3xl bg-white border border-teal-200/80 shadow-xs">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-slate-800 flex items-center gap-2">
            <Truck className="h-4 w-4 text-[#00A896]" />
            {remainingForFreeDelivery === 0 ? (
              <strong className="text-emerald-700">Congratulations! You unlocked FREE 2-Hour Express Delivery.</strong>
            ) : (
              <>Add <strong>{formatCurrency(remainingForFreeDelivery)}</strong> more to unlock FREE Express Delivery</>
            )}
          </span>
          <span className="text-xs font-black text-[#00A896]">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-[#00A896] transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Rx Warning Banner */}
          {requiresPrescription && (
            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-amber-950 text-sm">Doctor&apos;s Prescription Required</div>
                  <p className="text-amber-800 mt-0.5 leading-relaxed">
                    Some items in your basket require a valid doctor&apos;s prescription under Indian drug regulations.
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPrescriptionModalOpen(true)}
                className="rounded-xl shrink-0 font-bold"
              >
                <UploadCloud className="h-4 w-4 mr-1.5" />
                <span>Upload Now</span>
              </Button>
            </div>
          )}

          {/* Cart Item Cards */}
          <div className="space-y-3">
            {items.map((item) => {
              const prod = item.product;
              const imgUrl = prod.image_url || prod.primary_image || (prod.gallery_images && prod.gallery_images[0]);
              const discountVal = parseFloat(prod.discount_percent || prod.discount_percentage || '0');

              return (
                <Card key={item.id} className="p-4 sm:p-5 rounded-3xl border border-slate-200/80 bg-white shadow-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Media & Details */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {imgUrl ? (
                          <Image src={imgUrl} alt={prod.name} fill sizes="96px" className="object-cover" />
                        ) : (
                          <Pill className="h-8 w-8 text-[#00A896] stroke-1" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-[#00A896] uppercase tracking-wider">
                            {prod.brand_name || prod.category_name}
                          </span>
                          {prod.prescription_required && (
                            <Badge variant="rx" className="text-[9px] px-1.5 py-0">Rx Required</Badge>
                          )}
                        </div>

                        <Link href={`/medicines/${prod.slug}`}>
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 hover:text-[#00A896] transition-colors line-clamp-1">
                            {prod.name}
                          </h3>
                        </Link>

                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {prod.dosage_form} • {prod.pack_size}
                        </p>

                        {/* Save for later / Remove buttons */}
                        <div className="flex items-center gap-4 mt-3 text-xs">
                          <button
                            type="button"
                            onClick={() => handleSaveForLater(prod.id, prod.name)}
                            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium transition-colors"
                          >
                            <Heart className="h-3.5 w-3.5" />
                            <span>Save for later</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(prod.id)}
                            className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper & Price */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(prod.id, item.quantity - 1)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-800 min-w-[28px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(prod.id, item.quantity + 1)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-black text-[#0A2540]">
                          {formatCurrency(parseFloat(prod.discounted_price || prod.price) * item.quantity)}
                        </div>
                        {discountVal > 0 && (
                          <div className="text-[11px] text-slate-400 line-through">
                            {formatCurrency(parseFloat(prod.price || prod.price_inr || '0') * item.quantity)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2 text-xs">
            <Link href="/medicines" className="text-[#00A896] hover:underline font-bold flex items-center gap-1">
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right: Order Summary Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-6 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-4 sticky top-24">
            <h2 className="font-extrabold text-base text-[#0A2540] pb-3 border-b border-slate-100">
              Order Summary
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-[#00A896]" />
                  2-Hour Express Delivery
                </span>
                <span>
                  {deliveryFee === 0 ? (
                    <strong className="text-emerald-600 font-bold">FREE</strong>
                  ) : (
                    formatCurrency(deliveryFee)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Taxes & Handling</span>
                <span className="text-slate-400">Included</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline text-sm font-black text-[#0A2540]">
                <span>Total Amount</span>
                <span className="text-2xl text-[#0A2540]">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/checkout')}
              className="w-full rounded-2xl font-bold h-12 shadow-md shadow-[#00A896]/20"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#00A896] shrink-0" />
                <span>100% Genuine Pharmacy Sourcing Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#00A896] shrink-0" />
                <span>Contactless Express Delivery across {activePincode}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
