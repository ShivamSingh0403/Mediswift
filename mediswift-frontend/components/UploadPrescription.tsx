'use client';

import React, { useState, useRef } from 'react';
import api from '@/lib/api';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ShieldCheck,
  Eye,
} from 'lucide-react';

interface UploadPrescriptionProps {
  onUploadSuccess?: (data: any) => void;
  medicineId?: number;
}

export default function UploadPrescription({
  onUploadSuccess,
  medicineId,
}: UploadPrescriptionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadedResult, setUploadedResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMsg('');
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setErrorMsg('Invalid file format. Please upload JPG, PNG, WEBP, or PDF.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 10MB limit.');
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select or drag a prescription file.');
      return;
    }

    setUploading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (patientName) formData.append('patient_name', patientName);
      if (doctorNotes) formData.append('doctor_notes', doctorNotes);
      if (medicineId) formData.append('medicine_id', String(medicineId));

      const res = await api.post('/prescriptions/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadedResult(res.data.prescription || res.data);
      if (onUploadSuccess) onUploadSuccess(res.data);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to upload prescription. Please try again.';
      setErrorMsg(msg);
    } finally {
      setUploading(false);
    }
  };

  if (uploadedResult) {
    return (
      <div className="bg-white rounded-3xl border border-emerald-200 p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Prescription Uploaded Successfully</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Your document is securely saved and assigned reference <strong>#RX-{uploadedResult.id}</strong>. Our clinical pharmacist team is reviewing it now.
        </p>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          Status: {uploadedResult.status || 'Pending Review'}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setUploadedResult(null);
              handleRemoveFile();
              setPatientName('');
              setDoctorNotes('');
            }}
            className="text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors underline"
          >
            Upload Another Prescription
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" /> HIPAA-Compliant Medical Vault
        </div>
        <h3 className="text-xl font-black text-slate-900">Upload Doctor Prescription</h3>
        <p className="text-xs text-slate-500 mt-1">
          Attach a clear scan or photo of your prescription (JPG, PNG, PDF up to 10MB).
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        {/* Drag & Drop Box */}
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-brand-500 bg-brand-50/50'
                : 'border-slate-300 hover:border-brand-500 bg-slate-50/60 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center mx-auto mb-3 text-brand-600 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div className="text-sm font-bold text-slate-800">
              Drag and drop your prescription here, or <span className="text-brand-600">Browse</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports JPEG, PNG, WEBP, and PDF documents (Max 10MB)
            </p>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              {filePreview ? (
                <img
                  src={filePreview}
                  alt="Prescription preview"
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
              )}
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-800 truncate">{file.name}</div>
                <div className="text-[11px] text-slate-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Supplementary Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Patient Full Name
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Doctor / Clinic Notes (Optional)
            </label>
            <input
              type="text"
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Prescribing physician or instructions"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading || !file}
          className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading & Encrypting Document...
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" /> Submit Prescription for Verification
            </>
          )}
        </button>
      </form>
    </div>
  );
}
