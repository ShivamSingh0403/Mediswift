import React from 'react';
import Link from 'next/link';
import AddToCartButton from '@/components/AddToCartButton';
import MedicineCard from '@/components/MedicineCard';
import { Pill, Search, ShieldAlert, AlertCircle, ArrowRight } from 'lucide-react';

interface Medicine {
  id: number;
  name: string;
  category: string;
  category_display?: string;
  price: string;
  stock: number;
  description: string;
  image_url: string;
  manufacturer: string;
  dosage: string;
  requires_prescription: boolean;
}

// Fallback catalog in case backend is offline
const MOCK_MEDICINES: Medicine[] = [
  {
    id: 1,
    name: 'Amoxicillin 500mg',
    category: 'prescription',
    category_display: 'Prescription Drugs',
    price: '18.50',
    stock: 65,
    description: 'Broad-spectrum bactericidal antibiotic used to treat bacterial infections.',
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    manufacturer: 'Pfizer Pharmaceuticals',
    dosage: '500mg Capsule',
    requires_prescription: true,
  },
  {
    id: 6,
    name: 'Paracetamol Extra 650mg',
    category: 'otc',
    category_display: 'Over-The-Counter (OTC)',
    price: '7.25',
    stock: 150,
    description: 'Fast-acting analgesic and antipyretic providing prompt relief from headache, toothache, and fever.',
    image_url: 'https://images.unsplash.com/photo-1550572017-4fcdbb59cc32?w=600&auto=format&fit=crop&q=80',
    manufacturer: 'GSK Consumer Health',
    dosage: '650mg Tablet',
    requires_prescription: false,
  },
  {
    id: 10,
    name: 'Vitamin D3 5000 IU Immune Max',
    category: 'wellness',
    category_display: 'Wellness & Supplements',
    price: '21.99',
    stock: 120,
    description: 'High-potency bioactive cholecalciferol supporting bone density, mood balance, and innate immunity.',
    image_url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80',
    manufacturer: 'NatureMade Wellness',
    dosage: '5000 IU Softgel',
    requires_prescription: false,
  },
  {
    id: 13,
    name: 'Upper Arm Digital Blood Pressure Monitor',
    category: 'devices',
    category_display: 'Medical Devices & First Aid',
    price: '49.99',
    stock: 35,
    description: 'Clinical accuracy automated oscillometric blood pressure monitor with irregular heartbeat sensor.',
    image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80',
    manufacturer: 'Omron Healthcare',
    dosage: '1 Device Unit',
    requires_prescription: false,
  },
];

// Resolves Django API base URL from either NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_BASE_URL
const resolveApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  const root = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  return root.endsWith('/api') ? root : `${root.replace(/\/+$/, '')}/api`;
};

async function fetchMedicines(category?: string, search?: string): Promise<Medicine[]> {
  const apiBase = resolveApiBase();
  const url = new URL(`${apiBase}/medicines/`);
  if (category) url.searchParams.set('category', category);
  if (search) url.searchParams.set('search', search);

  try {
    // Dynamic SSR fetch with cache: 'no-store' guaranteeing fresh database inventory
    const res = await fetch(url.toString(), {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  } catch (error) {
    // Fallback if Django server is starting up
    let items = [...MOCK_MEDICINES];
    if (category) {
      items = items.filter((item) => item.category === category);
    }
    if (search) {
      const term = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term)
      );
    }
    return items;
  }
}

export default async function MedicinesPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string };
}) {
  const category = searchParams.category;
  const search = searchParams.search;
  const medicines = await fetchMedicines(category, search);

  const categories = [
    { label: 'All Catalog', value: '' },
    { label: 'Prescription Drugs', value: 'prescription' },
    { label: 'Over-The-Counter', value: 'otc' },
    { label: 'Wellness & Supplements', value: 'wellness' },
    { label: 'Medical Devices', value: 'devices' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-brand-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Pill className="w-4 h-4" />
            Live Pharmacy Dispensary
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Medicine & Medical Supplies Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Server-Side Rendered (SSR) pharmaceutical formulary connected live to Django REST API.
          </p>
        </div>

        {/* Search Input */}
        <form method="GET" action="/medicines" className="relative w-full md:w-80">
          <input
            type="text"
            name="search"
            defaultValue={search || ''}
            placeholder="Search medicine, formula, brand..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          {category && <input type="hidden" name="category" value={category} />}
        </form>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((c) => {
          const isActive = (category || '') === c.value;
          const href = c.value ? `/medicines?category=${c.value}` : '/medicines';
          return (
            <Link
              key={c.value}
              href={href}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      {/* Product Grid */}
      {medicines.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No medicines found</h3>
          <p className="text-xs text-slate-500">
            No products match your current search or category filter. Try resetting your filters.
          </p>
          <Link
            href="/medicines"
            className="inline-block px-4 py-2 text-xs font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            Reset Filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {medicines.map((med) => (
            <MedicineCard key={med.id} medicine={med as any} />
          ))}
        </div>
      )}
    </div>
  );
}
