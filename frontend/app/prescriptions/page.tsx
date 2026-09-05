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
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

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
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <UploadCloud className="h-12 w-12 text-[#00A896] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#0A2540]">Sign In to View Prescriptions</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          Access your digital prescription vault and check verification status by our licensed pharmacists.
        </p>
        <Link href="/account">
          <Button variant="primary">Login / Register</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0A2540]">Prescription Vault</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Encrypted document storage with pharmacist validation tracking for compliance with Indian CDSCO regulations.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setPrescriptionModalOpen(true)}>
          <UploadCloud className="h-4 w-4 mr-2" />
          <span>Upload New Rx</span>
        </Button>
      </div>

      {prescriptions.length === 0 && !loading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">No prescriptions uploaded</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">Upload a prescription to quickly order restricted antibiotics and medicines.</p>
          <Button size="sm" variant="outline" onClick={() => setPrescriptionModalOpen(true)}>
            Upload Prescription
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => {
            const statusVariant =
              rx.status === 'VERIFIED' ? 'success' : rx.status === 'REJECTED' ? 'danger' : 'warning';

            return (
              <Card key={rx.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#00A896] flex items-center justify-center shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0A2540] text-base">
                          {rx.original_filename || `Prescription #${rx.id.slice(0, 8)}`}
                        </span>
                        <Badge variant={statusVariant}>{rx.status_display}</Badge>
                      </div>
                      {rx.doctor_name && (
                        <div className="text-xs text-slate-600 mt-0.5">Doctor: {rx.doctor_name}</div>
                      )}
                      <div className="text-xs text-slate-400 mt-0.5">
                        Uploaded on {formatDate(rx.created_at)}
                      </div>
                      {rx.pharmacist_notes && (
                        <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="font-semibold text-slate-700">Pharmacist Note:</span> {rx.pharmacist_notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {rx.status === 'VERIFIED' && (
                      <Link href="/medicines">
                        <Button size="sm" variant="primary">Order Approved Medicines</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
