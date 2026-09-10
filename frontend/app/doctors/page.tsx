'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { doctorService, DoctorQueryParams } from '@/services/doctor-service';
import { Doctor, Specialty } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import {
  Star,
  Video,
  Search,
  MapPin,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Baby,
  HeartPulse,
  Smile,
  Bone,
  Heart,
  Brain,
  Apple,
  Activity,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
} from 'lucide-react';

// Lucide icon mapping for specialties
const SPECIALTY_ICON_MAP: Record<string, React.ElementType> = {
  Stethoscope,
  Sparkles,
  Baby,
  HeartPulse,
  Smile,
  Bone,
  Heart,
  Brain,
  Apple,
  Activity,
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [consultType, setConsultType] = useState<'all' | 'video' | 'in_person'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [minExp, setMinExp] = useState<number | undefined>(undefined);
  const [feeRange, setFeeRange] = useState<'all' | 'under_800' | '800_1200' | 'above_1200'>('all');
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('-rating');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Load Specialties once on mount
  useEffect(() => {
    async function loadSpecialties() {
      try {
        const res = await doctorService.getSpecialties();
        if (res?.data?.results) {
          setSpecialties(res.data.results);
        }
      } catch (err) {
        console.error('Failed to load specialties', err);
      }
    }
    loadSpecialties();
  }, []);

  // Fetch Doctors whenever filters change
  useEffect(() => {
    async function loadDoctors() {
      setLoading(true);
      try {
        const params: DoctorQueryParams = {
          search: search.trim() || undefined,
          specialty: selectedSpecialty || undefined,
          city: selectedCity || undefined,
          language: selectedLanguage || undefined,
          min_rating: minRating,
          ordering: sortBy,
        };

        if (consultType === 'video') {
          params.telehealth_only = true;
        } else if (consultType === 'in_person') {
          params.in_person_only = true;
        }

        if (minExp) {
          params.min_experience = minExp;
        }

        if (feeRange === 'under_800') {
          params.max_fee = 800;
        } else if (feeRange === '800_1200') {
          params.min_fee = 800;
          params.max_fee = 1200;
        } else if (feeRange === 'above_1200') {
          params.min_fee = 1200;
        }

        const res = await doctorService.getDoctors(params);
        if (res?.data?.results) {
          setDoctors(res.data.results);
        } else {
          setDoctors([]);
        }
      } catch (err) {
        console.error('Failed to load doctors', err);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadDoctors();
    }, 250);

    return () => clearTimeout(timer);
  }, [
    search,
    selectedSpecialty,
    consultType,
    selectedCity,
    selectedLanguage,
    minExp,
    feeRange,
    minRating,
    sortBy,
  ]);

  const resetFilters = () => {
    setSearch('');
    setSelectedSpecialty('');
    setConsultType('all');
    setSelectedCity('');
    setSelectedLanguage('');
    setMinExp(undefined);
    setFeeRange('all');
    setMinRating(undefined);
    setSortBy('-rating');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedSpecialty) count++;
    if (consultType !== 'all') count++;
    if (selectedCity) count++;
    if (selectedLanguage) count++;
    if (minExp !== undefined) count++;
    if (feeRange !== 'all') count++;
    if (minRating !== undefined) count++;
    return count;
  }, [selectedSpecialty, consultType, selectedCity, selectedLanguage, minExp, feeRange, minRating]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Banner */}
      <div className="bg-gradient-to-b from-[#0A2540] via-[#0D3156] to-[#0A2540] text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-[#00E5BE] text-xs font-semibold backdrop-blur-md border border-teal-500/30">
                <ShieldCheck className="h-4 w-4" />
                <span>100% Verified Indian Medical Council Specialists</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Find Top Doctors & Telehealth Consultations
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Connect with India&apos;s leading physicians and super-specialists from AIIMS, Apollo, Fortis, and Max Healthcare via encrypted video consultations or clinic visits.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/15">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="inline-block h-9 w-9 rounded-full ring-2 ring-[#0A2540] bg-teal-600 flex items-center justify-center font-bold text-xs">AS</div>
                <div className="inline-block h-9 w-9 rounded-full ring-2 ring-[#0A2540] bg-indigo-600 flex items-center justify-center font-bold text-xs">AD</div>
                <div className="inline-block h-9 w-9 rounded-full ring-2 ring-[#0A2540] bg-amber-600 flex items-center justify-center font-bold text-xs">RI</div>
              </div>
              <div className="text-xs">
                <p className="font-bold text-white">500+ Verified Doctors</p>
                <p className="text-slate-300">Instant slot confirmation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Specialty Selector Strip */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Browse by Clinical Specialty
            </h2>
            {selectedSpecialty && (
              <button
                onClick={() => setSelectedSpecialty('')}
                className="text-xs font-semibold text-[#00A896] hover:underline"
              >
                Clear Specialty
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
            <button
              onClick={() => setSelectedSpecialty('')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedSpecialty === ''
                  ? 'bg-[#0A2540] text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Stethoscope className="h-4 w-4" />
              <span>All Specialties</span>
            </button>
            {specialties.map((spec) => {
              const IconComponent = SPECIALTY_ICON_MAP[spec.icon || 'Stethoscope'] || Stethoscope;
              const isSelected = selectedSpecialty === spec.slug;
              return (
                <button
                  key={spec.id}
                  onClick={() => setSelectedSpecialty(isSelected ? '' : spec.slug)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#00A896] text-white shadow-md shadow-teal-500/20'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{spec.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Main Filter Bar */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search doctors by name, hospital, qualifications, or medical symptoms..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#00A896] focus:outline-none focus:ring-3 focus:ring-[#00A896]/15 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Consultation Type Selector */}
            <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => setConsultType('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  consultType === 'all'
                    ? 'bg-white text-[#0A2540] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Modes
              </button>
              <button
                type="button"
                onClick={() => setConsultType('video')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  consultType === 'video'
                    ? 'bg-[#00A896] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Video className="h-3.5 w-3.5" />
                <span>Video Consult</span>
              </button>
              <button
                type="button"
                onClick={() => setConsultType('in_person')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  consultType === 'in_person'
                    ? 'bg-[#0A2540] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>In-Clinic</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 focus:border-[#00A896] focus:outline-none"
            >
              <option value="-rating">Highest Rated</option>
              <option value="-experience_years">Most Experienced</option>
              <option value="consultation_fee">Fee: Low to High</option>
              <option value="-consultation_fee">Fee: High to Low</option>
            </select>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="md:hidden flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
            >
              <Filter className="h-4 w-4" />
              <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
            </button>
          </div>

          {/* Secondary Filter Controls */}
          <div
            className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-100 ${
              showFiltersMobile ? 'block' : 'hidden md:grid'
            }`}
          >
            {/* City */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                City / Region
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#00A896] focus:outline-none"
              >
                <option value="">All Cities</option>
                <option value="New Delhi">New Delhi</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Chennai">Chennai</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Gurugram">Gurugram</option>
              </select>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Experience
              </label>
              <select
                value={minExp === undefined ? '' : minExp}
                onChange={(e) => setMinExp(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#00A896] focus:outline-none"
              >
                <option value="">Any Experience</option>
                <option value="5">5+ Years</option>
                <option value="10">10+ Years</option>
                <option value="15">15+ Years</option>
              </select>
            </div>

            {/* Consultation Fee */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Consultation Fee
              </label>
              <select
                value={feeRange}
                onChange={(e) => setFeeRange(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#00A896] focus:outline-none"
              >
                <option value="all">Any Fee</option>
                <option value="under_800">Under ₹800</option>
                <option value="800_1200">₹800 - ₹1,200</option>
                <option value="above_1200">₹1,200+</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Languages
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#00A896] focus:outline-none"
              >
                <option value="">All Languages</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Tamil">Tamil</option>
                <option value="Bengali">Bengali</option>
                <option value="Marathi">Marathi</option>
                <option value="Telugu">Telugu</option>
              </select>
            </div>

            {/* Rating / Reset */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Rating
                </label>
                <select
                  value={minRating === undefined ? '' : minRating}
                  onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#00A896] focus:outline-none"
                >
                  <option value="">All Ratings</option>
                  <option value="4.9">4.9+ Stars</option>
                  <option value="4.8">4.8+ Stars</option>
                </select>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  title="Reset all filters"
                  className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-sm font-black text-[#0A2540]">
              {loading ? 'Finding specialists...' : `${doctors.length} Doctors Available`}
            </span>
            {selectedSpecialty && (
              <span className="ml-2 text-xs text-slate-500 font-medium">
                in {specialties.find((s) => s.slug === selectedSpecialty)?.name || selectedSpecialty}
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-[#00A896] hover:underline"
            >
              Reset all filters ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse space-y-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                    <div className="h-3 bg-slate-200 rounded-md w-2/3" />
                  </div>
                </div>
                <div className="h-3 bg-slate-100 rounded-md w-full" />
                <div className="h-10 bg-slate-100 rounded-xl w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && doctors.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-xl mx-auto my-12 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-teal-50 text-[#00A896] flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-[#0A2540]">No specialists match your criteria</h3>
            <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
              We couldn&apos;t find any doctors matching your active filters. Try expanding your search, changing the city, or resetting the filters.
            </p>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset All Filters
            </Button>
          </div>
        )}

        {/* Doctors Grid */}
        {!loading && doctors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doc) => {
              const avatarSrc = doc.avatar || doc.avatar_url;
              const profileLink = `/doctors/${doc.slug || doc.id}`;

              return (
                <Card
                  key={doc.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-xl hover:border-teal-500/40 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Doctor Avatar & Main Info */}
                    <div className="flex items-start gap-4">
                      <div className="relative w-18 h-18 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-slate-100 bg-gradient-to-tr from-[#0A2540] to-[#00A896]">
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={doc.doctor_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                            {doc.doctor_name ? doc.doctor_name.charAt(0) : 'D'}
                          </div>
                        )}
                        {doc.is_verified && (
                          <span
                            className="absolute bottom-1 right-1 p-0.5 rounded-full bg-emerald-500 text-white shadow-xs"
                            title="Verified Practitioner"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500 text-white" />
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link href={profileLink}>
                            <h3 className="font-bold text-slate-900 text-base hover:text-[#00A896] transition-colors truncate">
                              {doc.doctor_name}
                            </h3>
                          </Link>
                        </div>

                        {/* Specialties */}
                        <p className="text-xs font-bold text-[#00A896] mt-0.5 truncate">
                          {doc.specialties.map((s) => s.name).join(', ')}
                        </p>

                        {/* Qualifications */}
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                          {doc.qualifications}
                        </p>

                        {/* Hospital / Clinic */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span className="truncate">{doc.hospital_affiliation}</span>
                        </div>
                      </div>
                    </div>

                    {/* Mode badges & City */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 flex-wrap text-xs">
                      {doc.is_available_for_telehealth && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-[#00A896] border border-teal-200/60 font-semibold text-[11px]">
                          <Video className="h-3 w-3" />
                          <span>Video Consult</span>
                        </span>
                      )}
                      {doc.is_available_for_in_person && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px]">
                          <MapPin className="h-3 w-3" />
                          <span>In-Clinic</span>
                        </span>
                      )}
                      {doc.city && (
                        <span className="text-slate-400 text-[11px] ml-auto font-medium">
                          {doc.city}
                        </span>
                      )}
                    </div>

                    {/* Stats strip */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                      <span className="flex items-center text-amber-500 font-bold">
                        <Star className="h-3.5 w-3.5 fill-current mr-1 text-amber-400" />
                        {doc.rating}
                        <span className="text-slate-400 font-normal ml-1">
                          ({doc.review_count})
                        </span>
                      </span>
                      <span>•</span>
                      <span className="font-medium text-slate-700">
                        {doc.experience_years} yrs exp
                      </span>
                      <span>•</span>
                      <span className="truncate text-slate-500 text-[11px]">
                        {doc.languages}
                      </span>
                    </div>

                    {/* Next slot indicator */}
                    <div className="mt-3 px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-800 text-[11px] font-medium flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Next Available Slot</span>
                      </span>
                      <span className="font-bold text-emerald-700">Tomorrow, 09:30 AM</span>
                    </div>
                  </div>

                  {/* Bottom Fee & Book CTA */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Consultation Fee
                      </div>
                      <div className="text-base font-black text-[#0A2540]">
                        {formatCurrency(doc.consultation_fee)}
                      </div>
                    </div>

                    <Link href={profileLink} className="shrink-0">
                      <Button size="sm" variant="secondary" className="shadow-xs font-bold">
                        <span>Book Appointment</span>
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
