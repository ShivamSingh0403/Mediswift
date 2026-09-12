'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import {
  Pill,
  ShieldAlert,
  Activity,
  Droplet,
  Sparkles,
  Package,
  Layers,
  Thermometer,
  ShieldCheck,
} from 'lucide-react';

interface MedicineImageProps {
  product: Partial<Product> & {
    id?: string;
    name?: string;
    sku?: string;
    slug?: string;
    brand_name?: string;
    category_name?: string;
    category_slug?: string;
    dosage_form?: string;
    strength?: string;
    pack_size?: string;
    image_url?: string;
    primary_image?: string;
    image_status?: string;
    image_source?: string;
    image_alt_text?: string;
    image_license?: string;
    is_demo_data?: boolean;
  };
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  compact?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
}

/**
 * Returns clean category accent colors for pharmaceutical cards
 */
function getCategoryTheme(catSlug?: string) {
  const s = (catSlug || '').toLowerCase();
  if (s.includes('pain') || s.includes('fever')) {
    return {
      bg: 'from-amber-50/60 via-slate-50 to-orange-50/40',
      border: 'border-amber-200/60',
      badgeBg: 'bg-amber-100/80 text-amber-800',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50 border-amber-200/80',
    };
  }
  if (s.includes('device') || s.includes('monitor')) {
    return {
      bg: 'from-blue-50/60 via-slate-50 to-indigo-50/40',
      border: 'border-blue-200/60',
      badgeBg: 'bg-blue-100/80 text-blue-800',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50 border-blue-200/80',
    };
  }
  if (s.includes('ayur') || s.includes('wellness') || s.includes('nutrition')) {
    return {
      bg: 'from-emerald-50/60 via-slate-50 to-teal-50/40',
      border: 'border-emerald-200/60',
      badgeBg: 'bg-emerald-100/80 text-emerald-800',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-200/80',
    };
  }
  if (s.includes('heart') || s.includes('cardiac')) {
    return {
      bg: 'from-rose-50/60 via-slate-50 to-pink-50/40',
      border: 'border-rose-200/60',
      badgeBg: 'bg-rose-100/80 text-rose-800',
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50 border-rose-200/80',
    };
  }
  // Default clinical pharmacy theme
  return {
    bg: 'from-teal-50/50 via-slate-50 to-slate-100/70',
    border: 'border-teal-200/50',
    badgeBg: 'bg-teal-100/80 text-teal-900',
    iconColor: 'text-[#00A896]',
    iconBg: 'bg-teal-50 border-teal-200/80',
  };
}

/**
 * Returns distinct clinical icon based on dosage form
 */
function getDosageIcon(dosageForm?: string) {
  const form = (dosageForm || '').toUpperCase();
  if (form === 'LIQUID' || form === 'SYRUP' || form === 'DROPS') {
    return Droplet;
  }
  if (form === 'DEVICE') {
    return Activity;
  }
  if (form === 'SPRAY') {
    return Sparkles;
  }
  if (form === 'STRIP' || form === 'PATCH' || form === 'BANDAGE') {
    return Layers;
  }
  if (form === 'CAPSULE') {
    return Package;
  }
  return Pill;
}

export function MedicineImage({
  product,
  className = '',
  fill = true,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
  priority = false,
  compact = false,
}: MedicineImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Authoritative URL determination
  let rawUrl = product.image_url || product.primary_image || '';
  if (rawUrl.startsWith('/media/')) {
    rawUrl = `http://localhost:8000${rawUrl}`;
  }

  // A verified real image must be marked VERIFIED and have a non-empty URL
  const isVerified = product.image_status === 'VERIFIED' && Boolean(rawUrl) && !hasError;
  const theme = getCategoryTheme(product.category_slug);
  const IconComponent = getDosageIcon(product.dosage_form);

  const altText =
    product.image_alt_text ||
    `${product.name || 'Medicine'} ${product.strength || ''} by ${product.brand_name || 'MediSwift'} - ${product.pack_size || product.dosage_form || 'Healthcare'}`;

  // Error handler with dev-mode logging as required by Task 8
  const handleError = () => {
    setHasError(true);
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[MediSwift Image System] Photograph failed to load for Product ID: "${product.id || 'N/A'}" (SKU: "${product.sku || 'N/A'}"). URL: "${rawUrl}". Reverting to Clinical Specification Card.`
      );
    }
  };

  // 1. VERIFIED REAL PACKAGING PHOTOGRAPH
  if (isVerified && rawUrl) {
    return (
      <div className={`relative w-full h-full bg-white overflow-hidden flex items-center justify-center ${className}`}>
        {/* Shimmer pulse placeholder while image decodes */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200/70 to-slate-100 animate-pulse z-0" />
        )}

        <Image
          src={rawUrl}
          alt={altText}
          fill={fill}
          sizes={sizes}
          priority={priority}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          className={`object-contain p-2 transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    );
  }

  // 2. COMPACT MODE (e.g. cart drawer, quick search item)
  if (compact) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${theme.bg} border ${theme.border} p-1 text-center select-none ${className}`}
        title={`Specification: ${product.name || 'Medicine'} (${product.dosage_form || 'Formulation'})`}
      >
        <div className={`w-8 h-8 rounded-lg ${theme.iconBg} flex items-center justify-center ${theme.iconColor} shadow-2xs`}>
          <IconComponent className="h-4 w-4 stroke-[1.75]" />
        </div>
        <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider mt-1 truncate max-w-full">
          {product.dosage_form || 'ITEM'}
        </span>
      </div>
    );
  }

  // 3. FULL CLINICAL SPECIFICATION CARD (For cards, details, and catalog views)
  return (
    <div
      className={`w-full h-full flex flex-col justify-between p-3.5 bg-gradient-to-br ${theme.bg} border-b ${theme.border} select-none transition-all duration-300 ${className}`}
      title={altText}
    >
      {/* Top Header: Dosage Form & Packaging Specification Tag */}
      <div className="w-full flex items-center justify-between text-[10px] font-semibold text-slate-500">
        <span className="uppercase tracking-wider font-extrabold text-slate-600">
          {product.dosage_form || 'FORMULATION'}
        </span>

        {product.is_demo_data ? (
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-md bg-slate-100/90 text-slate-600 border border-slate-200">
            Catalog Sample
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-md bg-white/90 text-slate-500 border border-slate-200/80">
            Spec Card
          </span>
        )}
      </div>

      {/* Center: Dosage Form Icon Mark with Soft Shadow */}
      <div className="flex flex-col items-center justify-center my-auto py-2">
        <div
          className={`w-14 h-14 rounded-2xl ${theme.iconBg} border flex items-center justify-center ${theme.iconColor} shadow-sm group-hover:scale-105 transition-transform duration-300`}
        >
          <IconComponent className="h-7 w-7 stroke-[1.5]" />
        </div>
        {product.strength && (
          <span className="text-[10px] font-extrabold text-slate-600 mt-2 px-2 py-0.5 bg-white/90 rounded-full border border-slate-200/60 shadow-2xs">
            {product.strength}
          </span>
        )}
      </div>

      {/* Bottom Footer: Brand & Pack Size Metadata */}
      <div className="w-full text-center pt-1 border-t border-slate-200/40">
        <span className="text-xs font-black text-[#0A2540] block line-clamp-1">
          {product.brand_name || 'Pharmaceutical Care'}
        </span>
        <span className="text-[10px] text-slate-500 font-medium block line-clamp-1 mt-0.5">
          {product.pack_size || (product.is_demo_data ? 'Catalog Specification' : 'Standard Packaging')}
        </span>
      </div>
    </div>
  );
}
