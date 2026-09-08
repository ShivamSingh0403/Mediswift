'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '@/store/ui-store';
import { productService } from '@/services/product-service';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  Search,
  X,
  ArrowRight,
  Clock,
  TrendingUp,
  Pill,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

const POPULAR_SEARCHES = [
  'Dolo 650 Paracetamol',
  'Vitamin C 500mg',
  'Omega-3 Fish Oil',
  'Blood Pressure Monitor',
  'Whey Protein Powder',
  'Himalaya Ashwagandha',
  'Digital Thermometer',
  'Cough Syrup',
];

const QUICK_CATEGORIES = [
  { name: 'Pain Relief', slug: 'pain-relief', icon: '⚡' },
  { name: 'Vitamins & Supplements', slug: 'vitamins-supplements', icon: '🌿' },
  { name: 'Diabetes Care', slug: 'diabetes-care', icon: '🩸' },
  { name: 'Medical Devices', slug: 'medical-devices', icon: '🩺' },
  { name: 'Ayurvedic Products', slug: 'ayurvedic-products', icon: '🍃' },
  { name: 'Skin Care', slug: 'skin-care', icon: '✨' },
];

export function SearchOverlay() {
  const router = useRouter();
  const { isSearchOverlayOpen, setSearchOverlayOpen } = useUiStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mediswift_recent_searches');
        if (saved) setRecentSearches(JSON.parse(saved));
      } catch {
        // Ignore
      }
    }
  }, []);

  // Auto focus input when opened
  useEffect(() => {
    if (isSearchOverlayOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isSearchOverlayOpen]);

  // Handle ESC and Ctrl+K shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOverlayOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOverlayOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOverlayOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || !isSearchOverlayOpen) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await productService.getProducts({ search: query.trim(), page_size: 6 });
        if (res?.data?.results) {
          setResults(res.data.results);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timeout);
  }, [query, isSearchOverlayOpen]);

  const saveSearchTerm = (term: string) => {
    const updated = [term, ...recentSearches.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem('mediswift_recent_searches', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    saveSearchTerm(query.trim());
    setSearchOverlayOpen(false);
    router.push(`/medicines?search=${encodeURIComponent(query.trim())}`);
  };

  const handleItemClick = (searchTerm: string) => {
    setQuery(searchTerm);
    saveSearchTerm(searchTerm);
    setSearchOverlayOpen(false);
    router.push(`/medicines?search=${encodeURIComponent(searchTerm)}`);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('mediswift_recent_searches');
    } catch {
      // Ignore
    }
  };

  return (
    <AnimatePresence>
      {isSearchOverlayOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-start items-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSearchOverlayOpen(false)}
          className="fixed inset-0 bg-[#0A2540]/60 backdrop-blur-md transition-opacity"
        />

        {/* Search Modal Card */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 my-4 sm:my-8"
        >
          {/* Top Search Input Bar */}
          <form onSubmit={handleSearchSubmit} className="relative border-b border-slate-100 p-4 sm:p-5 flex items-center gap-3">
            <Search className="h-5 w-5 text-[#00A896] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 250+ genuine medicines, salts, brands, or medical devices..."
              className="flex-1 bg-transparent text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setSearchOverlayOpen(false)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors hidden sm:block"
            >
              ESC
            </button>
          </form>

          {/* Body Content */}
          <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto space-y-6">
            {/* Live Results if searching */}
            {query.trim() && (
              <div>
                <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>Search Results {loading && '(searching...)'}</span>
                  {results.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit()}
                      className="text-[#00A896] hover:underline flex items-center gap-1 font-semibold normal-case"
                    >
                      <span>View all results</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <div className="w-6 h-6 border-2 border-[#00A896]/30 border-t-[#00A896] rounded-full animate-spin mx-auto mb-2" />
                    Checking catalog...
                  </div>
                ) : results.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                    <Pill className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No matching products found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try searching by generic salt (e.g. Paracetamol) or category.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results.map((product) => (
                      <Link
                        key={product.id}
                        href={`/medicines/${product.slug}`}
                        onClick={() => {
                          saveSearchTerm(product.name);
                          setSearchOverlayOpen(false);
                        }}
                        className="group flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#00A896]/30 hover:shadow-xs transition-all"
                      >
                        <div className="relative w-14 h-14 rounded-xl bg-white border border-slate-100 shrink-0 overflow-hidden flex items-center justify-center">
                          {product.image_url || product.primary_image ? (
                            <Image
                              src={product.image_url || product.primary_image || ''}
                              alt={product.name}
                              fill
                              sizes="56px"
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <Pill className="h-6 w-6 text-[#00A896] stroke-1" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-[#00A896] uppercase tracking-wider block truncate">
                            {product.brand_name || product.category_name}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-[#00A896] transition-colors">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-black text-[#0A2540]">
                              {formatCurrency(product.discounted_price)}
                            </span>
                            {product.prescription_required && (
                              <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                Rx
                              </span>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#00A896] transition-colors shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && !query.trim() && (
              <div>
                <div className="flex items-center justify-between mb-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Recent Searches
                  </span>
                  <button
                    type="button"
                    onClick={clearRecent}
                    className="text-[11px] font-medium text-slate-400 hover:text-rose-500 transition-colors normal-case"
                  >
                    Clear history
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleItemClick(term)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-[#0A2540] transition-colors"
                    >
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            {!query.trim() && (
              <div>
                <div className="flex items-center gap-1.5 mb-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <TrendingUp className="h-3.5 w-3.5 text-[#00A896]" />
                  Popular Searches
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((term, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleItemClick(term)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 bg-teal-50/70 border border-teal-100 hover:bg-[#00A896] hover:text-white hover:border-[#00A896] transition-all"
                    >
                      <Sparkles className="h-3 w-3 text-[#00A896] group-hover:text-white" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Categories */}
            {!query.trim() && (
              <div>
                <div className="mb-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Browse by Specialty
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {QUICK_CATEGORIES.map((cat, idx) => (
                    <Link
                      key={idx}
                      href={`/categories/${cat.slug}`}
                      onClick={() => setSearchOverlayOpen(false)}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-[#00A896]/40 hover:shadow-xs transition-all text-xs font-semibold text-slate-800"
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="truncate">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Trust Footer Notice */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#00A896]" />
                <span>100% CDSCO Compliant & Licensed Indian Pharmacy</span>
              </div>
              <span>Press ↵ to search</span>
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
