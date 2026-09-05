'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { productService } from '@/services/product-service';
import { Product } from '@/types';
import { useCartStore } from '@/store/cart-store';
import { useNotificationStore } from '@/store/notification-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Plus } from 'lucide-react';

export default function CategoryProductsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { addItem } = useCartStore();
  const { addToast } = useNotificationStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategoryProducts() {
      try {
        const res = await productService.getProducts({ category: slug });
        if (res?.data?.results) setProducts(res.data.results);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    loadCategoryProducts();
  }, [slug]);

  const handleAdd = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    addToast({
      type: 'success',
      title: 'Added to Cart',
      message: `${product.name} added to cart.`,
    });
  };

  const formattedTitle = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0A2540]">{formattedTitle}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Browse specialized pharmaceuticals and healthcare supplies in this category.
        </p>
      </div>

      {products.length === 0 && !loading ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm">No medicines found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="glass-card-hover flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  {product.prescription_required ? (
                    <Badge variant="rx">Rx Required</Badge>
                  ) : (
                    <Badge variant="success">OTC</Badge>
                  )}
                  {parseFloat(product.discount_percent) > 0 && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {Math.round(parseFloat(product.discount_percent))}% OFF
                    </span>
                  )}
                </div>

                <Link href={`/medicines/${product.slug}`} className="block group">
                  <h4 className="font-bold text-slate-900 group-hover:text-[#00A896] transition-colors line-clamp-2">
                    {product.name}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-1">{product.generic_name}</p>
                </Link>

                <div className="text-[11px] text-slate-400 mt-2">{product.pack_size}</div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-[#0A2540]">
                    {formatCurrency(product.discounted_price)}
                  </div>
                  {parseFloat(product.discount_percent) > 0 && (
                    <div className="text-xs text-slate-400 line-through">
                      {formatCurrency(product.price)}
                    </div>
                  )}
                </div>

                <Button size="sm" variant="primary" onClick={(e) => handleAdd(product, e)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>Add</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
