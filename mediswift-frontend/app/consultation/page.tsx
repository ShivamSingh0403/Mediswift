import React from 'react';
import DoctorConsultation from '@/components/DoctorConsultation';

export const metadata = {
  title: 'Doctor Teleconsultation & Booking | Mediswift Pro',
  description: 'Book confidential, certified telehealth consultations with top specialists across Cardiology, Pediatrics, General Medicine, and Dermatology.',
};

export default function ConsultationPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <DoctorConsultation />
    </div>
  );
}
