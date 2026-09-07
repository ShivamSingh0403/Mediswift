'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Pill,
  Stethoscope,
  UploadCloud,
  ShieldCheck,
  Zap,
  Clock,
  ChevronRight,
  Star,
  Plus,
  ArrowRight,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { productService } from '@/services/product-service';
import { doctorService } from '@/services/doctor-service';
import { Product, Doctor } from '@/types';
import { useCartStore } from '@/store/cart-store';
import { useUiStore } from '@/store/ui-store';
import { useNotificationStore } from '@/store/notification-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ProductCard } from '@/components/product-card';
import { formatCurrency } from '@/lib/utils';

export default function HomePage() {
  const { addItem } = useCartStore();
  const { setPrescriptionModalOpen, activePincode } = useUiStore();
  const { addToast } = useNotificationStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, docRes] = await Promise.all([
          productService.getProducts(),
          doctorService.getDoctors(),
        ]);
        if (prodRes?.data?.results) setProducts(prodRes.data.results);
        if (docRes?.data?.results) setDoctors(docRes.data.results);
      } catch {
        // Fallback or offline state handled gracefully
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, 1);
    addToast({
      type: 'success',
      title: 'Added to Cart',
      message: `${product.name} added to your basket.`,
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0A2540] via-[#0D3B66] to-[#0A2540] text-white pt-12 pb-20 px-4">
        {/* Subtle decorative glow shapes */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#00A896]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-cyan-200">
                <span className="w-2 h-2 rounded-full bg-[#00A896] animate-pulse" />
                <span>Delivering across Pincode: {activePincode}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                Your Health, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-[#00A896] to-cyan-300">
                  Delivered Smarter.
                </span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed">
                Experience India&apos;s most unified healthcare ecosystem. Order genuine pharmaceuticals with 2-hour express delivery, consult verified specialists, and store encrypted prescriptions.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => setPrescriptionModalOpen(true)}
                  className="shadow-lg shadow-[#00A896]/25"
                >
                  <UploadCloud className="h-5 w-5 mr-2" />
                  <span>Upload Prescription</span>
                </Button>
                <Link href="/medicines">
                  <Button size="lg" variant="outline" className="border-white/20 text-white bg-white/5 hover:bg-white/10">
                    <span>Order Medicines</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* Trust Micro-Metrics */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-white/10 text-xs">
                <div>
                  <div className="font-bold text-xl text-white">2 Hours</div>
                  <div className="text-slate-400">Average Delivery</div>
                </div>
                <div>
                  <div className="font-bold text-xl text-white">100%</div>
                  <div className="text-slate-400">Genuine Rx Guarantee</div>
                </div>
                <div>
                  <div className="font-bold text-xl text-white">500+</div>
                  <div className="text-slate-400">Verified Doctors</div>
                </div>
              </div>
            </div>

            {/* Right Card Feature Grid */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <Link href="/medicines" className="group">
                <div className="rounded-2xl p-5 bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Pill className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-white text-base">Order Medicines</h3>
                  <p className="text-xs text-slate-300 mt-1">Flat 15-20% off on monthly refills</p>
                  <div className="mt-3 flex items-center text-xs font-semibold text-teal-300">
                    <span>Explore Catalog</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
              </Link>

              <Link href="/doctors" className="group">
                <div className="rounded-2xl p-5 bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-white text-base">Doctor Telehealth</h3>
                  <p className="text-xs text-slate-300 mt-1">Connect with specialists via HD video</p>
                  <div className="mt-3 flex items-center text-xs font-semibold text-cyan-300">
                    <span>Book Consult</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
              </Link>

              <div
                onClick={() => setPrescriptionModalOpen(true)}
                className="rounded-2xl p-5 bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-white text-base">Upload Rx</h3>
                <p className="text-xs text-slate-300 mt-1">Pharmacist reviews within 15 mins</p>
                <div className="mt-3 flex items-center text-xs font-semibold text-indigo-300">
                  <span>Fast Upload</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </div>
              </div>

              <Link href="/categories/vitamins-supplements" className="group">
                <div className="rounded-2xl p-5 bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all duration-300 hover:-translate-y-1">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <HeartPulse className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-white text-base">Wellness Hub</h3>
                  <p className="text-xs text-slate-300 mt-1">Immunity, Ayurveda & Nutrition</p>
                  <div className="mt-3 flex items-center text-xs font-semibold text-emerald-300">
                    <span>Shop Wellness</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Badge variant="accent" className="mb-2">Verified Pharmacy</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight">
              Essential Medicines & Healthcare
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Guaranteed genuine formulation from licensed manufacturers.
            </p>
          </div>
          <Link href="/medicines">
            <Button variant="outline" size="sm">
              <span>View All</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Top Telehealth Doctors Section */}
      <section className="py-16 px-4 bg-slate-100/60 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge variant="success" className="mb-2">Instant Telehealth</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight">
                Consult With Verified Specialists
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Zero waiting rooms. Connect via encrypted audio/video directly with top Indian doctors.
              </p>
            </div>
            <Link href="/doctors">
              <Button variant="outline" size="sm">
                <span>All Doctors</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {doctors.map((doc) => (
              <Card key={doc.id} className="glass-card-hover">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0A2540] to-[#00A896] text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-sm">
                    {doc.doctor_name ? doc.doctor_name.charAt(0) : 'D'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{doc.doctor_name}</h4>
                    <p className="text-xs text-[#00A896] font-medium">
                      {doc.specialties.map((s) => s.name).join(', ')}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{doc.qualifications}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                      <span className="flex items-center text-amber-500 font-semibold">
                        <Star className="h-3.5 w-3.5 fill-current mr-1" />
                        {doc.rating}
                      </span>
                      <span>•</span>
                      <span>{doc.experience_years} yrs exp</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400">Consultation Fee</div>
                    <div className="text-base font-bold text-[#0A2540]">
                      {formatCurrency(doc.consultation_fee)}
                    </div>
                  </div>
                  <Link href={`/doctors/${doc.id}`}>
                    <Button size="sm" variant="secondary">
                      <span>Book Slot</span>
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
