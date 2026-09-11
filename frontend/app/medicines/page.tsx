'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { productService } from '@/services/product-service';
import { Product, Category } from '@/types';
import { ProductCard } from '@/components/product-card';
import { ProductListRow } from '@/components/product-list-row';
import { ProductCardSkeleton, ProductListRowSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  SlidersHorizontal,
  Grid,
  List,
  X,
  Star,
  Check,
  RotateCcw,
  Pill,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

const POPULAR_BRANDS = [
  'Sun Pharma',
  'Cipla',
  'Dr. Reddy\'s',
  'Abbott',
  'Himalaya',
  'Zydus',
  'Lupin',
  'Torrent Pharma',
  'Glenmark',
  'Mankind',
];

function MedicinesMarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state reading
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialBrand = searchParams.get('brand') || '';
  const initialRx = searchParams.get('rx') || 'all';
  const initialSort = searchParams.get('sort') || 'popularity';
  const initialMinRating = Number(searchParams.get('min_rating')) || 0;
  const initialInStock = searchParams.get('in_stock') === 'true';
  const initialMaxPrice = Number(searchParams.get('max_price')) || 5000;

  // Local state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [rxFilter, setRxFilter] = useState(initialRx);
  const [sortBy, setSortBy] = useState(initialSort);
  const [minRating, setMinRating] = useState(initialMinRating);
  const [inStockOnly, setInStockOnly] = useState(initialInStock);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync URL search params
  const updateUrlParams = (paramsToUpdate: Record<string, string | number | boolean | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(paramsToUpdate).forEach(([key, val]) => {
      if (val === undefined || val === '' || val === 'all' || val === 0 || (key === 'in_stock' && !val) || (key === 'max_price' && Number(val) >= 5000)) {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });
    router.replace(`/medicines?${params.toString()}`, { scroll: false });
  };

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const catRes = await productService.getCategories();
        if (catRes?.data?.results) setCategories(catRes.data.results);
      } catch {
        // Handle error
      }
    }
    loadCategories();
  }, []);

  // Fetch products whenever filters change
  useEffect(() => {
    async function fetchCatalog() {
      setLoading(true);
      try {
        const res = await productService.getProducts({
          search: search || undefined,
          category: selectedCategory || undefined,
          brand: selectedBrand || undefined,
          prescription_required: rxFilter === 'rx' ? true : rxFilter === 'otc' ? false : undefined,
          sort: sortBy,
          min_rating: minRating > 0 ? minRating : undefined,
          in_stock: inStockOnly ? true : undefined,
          max_price: maxPrice < 5000 ? maxPrice : undefined,
          page_size: 60,
        });

        if (res?.data) {
          const items = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.results)
            ? res.data.results
            : [];
          setProducts(items);
        }
      } catch {
        // Handle gracefully
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchCatalog();
    }, 150);

    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedBrand, rxFilter, sortBy, minRating, inStockOnly, maxPrice]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedBrand('');
    setRxFilter('all');
    setSortBy('popularity');
    setMinRating(0);
    setInStockOnly(false);
    setMaxPrice(5000);
    router.replace('/medicines', { scroll: false });
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(selectedCategory) ||
    Boolean(selectedBrand) ||
    rxFilter !== 'all' ||
    sortBy !== 'popularity' ||
    minRating > 0 ||
    inStockOnly ||
    maxPrice < 5000;

  // Filter sidebar JSX
  const FilterContent = (
    <div className="space-y-6 text-xs">
      {/* Category selector */}
      <div>
        <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
          Specialty Categories
        </h4>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('');
              updateUrlParams({ category: undefined });
            }}
            className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
              selectedCategory === ''
                ? 'bg-[#00A896]/10 text-[#00A896] font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All Categories</span>
            {selectedCategory === '' && <Check className="h-3.5 w-3.5 text-[#00A896]" />}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                const newVal = selectedCategory === c.slug ? '' : c.slug;
                setSelectedCategory(newVal);
                updateUrlParams({ category: newVal || undefined });
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                selectedCategory === c.slug
                  ? 'bg-[#00A896]/10 text-[#00A896] font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">{c.name}</span>
              {selectedCategory === c.slug && <Check className="h-3.5 w-3.5 text-[#00A896]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Prescription Requirement */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2.5">
          Prescription Requirement
        </h4>
        <div className="space-y-1.5">
          {[
            { id: 'all', label: 'All Medicines' },
            { id: 'otc', label: 'Over The Counter (OTC)' },
            { id: 'rx', label: 'Prescription Required (Rx)' },
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900"
            >
              <input
                type="radio"
                name="rxFilter"
                checked={rxFilter === item.id}
                onChange={() => {
                  setRxFilter(item.id);
                  updateUrlParams({ rx: item.id === 'all' ? undefined : item.id });
                }}
                className="accent-[#00A896]"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Popular Brands */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2.5">
          Manufacturer / Brand
        </h4>
        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
          {POPULAR_BRANDS.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => {
                const newVal = selectedBrand === brand ? '' : brand;
                setSelectedBrand(newVal);
                updateUrlParams({ brand: newVal || undefined });
              }}
              className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition-colors ${
                selectedBrand === brand
                  ? 'bg-[#00A896]/10 text-[#00A896] font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">{brand}</span>
              {selectedBrand === brand && <Check className="h-3.5 w-3.5 text-[#00A896]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Max Price Range Slider */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
            Max Price
          </h4>
          <span className="font-bold text-[#00A896]">₹{maxPrice}</span>
        </div>
        <input
          type="range"
          min={50}
          max={5000}
          step={50}
          value={maxPrice}
          onChange={(e) => {
            const val = Number(e.target.value);
            setMaxPrice(val);
            updateUrlParams({ max_price: val < 5000 ? val : undefined });
          }}
          className="w-full accent-[#00A896] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>₹50</span>
          <span>₹5,000+</span>
        </div>
      </div>

      {/* Minimum Rating */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2.5">
          Customer Rating
        </h4>
        <div className="space-y-1.5">
          {[4, 3, 2].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                const newVal = minRating === r ? 0 : r;
                setMinRating(newVal);
                updateUrlParams({ min_rating: newVal || undefined });
              }}
              className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition-colors ${
                minRating === r ? 'bg-amber-50 text-amber-900 font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{r}★ & above</span>
              </span>
              {minRating === r && <Check className="h-3.5 w-3.5 text-amber-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* In Stock Only Checkbox */}
      <div className="pt-4 border-t border-slate-100">
        <label className="flex items-center gap-2.5 cursor-pointer text-slate-700">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => {
              setInStockOnly(e.target.checked);
              updateUrlParams({ in_stock: e.target.checked || undefined });
            }}
            className="accent-[#00A896] rounded h-4 w-4"
          />
          <span className="font-semibold">In-Stock Items Only</span>
        </label>
      </div>

      {/* Reset button inside sidebar */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="w-full rounded-xl text-slate-600 hover:text-rose-600 hover:border-rose-200"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            <span>Reset All Filters</span>
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-[#0A2540] tracking-tight">
          Medicines & Healthcare Marketplace
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore genuine medicines, diagnostic devices, and OTC healthcare essentials with 2-hour express delivery.
        </p>
      </div>

      {/* Top Search, Sort and View Controls Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              updateUrlParams({ search: e.target.value || undefined });
            }}
            placeholder="Search by brand name, salt composition, or symptom..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#00A896] focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                updateUrlParams({ search: undefined });
              }}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Right Sort & View Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Mobile filter toggle trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden rounded-xl"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
            <span>Filters</span>
          </Button>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                updateUrlParams({ sort: e.target.value });
              }}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#00A896] focus:outline-none cursor-pointer pr-8"
            >
              <option value="popularity">Sort: Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Customer Rating</option>
              <option value="newest">Newest Additions</option>
            </select>
          </div>

          {/* Grid vs List View Mode Switcher */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-[#00A896] shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-[#00A896] shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            Active Filters:
          </span>

          {search && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-800 px-3 py-1 rounded-full">
              &ldquo;{search}&rdquo;
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  updateUrlParams({ search: undefined });
                }}
              >
                <X className="h-3 w-3 text-slate-400 hover:text-slate-700" />
              </button>
            </span>
          )}

          {selectedCategory && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-teal-50 text-[#00A896] border border-teal-200 px-3 py-1 rounded-full">
              Category: {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('');
                  updateUrlParams({ category: undefined });
                }}
              >
                <X className="h-3 w-3 hover:text-teal-900" />
              </button>
            </span>
          )}

          {selectedBrand && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-800 px-3 py-1 rounded-full">
              Brand: {selectedBrand}
              <button
                type="button"
                onClick={() => {
                  setSelectedBrand('');
                  updateUrlParams({ brand: undefined });
                }}
              >
                <X className="h-3 w-3 hover:text-slate-700" />
              </button>
            </span>
          )}

          {rxFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-800 px-3 py-1 rounded-full">
              {rxFilter === 'rx' ? 'Rx Required' : 'OTC Only'}
              <button
                type="button"
                onClick={() => {
                  setRxFilter('all');
                  updateUrlParams({ rx: undefined });
                }}
              >
                <X className="h-3 w-3 hover:text-slate-700" />
              </button>
            </span>
          )}

          {minRating > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-full">
              {minRating}★ & above
              <button
                type="button"
                onClick={() => {
                  setMinRating(0);
                  updateUrlParams({ min_rating: undefined });
                }}
              >
                <X className="h-3 w-3 hover:text-amber-950" />
              </button>
            </span>
          )}

          {inStockOnly && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-full">
              In Stock Only
              <button
                type="button"
                onClick={() => {
                  setInStockOnly(false);
                  updateUrlParams({ in_stock: undefined });
                }}
              >
                <X className="h-3 w-3 hover:text-emerald-950" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-bold text-[#00A896] hover:underline ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Content: Sidebar + Products Grid/List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block lg:col-span-3 sticky top-24 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#00A896]" />
              <span>Filters</span>
            </h3>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {FilterContent}
        </div>

        {/* Products Listing Column */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Showing <strong>{products.length}</strong> healthcare products</span>
          </div>

          {loading ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <ProductListRowSkeleton key={i} />
                ))}
              </div>
            )
          ) : products.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="No matching medicines found"
              description="We couldn't find any products matching your specific filters. Try loosening your search criteria or resetting filters."
              actionLabel="Reset All Filters"
              onAction={handleResetFilters}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <ProductListRow key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#0A2540]/50 backdrop-blur-xs"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-[#00A896]" />
                  <span>Filter Products</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {FilterContent}
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full rounded-xl"
              >
                Apply Filters ({products.length} results)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MedicinesMarketplacePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading catalog...</div>}>
      <MedicinesMarketplaceContent />
    </Suspense>
  );
}
