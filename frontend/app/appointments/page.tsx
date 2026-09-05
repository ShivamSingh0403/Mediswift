'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Appointment } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Video, Calendar, Clock, Stethoscope, AlertCircle } from 'lucide-react';

export default function AppointmentsPage() {
  const { isAuthenticated } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAppointments() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get('/appointments/');
        if (res?.data?.data?.results) setAppointments(res.data.data.results);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-teal-50 text-[#00A896] flex items-center justify-center mx-auto mb-4">
          <Stethoscope className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#0A2540]">Sign In to View Appointments</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          Access your telehealth scheduled sessions, past doctor consults, and digital meeting links.
        </p>
        <Link href="/account">
          <Button variant="primary">Login / Register</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0A2540]">Telehealth Consultations</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your scheduled appointments and join live encrypted video consultations.
          </p>
        </div>
        <Link href="/doctors">
          <Button variant="secondary" size="sm">Book New Consult</Button>
        </Link>
      </div>

      {appointments.length === 0 && !loading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200">
          <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">No scheduled appointments</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">Connect with experienced Indian doctors right from your home.</p>
          <Link href="/doctors">
            <Button size="sm" variant="outline">Browse Specialists</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <Card key={appt.id} className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0A2540] text-white font-bold flex items-center justify-center shrink-0">
                    <Video className="h-6 w-6 text-[#00A896]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">
                        {appt.doctor?.doctor_name || 'Consultant Specialist'}
                      </h3>
                      <Badge variant="success">{appt.status_display}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Mode: {appt.consultation_type_display}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Scheduled: {formatDate(appt.scheduled_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {appt.meeting_link && appt.status === 'CONFIRMED' && (
                    <a href={appt.meeting_link} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" size="sm">
                        <Video className="h-4 w-4 mr-1.5" />
                        <span>Join Video Room</span>
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
