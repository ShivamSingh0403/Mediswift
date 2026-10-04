'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { resolveProductImage, ProductLike } from '@/lib/image-resolver';
import { ShieldCheck, Clock, Sparkles } from 'lucide-react';

export interface ProductImageProps {
  product?: ProductLike | null;
  priority?: boolean;
  className?: string;
  sizes?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  showBadge?: boolean;
  compact?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  interactive?: boolean;
  onClick?: () => void;
}

export function ProductImage({
  product,
  priority = false,
  className = '',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
  fill = true,
  width,
  height,
  showBadge = true,
  compact = false,
  interactive = false,
  onClick,
}: ProductImageProps) {
  const resolved = resolveProductImage(product);
  const [currentSrc, setCurrentSrc] = useState<string>(resolved.src);
  const [prevSrc, setPrevSrc] = useState<string>(resolved.src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  // Sync state if resolved.src changes without an effect
  if (prevSrc !== resolved.src) {
    setPrevSrc(resolved.src);
    setCurrentSrc(resolved.src);
    setIsLoaded(false);
    setErrorCount(0);
  }

  const handleError = () => {
    if (errorCount === 0 && resolved.fallbackSrc && resolved.fallbackSrc !== currentSrc) {
      setCurrentSrc(resolved.fallbackSrc);
      setErrorCount(1);
    } else if (errorCount <= 1 && currentSrc !== '/products/fallback-generic.svg') {
      setCurrentSrc('/products/fallback-generic.svg');
      setErrorCount(2);
    } else if (currentSrc !== '/products/fallback-generic.webp') {
      setCurrentSrc('/products/fallback-generic.webp');
      setErrorCount(3);
    }
  };

  // Compact Mode (for cart drawer, search dropdown, order item summaries)
  if (compact) {
    return (
      <div
        className={`relative w-full h-full bg-slate-50/80 rounded-lg overflow-hidden flex items-center justify-center ${className}`}
        onClick={onClick}
      >
        <Image
          src={currentSrc}
          alt={resolved.alt}
          fill={fill}
          width={!fill ? width || 64 : undefined}
          height={!fill ? height || 64 : undefined}
          sizes="64px"
          unoptimized
          onError={handleError}
          className="object-contain p-1 transition-transform duration-300 group-hover:scale-105"
        />
        {showBadge && (
          <div className="absolute top-0.5 right-0.5 z-10 pointer-events-none">
            {resolved.isVerified ? (
              <span className="inline-flex items-center text-[7px] font-extrabold px-1 py-0.2 rounded bg-emerald-600 text-white shadow-2xs">
                ✓
              </span>
            ) : resolved.status === 'USER_UPLOADED' ? (
              <span className="inline-flex items-center text-[7px] font-extrabold px-1 py-0.2 rounded bg-amber-500 text-white shadow-2xs">
                ◷
              </span>
            ) : (
              <span className="inline-flex items-center text-[7px] font-bold px-1 py-0.2 rounded bg-slate-700/80 text-white shadow-2xs">
                DEMO
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full Display Mode (Cards, catalog, marketplace, and product details)
  return (
    <div
      className={`relative w-full h-full bg-gradient-to-b from-slate-50/80 to-slate-100/50 rounded-xl overflow-hidden flex items-center justify-center p-3 select-none transition-all duration-300 ${
        interactive ? 'cursor-pointer hover:shadow-sm' : ''
      } ${className}`}
      onClick={onClick}
    >
      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200/60 to-slate-100 animate-pulse z-0" />
      )}

      {/* Product Image */}
      <Image
        src={currentSrc}
        alt={resolved.alt}
        fill={fill}
        width={!fill ? width || 400 : undefined}
        height={!fill ? height || 400 : undefined}
        sizes={sizes}
        priority={priority}
        unoptimized
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
        className={`object-contain p-2 transition-all duration-300 ease-out group-hover:scale-105 motion-reduce:transform-none ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Discrete Healthcare Badge */}
      {showBadge && (
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 pointer-events-none">
          {resolved.isVerified ? (
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs border border-emerald-400/50 backdrop-blur-xs">
              <ShieldCheck className="h-3 w-3 stroke-[2.5]" />
              <span>Verified Photo</span>
            </span>
          ) : resolved.status === 'USER_UPLOADED' ? (
            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs border border-amber-400/50 backdrop-blur-xs">
              <Clock className="h-2.5 w-2.5 stroke-[2.5]" />
              <span>Under Review</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-800/85 text-slate-100 shadow-xs border border-slate-700/60 backdrop-blur-xs tracking-wider uppercase">
              <Sparkles className="h-2.5 w-2.5 text-teal-300" />
              <span>Demo Visual</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductImage;
