'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doctorService } from '@/services/doctor-service';
import { appointmentService } from '@/services/appointment-service';
import { Doctor, TimeSlot, AvailableSlotsData } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Star,
  Video,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Languages,
  Award,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  AlertCircle,
  Stethoscope,
  Info,
  Sparkles,
  FileText,
  User,
  Heart,
  Share2,
} from 'lucide-react';

export default function DoctorDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const doctorSlugOrId = resolvedParams.slug;
  const router = useRouter();

  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useNotificationStore();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  // 6-Step Booking Stepper States
  // Step 1: Mode (VIDEO / IN_PERSON)
  const [selectedType, setSelectedType] = useState<'VIDEO' | 'IN_PERSON'>('VIDEO');

  // Step 2: Date Selection (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Step 3 & 4: Slot Dynamic Fetching & Selection
  const [slotsData, setSlotsData] = useState<AvailableSlotsData | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Step 5: Symptoms / Patient Notes
  const [symptoms, setSymptoms] = useState('');
  const [patientName, setPatientName] = useState('');

  // Step 6: Booking Submission & Confirmation
  const [isBooking, setIsBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<any | null>(null);

  // Generate next 14 calendar days for step 2
  const calendarDays = React.useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const weekdayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
      const isToday = i === 0;
      days.push({
        dateStr,
        weekdayShort,
        dayNum,
        monthShort,
        isToday,
      });
    }
    return days;
  }, []);

  // Initialize selected date to tomorrow or today
  useEffect(() => {
    if (calendarDays.length > 0 && !selectedDate) {
      // Default to tomorrow for optimal slot availability
      setSelectedDate(calendarDays[1].dateStr);
    }
  }, [calendarDays, selectedDate]);

  // Load Doctor Profile
  useEffect(() => {
    async function loadDoctor() {
      setLoading(true);
      try {
        const res = await doctorService.getDoctorBySlug(doctorSlugOrId);
        if (res?.data) {
          setDoctor(res.data);
        }
      } catch {
        // Try getDoctorById as fallback
        try {
          const res = await doctorService.getDoctorById(doctorSlugOrId);
          if (res?.data) setDoctor(res.data);
        } catch {
          addToast({
            type: 'error',
            title: 'Doctor Not Found',
            message: 'Unable to locate doctor profile.',
          });
        }
      } finally {
        setLoading(false);
      }
    }
    loadDoctor();
  }, [doctorSlugOrId, addToast]);

  // Fetch available slots when Doctor, Date, or Type changes
  useEffect(() => {
    if (!doctor || !selectedDate) return;

    async function loadSlots() {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const res = await appointmentService.getAvailableSlots(
          doctor!.slug || doctor!.id,
          selectedDate,
          selectedType
        );
        if (res?.data) {
          setSlotsData(res.data);
        }
      } catch (err) {
        console.error('Failed to load slots', err);
        setSlotsData(null);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [doctor, selectedDate, selectedType]);

  // Auto-fill patient name from Auth user
  useEffect(() => {
    if (user && !patientName) {
      const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
      setPatientName(name);
    }
  }, [user, patientName]);

  // Handle Booking submission
  const handleBooking = async () => {
    if (!isAuthenticated) {
      addToast({
        type: 'warning',
        title: 'Authentication Required',
        message: 'Please sign in to confirm and secure your appointment.',
      });
      router.push('/account');
      return;
    }

    if (!selectedSlot) {
      addToast({
        type: 'warning',
        title: 'Select a Time Slot',
        message: 'Please choose an available appointment time slot.',
      });
      return;
    }

    setIsBooking(true);
    try {
      // Build ISO datetime string from date and slot.time (HH:MM)
      const scheduledDateTime = new Date(`${selectedDate}T${selectedSlot.time}:00`);

      const res = await appointmentService.bookAppointment({
        doctor: doctor!.id,
        scheduled_at: scheduledDateTime.toISOString(),
        consultation_type: selectedType,
        symptoms: symptoms.trim() || 'General Specialist Consultation',
      });

      if (res?.data) {
        setBookingConfirmed(res.data);
        addToast({
          type: 'success',
          title: 'Appointment Booked Successfully!',
          message: `Your appointment reference is ${res.data.booking_reference}.`,
        });
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        'Could not schedule appointment. This slot may have just been booked. Please choose another time.';
      addToast({
        type: 'error',
        title: 'Booking Conflict',
        message: errorMsg,
      });
      // Refresh slots
      if (doctor && selectedDate) {
        appointmentService
          .getAvailableSlots(doctor.slug || doctor.id, selectedDate, selectedType)
          .then((r) => setSlotsData(r.data))
          .catch(() => {});
      }
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="animate-spin h-10 w-10 border-4 border-[#00A896] border-t-transparent rounded-full mx-auto" />
        <p className="text-slate-500 font-medium text-sm">Loading Doctor Profile & Calendars...</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#0A2540]">Doctor Profile Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          The specialist you are looking for may have relocated or updated their consultation URL.
        </p>
        <Link href="/doctors">
          <Button variant="primary">Browse All Specialists</Button>
        </Link>
      </div>
    );
  }

  const avatarSrc = doctor.avatar || doctor.avatar_url;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Top Breadcrumbs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/doctors" className="hover:text-[#00A896] flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Doctors</span>
          </Link>
          <span>/</span>
          <span className="text-slate-400">{doctor.specialties.map((s) => s.name).join(', ')}</span>
          <span>/</span>
          <span className="font-bold text-[#0A2540] truncate">{doctor.doctor_name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Doctor Profile & Credentials */}
          <div className="lg:col-span-7 space-y-6">
            {/* Main Doctor Hero Card */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shrink-0 shadow-md border-2 border-slate-100 bg-gradient-to-tr from-[#0A2540] to-[#00A896]">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={doctor.doctor_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-4xl">
                      {doctor.doctor_name ? doctor.doctor_name.charAt(0) : 'D'}
                    </div>
                  )}
                  {doctor.is_verified && (
                    <span
                      className="absolute bottom-2 right-2 p-1 rounded-full bg-emerald-500 text-white shadow-md"
                      title="Verified Medical Practitioner"
                    >
                      <CheckCircle2 className="h-4 w-4 fill-emerald-500 text-white" />
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-black text-[#0A2540] tracking-tight">
                      {doctor.doctor_name}
                    </h1>
                    {doctor.is_verified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        <span>Verified Specialist</span>
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-[#00A896]">
                    {doctor.specialties.map((s) => s.name).join(', ')}
                  </p>

                  <p className="text-xs text-slate-600 font-medium">{doctor.qualifications}</p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{doctor.hospital_affiliation}</span>
                    {doctor.city && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">{doctor.city}</span>
                      </>
                    )}
                  </div>

                  {/* Rating & Experience Strip */}
                  <div className="flex items-center gap-4 pt-3 text-xs text-slate-700 flex-wrap">
                    <div className="flex items-center bg-amber-50 px-3 py-1 rounded-xl border border-amber-200/80 font-bold text-amber-700">
                      <Star className="h-3.5 w-3.5 fill-current mr-1 text-amber-500" />
                      <span>{doctor.rating}</span>
                      <span className="text-amber-600/70 font-normal ml-1">
                        ({doctor.review_count} reviews)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 font-semibold">
                      <Award className="h-3.5 w-3.5 text-[#00A896]" />
                      <span>{doctor.experience_years} Years Experience</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 font-medium text-slate-600">
                      <Languages className="h-3.5 w-3.5 text-slate-400" />
                      <span>{doctor.languages}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* About / Clinical Biography */}
              <div className="pt-6 border-t border-slate-100 space-y-2">
                <h3 className="font-bold text-[#0A2540] text-sm uppercase tracking-wider">
                  About the Specialist
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {doctor.bio}
                </p>
              </div>

              {/* Clinic Information */}
              {doctor.clinic_address && (
                <div className="pt-6 border-t border-slate-100 space-y-2">
                  <h3 className="font-bold text-[#0A2540] text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#00A896]" />
                    <span>Clinic & Hospital Location</span>
                  </h3>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
                    <p className="font-bold text-[#0A2540]">{doctor.hospital_affiliation}</p>
                    <p className="text-slate-600">{doctor.clinic_address}</p>
                    <p className="text-slate-400 text-[11px] pt-1">
                      Free parking & wheelchair access available. Please arrive 15 minutes prior for vitals check.
                    </p>
                  </div>
                </div>
              )}

              {/* Consultation Features Strip */}
              <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-teal-50/60 border border-teal-100">
                  <Video className="h-5 w-5 text-[#00A896] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-[#0A2540]">Secure HD Video Consult</p>
                    <p className="text-slate-600 mt-0.5">End-to-end encrypted WebRTC room with digital prescription download.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <FileText className="h-5 w-5 text-[#0A2540] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-[#0A2540]">Digital Follow-up Included</p>
                    <p className="text-slate-600 mt-0.5">Free follow-up messaging valid for 5 days post consultation.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Reviews Section */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#0A2540] text-base">Patient Feedback & Reviews</h3>
                  <p className="text-xs text-slate-400">Verified reviews from patients who completed consultations</p>
                </div>
                <div className="flex items-center gap-1 text-amber-500 font-black text-lg">
                  <Star className="h-5 w-5 fill-current" />
                  <span>{doctor.rating}</span>
                  <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#0A2540]">Rajesh K. (Verified Patient)</span>
                    <span className="text-[11px] text-slate-400">2 weeks ago</span>
                  </div>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600">
                    &ldquo;Dr. {doctor.doctor_name} was extremely thorough and patient. Listened to my symptoms carefully and explained the treatment plan clearly.&rdquo;
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#0A2540]">Meera V. (Verified Patient)</span>
                    <span className="text-[11px] text-slate-400">1 month ago</span>
                  </div>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600">
                    &ldquo;Very smooth video consultation experience. The digital prescription was generated immediately after the call.&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 6-Step Interactive Booking Engine Widget */}
          <div className="lg:col-span-5">
            <div className="sticky top-20 rounded-3xl border-2 border-teal-500/30 bg-white p-6 sm:p-7 shadow-xl space-y-6">
              {/* Header Pricing */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Consultation Fee
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#0A2540] mt-0.5">
                    {formatCurrency(doctor.consultation_fee)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Instant Booking</span>
                  </span>
                </div>
              </div>

              {/* Confirmation View (if already booked in this session) */}
              {bookingConfirmed ? (
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-[#0A2540]">Appointment Confirmed!</h3>
                    <p className="text-xs text-slate-500">
                      Your consultation session with Dr. {doctor.doctor_name} is confirmed.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Booking Ref:</span>
                      <span className="font-bold text-[#0A2540] font-mono">
                        {bookingConfirmed.booking_reference}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Scheduled Time:</span>
                      <span className="font-bold text-slate-800">
                        {formatDate(bookingConfirmed.scheduled_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Consultation Type:</span>
                      <span className="font-bold text-[#00A896]">
                        {bookingConfirmed.consultation_type_display}
                      </span>
                    </div>
                  </div>

                  {bookingConfirmed.meeting_url && (
                    <a
                      href={bookingConfirmed.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="secondary" className="w-full font-bold">
                        <Video className="h-4 w-4 mr-1.5" />
                        <span>Open Video Consultation Room</span>
                      </Button>
                    </a>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Link href="/account/appointments" className="flex-1">
                      <Button variant="primary" className="w-full text-xs font-bold">
                        View in Appointments
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        setBookingConfirmed(null);
                        setSelectedSlot(null);
                      }}
                    >
                      Book Another
                    </Button>
                  </div>
                </div>
              ) : (
                /* Stepper Flow */
                <div className="space-y-6">
                  {/* STEP 1: Select Consultation Type */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#0A2540] text-white text-[10px] flex items-center justify-center font-black">
                          1
                        </span>
                        <span>Consultation Mode</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedType('VIDEO')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          selectedType === 'VIDEO'
                            ? 'border-[#00A896] bg-teal-50 text-[#00A896] ring-2 ring-[#00A896]/20 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Video className="h-5 w-5" />
                        <span>Video Consult</span>
                        <span className="text-[10px] font-normal text-slate-400">Join from Home</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedType('IN_PERSON')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          selectedType === 'IN_PERSON'
                            ? 'border-[#0A2540] bg-slate-900 text-white shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <MapPin className="h-5 w-5" />
                        <span>In-Clinic Visit</span>
                        <span className="text-[10px] font-normal text-slate-400">At Hospital</span>
                      </button>
                    </div>
                  </div>

                  {/* STEP 2: Select Date (14-day interactive ribbon) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#0A2540] text-white text-[10px] flex items-center justify-center font-black">
                          2
                        </span>
                        <span>Select Date</span>
                      </label>
                      <span className="text-[11px] font-semibold text-[#00A896]">
                        {slotsData?.weekday || ''}
                      </span>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                      {calendarDays.map((day) => {
                        const isSelected = selectedDate === day.dateStr;
                        return (
                          <button
                            key={day.dateStr}
                            type="button"
                            onClick={() => setSelectedDate(day.dateStr)}
                            className={`flex flex-col items-center justify-center min-w-[58px] py-2.5 px-2 rounded-2xl border text-xs transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#00A896] bg-[#00A896] text-white shadow-md shadow-teal-500/20 scale-105'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <span className={`text-[10px] font-bold ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                              {day.isToday ? 'Today' : day.weekdayShort}
                            </span>
                            <span className="text-base font-black my-0.5">{day.dayNum}</span>
                            <span className={`text-[9px] uppercase font-semibold ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                              {day.monthShort}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* STEP 3 & 4: Select Dynamic Available Slots */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#0A2540] text-white text-[10px] flex items-center justify-center font-black">
                          3
                        </span>
                        <span>Select Available Slot</span>
                      </label>
                      {slotsData && (
                        <span className="text-[11px] font-semibold text-slate-500">
                          {slotsData.available_count} slots open
                        </span>
                      )}
                    </div>

                    {loadingSlots ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        <div className="animate-spin h-6 w-6 border-2 border-[#00A896] border-t-transparent rounded-full mx-auto mb-2" />
                        Fetching live schedule...
                      </div>
                    ) : !slotsData || slotsData.slots.length === 0 ? (
                      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-center text-xs text-amber-800 space-y-1">
                        <AlertCircle className="h-5 w-5 text-amber-600 mx-auto" />
                        <p className="font-bold">No slots available on this date</p>
                        <p className="text-[11px] text-amber-700/80">
                          Dr. {doctor.doctor_name} does not consult on {slotsData?.weekday || 'selected day'}. Please pick another date.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {['Morning', 'Afternoon', 'Evening'].map((period) => {
                          const periodSlots = slotsData.slots.filter((s) => s.period === period);
                          if (periodSlots.length === 0) return null;

                          return (
                            <div key={period} className="space-y-1.5">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {period} Slots
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {periodSlots.map((slot) => {
                                  const isSelected = selectedSlot?.time === slot.time;
                                  return (
                                    <button
                                      key={slot.time}
                                      type="button"
                                      disabled={!slot.available}
                                      onClick={() => setSelectedSlot(slot)}
                                      title={slot.reason || slot.time_display}
                                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                                        isSelected
                                          ? 'bg-[#0A2540] text-white shadow-sm ring-2 ring-[#0A2540]/30'
                                          : slot.available
                                          ? 'bg-white border border-slate-200 text-slate-800 hover:border-[#00A896] hover:bg-teal-50/50 cursor-pointer'
                                          : 'bg-slate-100 border border-slate-200/60 text-slate-300 line-through cursor-not-allowed'
                                      }`}
                                    >
                                      {slot.time_display}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* STEP 5: Patient Details & Symptoms / Notes */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#0A2540] text-white text-[10px] flex items-center justify-center font-black">
                        4
                      </span>
                      <span>Reason for Visit / Symptoms</span>
                    </label>
                    <textarea
                      rows={2}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="Briefly describe your symptoms (e.g., Chest discomfort, chronic cough, follow-up on test reports)..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#00A896] focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 transition-all"
                    />
                  </div>

                  {/* STEP 6: Confirm Booking CTA */}
                  <div className="space-y-2 pt-2">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full font-bold shadow-md shadow-teal-500/20"
                      isLoading={isBooking}
                      disabled={!selectedSlot}
                      onClick={handleBooking}
                    >
                      {selectedSlot
                        ? `Confirm Booking for ${selectedSlot.time_display}`
                        : 'Select a Slot to Continue'}
                    </Button>

                    {!isAuthenticated && (
                      <p className="text-[11px] text-center text-slate-400">
                        You will be asked to sign in to confirm your booking.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
