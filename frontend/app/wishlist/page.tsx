'use client';

import React from 'react';
import Link from 'next/link';
import { useWishlistStore } from '@/store/wishlist-store';
import { useCartStore } from '@/store/cart-store';
import { useNotificationStore } from '@/store/notification-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { MedicineImage } from '@/components/ui/medicine-image';

export default function WishlistPage() {
  const { products, removeProduct, moveToCart, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { addToast } = useNotificationStore();

  const handleMoveToCart = (id: string) => {
    moveToCart(id, (p) => {
      addItem(p, 1);
      addToast({
        type: 'success',
        message: `${p.name} moved to your cart.`,
      });
    });
  };

  const handleRemove = (id: string, name: string) => {
    removeProduct(id);
    addToast({
      type: 'info',
      message: `${name} removed from wishlist.`,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540] flex items-center gap-2">
            <Heart className="h-7 w-7 text-rose-500 fill-rose-500" />
            <span>My Healthcare Wishlist</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Saved medicines, wellness essentials, and health monitors.
          </p>
        </div>

        {products.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => clearWishlist()}>
            Clear Wishlist
          </Button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-lg mx-auto p-6">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Your wishlist is empty</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6 max-w-sm mx-auto">
            Explore our verified pharmacy catalog and tap the heart icon on any medicine to save it for later.
          </p>
          <Link href="/products">
            <Button variant="primary" size="md">
              Explore Pharmacy Catalog
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between shadow-xs overflow-hidden">
              <div>
                <Link href={`/medicines/${product.slug}`} className="block relative h-40 rounded-xl overflow-hidden mb-3 border border-slate-100">
                  <MedicineImage
                    product={product}
                    className="w-full h-full"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </Link>
                <Link href={`/medicines/${product.slug}`}>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1 hover:text-[#00A896] transition-colors">{product.name}</h3>
                </Link>
                <p className="text-xs text-slate-400 mt-0.5">{product.dosage_form} • {product.pack_size}</p>
                <div className="mt-2 text-sm font-black text-[#0A2540]">
                  {formatCurrency(parseFloat(product.discounted_price || product.price))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleMoveToCart(product.id)}
                  className="flex-1 text-xs"
                >
                  <ShoppingBag className="h-3.5 w-3.5 mr-1" /> Move to Cart
                </Button>
                <button
                  type="button"
                  onClick={() => handleRemove(product.id, product.name)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Remove from wishlist"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
