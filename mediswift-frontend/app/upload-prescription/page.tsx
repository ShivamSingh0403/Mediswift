import React from 'react';
import Link from 'next/link';
import UploadPrescription from '@/components/UploadPrescription';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Upload Prescription | Mediswift Pro',
  description: 'Upload your medical prescription securely for pharmacist review and fast dispensation.',
};

export default function PrescriptionUploadPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link
        href="/medicines"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Medicines
      </Link>

      <UploadPrescription />
    </div>
  );
}
