'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Pill, Stethoscope, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useUiStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const { totalItems } = useCartStore();
  const { setCartDrawerOpen } = useUiStore();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/medicines', label: 'Medicines', icon: Pill },
    { href: '/doctors', label: 'Doctors', icon: Stethoscope },
    {
      action: () => setCartDrawerOpen(true),
      label: 'Cart',
      icon: ShoppingBag,
      badge: totalItems,
    },
    { href: '/account', label: 'Account', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1.5 shadow-lg shadow-slate-900/10">
      <div className="flex items-center justify-around">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = item.href ? (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)) : false;

          if (item.action) {
            return (
              <button
                key={idx}
                type="button"
                onClick={item.action}
                className="relative flex flex-col items-center justify-center p-1.5 min-w-[56px] text-slate-500 hover:text-[#00A896] transition-colors"
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-[#00A896] text-white text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={idx}
              href={item.href!}
              className={cn(
                'relative flex flex-col items-center justify-center p-1.5 min-w-[56px] rounded-xl transition-all',
                isActive
                  ? 'text-[#00A896] font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              {isActive && (
                <span className="absolute -top-1.5 w-6 h-1 bg-[#00A896] rounded-full" />
              )}
              <div className="relative">
                <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.2]')} />
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
