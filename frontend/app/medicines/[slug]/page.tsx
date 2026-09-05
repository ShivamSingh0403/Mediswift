'use client';

import React, { useEffect, useState, use } from 'react';
import { productService } from '@/services/product-service';
import { Product } from '@/types';
import { useCartStore } from '@/store/cart-store';
import { useNotificationStore } from '@/store/notification-store';
import { useUiStore } from '@/store/ui-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { ShieldCheck, Truck, Plus, Minus, UploadCloud, AlertCircle } from 'lucide-react';

export default function MedicineDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { addItem } = useCartStore();
  const { addToast } = useNotificationStore();
  const { setPrescriptionModalOpen } = useUiStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await productService.getProductBySlug(slug);
        if (res?.data) setProduct(res.data);
      } catch {
        // Error handling
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        Product not found.
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    addToast({
      type: 'success',
      title: 'Added to Cart',
      message: `${quantity}x ${product.name} added to your cart.`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Left Image Placeholder/Container */}
        <div className="md:col-span-5">
          <div className="sticky top-24 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xs flex flex-col items-center justify-center min-h-[350px]">
            <div className="w-28 h-28 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center font-black text-3xl mb-4">
              Rx
            </div>
            <h3 className="font-bold text-slate-800 text-center">{product.name}</h3>
            <p className="text-xs text-slate-400 mt-1">{product.pack_size}</p>
          </div>
        </div>

        {/* Right Product Details */}
        <div className="md:col-span-7 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.prescription_required ? (
                <Badge variant="rx">Prescription Required</Badge>
              ) : (
                <Badge variant="success">Over The Counter</Badge>
              )}
              <Badge variant="default">{product.dosage_form}</Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540]">{product.name}</h1>
            <p className="text-sm font-medium text-[#00A896] mt-1">{product.generic_name}</p>
            {product.manufacturer && (
              <p className="text-xs text-slate-500 mt-1">Manufacturer: {product.manufacturer}</p>
            )}
          </div>

          {/* Pricing Block */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-[#0A2540]">
                  {formatCurrency(product.discounted_price)}
                </span>
                {parseFloat(product.discount_percent) > 0 && (
                  <>
                    <span className="text-sm text-slate-400 line-through">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      {Math.round(parseFloat(product.discount_percent))}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Inclusive of all taxes</p>
            </div>

            {/* Quantity Controller & Add to Cart */}
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-slate-600 hover:text-slate-900"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-3 text-xs font-bold text-slate-800">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 text-slate-600 hover:text-slate-900"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button variant="primary" size="md" onClick={handleAddToCart}>
                Add to Cart
              </Button>
            </div>
          </div>

          {/* Rx Upload Alert Banner */}
          {product.prescription_required && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-amber-900">A valid prescription is required for this medicine</div>
                <p className="text-amber-700 mt-0.5">
                  You can upload your prescription now or during checkout for verification by our certified pharmacists.
                </p>
                <button
                  onClick={() => setPrescriptionModalOpen(true)}
                  className="mt-2 text-xs font-semibold text-[#00A896] hover:underline flex items-center gap-1"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload Prescription Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Detailed Product Info */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-5 border border-slate-200/80">
              <h3 className="font-bold text-[#0A2540] text-sm mb-2">Description & Uses</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{product.description}</p>
            </div>

            {product.composition && (
              <div className="rounded-2xl bg-white p-5 border border-slate-200/80">
                <h3 className="font-bold text-[#0A2540] text-sm mb-2">Salt Composition</h3>
                <p className="text-xs text-slate-600">{product.composition}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
