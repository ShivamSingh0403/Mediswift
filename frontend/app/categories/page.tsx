'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { productService } from '@/services/product-service';
import { Category } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Pill, ChevronRight, Sparkles } from 'lucide-react';

const CATEGORY_META: Record<string, { icon: string; desc: string }> = {
  'pain-relief': { icon: '⚡', desc: 'Analgesics, NSAIDs, joint care, and topical pain balms.' },
  'fever-cold': { icon: '🌡️', desc: 'Antipyretics, decongestants, cold syrups, and effervescents.' },
  'cough-respiratory': { icon: '🫁', desc: 'Bronchodilators, inhalers, cough drops, and expectorants.' },
  'digestive-health': { icon: '🥗', desc: 'Antacids, probiotics, laxatives, and digestion enzymes.' },
  'diabetes-care': { icon: '🩸', desc: 'Blood glucose testing, glucometers, insulin care, and strips.' },
  'heart-care': { icon: '❤️', desc: 'Cardiovascular maintenance, cholesterol control, and BP support.' },
  'vitamins-supplements': { icon: '🌿', desc: 'Daily multivitamins, Vitamin D3, calcium, and mineral complexes.' },
  'immunity-support': { icon: '🛡️', desc: 'Zinc, Vitamin C, herbal tonics, and natural resistance boosters.' },
  'skin-care': { icon: '✨', desc: 'Dermatological creams, acne treatments, and medicated lotions.' },
  'hair-care': { icon: '💇', desc: 'Anti-dandruff shampoos, hair serums, biotin, and scalp care.' },
  'baby-care': { icon: '👶', desc: 'Gentle pediatric wipes, baby lotions, and diaper rash creams.' },
  'womens-health': { icon: '🌸', desc: 'Hormonal support, prenatal vitamins, and hygiene essentials.' },
  'personal-care': { icon: '🧴', desc: 'Antiseptic body washes, oral rinses, and personal wellness.' },
  'first-aid': { icon: '🩹', desc: 'Bandages, antiseptic liquids, burn gels, and emergency kits.' },
  'medical-devices': { icon: '🩺', desc: 'Digital BP monitors, pulse oximeters, and nebulizers.' },
  'ayurvedic-products': { icon: '🍃', desc: 'Pure herbal extracts, Ashwagandha, Giloy, and Chyawanprash.' },
  'nutrition': { icon: '🥑', desc: 'Protein powders, dietary meal shakes, and energy supplements.' },
  'fitness-wellness': { icon: '🏋️', desc: 'Creatine, amino acids, muscle recovery, and workout nutrition.' },
  'oral-care': { icon: '🪥', desc: 'Medicated toothpastes, mouthwashes, and gum astringents.' },
  'eye-care': { icon: '👁️', desc: 'Lubricating eye drops, cooling rinses, and vision supplements.' },
};

export default function CategoriesIndexPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await productService.getCategories();
        if (res?.data?.results) setCategories(res.data.results);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <Badge variant="accent" className="mb-2">Specialty Catalog</Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-[#0A2540] tracking-tight">
          Browse Healthcare by Specialty
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
          Over 20 specialized therapeutic departments covering chronic care, acute illness, OTC wellness, and home diagnostics.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-[#00A896]/20 border-t-[#00A896] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-xs">Loading healthcare categories...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat.slug] || {
              icon: '💊',
              desc: cat.description || 'Quality pharmaceuticals and healthcare essentials.',
            };

            return (
              <Link key={cat.id} href={`/categories/${cat.slug}`} className="group">
                <Card className="p-6 rounded-3xl border border-slate-200/80 bg-white glass-card-hover flex flex-col justify-between h-full">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-slate-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                      {meta.icon}
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#00A896] transition-colors leading-snug">
                      {cat.name}
                    </h3>

                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                      {meta.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#00A896]">
                    <span>Explore Products</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
