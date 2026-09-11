'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { productService } from '@/services/product-service';
import { Product } from '@/types';
import { ProductCard } from '@/components/product-card';
import { ChevronLeft } from 'lucide-react';

export default function CategoryProductsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategoryProducts() {
      setLoading(true);
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

  const formattedTitle = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8">
      {/* Back button & title */}
      <div className="mb-8">
        <Link
          href="/medicines"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#00A896] mb-3 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to All Categories</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-[#0A2540]">{formattedTitle}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Browse genuine pharmaceuticals and healthcare supplies in this specialty.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-[#00A896]/20 border-t-[#00A896] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-xs">Loading products in {formattedTitle}...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200">
          <p className="text-slate-600 font-semibold text-base mb-1">No products found</p>
          <p className="text-slate-400 text-xs">No medicines are currently available in this category.</p>
        </div>
      ) : (
        <div>
          <div className="mb-4 text-xs font-medium text-slate-500">
            Showing {products.length} products
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
