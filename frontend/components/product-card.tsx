'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { useCartStore } from '@/store/cart-store';
import { useNotificationStore } from '@/store/notification-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useUiStore } from '@/store/ui-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Plus, Star, Pill, Sparkles, TrendingUp, Heart, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className = '' }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { addToast } = useNotificationStore();
  const { hasProduct, toggleProduct } = useWishlistStore();
  const { setQuickViewProduct, setCartDrawerOpen } = useUiStore();
  const [imgError, setImgError] = useState(false);

  const isWishlisted = hasProduct(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    addToast({
      type: 'success',
      title: 'Added to Cart',
      message: `${product.name} added to your basket.`,
    });
    setCartDrawerOpen(true);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleProduct(product.id);
    addToast({
      type: 'info',
      title: isWishlisted ? 'Removed from Wishlist' : 'Saved to Wishlist',
      message: `${product.name} ${isWishlisted ? 'removed from' : 'saved to'} your favorites.`,
    });
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  let resolvedImageUrl = product.image_url || product.primary_image || (product.gallery_images && product.gallery_images[0]);
  if (resolvedImageUrl && resolvedImageUrl.startsWith('/media/')) {
    resolvedImageUrl = `http://localhost:8000${resolvedImageUrl}`;
  }
  const discountVal = parseFloat(product.discount_percent || product.discount_percentage || '0');
  const ratingVal = parseFloat(product.rating || '4.5');
  const reviewCount = product.review_count || 45;

  return (
    <Card className={`glass-card-hover flex flex-col justify-between overflow-hidden group p-0 border border-slate-200/80 bg-white hover:border-[#00A896]/40 transition-all duration-300 ${className}`}>
      {/* Top Media & Floating Actions Area */}
      <div className="relative">
        <Link href={`/medicines/${product.slug}`} className="block relative h-48 w-full bg-slate-50 overflow-hidden">
          {resolvedImageUrl && !imgError ? (
            <Image
              src={resolvedImageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 25vw, 20vw"
              className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/40 to-slate-100 border-b border-slate-100 p-4 text-center select-none">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-teal-100/80 flex items-center justify-center text-[#00A896] group-hover:scale-110 group-hover:border-[#00A896]/40 transition-all duration-300">
                <Pill className="h-7 w-7" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 mt-2 tracking-tight line-clamp-1">
                {product.brand_name || product.dosage_form || 'MediSwift Genuine'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium line-clamp-1">
                {product.pack_size || 'Verified Pharmaceutical'}
              </span>
            </div>
          )}

          {/* Gradient Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A2540]/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.prescription_required ? (
            <Badge variant="rx" className="shadow-xs backdrop-blur-md bg-rose-600/90 text-white border-0 font-bold text-[10px]">
              Rx Required
            </Badge>
          ) : (
            <Badge variant="success" className="shadow-xs backdrop-blur-md bg-emerald-600/90 text-white border-0 font-bold text-[10px]">
              OTC
            </Badge>
          )}

          {product.bestseller && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded shadow-xs">
              <Sparkles className="h-2.5 w-2.5" /> Bestseller
            </span>
          )}

          {!product.bestseller && product.trending && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded shadow-xs">
              <TrendingUp className="h-2.5 w-2.5" /> Trending
            </span>
          )}
        </div>

        {/* Top Right Actions: Discount + Quick Icons */}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5 z-10">
          {discountVal > 0 && (
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100/95 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-xs">
              {Math.round(discountVal)}% OFF
            </span>
          )}

          {/* Quick Action Floating Buttons (appear on hover on desktop) */}
          <div className="flex flex-col gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleWishlist}
              className={`p-1.5 rounded-full shadow-sm backdrop-blur-md transition-all ${
                isWishlisted
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-white/90 text-slate-600 hover:text-rose-600 hover:bg-white'
              }`}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleQuickView}
              className="p-1.5 rounded-full bg-white/90 text-slate-600 hover:text-[#00A896] hover:bg-white shadow-sm backdrop-blur-md transition-all"
              title="Quick preview"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-medium text-[#00A896] uppercase tracking-wider truncate">
              {product.category_name || product.brand_name || 'Healthcare'}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 shrink-0">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{ratingVal.toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({reviewCount})</span>
            </div>
          </div>

          {/* Title */}
          <Link href={`/medicines/${product.slug}`} className="block group/link">
            <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover/link:text-[#00A896] transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h4>
          </Link>

          {/* Generic / Salt Name */}
          <p className="text-xs text-slate-500 line-clamp-1 mt-1" title={product.generic_name}>
            {product.generic_name}
          </p>

          {/* Dosage & Pack */}
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500 font-medium">
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {product.dosage_form} {product.strength ? `• ${product.strength}` : ''}
            </span>
            <span className="text-slate-400 truncate">{product.pack_size}</span>
          </div>
        </div>

        {/* Pricing & Add to Cart Footer */}
        <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="text-lg font-black text-[#0A2540]">
              {formatCurrency(product.discounted_price)}
            </div>
            {discountVal > 0 && (
              <div className="text-xs text-slate-400 line-through">
                {formatCurrency(product.price || product.price_inr)}
              </div>
            )}
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={handleAdd}
            className="rounded-xl px-3 h-8 shadow-xs hover:shadow-teal-500/20 active:scale-95 transition-all"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Add</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
