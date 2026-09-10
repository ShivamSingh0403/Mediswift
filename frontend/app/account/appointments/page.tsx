'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { appointmentService } from '@/services/appointment-service';
import { Appointment, TimeSlot, AvailableSlotsData } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { useNotificationStore } from '@/store/notification-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  Stethoscope,
  ChevronRight,
  AlertCircle,
  RotateCcw,
  XCircle,
  CheckCircle2,
  PhoneCall,
  FileText,
  Building2,
  ShieldCheck,
  ArrowRight,
  User,
  Info,
  CalendarCheck,
  Sparkles,
} from 'lucide-react';

export default function AccountAppointmentsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useNotificationStore();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled' | 'all'>('upcoming');

  // Reschedule Modal State
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlots, setRescheduleSlots] = useState<AvailableSlotsData | null>(null);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [selectedNewSlot, setSelectedNewSlot] = useState<TimeSlot | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Cancellation Modal State
  const [cancelTargetAppointment, setCancelTargetAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('Personal scheduling conflict');
  const [isCancelling, setIsCancelling] = useState(false);

  // Video Room Modal State
  const [activeVideoAppointment, setActiveVideoAppointment] = useState<Appointment | null>(null);

  // Fetch appointments
  const fetchAppointments = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await appointmentService.getAppointments();
      if (res?.data?.results) {
        setAppointments(res.data.results);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error('Failed to load appointments', err);
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Could not load appointment history.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [isAuthenticated]);

  // Calendar dates for rescheduling (next 10 days)
  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 1; i <= 10; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const weekdayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
      days.push({ dateStr, weekdayShort, dayNum, monthShort });
    }
    return days;
  }, []);

  // When reschedule modal opens, set default date & fetch slots
  useEffect(() => {
    if (rescheduleAppointment && calendarDays.length > 0) {
      const initialDate = calendarDays[0].dateStr;
      setRescheduleDate(initialDate);
    }
  }, [rescheduleAppointment, calendarDays]);

  // Fetch slots for reschedule date
  useEffect(() => {
    if (!rescheduleAppointment || !rescheduleDate) return;

    async function loadRescheduleSlots() {
      setLoadingRescheduleSlots(true);
      setSelectedNewSlot(null);
      try {
        const res = await appointmentService.getAvailableSlots(
          rescheduleAppointment!.doctor.slug || rescheduleAppointment!.doctor.id,
          rescheduleDate,
          rescheduleAppointment!.consultation_type
        );
        if (res?.data) {
          setRescheduleSlots(res.data);
        }
      } catch (err) {
        console.error('Failed to load slots for reschedule', err);
        setRescheduleSlots(null);
      } finally {
        setLoadingRescheduleSlots(false);
      }
    }
    loadRescheduleSlots();
  }, [rescheduleAppointment, rescheduleDate]);

  // Submit Reschedule
  const handleConfirmReschedule = async () => {
    if (!rescheduleAppointment || !selectedNewSlot || !rescheduleDate) return;

    setIsRescheduling(true);
    try {
      const scheduledDateTime = new Date(`${rescheduleDate}T${selectedNewSlot.time}:00`);
      const res = await appointmentService.rescheduleAppointment(
        rescheduleAppointment.id,
        scheduledDateTime.toISOString(),
        rescheduleReason.trim() || 'Patient requested reschedule'
      );

      if (res?.data) {
        addToast({
          type: 'success',
          title: 'Appointment Rescheduled',
          message: `Consultation moved to ${formatDate(res.data.scheduled_at)}.`,
        });
        setRescheduleAppointment(null);
        fetchAppointments();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not reschedule appointment. Please try another slot.';
      addToast({
        type: 'error',
        title: 'Reschedule Failed',
        message: msg,
      });
    } finally {
      setIsRescheduling(false);
    }
  };

  // Submit Cancellation
  const handleConfirmCancellation = async () => {
    if (!cancelTargetAppointment) return;

    setIsCancelling(true);
    try {
      const res = await appointmentService.cancelAppointment(
        cancelTargetAppointment.id,
        cancelReason.trim() || 'Cancelled by patient'
      );

      if (res?.data) {
        addToast({
          type: 'success',
          title: 'Appointment Cancelled',
          message: `Appointment ${cancelTargetAppointment.booking_reference} has been cancelled.`,
        });
        setCancelTargetAppointment(null);
        fetchAppointments();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to cancel appointment.';
      addToast({
        type: 'error',
        title: 'Cancellation Error',
        message: msg,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Filtered lists
  const now = new Date();
  const upcomingAppointments = appointments.filter(
    (a) =>
      ['PENDING', 'CONFIRMED', 'RESCHEDULED'].includes(a.status) &&
      new Date(a.scheduled_at).getTime() >= now.getTime() - 30 * 60 * 1000
  );

  const completedAppointments = appointments.filter(
    (a) =>
      a.status === 'COMPLETED' ||
      (['PENDING', 'CONFIRMED', 'RESCHEDULED'].includes(a.status) &&
        new Date(a.scheduled_at).getTime() < now.getTime() - 30 * 60 * 1000)
  );

  const cancelledAppointments = appointments.filter((a) => a.status === 'CANCELLED');

  const displayedAppointments = useMemo(() => {
    if (activeTab === 'upcoming') return upcomingAppointments;
    if (activeTab === 'completed') return completedAppointments;
    if (activeTab === 'cancelled') return cancelledAppointments;
    return appointments;
  }, [activeTab, appointments, upcomingAppointments, completedAppointments, cancelledAppointments]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-3xl bg-teal-50 text-[#00A896] flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Stethoscope className="h-8 w-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0A2540]">Sign In to View Appointments</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 max-w-md mx-auto leading-relaxed">
          Access your confirmed telehealth video consultation rooms, past clinic visit summaries, and reschedule slots anytime.
        </p>
        <Link href="/account">
          <Button variant="primary" size="lg" className="rounded-2xl font-bold">
            Sign In to Your Account
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Header Banner */}
      <div className="bg-[#0A2540] text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-[#00E5BE] text-xs font-semibold backdrop-blur-md border border-teal-500/30">
              <CalendarCheck className="h-3.5 w-3.5" />
              <span>Telehealth & In-Clinic Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              My Appointments & Consultations
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Manage appointments, join encrypted video rooms, or reschedule with top specialists.
            </p>
          </div>

          <Link href="/doctors">
            <Button variant="secondary" size="md" className="shadow-md shadow-teal-500/20 font-bold shrink-0">
              <Stethoscope className="h-4 w-4 mr-1.5" />
              <span>Book New Specialist</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-8 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'upcoming'
                ? 'bg-[#0A2540] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Upcoming</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'upcoming' ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {upcomingAppointments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'completed'
                ? 'bg-[#0A2540] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Completed</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'completed' ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {completedAppointments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'cancelled'
                ? 'bg-[#0A2540] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Cancelled</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'cancelled' ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {cancelledAppointments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-[#0A2540] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span>All Records ({appointments.length})</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse space-y-3"
              >
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && displayedAppointments.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-[#0A2540]">
              No {activeTab} appointments found
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Connect with top certified doctors across India in just a few clicks.
            </p>
            <Link href="/doctors">
              <Button variant="secondary" size="sm" className="font-bold">
                Find a Doctor
              </Button>
            </Link>
          </div>
        )}

        {/* Appointments List */}
        {!loading && displayedAppointments.length > 0 && (
          <div className="space-y-4">
            {displayedAppointments.map((appt) => {
              const doctor = appt.doctor;
              const avatarSrc = doctor?.avatar || doctor?.avatar_url;
              const isUpcoming =
                ['PENDING', 'CONFIRMED', 'RESCHEDULED'].includes(appt.status) &&
                new Date(appt.scheduled_at).getTime() >= now.getTime() - 30 * 60 * 1000;
              const isCancelled = appt.status === 'CANCELLED';
              const isVideo = appt.consultation_type === 'VIDEO';

              return (
                <Card
                  key={appt.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Doctor Profile & Appointment Meta */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-slate-100 bg-gradient-to-tr from-[#0A2540] to-[#00A896]">
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={doctor?.doctor_name || 'Doctor'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                            {doctor?.doctor_name ? doctor.doctor_name.charAt(0) : 'D'}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-base">
                            {doctor?.doctor_name || 'Medical Specialist'}
                          </h3>

                          {/* Status Badge */}
                          {appt.status === 'CONFIRMED' && (
                            <Badge variant="success">Confirmed</Badge>
                          )}
                          {appt.status === 'RESCHEDULED' && (
                            <Badge variant="warning">Rescheduled</Badge>
                          )}
                          {appt.status === 'CANCELLED' && (
                            <Badge variant="danger">Cancelled</Badge>
                          )}
                          {appt.status === 'COMPLETED' && (
                            <Badge variant="default">Completed</Badge>
                          )}

                          {/* Mode Badge */}
                          {isVideo ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-[#00A896] text-[11px] font-bold border border-teal-200/70">
                              <Video className="h-3 w-3" />
                              <span>Video Consultation</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                              <MapPin className="h-3 w-3" />
                              <span>In-Clinic Visit</span>
                            </span>
                          )}
                        </div>

                        {/* Specialty & Hospital */}
                        <p className="text-xs font-semibold text-[#00A896]">
                          {doctor?.specialties?.map((s) => s.name).join(', ') || 'Specialist'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {doctor?.hospital_affiliation || 'Partner Clinic'}
                        </p>

                        {/* Date & Time */}
                        <div className="flex items-center gap-3 pt-2 text-xs text-slate-700 flex-wrap">
                          <div className="flex items-center gap-1.5 font-bold text-[#0A2540] bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
                            <CalendarIcon className="h-3.5 w-3.5 text-[#00A896]" />
                            <span>{formatDate(appt.scheduled_at)}</span>
                          </div>

                          <div className="font-mono text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                            Ref: <span className="font-bold text-slate-800">{appt.booking_reference}</span>
                          </div>

                          <span className="text-xs font-bold text-slate-700">
                            Fee: {formatCurrency(appt.fee_amount)}
                          </span>
                        </div>

                        {/* Symptoms / Visit reason */}
                        {appt.symptoms && (
                          <p className="text-xs text-slate-500 pt-1">
                            <span className="font-semibold text-slate-700">Reason for consult:</span>{' '}
                            {appt.symptoms}
                          </p>
                        )}

                        {/* Cancellation Audit Record */}
                        {isCancelled && appt.cancellation_reason && (
                          <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-700">
                            <span className="font-bold">Cancellation Reason:</span> {appt.cancellation_reason}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap lg:flex-col items-stretch sm:items-end gap-2 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {/* Video Consultation Room Button */}
                      {isVideo && isUpcoming && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="font-bold shadow-xs"
                          onClick={() => setActiveVideoAppointment(appt)}
                        >
                          <Video className="h-4 w-4 mr-1.5" />
                          <span>Join Video Call</span>
                        </Button>
                      )}

                      {/* Reschedule Button */}
                      {isUpcoming && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-semibold hover:border-slate-400"
                          onClick={() => setRescheduleAppointment(appt)}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-500" />
                          <span>Reschedule</span>
                        </Button>
                      )}

                      {/* Cancel Button */}
                      {isUpcoming && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                          onClick={() => setCancelTargetAppointment(appt)}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          <span>Cancel</span>
                        </Button>
                      )}

                      {/* Book again for completed / cancelled */}
                      {!isUpcoming && doctor && (
                        <Link href={`/doctors/${doctor.slug || doctor.id}`}>
                          <Button variant="outline" size="sm" className="text-xs font-bold">
                            <span>Book Again</span>
                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
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

      {/* RESCHEDULE MODAL */}
      {rescheduleAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Reschedule Appointment</h3>
                <p className="text-xs text-slate-400">
                  Select a new date and time slot for Dr. {rescheduleAppointment.doctor.doctor_name}
                </p>
              </div>
              <button
                onClick={() => setRescheduleAppointment(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Current details */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Slot:</span>
                <span className="font-bold text-slate-800">
                  {formatDate(rescheduleAppointment.scheduled_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Booking Ref:</span>
                <span className="font-mono font-bold text-[#0A2540]">
                  {rescheduleAppointment.booking_reference}
                </span>
              </div>
            </div>

            {/* Date selection ribbon */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                1. Select New Date
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {calendarDays.map((day) => {
                  const isSelected = rescheduleDate === day.dateStr;
                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => setRescheduleDate(day.dateStr)}
                      className={`flex flex-col items-center justify-center min-w-[54px] py-2 px-1.5 rounded-2xl border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#00A896] bg-[#00A896] text-white font-bold shadow-md'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-[10px] opacity-80">{day.weekdayShort}</span>
                      <span className="text-base font-black my-0.5">{day.dayNum}</span>
                      <span className="text-[9px] uppercase opacity-80">{day.monthShort}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Available slot selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                2. Select New Time Slot
              </label>
              {loadingRescheduleSlots ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <div className="animate-spin h-5 w-5 border-2 border-[#00A896] border-t-transparent rounded-full mx-auto mb-2" />
                  Checking doctor availability...
                </div>
              ) : !rescheduleSlots || rescheduleSlots.slots.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center text-xs text-amber-800">
                  No slots available on this date.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                  {rescheduleSlots.slots.map((slot) => {
                    const isSelected = selectedNewSlot?.time === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedNewSlot(slot)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-[#0A2540] text-white shadow-sm'
                            : slot.available
                            ? 'bg-white border border-slate-200 text-slate-800 hover:border-[#00A896] cursor-pointer'
                            : 'bg-slate-100 border border-slate-200/50 text-slate-300 line-through cursor-not-allowed'
                        }`}
                      >
                        {slot.time_display}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Reason for Rescheduling (Optional)
              </label>
              <input
                type="text"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="e.g., Work conflict, travel plan changes"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#00A896] focus:outline-none"
              />
            </div>

            {/* Modal Buttons */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => setRescheduleAppointment(null)}
              >
                Keep Current
              </Button>
              <Button
                variant="secondary"
                className="flex-1 text-xs font-bold"
                disabled={!selectedNewSlot}
                isLoading={isRescheduling}
                onClick={handleConfirmReschedule}
              >
                Confirm New Slot
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CANCELLATION MODAL */}
      {cancelTargetAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-lg">Cancel Appointment?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to cancel your appointment with Dr.{' '}
                {cancelTargetAppointment.doctor.doctor_name} scheduled for{' '}
                <span className="font-semibold text-slate-700">
                  {formatDate(cancelTargetAppointment.scheduled_at)}
                </span>
                ?
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#00A896] focus:outline-none"
              >
                <option value="Personal scheduling conflict">Personal scheduling conflict</option>
                <option value="Feeling better / symptoms resolved">Feeling better / symptoms resolved</option>
                <option value="Consulted another doctor">Consulted another doctor</option>
                <option value="Emergency circumstances">Emergency circumstances</option>
                <option value="Other reason">Other reason</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-800 flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                Your slot will be freed up for other waiting patients. Your appointment record and consultation fee receipt remain safely stored in your account history.
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => setCancelTargetAppointment(null)}
              >
                Keep Appointment
              </Button>
              <Button
                variant="danger"
                className="flex-1 text-xs font-bold"
                isLoading={isCancelling}
                onClick={handleConfirmCancellation}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TELEHEALTH VIDEO CONSULTATION ROOM MODAL */}
      {activeVideoAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 text-[#00A896]">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">MediSwift Secure Telehealth Room</h3>
                  <p className="text-xs text-slate-400">End-to-End Encrypted WebRTC Session</p>
                </div>
              </div>
              <button
                onClick={() => setActiveVideoAppointment(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Doctor Info */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0A2540] to-[#00A896] text-white font-bold flex items-center justify-center text-lg shrink-0">
                {activeVideoAppointment.doctor.doctor_name?.charAt(0) || 'D'}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {activeVideoAppointment.doctor.doctor_name}
                </h4>
                <p className="text-xs text-[#00A896] font-semibold">
                  {activeVideoAppointment.doctor.specialties?.map((s) => s.name).join(', ')}
                </p>
                <p className="text-[11px] text-slate-400">
                  Room ID: <span className="font-mono text-slate-600">{activeVideoAppointment.meeting_room_id || 'secure-telehealth-room'}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100 font-medium">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Doctor is prepared. Camera and microphone permissions are required.</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-[11px] text-slate-500">
                <p>• Have your previous prescriptions or lab reports handy.</p>
                <p>• Digital prescription will be automatically linked to your vault upon call completion.</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {activeVideoAppointment.meeting_url ? (
                <a
                  href={activeVideoAppointment.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button variant="secondary" size="lg" className="w-full font-bold shadow-md shadow-teal-500/20">
                    <Video className="h-4 w-4 mr-2" />
                    <span>Launch Encrypted Video Call</span>
                  </Button>
                </a>
              ) : (
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full font-bold"
                  onClick={() => {
                    addToast({
                      type: 'info',
                      title: 'Connecting Room',
                      message: 'Connecting to MediSwift WebRTC gateway...',
                    });
                  }}
                >
                  <Video className="h-4 w-4 mr-2" />
                  <span>Enter Consultation Room</span>
                </Button>
              )}

              <Button
                variant="outline"
                size="md"
                onClick={() => setActiveVideoAppointment(null)}
                className="text-xs"
              >
                Close Window
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
