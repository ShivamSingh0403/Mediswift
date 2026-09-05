'use client';

import React, { useState } from 'react';
import { useUiStore } from '@/store/ui-store';
import { useNotificationStore } from '@/store/notification-store';
import { prescriptionService } from '@/services/prescription-service';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export function PrescriptionModal() {
  const { isPrescriptionModalOpen, setPrescriptionModalOpen } = useUiStore();
  const { addToast } = useNotificationStore();

  const [file, setFile] = useState<File | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [patientNotes, setPatientNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        addToast({
          type: 'error',
          title: 'File too large',
          message: 'Prescription document must be less than 10MB.',
        });
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      addToast({
        type: 'warning',
        message: 'Please choose a prescription document (PDF or image).',
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('document', file);
    if (doctorName) formData.append('doctor_name', doctorName);
    if (patientNotes) formData.append('patient_notes', patientNotes);

    try {
      await prescriptionService.uploadPrescription(formData);
      setUploadSuccess(true);
      addToast({
        type: 'success',
        title: 'Prescription Uploaded',
        message: 'A licensed pharmacist will review your prescription within 15 minutes.',
      });
      setTimeout(() => {
        setUploadSuccess(false);
        setFile(null);
        setDoctorName('');
        setPatientNotes('');
        setPrescriptionModalOpen(false);
      }, 1500);
    } catch {
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'Please login to upload your prescription or verify network connection.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isPrescriptionModalOpen}
      onClose={() => setPrescriptionModalOpen(false)}
      title="Secure Prescription Upload"
      description="Upload your doctor's prescription for rapid pharmacist verification."
    >
      {uploadSuccess ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h4 className="font-bold text-slate-800 text-base">Prescription Submitted!</h4>
          <p className="text-xs text-slate-500 max-w-xs">
            Your prescription has been securely uploaded to our encrypted vault.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center hover:border-[#00A896] transition-colors cursor-pointer bg-slate-50/50">
            <input
              type="file"
              id="prescription-file-input"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="prescription-file-input" className="cursor-pointer block">
              <div className="mx-auto w-12 h-12 rounded-full bg-[#00A896]/10 text-[#00A896] flex items-center justify-center mb-2">
                <UploadCloud className="h-6 w-6" />
              </div>
              {file ? (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#0A2540]">
                  <FileText className="h-4 w-4 text-[#00A896]" />
                  <span>{file.name}</span>
                </div>
              ) : (
                <>
                  <div className="text-xs font-semibold text-slate-800">
                    Click to browse or drop prescription file
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Supports PDF, JPG, PNG (Max 10 MB)
                  </div>
                </>
              )}
            </label>
          </div>

          <Input
            label="Prescribing Doctor Name (Optional)"
            placeholder="e.g., Dr. Rajesh Sharma"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Special Instructions / Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Need 30 days dosage refill"
              value={patientNotes}
              onChange={(e) => setPatientNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#00A896] focus:outline-none focus:ring-2 focus:ring-[#00A896]/20"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-blue-50/60 p-3 text-[11px] text-slate-600 border border-blue-100">
            <AlertCircle className="h-4 w-4 text-[#0A2540] shrink-0" />
            <span>Prescriptions are encrypted and strictly accessed by certified pharmacists.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPrescriptionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={isUploading}
            >
              Confirm Upload
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
