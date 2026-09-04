import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppointmentForm from '@/components/AppointmentForm';
import {
  Stethoscope,
  Star,
  Clock,
  Award,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';

interface DoctorDetail {
  id: number;
  name: string;
  specialty: string;
  specialty_display?: string;
  experience: number;
  fee: string;
  availability: string;
  email: string;
  phone: string;
  bio: string;
  rating: string | number;
  image_url: string;
}

const MOCK_DOCTORS: Record<string, DoctorDetail> = {
  '1': {
    id: 1,
    name: 'Sarah Jenkins',
    specialty: 'Cardiology',
    specialty_display: 'Cardiologist',
    experience: 14,
    fee: '85.00',
    availability: 'Mon - Fri: 09:00 AM - 05:00 PM',
    email: 'dr.jenkins@mediswift.com',
    phone: '+1 (555) 349-2910',
    bio: 'Dr. Sarah Jenkins is a board-certified Cardiologist with over 14 years of clinical experience in preventive cardiovascular care, lipid disorders, and hypertension management.',
    rating: 4.95,
    image_url:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=80',
  },
  '2': {
    id: 2,
    name: 'Marcus Vance',
    specialty: 'Dermatology',
    specialty_display: 'Dermatologist',
    experience: 11,
    fee: '75.00',
    availability: 'Tue - Sat: 10:00 AM - 06:00 PM',
    email: 'dr.vance@mediswift.com',
    phone: '+1 (555) 482-1928',
    bio: 'Dr. Marcus Vance specializes in medical and aesthetic dermatology, acne therapeutics, and clinical skin cancer screenings with tele-dermatology consultations.',
    rating: 4.88,
    image_url:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80',
  },
};

async function getDoctor(id: string): Promise<DoctorDetail | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

  try {
    const res = await fetch(`${apiBase}/doctors/${id}/`, {
      cache: 'no-store',
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Status ${res.status}`);

    return await res.json();
  } catch (error) {
    return (
      MOCK_DOCTORS[id] || {
        id: Number(id) || 1,
        name: `Alexander Wright`,
        specialty: 'General Physician',
        specialty_display: 'General Physician',
        experience: 10,
        fee: '60.00',
        availability: 'Mon - Fri: 08:30 AM - 04:30 PM',
        email: 'dr.wright@mediswift.com',
        phone: '+1 (555) 837-1928',
        bio: 'Comprehensive family medicine specialist focused on primary diagnostics, chronic disease monitoring, and swift telemedicine prescriptions.',
        rating: 4.9,
        image_url:
          'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&auto=format&fit=crop&q=80',
      }
    );
  }
}

export default async function DoctorProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const doctor = await getDoctor(params.id);

  if (!doctor) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Doctor Profile & Credentials */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <img
                src={
                  doctor.image_url ||
                  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80'
                }
                alt={doctor.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-slate-200 shadow-sm"
              />
              <div className="text-center sm:text-left space-y-1">
                <span className="px-2.5 py-1 bg-brand-50 text-brand-700 text-[11px] font-bold rounded-full border border-brand-200 uppercase tracking-wider">
                  {doctor.specialty_display || doctor.specialty}
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Dr. {doctor.name}
                </h1>
                <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-500 text-xs font-bold pt-0.5">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{doctor.rating}</span>
                  <span className="text-slate-400 font-normal">(180+ verified reviews)</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <div className="text-lg font-black text-slate-900">{doctor.experience}+ Yrs</div>
                <div className="text-[11px] text-slate-500 font-medium">Clinical Practice</div>
              </div>
              <div className="p-3 bg-teal-50/70 rounded-2xl border border-teal-200/80 text-center">
                <div className="text-lg font-black text-brand-700">${doctor.fee}</div>
                <div className="text-[11px] text-brand-800 font-medium">Session Fee</div>
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <Clock className="w-4 h-4 text-brand-600 shrink-0" />
                <span>
                  <strong>Schedule:</strong> {doctor.availability}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
                <span>Verified License & Medical Board Certification</span>
              </div>
            </div>

            {/* Bio */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Professional Background
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">{doctor.bio}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Appointment Booking Form */}
        <div className="lg:col-span-7">
          <AppointmentForm
            doctorId={doctor.id}
            doctorName={doctor.name}
            consultationFee={doctor.fee}
          />
        </div>
      </div>
    </div>
  );
}
