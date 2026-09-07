'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { productService } from '@/services/product-service';
import { Product, Category } from '@/types';
import { ProductCard } from '@/components/product-card';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

function MedicinesCatalogContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [rxFilter, setRxFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popularity');
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
            sort: sortBy || undefined,
          }),
          productService.getCategories(),
        ]);
        if (prodRes?.data?.results) setProducts(prodRes.data.results);
        if (catRes?.data?.results) setCategories(catRes.data.results);
      } catch {
        // Handle error gracefully
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [search, selectedCategory, rxFilter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-[#0A2540] tracking-tight">
          Medicines & Healthcare Catalog
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore over 250 genuine medicines, OTC healthcare formulations, and specialized medical supplies.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-8 flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by medicine name, salt composition, or brand..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#00A896] focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 transition-all"
          />
        </div>

        {/* Category dropdown */}
        <div className="w-full md:w-52">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 focus:border-[#00A896] focus:outline-none cursor-pointer"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Rx requirement toggle */}
        <div className="w-full md:w-44">
          <select
            value={rxFilter}
            onChange={(e) => setRxFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 focus:border-[#00A896] focus:outline-none cursor-pointer"
          >
            <option value="all">All Prescriptions</option>
            <option value="rx">Rx Required Only</option>
            <option value="otc">Over The Counter (OTC)</option>
          </select>
        </div>

        {/* Sort dropdown */}
        <div className="w-full md:w-48 relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 focus:border-[#00A896] focus:outline-none cursor-pointer"
          >
            <option value="popularity">Sort: Most Popular</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest Additions</option>
          </select>
        </div>
      </div>

      {/* Active Count & Status */}
      <div className="flex items-center justify-between mb-4 px-1 text-xs text-slate-500 font-medium">
        <span>Showing {products.length} healthcare products</span>
        {(search || selectedCategory || rxFilter !== 'all' || sortBy !== 'popularity') && (
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('');
              setRxFilter('all');
              setSortBy('popularity');
            }}
            className="text-[#00A896] hover:underline font-semibold"
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-[#00A896]/20 border-t-[#00A896] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-xs">Loading healthcare catalog...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
          <p className="text-slate-600 font-semibold text-base mb-1">No medicines found</p>
          <p className="text-slate-400 text-xs">Try adjusting your search terms or filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
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
