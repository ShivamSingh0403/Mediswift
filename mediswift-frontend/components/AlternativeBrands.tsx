'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { formatINR } from '@/lib/currency';
import { useCartStore } from '@/store/cartStore';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  ShoppingBag,
  Check,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface SubstituteItem {
  id: number;
  name: string;
  category: string;
  price: string;
  mrp?: string | null;
  image_url: string;
  stock: number;
  manufacturer?: string;
  composition?: string;
  dosage_form_display?: string;
  packaging?: string;
  savings_amount?: string;
  savings_percentage?: number;
  is_cheaper?: boolean;
}

interface SubstitutesResponse {
  target_id: number;
  target_name: string;
  target_price: string;
  composition: string;
  total_substitutes: number;
  cheaper_count: number;
  substitutes: SubstituteItem[];
}

interface AlternativeBrandsProps {
  medicineId: number;
  targetPrice?: string;
  composition?: string;
}

export default function AlternativeBrands({
  medicineId,
  targetPrice,
  composition,
}: AlternativeBrandsProps) {
  const [data, setData] = useState<SubstitutesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [addedMap, setAddedMap] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    let isMounted = true;

    async function loadSubstitutes() {
      try {
        setLoading(true);
        const res = await api.get<SubstitutesResponse>(
          `/medicines/${medicineId}/substitutes/`
        );
        if (isMounted) {
          setData(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch substitutes for medicine:', medicineId, err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (medicineId) {
      loadSubstitutes();
    }

    return () => {
      isMounted = false;
    };
  }, [medicineId]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -320 : 320;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const handleAdd = (sub: SubstituteItem) => {
    addItem({
      id: sub.id,
      name: sub.name,
      price: String(sub.price),
      image_url: sub.image_url,
      stock: sub.stock,
    });

    setAddedMap((prev) => ({ ...prev, [sub.id]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [sub.id]: false }));
    }, 1800);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-6 flex items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
        <span className="text-sm font-medium">Analyzing salt compositions & bio-equivalents...</span>
      </div>
    );
  }

  if (!data || data.substitutes.length === 0) {
    return null;
  }

  return (
    <section className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 p-6 sm:p-8 text-white shadow-2xl overflow-hidden">
      {/* High-tech ambient glowing radial lights */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Smart Substitute AI Engine
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Cheaper Generic Alternatives & Equivalent Brands
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Identical active chemical formula (<span className="text-teal-300 font-mono font-medium">{data.composition || composition || 'Active Salt'}</span>) verified for clinical bio-equivalence at substantial savings.
          </p>
        </div>

        {/* Scroll Arrows */}
        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={() => handleScroll('left')}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Container */}
      <div
        ref={scrollRef}
        className="relative z-10 flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
        style={{ scrollbarWidth: 'thin' }}
      >
        {data.substitutes.map((sub) => {
          const isAdded = addedMap[sub.id];
          const hasSavings = Boolean(sub.savings_percentage && sub.savings_percentage > 0);

          return (
            <motion.div
              key={sub.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="w-72 sm:w-80 shrink-0 snap-start rounded-2xl bg-white/10 hover:bg-white/[0.14] border border-white/10 hover:border-teal-400/40 backdrop-blur-xl p-4 flex flex-col justify-between transition-all duration-300 shadow-lg group"
            >
              <div>
                {/* Top Badge */}
                <div className="flex items-center justify-between mb-3">
                  {hasSavings ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                      <TrendingDown className="w-3 h-3" />
                      Save {sub.savings_percentage}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      <ShieldCheck className="w-3 h-3 text-teal-400" />
                      Identical Salt
                    </span>
                  )}

                  <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                    {sub.manufacturer || 'Certified Indian Pharma'}
                  </span>
                </div>

                {/* Product Preview */}
                <div className="flex gap-3 mb-3">
                  <div className="w-16 h-16 rounded-xl bg-white/10 p-2 shrink-0 flex items-center justify-center overflow-hidden border border-white/10">
                    <img
                      src={sub.image_url}
                      alt={sub.name}
                      className="max-h-full max-w-full object-contain filter group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/medicines/${sub.id}`}
                      className="block font-bold text-white text-sm hover:text-teal-300 transition-colors line-clamp-1"
                    >
                      {sub.name}
                    </Link>
                    <p className="text-[11px] text-teal-200/80 font-mono truncate mt-0.5">
                      {sub.composition || 'Generic Equivalent'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {sub.packaging || 'Standard pack'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price comparison & Quick Action */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 mt-2">
                <div>
                  <div className="text-base font-extrabold text-white">
                    {formatINR(sub.price)}
                  </div>
                  {hasSavings && sub.savings_amount && (
                    <p className="text-[10px] text-emerald-400 font-semibold">
                      Save {formatINR(sub.savings_amount)}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleAdd(sub)}
                  disabled={sub.stock <= 0}
                  className={`py-1.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                    isAdded
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 hover:scale-105 active:scale-95'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Switched
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" /> Switch & Add
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
