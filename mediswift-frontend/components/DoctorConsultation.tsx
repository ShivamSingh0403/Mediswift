'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  Stethoscope,
  Calendar,
  Clock,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { formatINR } from '@/lib/currency';

interface DoctorItem {
  id: number;
  name: string;
  specialty: string;
  specialty_display?: string;
  experience: number;
  fee: string;
  rating: string | number;
  image_url: string;
  bio: string;
}

interface SlotItem {
  time_slot: string;
  is_available: boolean;
}

export default function DoctorConsultation() {
  const { user } = useAuthStore();

  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);

  // Tomorrow as default date string
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(minDateStr);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [reason, setReason] = useState('');

  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch Doctor list on load
  useEffect(() => {
    async function loadDoctors() {
      try {
        const res = await api.get('/doctors/');
        const docs = Array.isArray(res.data) ? res.data : res.data.results || [];
        setDoctors(docs);
        if (docs.length > 0) {
          setSelectedDoctorId(docs[0].id);
        }
      } catch (err) {
        console.error('Error fetching doctors:', err);
      } finally {
        setLoadingDoctors(false);
      }
    }
    loadDoctors();
  }, []);

  // 2. Prepopulate patient details from auth store
  useEffect(() => {
    if (user) {
      if (user.first_name || user.last_name) {
        setPatientName(`${user.first_name || ''} ${user.last_name || ''}`.trim());
      }
      if (user.email) setPatientEmail(user.email);
      if (user.phone_number) setPatientPhone(user.phone_number);
    }
  }, [user]);

  // 3. Fetch available slots dynamically when doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return;

    async function fetchAvailableSlots() {
      setLoadingSlots(true);
      setSelectedSlot(null);
      setErrorMessage('');
      try {
        const res = await api.get(
          `/doctors/available-slots/?doctor_id=${selectedDoctorId}&date=${selectedDate}`
        );
        setSlots(res.data.slots || []);
      } catch (err) {
        // Fallback default slots
        setSlots([
          { time_slot: '09:00 AM - 09:30 AM', is_available: true },
          { time_slot: '10:00 AM - 10:30 AM', is_available: true },
          { time_slot: '11:30 AM - 12:00 PM', is_available: false },
          { time_slot: '02:00 PM - 02:30 PM', is_available: true },
          { time_slot: '03:30 PM - 04:00 PM', is_available: true },
          { time_slot: '04:30 PM - 05:00 PM', is_available: true },
        ]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchAvailableSlots();
  }, [selectedDoctorId, selectedDate]);

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedDoctorId || !selectedSlot || !selectedDate) {
      setErrorMessage('Please select a doctor, appointment date, and available time slot.');
      return;
    }

    if (!patientName || !patientEmail || !patientPhone) {
      setErrorMessage('Please fill in your name, email, and phone number.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        doctor: selectedDoctorId,
        patient_name: patientName,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        appointment_date: selectedDate,
        time_slot: selectedSlot,
        reason,
      };

      const res = await api.post('/appointments/', payload);
      setSuccessBooking(res.data);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.time_slot?.[0] ||
        err.response?.data?.detail ||
        'Failed to book appointment. The selected time slot may have just been taken.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (successBooking) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-emerald-200 p-8 sm:p-12 text-center space-y-5 shadow-sm">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Booking Confirmed
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight pt-2">
            Telehealth Session Scheduled!
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Your consultation with <strong>Dr. {selectedDoctor?.name}</strong> has been secured. An encrypted video meeting link has been sent to <strong>{patientEmail}</strong>.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 text-sm space-y-2.5 max-w-md mx-auto text-left border border-slate-200">
          <div className="flex justify-between">
            <span className="text-slate-400">Doctor</span>
            <span className="font-bold text-slate-800">Dr. {selectedDoctor?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Specialty</span>
            <span className="font-medium text-slate-700">{selectedDoctor?.specialty}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Date & Slot</span>
            <span className="font-bold text-slate-900">{selectedDate} ({selectedSlot})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Consultation Fee</span>
            <span className="font-bold text-brand-700">${selectedDoctor?.fee}</span>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={() => {
              setSuccessBooking(null);
              setSelectedSlot(null);
            }}
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Book Another Consultation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Top Banner */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-wider mb-1">
          <Stethoscope className="w-4 h-4" /> Live Telehealth Network
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Book Certified Doctor Consultation
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Select a specialist, check live slot availability, and connect via HD encrypted video call.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Step 1: Doctor Picker */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-brand-600" /> 1. Choose Medical Specialist
          </h3>

          {loadingDoctors ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
            </div>
          ) : (
            <div className="space-y-3">
              {doctors.map((doc) => {
                const isSelected = selectedDoctorId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctorId(doc.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/50 shadow-sm ring-1 ring-brand-500'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={
                        doc.image_url ||
                        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80'
                      }
                      alt={doc.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                          {doc.specialty_display || doc.specialty}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                          <Star className="w-3 h-3 fill-amber-400" /> {doc.rating}
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm truncate">Dr. {doc.name}</h4>
                      <div className="text-xs text-slate-500">
                        {doc.experience} yrs exp • <strong className="text-slate-800">{formatINR(doc.fee)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 2 & 3: Date & Time-Slot Selector and Confirmation */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" /> 2. Date & Available Time Slots
            </h3>

            {/* Date Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Consultation Date
              </label>
              <input
                type="date"
                min={minDateStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none"
              />
            </div>

            {/* Slots Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Available Slots
                </label>
                <span className="text-[11px] text-slate-400">
                  {loadingSlots
                    ? 'Loading live slots...'
                    : `${slots.filter((s) => s.is_available).length} slots open`}
                </span>
              </div>

              {loadingSlots ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-600 mx-auto" />
                </div>
              ) : slots.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No slots available on this date. Try another day.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {slots.map((s) => {
                    const isSelected = selectedSlot === s.time_slot;
                    return (
                      <button
                        type="button"
                        key={s.time_slot}
                        disabled={!s.is_available}
                        onClick={() => setSelectedSlot(s.time_slot)}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                          !s.is_available
                            ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {s.time_slot.split(' - ')[0]}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3: Patient Form */}
            <form onSubmit={handleBooking} className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Patient Details & Consultation Reason
              </h4>

              <div>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Full Patient Name *"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="email"
                  required
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="Email Address *"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none"
                />
                <input
                  type="tel"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="Phone Number *"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Symptoms or reason for consultation (optional)..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedSlot}
                className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Reserving Appointment Slot...
                  </>
                ) : (
                  <>
                    Confirm Telehealth Consultation ({formatINR(selectedDoctor?.fee || 0)}){' '}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
