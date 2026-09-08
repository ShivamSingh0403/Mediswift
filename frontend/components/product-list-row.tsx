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
import { formatCurrency } from '@/lib/utils';
import { Plus, Star, Pill, Sparkles, TrendingUp, Heart, Eye } from 'lucide-react';

interface ProductListRowProps {
  product: Product;
}

export function ProductListRow({ product }: ProductListRowProps) {
  const { addItem } = useCartStore();
  const { addToast } = useNotificationStore();
  const { hasProduct, toggleProduct } = useWishlistStore();
  const { setQuickViewProduct, setCartDrawerOpen } = useUiStore();
  const [imgError, setImgError] = useState(false);

  const isWishlisted = hasProduct(product.id);
  const imageUrl = product.image_url || product.primary_image || (product.gallery_images && product.gallery_images[0]);
  const discountVal = parseFloat(product.discount_percent || product.discount_percentage || '0');
  const ratingVal = parseFloat(product.rating || '4.5');
  const reviewCount = product.review_count || 45;

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

  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:border-[#00A896]/40 hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Left Media & Info */}
      <div className="flex items-start gap-4 min-w-0 flex-1">
        {/* Thumbnail */}
        <Link href={`/medicines/${product.slug}`} className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
          {imageUrl && !imgError ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="112px"
              className="object-cover group-hover:scale-105 transition-transform"
              onError={() => setImgError(true)}
            />
          ) : (
            <Pill className="h-8 w-8 text-[#00A896] stroke-1" />
          )}
        </Link>

        {/* Metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#00A896] uppercase tracking-wider">
              {product.brand_name || product.category_name}
            </span>
            {product.prescription_required ? (
              <Badge variant="rx" className="text-[9px] px-1.5 py-0">Rx Required</Badge>
            ) : (
              <Badge variant="success" className="text-[9px] px-1.5 py-0">OTC</Badge>
            )}
            {product.bestseller && (
              <span className="text-[9px] font-black uppercase bg-amber-500 text-white px-1.5 py-0.5 rounded">
                Bestseller
              </span>
            )}
          </div>

          <Link href={`/medicines/${product.slug}`}>
            <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#00A896] transition-colors line-clamp-1">
              {product.name}
            </h4>
          </Link>

          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5" title={product.generic_name}>
            Composition: {product.generic_name}
          </p>

          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
              {product.dosage_form} {product.strength ? `• ${product.strength}` : ''}
            </span>
            <span className="text-slate-400">{product.pack_size}</span>
            <div className="flex items-center gap-1 font-bold text-amber-500">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{ratingVal.toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({reviewCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pricing & Actions */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        <div className="text-left sm:text-right">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-[#0A2540]">
              {formatCurrency(product.discounted_price)}
            </span>
            {discountVal > 0 && (
              <span className="text-xs text-slate-400 line-through">
                {formatCurrency(product.price || product.price_inr)}
              </span>
            )}
          </div>
          {discountVal > 0 && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              {Math.round(discountVal)}% OFF
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleWishlist}
            className={`p-2 rounded-xl border transition-colors ${
              isWishlisted
                ? 'border-rose-200 bg-rose-50 text-rose-600'
                : 'border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
            title="Wishlist"
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setQuickViewProduct(product)}
            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-[#00A896] hover:bg-slate-50 transition-colors"
            title="Quick view"
          >
            <Eye className="h-4 w-4" />
          </button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleAdd}
            className="rounded-xl px-4 h-9 shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span>Add</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
