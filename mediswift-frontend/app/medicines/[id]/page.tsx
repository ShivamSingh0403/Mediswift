import React from 'react';
import { notFound } from 'next/navigation';
import MedicineDetail, { MedicineData } from '@/components/MedicineDetail';

// Resolves Django API base URL from NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_API_URL
const resolveApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  const root = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  return root.endsWith('/api') ? root : `${root.replace(/\/+$/, '')}/api`;
};

async function getMedicine(id: string): Promise<MedicineData | null> {
  const apiBase = resolveApiBase();

  try {
    const res = await fetch(`${apiBase}/medicines/${id}/`, {
      cache: 'no-store', // Real-time SSR
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    return await res.json();
  } catch (error) {
    console.warn(`Could not fetch medicine #${id} from Django API, falling back:`, error);
    return {
      id: Number(id) || 1,
      name: 'Crocin 650 Advance',
      category: 'otc',
      category_display: 'Over-The-Counter (OTC)',
      price: '32.00',
      mrp: '36.50',
      discount_percent: 12,
      stock: 150,
      description:
        'Fast-absorption paracetamol formulation providing prompt relief from fever, headache, body ache, and toothache with optic release micro-technology.',
      image_url:
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
      manufacturer: 'GlaxoSmithKline Consumer Healthcare',
      composition: 'Paracetamol (650mg)',
      dosage: 'Take 1 tablet every 4 to 6 hours as needed',
      dosage_form: 'tablet',
      dosage_form_display: 'Tablet',
      packaging: 'Strip of 15 tablets',
      requires_prescription: false,
      how_to_use: 'Take with a full glass of water. Do not exceed 4000mg of paracetamol within a 24-hour period.',
      side_effects: 'Rare allergic rash, nausea. Avoid concurrent alcohol consumption to safeguard liver health.',
      created_at: new Date().toISOString(),
    };
  }
}

export default async function MedicineDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const medicine = await getMedicine(params.id);

  if (!medicine) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50/50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MedicineDetail medicine={medicine} />
      </div>
    </main>
  );
}
