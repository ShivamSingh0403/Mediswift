'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Product, ProductImageStatus } from '@/types';
import { ShieldCheck, Clock, Sparkles } from 'lucide-react';

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
    image_status?: ProductImageStatus | string;
    image_alt?: string;
    image_alt_text?: string;
    is_real_product_photo?: boolean;
    image_source?: string;
    source_url?: string;
    image_license?: string;
    verified_by?: string;
    verified_at?: string | null;
    is_demo_data?: boolean;
  };
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  compact?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  showBadge?: boolean;
}

/**
 * Authentic Medical Cross Icon for pharmaceutical packaging placeholders
 */
export function MedicalCrossIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M8.5 3a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v4h4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-4v4a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5v-4h-4A1.5 1.5 0 0 1 3 14v-4A1.5 1.5 0 0 1 4.5 8.5h4V3z" />
    </svg>
  );
}

/**
 * Returns subtle clinical accent palettes based on pharmaceutical specialty
 */
function getCategoryTheme(catSlug?: string) {
  const s = (catSlug || '').toLowerCase();
  if (s.includes('pain') || s.includes('fever')) {
    return {
      bg: 'from-amber-50/70 via-slate-50 to-orange-50/50',
      border: 'border-amber-200/70',
      badgeBg: 'bg-amber-100/90 text-amber-800 border-amber-200',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100/70 border-amber-200',
      accentRing: 'ring-amber-200/40',
    };
  }
  if (s.includes('device') || s.includes('monitor')) {
    return {
      bg: 'from-blue-50/70 via-slate-50 to-indigo-50/50',
      border: 'border-blue-200/70',
      badgeBg: 'bg-blue-100/90 text-blue-800 border-blue-200',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100/70 border-blue-200',
      accentRing: 'ring-blue-200/40',
    };
  }
  if (s.includes('ayur') || s.includes('wellness') || s.includes('nutrition')) {
    return {
      bg: 'from-emerald-50/70 via-slate-50 to-teal-50/50',
      border: 'border-emerald-200/70',
      badgeBg: 'bg-emerald-100/90 text-emerald-800 border-emerald-200',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100/70 border-emerald-200',
      accentRing: 'ring-emerald-200/40',
    };
  }
  if (s.includes('heart') || s.includes('cardiac')) {
    return {
      bg: 'from-rose-50/70 via-slate-50 to-pink-50/50',
      border: 'border-rose-200/70',
      badgeBg: 'bg-rose-100/90 text-rose-800 border-rose-200',
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-100/70 border-rose-200',
      accentRing: 'ring-rose-200/40',
    };
  }
  // Default MediSwift pharmacy clinical palette
  return {
    bg: 'from-teal-50/60 via-slate-50 to-slate-100/80',
    border: 'border-teal-200/60',
    badgeBg: 'bg-teal-100/90 text-teal-900 border-teal-200',
    iconColor: 'text-[#00A896]',
    iconBg: 'bg-teal-100/80 border-teal-200',
    accentRing: 'ring-teal-200/50',
  };
}

export function MedicineImage({
  product,
  className = '',
  fill = true,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
  priority = false,
  compact = false,
  showBadge = true,
}: MedicineImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Authoritative URL determination
  let rawUrl = product.image_url || product.primary_image || '';
  if (rawUrl.startsWith('/media/')) {
    rawUrl = `http://127.0.0.1:8000${rawUrl}`;
  } else if (rawUrl.startsWith('http://localhost:8000/media/')) {
    rawUrl = rawUrl.replace('http://localhost:8000', 'http://127.0.0.1:8000');
  }

  // Authoritative 4-tier display priority:
  // 1) VERIFIED real packaging photo (Green Verified badge)
  // 2) PENDING_REVIEW / DOWNLOADED authorized photo (Amber Under Review badge)
  // 3) AI_DEMO_ONLY demo visual (Indigo AI DEMO badge + "Demo visual — real product photo pending")
  // 4) Fallback to custom MediSwift clinical placeholder (only if no image or network error)
  const isVerified =
    (product.image_status === 'VERIFIED' || product.is_real_product_photo === true) &&
    Boolean(rawUrl) &&
    !hasError;

  const isPendingReview =
    (product.image_status === 'PENDING_REVIEW' || product.image_status === 'DOWNLOADED') &&
    Boolean(rawUrl) &&
    !hasError &&
    !isVerified;

  const isAiDemo =
    (product.image_status === 'AI_DEMO_ONLY' || rawUrl.includes('ai_demo')) &&
    Boolean(rawUrl) &&
    !hasError &&
    !isVerified &&
    !isPendingReview;

  const hasImageToDisplay = (isVerified || isPendingReview || isAiDemo) && Boolean(rawUrl);

  const theme = getCategoryTheme(product.category_slug);
  const categoryLabel = product.category_name || 'Pharmaceutical Care';

  const altText =
    product.image_alt ||
    product.image_alt_text ||
    (isAiDemo
      ? `AI-generated demo visual for ${product.name || 'Medicine'} (${product.sku || 'N/A'})`
      : `${product.name || 'Medicine'} ${product.strength || ''} by ${product.brand_name || 'MediSwift'} - ${product.pack_size || product.dosage_form || 'Healthcare'}`);

  // Error handler: fallback seamlessly without showing broken image icon
  const handleError = () => {
    setHasError(true);
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[MediSwift Image System] Image failed to load for Product "${product.name || 'N/A'}" (SKU: "${product.sku || 'N/A'}"). URL: "${rawUrl}". Reverting to clinical placeholder.`
      );
    }
  };

  // 1. COMPACT MODE WITH ACTIVE IMAGE (e.g. cart drawer, quick search, order item summary)
  if (compact && hasImageToDisplay && rawUrl) {
    return (
      <div className={`relative w-full h-full bg-slate-50 overflow-hidden flex items-center justify-center ${className}`}>
        <Image
          src={rawUrl}
          alt={altText}
          fill={fill}
          sizes="64px"
          unoptimized
          onError={handleError}
          className="object-contain p-1"
        />
        {showBadge && (
          <div className="absolute top-0.5 right-0.5 z-10">
            {isAiDemo ? (
              <span className="inline-flex items-center text-[7px] font-extrabold px-1 py-0.2 rounded bg-indigo-600 text-white shadow-2xs">
                AI
              </span>
            ) : isVerified ? (
              <span className="inline-flex items-center text-[7px] font-extrabold px-1 py-0.2 rounded bg-emerald-600 text-white shadow-2xs">
                ✓
              </span>
            ) : (
              <span className="inline-flex items-center text-[7px] font-extrabold px-1 py-0.2 rounded bg-amber-500 text-white shadow-2xs">
                ◷
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // 2. FULL CARD IMAGE DISPLAY (For cards, catalog, marketplace, and detail views)
  if (hasImageToDisplay && rawUrl) {
    return (
      <div className={`relative w-full h-full bg-slate-50/50 overflow-hidden flex flex-col items-center justify-center ${className}`}>
        {!isLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200/70 to-slate-100 animate-pulse motion-reduce:animate-none z-0" />
        )}

        <Image
          src={rawUrl}
          alt={altText}
          fill={fill}
          sizes={sizes}
          priority={priority}
          unoptimized
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          className={`object-contain p-2 transition-opacity duration-300 motion-reduce:transition-none ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Status badges */}
        {showBadge && (
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
            {isVerified ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs border border-emerald-400/60 backdrop-blur-xs">
                <ShieldCheck className="h-3 w-3 stroke-[2.5]" />
                <span>Verified image</span>
              </span>
            ) : isPendingReview ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs border border-amber-400/60 backdrop-blur-xs">
                <Clock className="h-3 w-3 stroke-[2.5]" />
                <span>Image under review</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-600/95 text-white shadow-xs border border-indigo-400/50 backdrop-blur-xs tracking-wide">
                <Sparkles className="h-2.5 w-2.5 text-indigo-200" />
                <span>AI DEMO</span>
              </span>
            )}
          </div>
        )}

        {/* AI Demo Mandatory Disclaimer Footer on Card */}
        {isAiDemo && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/80 via-slate-900/50 to-transparent py-1 px-2 text-center z-10">
            <span className="text-[9px] font-bold text-slate-100 tracking-tight drop-shadow-xs block truncate">
              Demo visual — real product photo pending
            </span>
          </div>
        )}
      </div>
    );
  }

  // 3. COMPACT FALLBACK (when no photo exists or network load failed)
  if (compact) {
    return (
      <div
        className={`relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${theme.bg} border ${theme.border} p-1 text-center select-none ${className}`}
        title={`${product.name || 'Medicine'}: Product image under verification`}
      >
        <div
          className={`w-7 h-7 rounded-lg ${theme.iconBg} border flex items-center justify-center ${theme.iconColor} shadow-2xs`}
        >
          <MedicalCrossIcon className="h-3.5 w-3.5" />
        </div>
        <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider mt-1 truncate max-w-full">
          Under review
        </span>
      </div>
    );
  }

  // 4. FULL CUSTOM PLACEHOLDER (Only when no image exists or failed network load)
  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between p-3.5 sm:p-4 bg-gradient-to-br ${theme.bg} border-b ${theme.border} select-none transition-all duration-300 motion-reduce:transition-none ${className}`}
      title={`${altText} — Product image under verification`}
      role="img"
      aria-label={`Product image under verification for ${product.name || 'Medicine'}`}
    >
      {/* Top Header: Category Label & Status badge */}
      <div className="w-full flex items-center justify-between gap-1.5 text-[10px] font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-white/95 px-2.5 py-0.5 rounded-full border border-slate-200/80 shadow-2xs truncate max-w-[65%]">
          {categoryLabel}
        </span>

        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
          <Clock className="h-2.5 w-2.5 stroke-[2.2]" />
          <span>Image under review</span>
        </span>
      </div>

      {/* Center Hero: Medical Cross Icon + Placeholder Notice */}
      <div className="flex flex-col items-center justify-center my-auto py-3 text-center px-1">
        <div
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${theme.iconBg} border flex items-center justify-center ${theme.iconColor} shadow-sm ring-4 ${theme.accentRing} transition-transform duration-300 motion-reduce:transition-none group-hover:scale-105`}
        >
          <MedicalCrossIcon className="h-7 w-7 sm:h-8 sm:w-8" />
        </div>

        <p className="text-[11px] sm:text-xs font-bold text-slate-800 mt-2.5 tracking-tight line-clamp-1">
          Product image under verification
        </p>

        {product.strength && (
          <span className="text-[9.5px] font-semibold text-slate-500 mt-1 px-2 py-0.5 bg-white/80 rounded-full border border-slate-200/60 shadow-2xs">
            {product.strength}
          </span>
        )}
      </div>

      {/* Bottom Footer: Formulation & Packaging Details */}
      <div className="w-full text-center pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-medium">
        <span className="font-bold text-[#0A2540] truncate max-w-[60%]">
          {product.brand_name || 'MediSwift Verified'}
        </span>
        <span className="uppercase text-[9px] font-mono text-slate-500 shrink-0">
          {product.sku || product.dosage_form || 'AUTHENTIC'}
        </span>
      </div>
    </div>
  );
}
