'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Stethoscope,
} from 'lucide-react';

interface AppointmentFormProps {
  doctorId: number;
  doctorName: string;
  consultationFee: string | number;
}

const AVAILABLE_SLOTS = [
  '09:00 AM - 09:30 AM',
  '10:00 AM - 10:30 AM',
  '11:30 AM - 12:00 PM',
  '02:00 PM - 02:30 PM',
  '03:30 PM - 04:00 PM',
  '04:30 PM - 05:00 PM',
];

export default function AppointmentForm({
  doctorId,
  doctorName,
  consultationFee,
}: AppointmentFormProps) {
  const { user } = useAuthStore();

  // Get tomorrow's date formatted as YYYY-MM-DD for min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  const [appointmentDate, setAppointmentDate] = useState(minDateStr);
  const [timeSlot, setTimeSlot] = useState(AVAILABLE_SLOTS[0]);
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [reason, setReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Prepopulate form if user is logged in
  useEffect(() => {
    if (user) {
      if (user.first_name || user.last_name) {
        setPatientName(`${user.first_name || ''} ${user.last_name || ''}`.trim());
      }
      if (user.email) setPatientEmail(user.email);
      if (user.phone_number) setPatientPhone(user.phone_number);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!patientName || !patientEmail || !patientPhone || !appointmentDate || !timeSlot) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        doctor: doctorId,
        patient_name: patientName,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        appointment_date: appointmentDate,
        time_slot: timeSlot,
        reason,
      };

      const res = await api.post('/appointments/', payload);
      setSuccessData(res.data);
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to book appointment. Please check your data and retry.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="bg-white rounded-3xl border border-emerald-200 p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">Consultation Booked!</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Your appointment request with <strong className="text-slate-800">Dr. {doctorName}</strong> has been registered. A confirmation email and telemedicine link will be sent to <strong>{patientEmail}</strong>.
        </p>

        <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2 text-left max-w-sm mx-auto border border-slate-200">
          <div className="flex justify-between">
            <span className="text-slate-400">Date</span>
            <span className="font-bold text-slate-800">{appointmentDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Time Slot</span>
            <span className="font-bold text-slate-800">{timeSlot}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Consultation Fee</span>
            <span className="font-bold text-brand-700">${Number(consultationFee).toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={() => {
            setSuccessData(null);
            setReason('');
          }}
          className="mt-4 px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
        >
          Book Another Slot
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-brand-600 text-xs font-bold uppercase tracking-wider mb-1">
          <Stethoscope className="w-4 h-4" /> Schedule Appointment
        </div>
        <h3 className="text-xl font-bold text-slate-900">Book Digital Consultation</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Standard fee: <strong className="text-slate-800">${Number(consultationFee).toFixed(2)}</strong> (payable upon session)
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            1. Select Preferred Date *
          </label>
          <div className="relative">
            <input
              type="date"
              required
              min={minDateStr}
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Time Slot Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            2. Choose Time Slot *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AVAILABLE_SLOTS.map((slot) => {
              const isSelected = timeSlot === slot;
              return (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setTimeSlot(slot)}
                  className={`p-2 rounded-xl text-[11px] font-bold border transition-all ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>

        {/* Patient Details */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            3. Patient Information
          </label>

          <div>
            <input
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Full Patient Name *"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="email"
              required
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              placeholder="Email Address *"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
            <input
              type="tel"
              required
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              placeholder="Phone Number *"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Brief description of your health concern or symptoms (optional)..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Confirming Booking...
            </>
          ) : (
            <>
              Confirm Appointment Booking
            </>
          )}
        </button>
      </form>
    </div>
  );
}
