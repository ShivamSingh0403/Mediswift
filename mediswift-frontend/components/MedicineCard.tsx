'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { formatINR } from '@/lib/currency';
import {
  ShoppingBag,
  ShieldAlert,
  Check,
  Eye,
  Sparkles,
  Pill,
  ArrowRight,
} from 'lucide-react';

export interface MedicineItem {
  id: number;
  name: string;
  category: string;
  category_display?: string;
  price: string | number;
  mrp?: string | number | null;
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
  requires_prescription: boolean;
}

interface MedicineCardProps {
  medicine: MedicineItem;
}

export default function MedicineCard({ medicine }: MedicineCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 3D Tilt calculation with Framer Motion springs
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (medicine.stock <= 0) return;

    addItem({
      id: medicine.id,
      name: medicine.name,
      price: String(medicine.price),
      image_url: medicine.image_url,
      stock: medicine.stock,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const isOutOfStock = medicine.stock <= 0;
  const numPrice = typeof medicine.price === 'string' ? parseFloat(medicine.price) : medicine.price;
  const numMrp = medicine.mrp ? (typeof medicine.mrp === 'string' ? parseFloat(medicine.mrp) : medicine.mrp) : null;
  const discount = medicine.discount_percent || (numMrp && numMrp > numPrice ? Math.round(((numMrp - numPrice) / numMrp) * 100) : 0);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ duration: 0.2 }}
      className="relative rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-brand-600/10 hover:border-brand-500/40 transition-shadow duration-300 flex flex-col h-full overflow-hidden group perspective-1000"
    >
      {/* Top Banner Badges */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {medicine.requires_prescription ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs backdrop-blur-sm">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            Rx Required
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs backdrop-blur-sm">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            OTC Verified
          </span>
        )}

        {discount > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
            {discount}% OFF
          </span>
        )}
      </div>

      {/* Product Image Area with Ambient Glow */}
      <div className="relative w-full h-48 sm:h-52 bg-gradient-to-b from-slate-50 to-slate-100/60 flex items-center justify-center p-6 overflow-hidden">
        {/* Subtle holographic radial light */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(14,165,233,0.08),transparent_70%)] pointer-events-none" />

        <img
          src={medicine.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80'}
          alt={medicine.name}
          className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-110 group-hover:drop-shadow-xl transition-all duration-500 ease-out"
          loading="lazy"
        />

        {/* High-Tech Glassmorphic Quick-Add Overlay on Hover */}
        <motion.div
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0, pointerEvents: isHovered ? 'auto' : 'none' }}
          transition={{ duration: 0.22 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center gap-3 p-4 z-10"
        >
          <div className="text-center text-white">
            <p className="text-xs text-slate-200 line-clamp-1">{medicine.packaging || 'Standard Pack'}</p>
            <p className="text-sm font-bold text-white mt-0.5">{formatINR(medicine.price)}</p>
          </div>

          <div className="flex items-center gap-2 w-full max-w-[200px]">
            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              className={`flex-1 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all duration-200 ${
                isOutOfStock
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : added
                  ? 'bg-emerald-500 text-white'
                  : 'bg-brand-600 hover:bg-brand-500 text-white hover:scale-105 active:scale-95'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Added!
                </>
              ) : isOutOfStock ? (
                'Out of Stock'
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" /> Quick Add
                </>
              )}
            </button>

            <Link
              href={`/medicines/${medicine.id}`}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors"
              title="View Medicine Details"
            >
              <Eye className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Content Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white">
        <div>
          {/* Packaging / Dosage form pill */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1.5">
            <span className="capitalize text-brand-600 font-semibold">
              {medicine.dosage_form_display || medicine.dosage_form || 'Tablet'}
            </span>
            <span>•</span>
            <span className="truncate">{medicine.packaging || 'Standard pack'}</span>
          </div>

          {/* Title */}
          <Link href={`/medicines/${medicine.id}`} className="block group-hover:text-brand-600 transition-colors">
            <h3 className="font-bold text-slate-900 text-base line-clamp-1 leading-snug">
              {medicine.name}
            </h3>
          </Link>

          {/* Salt / Composition breakdown */}
          <p className="text-xs text-slate-500 font-mono mt-1 line-clamp-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
            {medicine.composition || medicine.dosage || 'Active Pharmaceutical Ingredient'}
          </p>

          {/* Manufacturer */}
          {medicine.manufacturer && (
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              By {medicine.manufacturer}
            </p>
          )}
        </div>

        {/* Pricing and Action Section */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-slate-900 tracking-tight">
                {formatINR(medicine.price)}
              </span>
              {numMrp && numMrp > numPrice && (
                <span className="text-xs text-slate-400 line-through">
                  {formatINR(numMrp)}
                </span>
              )}
            </div>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
              {medicine.stock > 0 ? `In Stock (${medicine.stock})` : 'Out of Stock'}
            </p>
          </div>

          <Link
            href={`/medicines/${medicine.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 group-hover:translate-x-0.5 transition-transform"
          >
            Details <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
