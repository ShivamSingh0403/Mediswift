'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { productService } from '@/services/product-service';
import { Product, Category } from '@/types';
import { useCartStore } from '@/store/cart-store';
import { useNotificationStore } from '@/store/notification-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Search, Plus } from 'lucide-react';

function MedicinesCatalogContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const { addItem } = useCartStore();
  const { addToast } = useNotificationStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [rxFilter, setRxFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          productService.getProducts({
            search: search || undefined,
            category: selectedCategory || undefined,
            prescription_required: rxFilter === 'rx' ? true : rxFilter === 'otc' ? false : undefined,
          }),
          productService.getCategories(),
        ]);
        if (prodRes?.data?.results) setProducts(prodRes.data.results);
        if (catRes?.data?.results) setCategories(catRes.data.results);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [search, selectedCategory, rxFilter]);

  const handleAdd = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    addToast({
      type: 'success',
      title: 'Added to Cart',
      message: `${product.name} added to cart.`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0A2540]">Medicines & Healthcare Catalog</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore genuine medicines, OTC supplements, and specialized pharmaceutical products.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by brand name, salt composition or condition..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#00A896] focus:outline-none focus:ring-2 focus:ring-[#00A896]/20"
          />
        </div>

        {/* Category dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full md:w-48 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 focus:border-[#00A896] focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>

        {/* Rx requirement toggle */}
        <select
          value={rxFilter}
          onChange={(e) => setRxFilter(e.target.value)}
          className="w-full md:w-40 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 focus:border-[#00A896] focus:outline-none"
        >
          <option value="all">All Medicines</option>
          <option value="rx">Rx Required</option>
          <option value="otc">OTC Only</option>
        </select>
      </div>

      {/* Product Grid */}
      {products.length === 0 && !loading ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm">No medicines found matching the selected filters.</p>
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

export default function MedicinesCatalogPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading catalog...</div>}>
      <MedicinesCatalogContent />
    </Suspense>
  );
}
