'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { prescriptionService } from '@/services/prescription-service';
import { Prescription } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { useUiStore } from '@/store/ui-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  XCircle,
  Calendar,
  ExternalLink,
} from 'lucide-react';

export default function PrescriptionsPage() {
  const { isAuthenticated } = useAuthStore();
  const { setPrescriptionModalOpen } = useUiStore();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrescriptions() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        const res = await prescriptionService.getPrescriptions();
        if (res?.data?.results) setPrescriptions(res.data.results);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    loadPrescriptions();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-3xl bg-teal-50 text-[#00A896] flex items-center justify-center mx-auto mb-4 shadow-xs">
          <UploadCloud className="h-8 w-8 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl font-black text-[#0A2540]">Sign In to View Prescription Vault</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-8 max-w-md mx-auto leading-relaxed">
          Access your digital prescription vault and check real-time verification status by our certified Indian pharmacists.
        </p>
        <Link href="/account">
          <Button variant="primary" size="lg" className="rounded-2xl font-bold shadow-md shadow-[#00A896]/20">
            Login / Register
          </Button>
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5" /> Approved
          </span>
        );
      case 'PENDING':
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            <Clock className="h-3.5 w-3.5" /> Under Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
            <XCircle className="h-3.5 w-3.5" /> Rejected
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
            <Calendar className="h-3.5 w-3.5" /> Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-3 py-1 rounded-full">
            <FileText className="h-3.5 w-3.5" /> Uploaded
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0A2540]">Digital Prescription Vault</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Encrypted document repository compliant with CDSCO regulations. Registered pharmacists review and approve valid prescriptions before restricted Schedule H/H1 pharmaceuticals are dispatched.
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={() => setPrescriptionModalOpen(true)}
          className="rounded-2xl font-bold shadow-xs hover:shadow-teal-500/20 shrink-0"
        >
          <UploadCloud className="h-4 w-4 mr-2" />
          <span>Upload New Rx</span>
        </Button>
      </div>

      {/* Trust & Legal Compliance Card */}
      <div className="mb-8 p-5 rounded-3xl bg-teal-50/60 border border-teal-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <ShieldCheck className="h-6 w-6 text-[#00A896] shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-[#0A2540] text-sm">CDSCO Medical Compliance Notice</div>
            <p className="text-slate-600 mt-0.5 leading-relaxed">
              Valid medical prescriptions must clearly show: Doctor&apos;s Name, Registration Number, Patient Details, Date of Consultation, and Doctor&apos;s Signature. Expired or altered scripts will be rejected.
            </p>
          </div>
        </div>
      </div>

      {/* Prescription List */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-[#00A896]/20 border-t-[#00A896] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-xs">Loading encrypted documents...</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No Prescriptions in Vault</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-6">
            Upload your doctor&apos;s prescription to order restricted medications or view your consultation histories.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => setPrescriptionModalOpen(true)}
            className="rounded-xl shadow-xs"
          >
            Upload Prescription Now
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prescriptions.map((rx) => (
            <Card key={rx.id} className="p-5 rounded-3xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  {getStatusBadge(rx.status)}
                </div>

                <h3 className="font-bold text-sm text-slate-900 truncate" title={rx.original_filename}>
                  {rx.original_filename}
                </h3>

                {rx.doctor_name && (
                  <p className="text-xs text-[#00A896] font-semibold mt-1">
                    Dr. {rx.doctor_name}
                  </p>
                )}

                {rx.patient_notes && (
                  <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                    &ldquo;{rx.patient_notes}&rdquo;
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Uploaded {formatDate(rx.created_at)}</span>
                {rx.document && (
                  <a
                    href={rx.document}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#00A896] hover:underline font-semibold"
                  >
                    <span>View File</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
