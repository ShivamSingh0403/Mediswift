'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '@/store/ui-store';
import { useCartStore } from '@/store/cart-store';
import { useNotificationStore } from '@/store/notification-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import {
  X,
  Plus,
  Minus,
  Star,
  Pill,
  Heart,
  ShieldCheck,
  Truck,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export function ProductQuickViewModal() {
  const { quickViewProduct, setQuickViewProduct, setPrescriptionModalOpen, setCartDrawerOpen } = useUiStore();
  const { addItem } = useCartStore();
  const { addToast } = useNotificationStore();
  const { hasProduct, toggleProduct } = useWishlistStore();
  const [quantity, setQuantity] = useState(1);

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const isWishlisted = hasProduct(product.id);
  const imageUrl = product.image_url || product.primary_image || (product.gallery_images && product.gallery_images[0]);
  const discountVal = parseFloat(product.discount_percent || product.discount_percentage || '0');
  const ratingVal = parseFloat(product.rating || '4.5');
  const reviewCount = product.review_count || 48;

  const handleAddToCart = () => {
    addItem(product, quantity);
    addToast({
      type: 'success',
      title: 'Added to Cart',
      message: `${quantity}x ${product.name} added to your basket.`,
    });
    setQuickViewProduct(null);
    setCartDrawerOpen(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setQuickViewProduct(null)}
          className="fixed inset-0 bg-[#0A2540]/60 backdrop-blur-xs transition-opacity"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 my-8"
        >
          {/* Close Button */}
          <button
            onClick={() => setQuickViewProduct(null)}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* Image section */}
            <div className="relative aspect-square sm:aspect-auto bg-slate-50 flex items-center justify-center p-6 border-b sm:border-b-0 sm:border-r border-slate-100">
              {imageUrl ? (
                <div className="relative w-full h-full min-h-[240px]">
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover rounded-2xl"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-[#00A896]">
                  <Pill className="h-16 w-16 stroke-1 opacity-70 mb-2" />
                  <span className="text-xs font-semibold text-slate-500">{product.dosage_form}</span>
                </div>
              )}

              {/* Rx Badge */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                {product.prescription_required ? (
                  <Badge variant="rx" className="shadow-xs font-bold text-[10px]">Rx Required</Badge>
                ) : (
                  <Badge variant="success" className="shadow-xs font-bold text-[10px]">OTC</Badge>
                )}
              </div>
            </div>

            {/* Content section */}
            <div className="p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-bold text-[#00A896] uppercase tracking-wider">
                    {product.brand_name || product.category_name}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{ratingVal.toFixed(1)}</span>
                    <span className="text-slate-400 font-normal">({reviewCount})</span>
                  </div>
                </div>

                <h3 className="font-extrabold text-lg text-slate-900 leading-snug">
                  {product.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {product.short_description || product.description || product.generic_name}
                </p>

                <div className="flex items-center gap-2 mt-3 text-xs text-slate-600 font-medium">
                  <span className="bg-slate-100 px-2.5 py-0.5 rounded-md">
                    {product.dosage_form} {product.strength ? `• ${product.strength}` : ''}
                  </span>
                  <span className="text-slate-400">{product.pack_size}</span>
                </div>

                {/* Price block */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline gap-3">
                  <span className="text-2xl font-black text-[#0A2540]">
                    {formatCurrency(product.discounted_price)}
                  </span>
                  {discountVal > 0 && (
                    <>
                      <span className="text-xs text-slate-400 line-through">
                        {formatCurrency(product.price || product.price_inr)}
                      </span>
                      <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {Math.round(discountVal)}% OFF
                      </span>
                    </>
                  )}
                </div>

                {/* Rx Warning */}
                {product.prescription_required && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Doctor&apos;s prescription required before fulfillment.</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  {/* Quantity Stepper */}
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-800 min-w-[24px] text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleAddToCart}
                    className="flex-1 rounded-xl font-bold shadow-sm shadow-[#00A896]/20"
                  >
                    Add to Cart
                  </Button>

                  <button
                    type="button"
                    onClick={() => toggleProduct(product.id)}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      isWishlisted
                        ? 'border-rose-200 bg-rose-50 text-rose-600'
                        : 'border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                    title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  >
                    <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>

                <Link
                  href={`/medicines/${product.slug}`}
                  onClick={() => setQuickViewProduct(null)}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#00A896] hover:underline w-full text-center"
                >
                  <span>View Full Product Details & Clinical Information</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
