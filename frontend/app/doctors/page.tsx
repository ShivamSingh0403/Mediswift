'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { doctorService } from '@/services/doctor-service';
import { Doctor, Specialty } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Star, Video, Search, MapPin, Stethoscope, ChevronRight } from 'lucide-react';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDoctors() {
      setLoading(true);
      try {
        const [docRes, specRes] = await Promise.all([
          doctorService.getDoctors({
            search: search || undefined,
            specialty: selectedSpecialty || undefined,
          }),
          doctorService.getSpecialties(),
        ]);
        if (docRes?.data?.results) setDoctors(docRes.data.results);
        if (specRes?.data?.results) setSpecialties(specRes.data.results);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    loadDoctors();
  }, [search, selectedSpecialty]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0A2540]">Doctor Discovery & Telehealth</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Consult India&apos;s leading verified medical specialists via secure video consultation or in-clinic visits.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctors by name, hospital or qualifications..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#00A896] focus:outline-none focus:ring-2 focus:ring-[#00A896]/20"
          />
        </div>

        <select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="w-full md:w-56 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 focus:border-[#00A896] focus:outline-none"
        >
          <option value="">All Specialties</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.slug}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Doctors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doc) => (
          <Card key={doc.id} className="glass-card-hover flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0A2540] to-[#00A896] text-white font-bold text-2xl flex items-center justify-center shrink-0 shadow-sm">
                  {doc.doctor_name ? doc.doctor_name.charAt(0) : 'D'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base truncate">{doc.doctor_name}</h3>
                    {doc.is_available_for_telehealth && (
                      <span className="p-1 rounded-md bg-teal-50 text-[#00A896]" title="Available for Video Consult">
                        <Video className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[#00A896] mt-0.5">
                    {doc.specialties.map((s) => s.name).join(', ')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{doc.qualifications}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{doc.hospital_affiliation}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <span className="flex items-center text-amber-500 font-bold">
                  <Star className="h-3.5 w-3.5 fill-current mr-1" />
                  {doc.rating}
                </span>
                <span>•</span>
                <span>{doc.experience_years} years experience</span>
                <span>•</span>
                <span className="truncate">{doc.languages}</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">Consultation Fee</div>
                <div className="text-base font-bold text-[#0A2540]">
                  {formatCurrency(doc.consultation_fee)}
                </div>
              </div>

              <Link href={`/doctors/${doc.id}`}>
                <Button size="sm" variant="secondary">
                  <span>Book Appointment</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
