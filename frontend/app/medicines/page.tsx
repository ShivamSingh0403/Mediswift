'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Stethoscope,
  ArrowRight,
  TrendingUp,
  Percent,
  Clock,
  ShieldCheck,
  Activity,
} from 'lucide-react';

const FEATURED_CATEGORIES = [
  { name: 'First Aid', slug: 'first-aid', icon: '🩹', color: 'from-rose-50 to-red-50/50 border-rose-200/80 text-rose-700' },
  { name: 'Medical Devices', slug: 'medical-devices', icon: '🩺', color: 'from-blue-50 to-indigo-50/50 border-blue-200/80 text-blue-700' },
  { name: 'Personal Care', slug: 'personal-care', icon: '🧴', color: 'from-teal-50 to-emerald-50/50 border-teal-200/80 text-teal-700' },
  { name: 'Oral Care', slug: 'oral-care', icon: '🪥', color: 'from-cyan-50 to-sky-50/50 border-cyan-200/80 text-cyan-700' },
  { name: 'Skin Care', slug: 'skin-care', icon: '✨', color: 'from-amber-50 to-yellow-50/50 border-amber-200/80 text-amber-700' },
  { name: 'Hair Care', slug: 'hair-care', icon: '💇', color: 'from-purple-50 to-violet-50/50 border-purple-200/80 text-purple-700' },
  { name: 'Baby Care', slug: 'baby-care', icon: '👶', color: 'from-pink-50 to-rose-50/50 border-pink-200/80 text-pink-700' },
  { name: "Women's Wellness", slug: 'womens-wellness', icon: '🌸', color: 'from-rose-50 to-pink-50/50 border-rose-200/80 text-rose-700' },
  { name: 'Fitness & Wellness', slug: 'fitness-wellness', icon: '🏋️', color: 'from-emerald-50 to-teal-50/50 border-emerald-200/80 text-emerald-700' },
  { name: 'Ayurveda & Wellness', slug: 'ayurveda-wellness', icon: '🍃', color: 'from-amber-50 to-orange-50/50 border-amber-200/80 text-amber-800' },
];

const POPULAR_BRANDS = [
  'Sun Pharma',
  'Cipla',
  "Dr. Reddy's",
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
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // URL state
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

  // Autocomplete state
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Product[]>([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);

  // Sync URL search params
  const updateUrlParams = (paramsToUpdate: Record<string, string | number | boolean | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(paramsToUpdate).forEach(([key, val]) => {
      if (
        val === undefined ||
        val === '' ||
        val === 'all' ||
        val === 0 ||
        (key === 'in_stock' && !val) ||
        (key === 'max_price' && Number(val) >= 5000)
      ) {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });
    router.replace(`/medicines?${params.toString()}`, { scroll: false });
  };

  // Close autocomplete on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsAutocompleteOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const catRes = await productService.getCategories();
        if (catRes?.data?.results) setCategories(catRes.data.results);
      } catch {
        // Handle error gracefully
      }
    }
    loadCategories();
  }, []);

  // Fetch products whenever filters change (with debounce)
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
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchCatalog();
    }, 150);

    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedBrand, rxFilter, sortBy, minRating, inStockOnly, maxPrice]);

  // Autocomplete fetcher
  useEffect(() => {
    if (!search || search.length < 2) {
      setAutocompleteSuggestions([]);
      setIsAutocompleteOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await productService.getProducts({
          search,
          page_size: 5,
        });
        if (res?.data) {
          const items = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.results)
            ? res.data.results
            : [];
          setAutocompleteSuggestions(items);
          setIsAutocompleteOpen(items.length > 0);
        }
      } catch {
        setAutocompleteSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [search]);

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

  // Reusable Filter Sidebar Content
  const FilterContent = (
    <div className="space-y-6 text-xs">
      {/* Category Filter */}
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
            { id: 'all', label: 'All Medicines & Care' },
            { id: 'otc', label: 'Over The Counter (OTC)' },
            { id: 'rx', label: 'Prescription Required (Rx)' },
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900 select-none"
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
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="truncate">{brand}</span>
              {selectedBrand === brand && <Check className="h-3 w-3 text-[#00A896]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
            Max Price (INR)
          </h4>
          <span className="font-bold text-[#00A896] text-xs">
            ₹{maxPrice.toLocaleString('en-IN')}
          </span>
        </div>
        <input
          type="range"
          min="100"
          max="5000"
          step="100"
          value={maxPrice}
          onChange={(e) => {
            const val = Number(e.target.value);
            setMaxPrice(val);
            updateUrlParams({ max_price: val >= 5000 ? undefined : val });
          }}
          className="w-full accent-[#00A896] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>₹100</span>
          <span>₹2,500</span>
          <span>₹5,000+</span>
        </div>
      </div>

      {/* In Stock Only Checkbox */}
      <div className="pt-4 border-t border-slate-100">
        <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 select-none">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => {
              setInStockOnly(e.target.checked);
              updateUrlParams({ in_stock: e.target.checked ? true : undefined });
            }}
            className="rounded border-slate-300 text-[#00A896] focus:ring-[#00A896]"
          />
          <span className="font-medium text-xs">In-Stock Items Only</span>
        </label>
      </div>

      {/* Customer Rating Filter */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2.5">
          Customer Rating
        </h4>
        <div className="flex gap-2">
          {[4, 3, 2].map((stars) => (
            <button
              key={stars}
              type="button"
              onClick={() => {
                const newVal = minRating === stars ? 0 : stars;
                setMinRating(newVal);
                updateUrlParams({ min_rating: newVal > 0 ? newVal : undefined });
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-center border text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                minRating === stars
                  ? 'border-[#00A896] bg-[#00A896]/10 text-[#00A896]'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{stars}★</span>
              <span className="text-[10px] font-normal">& up</span>
            </button>
          ))}
        </div>
      </div>

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
    <div className="min-h-screen bg-slate-50/50">
      {/* PART 5: HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0A2540] via-[#0D3B66] to-[#0A2540] text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="max-w-[1536px] mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-teal-200 backdrop-blur-md">
                <ShieldCheck className="h-3.5 w-3.5 text-[#00A896]" />
                <span>MediSwift Certified Healthcare Marketplace</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Healthcare, Simplified.
              </h1>

              <p className="text-sm sm:text-base text-slate-200 font-normal max-w-2xl leading-relaxed">
                Discover healthcare essentials, manage prescriptions, and connect with healthcare professionals from one place.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  size="md"
                  variant="primary"
                  onClick={() => {
                    const catalogEl = document.getElementById('marketplace-catalog');
                    if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="rounded-xl font-bold shadow-lg shadow-teal-500/25 px-5 h-11"
                >
                  <Pill className="h-4 w-4 mr-2" />
                  <span>Shop Healthcare</span>
                </Button>

                <Link href="/doctors">
                  <Button
                    size="md"
                    variant="outline"
                    className="rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white border-white/25 backdrop-blur-md px-5 h-11"
                  >
                    <Stethoscope className="h-4 w-4 mr-2 text-teal-300" />
                    <span>Book a Doctor</span>
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 hidden lg:flex justify-end">
              <div className="p-5 rounded-3xl bg-white/10 border border-white/15 backdrop-blur-md space-y-3 max-w-xs text-xs">
                <div className="flex items-center gap-2 font-bold text-teal-200">
                  <Activity className="h-4 w-4 text-[#00A896]" />
                  <span>Express Pharmacy Logistics</span>
                </div>
                <p className="text-slate-300 leading-snug">
                  512 catalog medicines and wellness essentials packed in temperature-monitored cold-chain conditions.
                </p>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-teal-300 font-semibold">
                  <span>Standard Delivery: Under 2 Hrs</span>
                  <span>100% Genuine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PART 6: CATEGORY EXPERIENCE */}
      <section className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 -mt-6 relative z-20">
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#00A896]" />
              <span>Explore Healthcare Categories</span>
            </h2>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('');
                  updateUrlParams({ category: undefined });
                }}
                className="text-xs font-semibold text-[#00A896] hover:underline"
              >
                Clear Category Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {FEATURED_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              const matchingDbCat = categories.find((c) => c.slug === cat.slug);
              const countDisplay = matchingDbCat ? `${matchingDbCat.name}` : cat.name;

              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => {
                    const nextSlug = isSelected ? '' : cat.slug;
                    setSelectedCategory(nextSlug);
                    updateUrlParams({ category: nextSlug || undefined });
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'border-[#00A896] bg-teal-50/70 shadow-xs ring-2 ring-[#00A896]/20'
                      : 'border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-[#00A896]/40 hover:shadow-xs'
                  }`}
                >
                  <span className="text-2xl mb-1.5 select-none">{cat.icon}</span>
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">{cat.name}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Explore Products</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* MAIN CATALOG AREA */}
      <div id="marketplace-catalog" className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8">
        {/* Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-[#00A896] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-800 font-bold">Medicines & Healthcare Marketplace</span>
          {selectedCategory && (
            <>
              <span>/</span>
              <span className="text-[#00A896] font-semibold">
                {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
              </span>
            </>
          )}
        </div>

        {/* PART 7: SEARCH & CONTROLS BAR */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Debounced Search with Autocomplete */}
          <div ref={searchContainerRef} className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                updateUrlParams({ search: e.target.value || undefined });
              }}
              onFocus={() => {
                if (autocompleteSuggestions.length > 0) setIsAutocompleteOpen(true);
              }}
              placeholder="Search by product name, brand, category, or SKU..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#00A896] focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setAutocompleteSuggestions([]);
                  setIsAutocompleteOpen(false);
                  updateUrlParams({ search: undefined });
                }}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Autocomplete Dropdown */}
            {isAutocompleteOpen && autocompleteSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-30 p-2 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 block">
                  Quick Matching Suggestions
                </span>
                {autocompleteSuggestions.map((item) => (
                  <Link
                    key={item.id}
                    href={`/medicines/${item.slug}`}
                    onClick={() => setIsAutocompleteOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-teal-50/70 text-xs text-slate-800 transition-colors"
                  >
                    <div className="truncate mr-2">
                      <span className="font-bold">{item.name}</span>
                      <span className="text-slate-400 ml-2">({item.brand_name || item.dosage_form})</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#00A896] shrink-0">
                      ₹{parseFloat(item.discounted_price || item.price).toFixed(2)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Controls: Filters Button, Sort Dropdown & Grid View Toggle */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Mobile Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden rounded-xl"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
              <span>Filters</span>
            </Button>

            {/* PART 9: SORTING DROPDOWN */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  updateUrlParams({ sort: e.target.value });
                }}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#00A896] focus:outline-none cursor-pointer pr-8"
              >
                <option value="popularity">Relevance (Most Popular)</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="newest">Newest Additions</option>
                <option value="rating">Top Rated</option>
                <option value="discount">Biggest Discount</option>
              </select>
            </div>

            {/* View Mode Toggle */}
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

        {/* Active Filter Badges */}
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

        {/* Layout Grid: Sticky Sidebar + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* PART 8: DESKTOP STICKY FILTER SIDEBAR */}
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

          {/* PART 10: PRODUCT GRID / LIST */}
          <div className="lg:col-span-9 space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Showing <strong>{products.length}</strong> healthcare products</span>
            </div>

            {loading ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
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
      </div>

      {/* PART 8: ANIMATED MOBILE FILTER DRAWER */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-[#0A2540]/60 backdrop-blur-xs"
            />

            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-[#00A896]" />
                    <span>Filter Products</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {FilterContent}
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="flex-1 rounded-xl text-xs font-semibold"
                >
                  Reset
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 rounded-xl text-xs font-bold"
                >
                  Apply Filters
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MedicinesMarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1536px] mx-auto px-4 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <MedicinesMarketplaceContent />
    </Suspense>
  );
}
