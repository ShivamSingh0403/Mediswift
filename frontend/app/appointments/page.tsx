'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Stethoscope } from 'lucide-react';

export default function AppointmentsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account/appointments');
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-teal-50 text-[#00A896] flex items-center justify-center mx-auto mb-4">
        <Stethoscope className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold text-[#0A2540]">Redirecting to Appointments Dashboard...</h2>
      <p className="text-xs text-slate-500">
        If you are not redirected automatically, click below to open your appointments.
      </p>
      <Link href="/account/appointments">
        <Button variant="primary" size="sm">Go to Appointments</Button>
      </Link>
    </div>
  );
}
