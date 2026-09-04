import React from 'react';
import Link from 'next/link';
import { Pill, Activity, Stethoscope, ShieldCheck, ArrowRight, Truck, Sparkles, CheckCircle2 } from 'lucide-react';

// Fallback categories in case backend is being initialized
const DEFAULT_CATEGORIES = [
  { id: 'prescription', name: 'Prescription Drugs', icon: Pill, count: '350+ items', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 'otc', name: 'Over-The-Counter (OTC)', icon: Activity, count: '500+ items', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 'wellness', name: 'Wellness & Supplements', icon: Sparkles, count: '280+ items', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { id: 'devices', name: 'Medical Devices & First Aid', icon: Stethoscope, count: '140+ items', color: 'bg-purple-50 text-purple-600 border-purple-200' },
];

async function getCategories() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
  try {
    const res = await fetch(`${apiBase}/medicines/categories/`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Failed to fetch categories');
    const data = await res.json();
    return data;
  } catch (err) {
    // Return gracefully structured fallback
    return DEFAULT_CATEGORIES.map((c) => ({ id: c.id, name: c.name }));
  }
}

export default async function HomePage() {
  const backendCategories = await getCategories();

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/60 via-slate-50 to-white pt-16 pb-20 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100/80 border border-brand-200 text-brand-800 text-xs font-semibold tracking-wide">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                Next-Gen Telehealth & Pharmacy Platform
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Healthcare Delivered <br className="hidden sm:inline" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-teal-500">
                  Swiftly & Securely.
                </span>
              </h1>
              
              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Order genuine medications with verified prescriptions, connect with certified medical specialists, and receive priority doorstep delivery in 30 minutes.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/medicines"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/25 transition-all hover:scale-[1.02]"
                >
                  <Pill className="w-5 h-5" />
                  Explore Medicines
                </Link>
                <Link
                  href="/cart"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs transition-all"
                >
                  View Cart & Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust Micro-Metrics */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/80 max-w-md mx-auto lg:mx-0 text-left">
                <div>
                  <div className="text-2xl font-bold text-slate-900">10k+</div>
                  <div className="text-xs text-slate-500 font-medium">Verified Meds</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">99.8%</div>
                  <div className="text-xs text-slate-500 font-medium">On-time Delivery</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">24/7</div>
                  <div className="text-xs text-slate-500 font-medium">Support</div>
                </div>
              </div>
            </div>

            {/* Visual Hero Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-brand-500 to-teal-400 opacity-20 blur-xl"></div>
                <div className="relative bg-white border border-slate-200/90 rounded-2xl shadow-xl p-6 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        RX
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Instant Prescription Care</h4>
                        <p className="text-xs text-slate-500">Live Inventory Verification</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                      Active
                    </span>
                  </div>

                  {/* Highlights list */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
                      <span className="text-slate-700 font-medium">Automated stock lock & cold-chain guarantee</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
                      <span className="text-slate-700 font-medium">Verified by licensed clinical pharmacists</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
                      <span className="text-slate-700 font-medium">End-to-end encrypted medical checkout</span>
                    </div>
                  </div>

                  <Link
                    href="/medicines"
                    className="block text-center py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Browse Full Medicine Catalog →
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">
              Curated Formulary
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Featured Healthcare Categories
            </h2>
          </div>
          <Link
            href="/medicines"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 group"
          >
            View all categories
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {backendCategories.map((cat: { id: string; name: string }) => {
            const fallbackInfo = DEFAULT_CATEGORIES.find((c) => c.id === cat.id);
            const countText = fallbackInfo?.count || 'Explore items';
            const colorClass = fallbackInfo?.color || 'bg-teal-50 text-teal-600 border-teal-200';

            return (
              <Link
                key={cat.id}
                href={`/medicines?category=${cat.id}`}
                className="group relative bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-brand-500/40 transition-all hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${colorClass}`}>
                  <Pill className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-lg">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">{countText}</p>
                <div className="mt-4 flex items-center text-xs font-semibold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Browse products →
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Trust & Guarantee Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-brand-700 to-teal-800 text-white p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Need immediate doctor consultation or prescription renewal?
            </h3>
            <p className="text-teal-100 text-base leading-relaxed">
              Connect via high-definition video call with top certified doctors across Cardiology, Pediatrics, General Medicine, and Dermatology within 5 minutes.
            </p>
            <div className="pt-2">
              <Link
                href="/medicines"
                className="inline-flex items-center gap-2 bg-white text-brand-800 font-bold px-6 py-3 rounded-xl hover:bg-teal-50 transition-all shadow-md"
              >
                Schedule Consultation
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
