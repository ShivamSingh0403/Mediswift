'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { doctorService } from '@/services/doctor-service';
import { apiClient } from '@/lib/api-client';
import { Doctor } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Star, Video, MapPin, Calendar, Clock, CheckCircle2 } from 'lucide-react';

export default function DoctorDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const doctorId = resolvedParams.slug;
  const router = useRouter();

  const { isAuthenticated } = useAuthStore();
  const { addToast } = useNotificationStore();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'VIDEO' | 'IN_PERSON'>('VIDEO');
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM');
  const [symptoms, setSymptoms] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    async function loadDoc() {
      try {
        const res = await doctorService.getDoctorById(doctorId);
        if (res?.data) setDoctor(res.data);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    loadDoc();
  }, [doctorId]);

  const handleBooking = async () => {
    if (!isAuthenticated) {
      addToast({
        type: 'warning',
        title: 'Authentication Required',
        message: 'Please sign in to confirm your appointment.',
      });
      router.push('/account');
      return;
    }

    setIsBooking(true);
    try {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 1);
      scheduledDate.setHours(10, 0, 0, 0);

      await apiClient.post('/appointments/', {
        doctor: doctorId,
        scheduled_at: scheduledDate.toISOString(),
        consultation_type: selectedType,
        symptoms: symptoms || 'General Medical Consultation',
      });

      addToast({
        type: 'success',
        title: 'Appointment Confirmed',
        message: `Your telehealth session with Dr. ${doctor?.doctor_name} is scheduled.`,
      });
      router.push('/appointments');
    } catch {
      addToast({
        type: 'error',
        title: 'Booking Failed',
        message: 'Could not schedule appointment. Please try again.',
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">Loading doctor profile...</div>;
  }

  if (!doctor) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">Doctor not found.</div>;
  }

  const timeSlots = ['09:30 AM', '10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Left Profile Overview */}
        <div className="md:col-span-7 space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xs">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#0A2540] to-[#00A896] text-white font-bold text-3xl flex items-center justify-center shrink-0 shadow-md">
                {doctor.doctor_name ? doctor.doctor_name.charAt(0) : 'D'}
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#0A2540]">{doctor.doctor_name}</h1>
                <p className="text-sm font-semibold text-[#00A896] mt-0.5">
                  {doctor.specialties.map((s) => s.name).join(', ')}
                </p>
                <p className="text-xs text-slate-600 mt-1">{doctor.qualifications}</p>
                <p className="text-xs text-slate-400">{doctor.hospital_affiliation}</p>

                <div className="flex items-center gap-3 mt-3 text-xs text-slate-600">
                  <span className="flex items-center text-amber-500 font-bold">
                    <Star className="h-4 w-4 fill-current mr-1" />
                    {doctor.rating} ({doctor.review_count} reviews)
                  </span>
                  <span>•</span>
                  <span>{doctor.experience_years} years experience</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="font-bold text-[#0A2540] text-sm mb-2">About Doctor</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{doctor.bio}</p>
            </div>

            {doctor.clinic_address && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="font-bold text-[#0A2540] text-sm mb-2">Clinic Address</h3>
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{doctor.clinic_address}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Appointment Booking Card */}
        <div className="md:col-span-5">
          <div className="sticky top-24 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-md space-y-6">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Consultation Fee</div>
              <div className="text-2xl font-black text-[#0A2540] mt-1">
                {formatCurrency(doctor.consultation_fee)}
              </div>
            </div>

            {/* Consultation Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Consultation Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedType('VIDEO')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    selectedType === 'VIDEO'
                      ? 'border-[#00A896] bg-teal-50 text-[#00A896]'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <Video className="h-4 w-4" />
                  <span>Video Call</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType('IN_PERSON')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    selectedType === 'IN_PERSON'
                      ? 'border-[#00A896] bg-teal-50 text-[#00A896]'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  <span>In-Clinic</span>
                </button>
              </div>
            </div>

            {/* Slot selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Select Available Slot (Tomorrow)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                      selectedSlot === slot
                        ? 'border-[#0A2540] bg-[#0A2540] text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Symptoms / Note */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Reason for Visit / Symptoms
              </label>
              <textarea
                rows={2}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g., Mild fever, headache for 2 days"
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#00A896] focus:outline-none focus:ring-2 focus:ring-[#00A896]/20"
              />
            </div>

            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              isLoading={isBooking}
              onClick={handleBooking}
            >
              Confirm Appointment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
