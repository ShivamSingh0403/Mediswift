import React from 'react';
import Link from 'next/link';
import { HeartPulse, ShieldCheck, Truck, Clock, Headphones } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-24 border-t border-slate-800">
      {/* Value Badges */}
      <div className="border-b border-slate-800/80 py-8 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-brand-400 shrink-0" />
            <div>
              <h4 className="text-white text-sm font-semibold">100% Genuine</h4>
              <p className="text-xs text-slate-400">Verified pharmaceuticals</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8 text-brand-400 shrink-0" />
            <div>
              <h4 className="text-white text-sm font-semibold">Swift Delivery</h4>
              <p className="text-xs text-slate-400">Express delivery to doorstep</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-brand-400 shrink-0" />
            <div>
              <h4 className="text-white text-sm font-semibold">24/7 Availability</h4>
              <p className="text-xs text-slate-400">Doctors & pharmacy on call</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Headphones className="w-8 h-8 text-brand-400 shrink-0" />
            <div>
              <h4 className="text-white text-sm font-semibold">Expert Support</h4>
              <p className="text-xs text-slate-400">Direct pharmacist consultation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <HeartPulse className="w-5 h-5 text-brand-500" />
              Mediswift Pro
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enterprise healthcare commerce and digital consultation platform connecting patients with trusted healthcare providers.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/medicines" className="hover:text-white transition-colors">Medicine Store</Link></li>
              <li><Link href="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/medicines?category=prescription" className="hover:text-white transition-colors">Prescription Drugs</Link></li>
              <li><Link href="/medicines?category=otc" className="hover:text-white transition-colors">Over-The-Counter</Link></li>
              <li><Link href="/medicines?category=wellness" className="hover:text-white transition-colors">Wellness & Vitamins</Link></li>
              <li><Link href="/medicines?category=devices" className="hover:text-white transition-colors">Medical Devices</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Compliance</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Mediswift Pro operates under strict medical supply regulations. Valid prescriptions are required where legally mandated.
            </p>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Mediswift Healthcare Inc. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
