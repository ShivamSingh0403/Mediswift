'use client';

import React, { useState, useRef } from 'react';
import { useUiStore } from '@/store/ui-store';
import { useNotificationStore } from '@/store/notification-store';
import { prescriptionService } from '@/services/prescription-service';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';

export function PrescriptionModal() {
  const { isPrescriptionModalOpen, setPrescriptionModalOpen } = useUiStore();
  const { addToast } = useNotificationStore();

  const [file, setFile] = useState<File | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [patientNotes, setPatientNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selected: File) => {
    if (selected.size > 10 * 1024 * 1024) {
      addToast({
        type: 'error',
        title: 'File too large',
        message: 'Prescription document must be less than 10MB.',
      });
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selected.type)) {
      addToast({
        type: 'error',
        title: 'Invalid File Format',
        message: 'Please upload a PDF, PNG, JPG, or WEBP image.',
      });
      return;
    }
    setFile(selected);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      addToast({
        type: 'warning',
        message: 'Please select or drag a valid prescription file.',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('document', file);
    if (doctorName) formData.append('doctor_name', doctorName);
    if (patientNotes) formData.append('patient_notes', patientNotes);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 100);

      await prescriptionService.uploadPrescription(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);
      addToast({
        type: 'success',
        title: 'Prescription Uploaded',
        message: 'Our certified pharmacists will verify your prescription within minutes.',
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'Could not upload prescription document. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setPrescriptionModalOpen(false);
    setFile(null);
    setDoctorName('');
    setPatientNotes('');
    setUploadSuccess(false);
    setUploadProgress(0);
  };

  return (
    <Modal
      isOpen={isPrescriptionModalOpen}
      onClose={handleClose}
      title="Upload Medical Prescription"
      description="Secure encrypted upload for pharmacist verification compliant with CDSCO regulations."
    >
      {uploadSuccess ? (
        <div className="py-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Prescription Received!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Your prescription is now undergoing verification by our licensed Indian pharmacists. You can monitor its status anytime in your Prescription Vault.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Button variant="primary" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-[#00A896] bg-teal-50/70 scale-102'
                : file
                ? 'border-emerald-300 bg-emerald-50/40'
                : 'border-slate-200 hover:border-[#00A896]/60 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />

            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-emerald-600 shrink-0" />
                <div className="text-left min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate max-w-xs">{file.name}</div>
                  <div className="text-[10px] text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#00A896] flex items-center justify-center mx-auto shadow-xs">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#00A896]">Click to upload</span>
                  <span className="text-xs text-slate-500"> or drag and drop</span>
                </div>
                <p className="text-[10px] text-slate-400">PDF, JPG, PNG, or WEBP (Max 10MB)</p>
              </div>
            )}
          </div>

          {/* Progress bar if uploading */}
          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                <span>Encrypting and uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#00A896] transition-all duration-200 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Optional metadata fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Doctor / Clinic Name (Optional)
              </label>
              <Input
                placeholder="e.g. Dr. Rajesh Sharma, Apollo Clinic"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Patient Instructions / Special Notes (Optional)
              </label>
              <Input
                placeholder="e.g. Please deliver 30 days refill dosage"
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Regulatory Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-[#00A896] shrink-0 mt-0.5" />
            <span>
              Valid prescriptions must include Doctor&apos;s Name, Registration Number, Patient Details, Date, and Doctor&apos;s Signature.
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isUploading || !file}>
              {isUploading ? 'Uploading...' : 'Submit for Review'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
