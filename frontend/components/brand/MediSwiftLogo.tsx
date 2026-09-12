'use client';

import React from 'react';
import Link from 'next/link';

export type LogoVariant = 'full' | 'header' | 'icon' | 'app-icon' | 'wordmark' | 'monochrome';
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LogoTheme = 'dark' | 'light' | 'monochrome';

interface MediSwiftLogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  theme?: LogoTheme;
  className?: string;
  href?: string;
  showTagline?: boolean;
}

const sizeConfig: Record<LogoSize, { iconSize: number; textSize: string; subTextSize: string }> = {
  xs: { iconSize: 20, textSize: 'text-sm font-black', subTextSize: 'text-[8px]' },
  sm: { iconSize: 28, textSize: 'text-lg font-black', subTextSize: 'text-[9px]' },
  md: { iconSize: 36, textSize: 'text-xl sm:text-2xl font-black', subTextSize: 'text-[10px]' },
  lg: { iconSize: 48, textSize: 'text-2xl sm:text-3xl font-black', subTextSize: 'text-xs' },
  xl: { iconSize: 64, textSize: 'text-4xl font-black', subTextSize: 'text-sm' },
};

export function MediSwiftIcon({
  size = 36,
  theme = 'light',
  className = '',
}: {
  size?: number;
  theme?: LogoTheme;
  className?: string;
}) {
  const isDarkBg = theme === 'dark';
  const isMonochrome = theme === 'monochrome';

  // Primary palette
  const crossColor = isMonochrome
    ? (isDarkBg ? '#FFFFFF' : '#0A2540')
    : '#00A896';
  const wingColor = isMonochrome
    ? (isDarkBg ? '#CBD5E1' : '#475569')
    : (isDarkBg ? '#38BDF8' : '#0A2540');
  const accentDot = isMonochrome
    ? (isDarkBg ? '#FFFFFF' : '#0A2540')
    : '#10B981';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${className}`}
      role="img"
      aria-label="MediSwift Healthcare Cross and Swift Wings Emblem"
    >
      <defs>
        {/* Soft gradient for modern healthcare depth */}
        <linearGradient id="mediswiftCrossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isMonochrome ? crossColor : '#00C4A7'} />
          <stop offset="100%" stopColor={isMonochrome ? crossColor : '#008B7A'} />
        </linearGradient>

        <linearGradient id="mediswiftWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isMonochrome ? wingColor : (isDarkBg ? '#38BDF8' : '#0A2540')} />
          <stop offset="100%" stopColor={isMonochrome ? wingColor : (isDarkBg ? '#0284C7' : '#0D3B66')} />
        </linearGradient>

        <filter id="mediswiftGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#00A896" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Dynamic Swift Wing / Speed Aero Element Behind Cross */}
      <path
        d="M12 56C24 40 45 28 84 20C65 35 55 52 50 82C46 64 33 58 12 56Z"
        fill="url(#mediswiftWingGrad)"
        opacity="0.95"
      />

      {/* The Symmetrical Precision Healthcare Cross with Rounded Chamfers */}
      <g filter="url(#mediswiftGlow)">
        {/* Vertical Cross Stem */}
        <rect
          x="38"
          y="16"
          width="24"
          height="68"
          rx="8"
          fill="url(#mediswiftCrossGrad)"
        />
        {/* Horizontal Cross Arm */}
        <rect
          x="16"
          y="38"
          width="68"
          height="24"
          rx="8"
          fill="url(#mediswiftCrossGrad)"
        />
      </g>

      {/* Center Vital Heartbeat / Dynamic Spark Intersection Cut */}
      <circle cx="50" cy="50" r="6" fill={isDarkBg ? '#0A2540' : '#FFFFFF'} />
      <circle cx="50" cy="50" r="3.5" fill={accentDot} />

      {/* Leading Edge Speed Particle */}
      <circle cx="86" cy="18" r="4" fill={accentDot} />
    </svg>
  );
}

export function MediSwiftLogo({
  variant = 'header',
  size = 'md',
  theme = 'light',
  className = '',
  href = '/',
  showTagline = true,
}: MediSwiftLogoProps) {
  const currentSize = sizeConfig[size];
  const isDarkBg = theme === 'dark';
  const isMonochrome = theme === 'monochrome';

  const wordmarkMediColor = isMonochrome
    ? (isDarkBg ? 'text-white' : 'text-slate-900')
    : (isDarkBg ? 'text-white' : 'text-[#0A2540]');

  const wordmarkSwiftColor = isMonochrome
    ? (isDarkBg ? 'text-slate-300' : 'text-slate-700')
    : 'text-[#00A896]';

  const taglineColor = isDarkBg ? 'text-slate-400' : 'text-slate-400';

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Icon */}
      {variant !== 'wordmark' && (
        <div
          className={`flex items-center justify-center ${
            variant === 'app-icon'
              ? 'p-3 rounded-3xl bg-gradient-to-tr from-[#0A2540] via-[#0D3B66] to-[#00A896] shadow-lg border border-white/20'
              : ''
          }`}
        >
          <MediSwiftIcon
            size={currentSize.iconSize}
            theme={variant === 'app-icon' ? 'dark' : theme}
            className="group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Wordmark & Tagline */}
      {variant !== 'icon' && (
        <div className="flex flex-col leading-none">
          <div className={`tracking-tight ${currentSize.textSize} flex items-center`}>
            <span className={wordmarkMediColor}>MEDI</span>
            <span className={wordmarkSwiftColor}>SWIFT</span>
          </div>
          {(variant === 'full' || (variant === 'header' && showTagline && size !== 'xs')) && (
            <span
              className={`${currentSize.subTextSize} font-bold tracking-wider uppercase ${taglineColor} mt-0.5`}
            >
              Healthcare &bull; 2-Hr Delivery
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group inline-block" aria-label="MediSwift Home">
        {content}
      </Link>
    );
  }

  return content;
}
