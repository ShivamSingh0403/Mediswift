'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { formatINR } from '@/lib/currency';
import { useCartStore } from '@/store/cartStore';
import AlternativeBrands from '@/components/AlternativeBrands';
import {
  ShieldAlert,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Building,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Check,
  AlertCircle,
  FileUp,
  Share2,
  Heart,
  ChevronRight,
  Info,
  Maximize2,
} from 'lucide-react';

export interface MedicineData {
  id: number;
  name: string;
  category: string;
  category_display?: string;
  price: string;
  mrp?: string | null;
  discount_percent?: number;
  stock: number;
  description: string;
  image_url: string;
  manufacturer?: string;
  composition?: string;
  dosage?: string;
  dosage_form?: string;
  dosage_form_display?: string;
  packaging?: string;
  side_effects?: string;
  how_to_use?: string;
  requires_prescription: boolean;
  created_at?: string;
}

interface MedicineDetailProps {
  medicine: MedicineData;
}

export default function MedicineDetail({ medicine }: MedicineDetailProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);

  // Cinematic gallery images (primary + stylized complementary medical macro shots)
  const galleryImages = [
    medicine.image_url,
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=800&auto=format&fit=crop&q=80',
  ].filter(Boolean);

  const numPrice = parseFloat(medicine.price);
  const numMrp = medicine.mrp ? parseFloat(medicine.mrp) : null;
  const discount = medicine.discount_percent || (numMrp && numMrp > numPrice ? Math.round(((numMrp - numPrice) / numMrp) * 100) : 0);

  const handleAddToCart = () => {
    if (medicine.stock <= 0) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: medicine.id,
        name: medicine.name,
        price: medicine.price,
        image_url: medicine.image_url,
        stock: medicine.stock,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/" className="hover:text-brand-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/medicines" className="hover:text-brand-600 transition-colors">
          Medicines
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold truncate max-w-xs">{medicine.name}</span>
      </nav>

      {/* Main Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Cinematic Image Gallery */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square rounded-3xl bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200/80 border border-slate-200/90 shadow-lg overflow-hidden flex items-center justify-center p-8 group">
            {/* Ambient High-Tech Holographic Aura */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.12),transparent_70%)] pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.img
                key={activeImageIdx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                src={galleryImages[activeImageIdx]}
                alt={medicine.name}
                className="max-h-full max-w-full object-contain filter drop-shadow-xl group-hover:scale-105 transition-transform duration-500"
              />
            </AnimatePresence>

            {/* Floating Rx / OTC Badge */}
            <div className="absolute top-4 left-4 z-10">
              {medicine.requires_prescription ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-md shadow-rose-500/20">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Rx Required
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  OTC Approved
                </span>
              )}
            </div>

            {/* Quick Share CTA */}
            <button
              onClick={handleShare}
              className="absolute top-4 right-4 p-2.5 rounded-2xl bg-white/80 hover:bg-white text-slate-700 shadow-sm backdrop-blur-md transition-all active:scale-95"
              title="Share medicine link"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {copied && (
              <span className="absolute top-16 right-4 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-bold shadow-md">
                Link Copied!
              </span>
            )}
          </div>

          {/* Gallery Thumbnails */}
          <div className="grid grid-cols-4 gap-3">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={`relative aspect-square rounded-2xl p-2 bg-white border transition-all duration-200 overflow-hidden flex items-center justify-center ${
                  activeImageIdx === idx
                    ? 'border-brand-600 ring-2 ring-brand-500/20 shadow-sm scale-105'
                    : 'border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: High-Tech Medicine Details & Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-brand-600 uppercase tracking-wider">
              <span>{medicine.category_display || medicine.category}</span>
              <span>•</span>
              <span className="text-slate-500 font-normal">
                {medicine.packaging || 'Standard Packaging'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              {medicine.name}
            </h1>

            {/* Salt / Composition Pill */}
            <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-mono text-slate-800">
              <span className="text-slate-400 font-sans font-bold">Salt Formula:</span>
              <span className="font-bold text-brand-700">
                {medicine.composition || medicine.dosage || 'Standard Pharmaceutical Formula'}
              </span>
            </div>

            {medicine.manufacturer && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Manufactured by <span className="font-semibold text-slate-700">{medicine.manufacturer}</span>
              </p>
            )}
          </div>

          {/* Dynamic Prescription Warning Banner (if Rx required) */}
          {medicine.requires_prescription && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border border-rose-200/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500 text-white shrink-0 animate-pulse">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-900">
                    Rx: Valid Doctor Prescription Required
                  </h4>
                  <p className="text-xs text-rose-700/90 mt-0.5">
                    As per Indian Drugs & Cosmetics Act, a valid physician prescription must be verified prior to dispatch.
                  </p>
                </div>
              </div>

              <Link
                href={`/upload-prescription?medicine_id=${medicine.id}`}
                className="shrink-0 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all"
              >
                <FileUp className="w-3.5 h-3.5" />
                Upload Rx Now
              </Link>
            </motion.div>
          )}

          {/* Pricing & Stock Card */}
          <div className="rounded-3xl bg-slate-50/80 border border-slate-200/90 p-6 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Special Online Price
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    {formatINR(medicine.price)}
                  </span>
                  {numMrp && numMrp > numPrice && (
                    <span className="text-sm sm:text-base text-slate-400 line-through">
                      MRP {formatINR(numMrp)}
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xs">
                      {discount}% OFF
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Inclusive of all taxes & GMP quality verification
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Availability
                </span>
                {medicine.stock > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    In Stock ({medicine.stock} units)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Currently Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Quantity Controller & Add to Cart */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center border border-slate-300 rounded-2xl bg-white p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold text-sm text-slate-800">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(medicine.stock, q + 1))}
                  className="w-9 h-9 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={medicine.stock <= 0}
                className={`flex-1 w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-200 ${
                  medicine.stock <= 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : added
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/25 hover:scale-[1.02] active:scale-95'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" /> Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" /> Add {quantity > 1 ? `(${quantity})` : ''} to Cart
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Delivery & Trust Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 text-center space-y-1">
              <Truck className="w-5 h-5 text-brand-600 mx-auto" />
              <p className="text-xs font-bold text-slate-800">Express Delivery</p>
              <p className="text-[10px] text-slate-400">Within 24-48 Hours</p>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 text-center space-y-1">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-slate-800">100% Genuine</p>
              <p className="text-[10px] text-slate-400">Direct From Pharma</p>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 text-center space-y-1">
              <RotateCcw className="w-5 h-5 text-indigo-600 mx-auto" />
              <p className="text-xs font-bold text-slate-800">Easy Returns</p>
              <p className="text-[10px] text-slate-400">7-Day Return Policy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Substitutes Component (Phase 3) */}
      <AlternativeBrands
        medicineId={medicine.id}
        targetPrice={medicine.price}
        composition={medicine.composition}
      />

      {/* Deep Composition & Clinical Breakdown Tabs */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 space-y-8 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-brand-600" />
            Product Overview & Description
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {medicine.description}
          </p>
        </div>

        <hr className="border-slate-100" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Active Salt Composition & Formulation
            </h3>
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Active Chemical Ingredient:</span>
                <span className="font-bold text-slate-900">{medicine.composition || medicine.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dosage Form:</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {medicine.dosage_form_display || medicine.dosage_form || 'Tablet'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Packaging Type:</span>
                <span className="font-semibold text-slate-800">{medicine.packaging || 'Standard Pack'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Therapeutic Class:</span>
                <span className="font-semibold text-slate-800">{medicine.category_display || medicine.category}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Clinical Administration & Instructions
            </h3>
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-2 text-xs text-slate-700 leading-relaxed">
              <p>
                <strong className="text-slate-900">How to Use:</strong>{' '}
                {medicine.how_to_use || 'Take strictly in accordance with your physician\'s directions or packaging label. Do not chew or crush sustained-release tablets.'}
              </p>
              <p className="pt-1">
                <strong className="text-slate-900">Potential Side Effects:</strong>{' '}
                {medicine.side_effects || 'Transient nausea, mild headache, or dry mouth. If symptoms persist or allergic reactions occur, discontinue immediately.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
