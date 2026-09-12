'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Pill,
  Stethoscope,
  UploadCloud,
  ShieldCheck,
  Zap,
  Clock,
  ChevronRight,
  ChevronLeft,
  Star,
  Plus,
  ArrowRight,
  Activity,
  HeartPulse,
  Sparkles,
  Thermometer,
  Search,
  CheckCircle2,
  Lock,
  PhoneCall,
  Download,
  HelpCircle,
  ChevronDown,
  Quote,
  Flame,
  Award,
  Copy,
  Check,
  Truck,
  Calendar,
  Bell,
  Tag,
  X,
} from 'lucide-react';
import { productService } from '@/services/product-service';
import { doctorService } from '@/services/doctor-service';
import { Product, Doctor, Category } from '@/types';
import { useCartStore } from '@/store/cart-store';
import { useUiStore } from '@/store/ui-store';
import { useNotificationStore } from '@/store/notification-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ProductCard } from '@/components/product-card';
import { ProductCardSkeleton, DoctorCardSkeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { fadeUp, staggerContainer } from '@/lib/motion';

const CURATED_CATEGORIES = [
  { name: 'Pain Relief', slug: 'pain-relief', icon: '⚡', color: 'from-amber-500/10 to-orange-500/10', count: '13+ Products' },
  { name: 'Fever & Cold', slug: 'fever-cold', icon: '🌡️', color: 'from-blue-500/10 to-cyan-500/10', count: '13+ Products' },
  { name: 'Vitamins & Supplements', slug: 'vitamins-supplements', icon: '🌿', color: 'from-teal-500/10 to-emerald-500/10', count: '13+ Products' },
  { name: 'Diabetes Care', slug: 'diabetes-care', icon: '🩸', color: 'from-rose-500/10 to-red-500/10', count: '13+ Products' },
  { name: 'Heart Care', slug: 'heart-care', icon: '❤️', color: 'from-pink-500/10 to-rose-500/10', count: '13+ Products' },
  { name: 'Skin Care', slug: 'skin-care', icon: '✨', color: 'from-purple-500/10 to-indigo-500/10', count: '13+ Products' },
  { name: 'Hair Care', slug: 'hair-care', icon: '💇', color: 'from-violet-500/10 to-purple-500/10', count: '13+ Products' },
  { name: 'Baby Care', slug: 'baby-care', icon: '👶', color: 'from-sky-500/10 to-blue-500/10', count: '13+ Products' },
  { name: "Women's Health", slug: 'womens-health', icon: '🌸', color: 'from-rose-500/10 to-pink-500/10', count: '13+ Products' },
  { name: 'Digestive Health', slug: 'digestive-health', icon: '🥗', color: 'from-emerald-500/10 to-teal-500/10', count: '13+ Products' },
  { name: 'First Aid', slug: 'first-aid', icon: '🩹', color: 'from-red-500/10 to-rose-500/10', count: '13+ Products' },
  { name: 'Medical Devices', slug: 'medical-devices', icon: '🩺', color: 'from-cyan-500/10 to-teal-500/10', count: '13+ Products' },
  { name: 'Ayurvedic Products', slug: 'ayurvedic-products', icon: '🍃', color: 'from-lime-500/10 to-green-500/10', count: '13+ Products' },
  { name: 'Oral Care', slug: 'oral-care', icon: '🪥', color: 'from-teal-500/10 to-cyan-500/10', count: '13+ Products' },
  { name: 'Eye Care', slug: 'eye-care', icon: '👁️', color: 'from-indigo-500/10 to-blue-500/10', count: '13+ Products' },
  { name: 'Fitness & Wellness', slug: 'fitness-wellness', icon: '🏋️', color: 'from-amber-500/10 to-yellow-500/10', count: '13+ Products' },
];

const FAQS = [
  {
    q: 'Do I need a doctor prescription to order medicines on MediSwift?',
    a: 'For Over-The-Counter (OTC) items like multivitamins, analgesics, digestive syrups, and first aid supplies, no prescription is needed. For Schedule H and H1 prescription-only pharmaceuticals, Indian law (CDSCO) requires a valid prescription from a registered medical practitioner, which our certified pharmacists review within minutes.',
  },
  {
    q: 'How does the 2-Hour Express Delivery work?',
    a: 'We operate micro-fulfillment centers across major cities in India. Once your order is verified and packed in temperature-controlled packaging, our local express courier delivers it directly to your doorstep in under 120 minutes with live GPS tracking.',
  },
  {
    q: 'Are all medicines sold on MediSwift 100% genuine and verified?',
    a: 'Yes. MediSwift sources all medicines directly from licensed pharmaceutical manufacturers and authorized super-stockists (including Sun Pharma, Cipla, Abbott, GSK, and Dr. Reddy\'s). Every batch is scanned and verified for authenticity, batch numbers, and expiry dates.',
  },
  {
    q: 'How do digital doctor tele-consultations work?',
    a: 'You can consult verified, NMC-registered physicians and specialists across 25+ medical departments. Once booked, you join an encrypted, HIPAA-compliant video session. Post-consultation, your digital prescription is automatically saved to your MediSwift Prescription Vault.',
  },
  {
    q: 'What is your return and refund policy for medicines?',
    a: 'We offer hassle-free returns on sealed, unadulterated items with valid packaging within 7 days of delivery. For temperature-sensitive cold-chain items or opened medicines, returns are governed by pharmacy safety protocols.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'MediSwift delivered my mother’s critical cardiac and diabetic medicines within 45 minutes of prescription upload. Truly a lifesaver in urgent situations.',
    author: 'Vikram Joshi',
    role: 'Verified Customer, Ahmedabad',
    rating: 5,
    tag: 'Express Delivery',
  },
  {
    quote: 'The tele-consultation with the cardiologist was seamless. The prescription was immediately ready in my cart with an automatic 20% discount on refills.',
    author: 'Dr. Radhika Nair',
    role: 'Healthcare Consultant, Bengaluru',
    rating: 5,
    tag: 'Doctor Telehealth',
  },
  {
    quote: 'Having all authentic OTC supplements, ayurvedic tonics, and medical devices under one roof with fast delivery makes this my go-to healthcare app.',
    author: 'Ananya Sharma',
    role: 'Fitness Enthusiast, Mumbai',
    rating: 5,
    tag: 'Authentic Pharmacy',
  },
];

const PROMO_COUPONS = [
  {
    code: 'FIRSTMED20',
    title: 'Flat 20% OFF on 1st Order',
    desc: 'Valid on prescription and OTC orders above ₹499. Max savings ₹300.',
    category: 'Welcome Offer',
    expires: 'Instant Apply',
    gradient: 'from-teal-500/10 via-emerald-500/10 to-teal-600/10',
    badgeColor: 'bg-teal-500/10 text-[#00A896] border-teal-500/20',
  },
  {
    code: 'EXPRESS50',
    title: 'Free 2-Hour Express Delivery',
    desc: 'Zero shipping fee on cold-chain & urgent orders above ₹399.',
    category: 'Express Shipping',
    expires: 'High Speed',
    gradient: 'from-blue-500/10 via-cyan-500/10 to-sky-600/10',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  {
    code: 'HEARTCARE',
    title: 'Extra 25% OFF Cardiac Meds',
    desc: 'Special subsidy on chronic care, blood pressure & statins refills.',
    category: 'Chronic Care',
    expires: 'Doctor Recommended',
    gradient: 'from-rose-500/10 via-pink-500/10 to-red-600/10',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  },
  {
    code: 'FAMILYPLUS',
    title: 'Save ₹250 on Family Packs',
    desc: 'Applicable on pediatric wellness, immunity & daily home first aid.',
    category: 'Family Health',
    expires: 'Limited Stock',
    gradient: 'from-purple-500/10 via-indigo-500/10 to-violet-600/10',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
];

export default function HomePage() {
  const { setPrescriptionModalOpen, setSearchOverlayOpen, activePincode } = useUiStore();
  const { addToast } = useNotificationStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [deviceProducts, setDeviceProducts] = useState<Product[]>([]);
  const [wellnessProducts, setWellnessProducts] = useState<Product[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Top dismissible announcement
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  // Coupon copy state
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  // Trending filter tab
  const [activeTrendingTab, setActiveTrendingTab] = useState('all');

  // Carousel index for featured products
  const [featuredIndex, setFeaturedIndex] = useState(0);

  // FAQ Accordion open index
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleCopyCoupon = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCoupon(code);
    addToast({
      type: 'success',
      title: 'Coupon Copied!',
      message: `Code "${code}" copied to clipboard. Apply at checkout for instant savings!`,
    });
    setTimeout(() => {
      setCopiedCoupon((prev) => (prev === code ? null : prev));
    }, 3000);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      addToast({
        type: 'error',
        title: 'Invalid Email',
        message: 'Please enter a valid email address to receive refills and health updates.',
      });
      return;
    }
    setNewsletterSubmitted(true);
    addToast({
      type: 'success',
      title: 'Subscribed Successfully!',
      message: 'You have been enrolled in MediSwift Health Updates & Refill Reminders.',
    });
  };

  useEffect(() => {
    async function loadCatalog() {
      try {
        const extractResults = (val: unknown): unknown[] => {
          if (!val || typeof val !== 'object') return [];
          const record = val as Record<string, unknown>;
          if (Array.isArray(record.data)) return record.data;
          if (record.data && typeof record.data === 'object') {
            const inner = record.data as Record<string, unknown>;
            if (Array.isArray(inner.results)) return inner.results;
          }
          if (Array.isArray(record.results)) return record.results;
          return [];
        };

        const [prodSettled, docSettled, devSettled, wellSettled] = await Promise.allSettled([
          productService.getProducts({ page_size: 40 }),
          doctorService.getDoctors(),
          productService.getProducts({ category: 'medical-devices', page_size: 10 }),
          productService.getProducts({ category: 'vitamins-supplements', page_size: 10 }),
        ]);

        if (prodSettled.status === 'fulfilled') {
          const all = extractResults(prodSettled.value) as Product[];
          setProducts(all);
          const featured = all.filter((p) => p.featured || p.bestseller);
          setFeaturedProducts(featured.length > 0 ? featured : all.slice(0, 10));
          const trending = all.filter((p) => p.trending);
          setTrendingProducts(trending.length > 0 ? trending : all.slice(0, 10));
        }

        if (devSettled.status === 'fulfilled') {
          setDeviceProducts(extractResults(devSettled.value) as Product[]);
        }

        if (wellSettled.status === 'fulfilled') {
          setWellnessProducts(extractResults(wellSettled.value) as Product[]);
        }

        if (docSettled.status === 'fulfilled') {
          const docs = extractResults(docSettled.value) as Doctor[];
          setDoctors(docs.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load homepage catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const handleNextFeatured = () => {
    setFeaturedIndex((prev) => (prev + 1) % Math.max(1, featuredProducts.length - 3));
  };

  const handlePrevFeatured = () => {
    setFeaturedIndex((prev) => (prev - 1 + Math.max(1, featuredProducts.length - 3)) % Math.max(1, featuredProducts.length - 3));
  };

  // Filter trending based on active tab
  const filteredTrending = trendingProducts.filter((p) => {
    if (activeTrendingTab === 'all') return true;
    if (activeTrendingTab === 'rx') return p.prescription_required;
    if (activeTrendingTab === 'otc') return !p.prescription_required;
    if (activeTrendingTab === 'bestseller') return p.bestseller;
    if (activeTrendingTab === 'deals') return Number(p.discount_percent || 0) >= 15;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      {/* SECTION 1: TOP DISMISSIBLE ANNOUNCEMENT BAR */}
      {!announcementDismissed && (
        <div className="bg-gradient-to-r from-[#00A896] via-[#028090] to-[#0A2540] text-white py-2 px-4 text-xs relative z-40 border-b border-teal-400/20 shadow-xs">
          <div className="max-w-[1536px] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase inline-flex items-center gap-1">
                <Tag className="h-3 w-3" /> Offer
              </span>
              <span className="font-semibold">
                Get Flat 20% OFF on your 1st medicine order with code
              </span>
              <button
                type="button"
                onClick={() => handleCopyCoupon('FIRSTMED20')}
                className="font-mono font-bold bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded border border-white/30 text-amber-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>FIRSTMED20</span>
                <Copy className="h-3 w-3" />
              </button>
              <span className="text-teal-200 hidden md:inline">|</span>
              <span className="text-teal-100 hidden md:inline items-center gap-1">
                ⚡ 2-Hour Express Delivery active for Pincode <strong>{activePincode}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/medicines"
                className="text-white hover:text-amber-300 font-bold underline underline-offset-2 hidden sm:inline text-[11px]"
              >
                Shop Medicines Now →
              </Link>
              <button
                type="button"
                onClick={() => setAnnouncementDismissed(true)}
                className="text-teal-200 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0A2540] via-[#0D3B66] to-[#0A2540] text-white pt-12 sm:pt-16 pb-20 sm:pb-24 px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Glow ambient backgrounds */}
        <div className="absolute -top-32 -left-32 w-[36rem] h-[36rem] rounded-full bg-[#00A896]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[36rem] h-[36rem] rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        <div className="max-w-[1536px] mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-center">
            {/* Left Copy & Search */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer()}
              className="lg:col-span-7 space-y-6"
            >
              {/* Location Badge */}
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-cyan-200 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-[#00A896] animate-pulse" />
                <span>Express 2-Hr Delivery to Pincode <strong>{activePincode}</strong></span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.06]">
                Your Health, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-[#00A896] to-cyan-300">
                  Delivered Smarter.
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p variants={fadeUp} className="text-base sm:text-lg text-slate-200 font-normal leading-relaxed max-w-2xl">
                Order genuine medicines with instant 20% discount, consult verified top doctors via video in minutes, and receive express delivery directly to your door.
              </motion.p>

              {/* Hero Search Box */}
              <motion.div variants={fadeUp} className="pt-2">
                <div
                  onClick={() => setSearchOverlayOpen(true)}
                  className="flex items-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-2 shadow-2xl hover:border-teal-400/60 hover:bg-white/15 transition-all cursor-text group max-w-2xl"
                >
                  <div className="pl-3 pr-2 text-slate-300 group-hover:text-teal-300 transition-colors">
                    <Search className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-xs sm:text-sm text-slate-300 truncate py-2">
                    Search medicines, salts (e.g. Paracetamol, Metformin), or wellness products...
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    className="rounded-xl font-bold px-4 sm:px-6 shadow-md shadow-teal-500/30"
                  >
                    Search
                  </Button>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/medicines">
                  <Button size="lg" variant="primary" className="rounded-2xl font-bold shadow-lg shadow-teal-500/25 h-12 px-6">
                    <Pill className="h-5 w-5 mr-2" />
                    <span>Order Medicines</span>
                  </Button>
                </Link>

                <Link href="/doctors">
                  <Button size="lg" variant="ghost" className="rounded-2xl text-cyan-200 hover:text-white hover:bg-white/5 h-12 px-6">
                    <Stethoscope className="h-5 w-5 mr-2" />
                    <span>Consult Doctor</span>
                  </Button>
                </Link>
              </motion.div>

              {/* Trust Micro-Metrics */}
              <motion.div variants={fadeUp} className="pt-6 grid grid-cols-3 gap-4 border-t border-white/10 text-xs">
                <div>
                  <div className="font-extrabold text-xl sm:text-2xl text-white">2 Hours</div>
                  <div className="text-slate-300 mt-0.5">Average Delivery Time</div>
                </div>
                <div>
                  <div className="font-extrabold text-xl sm:text-2xl text-white">100% Genuine</div>
                  <div className="text-slate-300 mt-0.5">Licensed Rx Guarantee</div>
                </div>
                <div>
                  <div className="font-extrabold text-xl sm:text-2xl text-white">Verified Specialists</div>
                  <div className="text-slate-300 mt-0.5">NMC Registered Doctors</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Interactive Highlights Cards */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4 sm:gap-5">
              <Link href="/medicines" className="group">
                <div className="rounded-3xl p-5 sm:p-6 bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Pill className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-white text-base sm:text-lg">Order Medicines</h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">260+ catalog items with up to 25% savings</p>
                  </div>
                  <div className="mt-4 flex items-center text-xs font-semibold text-teal-300">
                    <span>Explore Catalog</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
              </Link>

              <Link href="/doctors" className="group">
                <div className="rounded-3xl p-5 sm:p-6 bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-white text-base sm:text-lg">Instant Telehealth</h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">Video consult top specialists in 10 mins</p>
                  </div>
                  <div className="mt-4 flex items-center text-xs font-semibold text-cyan-300">
                    <span>Find Doctors</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setPrescriptionModalOpen(true)}
                className="group text-left"
              >
                <div className="rounded-3xl p-5 sm:p-6 bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-white text-base sm:text-lg">Upload Rx</h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">Pharmacist reviews within 5 minutes</p>
                  </div>
                  <div className="mt-4 flex items-center text-xs font-semibold text-indigo-300">
                    <span>Upload Now</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
              </button>

              <Link href="/categories/ayurvedic-products" className="group">
                <div className="rounded-3xl p-5 sm:p-6 bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-white text-base sm:text-lg">Wellness & Herbals</h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">Pure herbal tonics, vitamins & nutrition</p>
                  </div>
                  <div className="mt-4 flex items-center text-xs font-semibold text-emerald-300">
                    <span>Shop Wellness</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: QUICK HEALTHCARE ACTIONS STRIP */}
      <section className="relative -mt-8 sm:-mt-10 z-20 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1536px] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <Link
            href="/medicines"
            className="group p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-500/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-teal-50 text-[#00A896] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Pill className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#00A896] transition-colors">
                Order Medicines
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                260+ verified formulations, flat 20% off
              </p>
            </div>
            <div className="mt-3 flex items-center text-[10px] font-bold text-[#00A896]">
              <span>Explore</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>

          <Link
            href="/doctors"
            className="group p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-cyan-500/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Stethoscope className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-cyan-600 transition-colors">
                Video Consult
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                500+ top Indian doctors in 10 mins
              </p>
            </div>
            <div className="mt-3 flex items-center text-[10px] font-bold text-cyan-600">
              <span>Consult Now</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setPrescriptionModalOpen(true)}
            className="group p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-500/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                Upload Rx
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                Pharmacist review & instant cart filling
              </p>
            </div>
            <div className="mt-3 flex items-center text-[10px] font-bold text-indigo-600">
              <span>Quick Upload</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </button>

          <Link
            href="/categories/medical-devices"
            className="group p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-rose-500/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <HeartPulse className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-rose-600 transition-colors">
                Health Monitors
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                BP machines, glucometers & strips
              </p>
            </div>
            <div className="mt-3 flex items-center text-[10px] font-bold text-rose-600">
              <span>View Devices</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>

          <Link
            href="/categories/ayurvedic-products"
            className="group p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-500/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                Ayurveda & Herbals
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                Pure herbs, Chyawanprash & tonics
              </p>
            </div>
            <div className="mt-3 flex items-center text-[10px] font-bold text-emerald-600">
              <span>Shop Natural</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>

          <Link
            href="/orders"
            className="group p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-500/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Truck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                Track Orders
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                Live GPS delivery map & updates
              </p>
            </div>
            <div className="mt-3 flex items-center text-[10px] font-bold text-amber-600">
              <span>Track Now</span>
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* SECTION 4: QUICK CATEGORY EXPLORER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1536px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <Badge variant="accent" className="mb-2">Specialty Care</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight">
              Explore Healthcare by Category
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Curated therapeutic formulations covering all major medical departments.
            </p>
          </div>
          <Link href="/medicines">
            <Button variant="outline" size="sm" className="rounded-xl">
              <span>View All 20 Categories</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {CURATED_CATEGORIES.map((cat, idx) => (
            <Link
              key={idx}
              href={`/categories/${cat.slug}`}
              className="group flex flex-col items-center text-center p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-[#00A896]/50 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-slate-100 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <h4 className="font-bold text-xs text-slate-800 group-hover:text-[#00A896] transition-colors line-clamp-1">
                {cat.name}
              </h4>
              <span className="text-[10px] text-slate-400 mt-0.5">{cat.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 3: PRESCRIPTION UPLOAD BANNER */}
      <section className="px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1536px] mx-auto mb-16">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0A2540] via-[#123A63] to-[#00A896] text-white p-8 sm:p-12 overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs text-teal-200 font-semibold">
              <ShieldCheck className="h-4 w-4" /> CDSCO Compliant & Pharmacist Verified
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Have a Doctor&apos;s Prescription? <br />
              Let Our Pharmacists Fulfill It.
            </h2>

            <p className="text-sm text-slate-200 leading-relaxed">
              Upload your written or digital prescription. Our registered pharmacists will review the dosage, identify the medicines, and add genuine products to your cart with automatic refill discounts.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setPrescriptionModalOpen(true)}
                className="rounded-2xl font-bold h-12 px-6 shadow-md shadow-black/20"
              >
                <UploadCloud className="h-5 w-5 mr-2" />
                <span>Upload Prescription Now</span>
              </Button>
              <Link href="/prescriptions">
                <Button variant="outline" size="lg" className="rounded-2xl border-white/30 text-white bg-white/10 hover:bg-white/20 h-12 px-6">
                  <span>View Prescription Vault</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: FEATURED PRODUCTS CAROUSEL */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1536px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
              <Sparkles className="h-4 w-4" /> Doctor Recommended
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight">
              Featured Medicines & Formulations
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Top prescribed formulations and clinical staples from verified brands.
            </p>
          </div>

          {/* Carousel controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevFeatured}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              aria-label="Previous products"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNextFeatured}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              aria-label="Next products"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            {featuredProducts.slice(featuredIndex, featuredIndex + 5).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* SECTION 5: TRENDING PRODUCTS WITH TABS */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1536px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">
              <Flame className="h-4 w-4 fill-rose-500 text-rose-500" /> High In Demand
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight">
              Trending Healthcare Essentials
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Most frequently ordered products across Indian households this week.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTrendingTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTrendingTab === 'all'
                  ? 'bg-[#00A896] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Items
            </button>
            <button
              type="button"
              onClick={() => setActiveTrendingTab('otc')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTrendingTab === 'otc'
                  ? 'bg-[#00A896] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              OTC Only
            </button>
            <button
              type="button"
              onClick={() => setActiveTrendingTab('rx')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTrendingTab === 'rx'
                  ? 'bg-[#00A896] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Prescription Rx
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredTrending.slice(0, 10).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* SECTION 6: MEDICAL DEVICES SHOWCASE */}
      {deviceProducts.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1536px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge variant="default" className="mb-2">Diagnostic Hardware</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight">
                Medical Devices & Home Health Monitors
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Clinically validated blood pressure monitors, glucometers, nebulizers, and pulse oximeters.
              </p>
            </div>
            <Link href="/categories/medical-devices">
              <Button variant="outline" size="sm" className="rounded-xl">
                View All Devices
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            {deviceProducts.slice(0, 5).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* SECTION 7: WELLNESS & LIFESTYLE */}
      {wellnessProducts.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1536px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge variant="success" className="mb-2">Daily Vitality</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight">
                Vitamins, Supplements & Wellness
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Elevate your daily nutrition with high-potency multivitamins, omega fish oils, and immunity tonics.
              </p>
            </div>
            <Link href="/categories/vitamins-supplements">
              <Button variant="outline" size="sm" className="rounded-xl">
                View Wellness
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            {wellnessProducts.slice(0, 5).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* SECTION 10: HEALTHCARE OFFERS & SAVINGS */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1536px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#00A896] uppercase tracking-wider mb-1">
              <Tag className="h-4 w-4" /> Exclusive Pharmacy Discounts
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight">
              Healthcare Savings & Verified Coupons
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Maximize your medicine savings with active promotional vouchers valid across India.
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-xs inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>4 Active Coupons Verified Today</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PROMO_COUPONS.map((coupon, idx) => {
            const isCopied = copiedCoupon === coupon.code;
            return (
              <div
                key={idx}
                className={`relative rounded-3xl p-6 bg-gradient-to-br ${coupon.gradient} border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden group`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${coupon.badgeColor}`}>
                      {coupon.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {coupon.expires}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    {coupon.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {coupon.desc}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <div className="font-mono font-black text-sm tracking-wider text-[#0A2540] bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    {coupon.code}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCoupon(coupon.code)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#00A896] hover:bg-[#028090] text-white'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 11: DOCTOR CONSULTATION SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 xl:px-10 bg-slate-100/70 border-y border-slate-200/80">
        <div className="max-w-[1536px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <Badge variant="accent" className="mb-2">Instant Telehealth</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight">
                Consult With Verified Specialists
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Zero waiting rooms. Connect via encrypted audio/video directly with top Indian doctors.
              </p>
            </div>
            <Link href="/doctors">
              <Button variant="primary" size="md" className="rounded-xl shadow-xs">
                <span>Browse 500+ Doctors</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <DoctorCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {doctors.map((doctor) => (
                <Card key={doctor.id} className="glass-card-hover p-5 flex flex-col justify-between rounded-3xl bg-white border border-slate-200">
                  <div>
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center font-bold text-lg shrink-0">
                        {doctor.doctor_name?.[0] || 'D'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">
                          {doctor.doctor_name}
                        </h4>
                        <p className="text-xs text-[#00A896] font-semibold">
                          {doctor.specialties?.[0]?.name || 'Specialist'}
                        </p>
                        <p className="text-[11px] text-slate-400">{doctor.experience_years} years exp</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-y border-slate-100 text-xs">
                      <span className="text-slate-500">Consultation Fee</span>
                      <span className="font-extrabold text-[#0A2540]">
                        {formatCurrency(doctor.consultation_fee)}
                      </span>
                    </div>
                  </div>

                  <Link href={`/doctors/${doctor.id}`} className="mt-4">
                    <Button variant="outline" size="sm" className="w-full rounded-xl text-xs font-semibold">
                      Book Video Consult
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 9: HOW MEDISWIFT WORKS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1536px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="default" className="mb-2">Unified Process</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight">
            How MediSwift Delivers Healthcare
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Experience smooth digital healthcare from symptom detection to doorstep recovery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs relative flex flex-col items-start">
            <span className="text-4xl font-black text-slate-100 absolute top-4 right-4">01</span>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center mb-4">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">1. Search & Select</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Find genuine medicines, generic salts, or OTC healthcare essentials across 20 specialized categories.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs relative flex flex-col items-start">
            <span className="text-4xl font-black text-slate-100 absolute top-4 right-4">02</span>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center mb-4">
              <UploadCloud className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">2. Upload Prescription</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload a clear photo or PDF of your doctor&apos;s prescription for restricted Schedule H pharmaceuticals.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs relative flex flex-col items-start">
            <span className="text-4xl font-black text-slate-100 absolute top-4 right-4">03</span>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">3. Pharmacist Review</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Our registered Indian pharmacists review drug interactions, verify dosages, and approve fulfillment.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs relative flex flex-col items-start">
            <span className="text-4xl font-black text-slate-100 absolute top-4 right-4">04</span>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center mb-4">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">4. 2-Hour Delivery</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Medicines are packaged in cold-chain insulated bags and delivered to your doorstep in under 2 hours.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 10: TRUST METRICS */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 xl:px-10 bg-[#0A2540] text-white">
        <div className="max-w-[1536px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-black text-[#00A896]">260+</div>
            <div className="text-xs text-slate-300 mt-1 font-semibold">Verified Medicines & Devices</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-[#00A896]">500+</div>
            <div className="text-xs text-slate-300 mt-1 font-semibold">Registered Indian Doctors</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-[#00A896]">15,000+</div>
            <div className="text-xs text-slate-300 mt-1 font-semibold">Postal Pincodes Served</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-[#00A896]">99.8%</div>
            <div className="text-xs text-slate-300 mt-1 font-semibold">On-Time Express Fulfillment</div>
          </div>
        </div>
      </section>

      {/* SECTION 11: PATIENT TESTIMONIALS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1536px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="accent" className="mb-2">Real Stories</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight">
            Trusted by Thousands Across India
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            See how MediSwift is transforming everyday healthcare and emergency refills.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <Card key={idx} className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-[#00A896] bg-teal-50 px-2 py-0.5 rounded-full">
                    {t.tag}
                  </span>
                </div>
                <Quote className="h-6 w-6 text-slate-200 mb-2" />
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100">
                <div className="font-bold text-xs text-slate-900">{t.author}</div>
                <div className="text-[11px] text-slate-400">{t.role}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 12: HEALTHCARE FAQ ACCORDION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="default" className="mb-2">Frequently Asked Questions</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight">
            Got Questions? We&apos;ve Got Answers.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Learn more about legal prescription compliance, cold-chain storage, and doctor consultations.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-[#00A896]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 16: HEALTH UPDATES & REFILL REMINDERS */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1536px] mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 border border-teal-200/80 p-8 sm:p-12 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-600/10 text-teal-700 text-xs font-bold">
              <Bell className="h-3.5 w-3.5" />
              <span>Smart Chronic Refill Reminders</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A2540] tracking-tight">
              Never Run Out of Your Essential Daily Medicines
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Sign up for automated SMS/Email reminders 5 days before your prescriptions exhaust, plus verified health tips and exclusive refill discounts.
            </p>
          </div>

          <div className="w-full lg:w-auto shrink-0">
            {newsletterSubmitted ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-emerald-300 shadow-sm text-emerald-800">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">You&apos;re Subscribed!</h4>
                  <p className="text-xs text-slate-600">Refill reminders and health discounts are on the way.</p>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleNewsletterSubmit}
                className="flex flex-col sm:flex-row items-center gap-2.5 max-w-md w-full"
              >
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email for refill alerts..."
                  className="w-full sm:w-80 px-4 py-3 rounded-2xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00A896] text-xs sm:text-sm shadow-xs"
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full sm:w-auto rounded-2xl font-bold h-11 px-6 shadow-md shadow-teal-600/20 shrink-0 cursor-pointer"
                >
                  <span>Subscribe</span>
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 17: MOBILE APP PROMOTION */}
      <section className="px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1536px] mx-auto pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-[#0A2540] via-[#0D3B66] to-[#0A2540] text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="max-w-xl space-y-4 text-center md:text-left">
            <Badge variant="accent">Coming Soon to iOS & Android</Badge>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              MediSwift in Your Pocket. Faster Healthcare on the Go.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Order refills in one tap, receive pill reminders, track live delivery couriers on a map, and consult specialists anywhere in India.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-xs font-semibold hover:bg-white/15 transition-colors cursor-pointer">
                <Download className="h-4 w-4 text-[#00A896]" />
                <span>Google Play Store</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-xs font-semibold hover:bg-white/15 transition-colors cursor-pointer">
                <Download className="h-4 w-4 text-[#00A896]" />
                <span>Apple App Store</span>
              </div>
            </div>
          </div>

          <div className="w-48 h-48 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center p-4">
            <Zap className="h-12 w-12 text-[#00A896] mb-2 animate-bounce" />
            <span className="font-extrabold text-sm text-white">MediSwift Mobile</span>
            <span className="text-[10px] text-slate-400 mt-1">2-Hour Express Guaranteed</span>
          </div>
        </div>
      </section>
    </div>
  );
}
