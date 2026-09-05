'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Pill, Stethoscope, UploadCloud, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useUiStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const { totalItems } = useCartStore();
  const { setPrescriptionModalOpen } = useUiStore();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/medicines', label: 'Medicines', icon: Pill },
    {
      action: () => setPrescriptionModalOpen(true),
      label: 'Upload Rx',
      icon: UploadCloud,
      isSpecial: true,
    },
    { href: '/doctors', label: 'Doctors', icon: Stethoscope },
    { href: '/cart', label: 'Cart', icon: ShoppingBag, badge: totalItems },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = item.href ? pathname === item.href : false;

          if (item.action) {
            return (
              <button
                key={idx}
                onClick={item.action}
                className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#00A896] transition-colors"
              >
                <div className="p-1 rounded-full bg-[#00A896]/10 text-[#00A896]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={idx}
              href={item.href!}
              className={cn(
                'relative flex flex-col items-center gap-0.5 text-slate-500 hover:text-[#0A2540] transition-colors',
                isActive && 'text-[#00A896] font-semibold'
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-[#00A896] text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
