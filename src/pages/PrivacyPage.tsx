import React from 'react';
import { ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { ClinicSettings } from '../types';

interface PrivacyPageProps {
  clinicSettings: ClinicSettings;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ clinicSettings }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
          <span>Patient Data Protection Policy</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Privacy Policy & Appointment Data Notice
        </h1>
        <p className="text-xs text-slate-600">
          Last updated: October 2026 · Just Smile Dental Clinic & Implant Centre
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <FileText className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p>
          <strong>Notice for Clinic Owner:</strong> This policy outlines standard healthcare patient privacy and data handling practices for appointment scheduling. Clinic-specific legal registration and statutory disclosures should be verified by the clinic proprietor before public advertising.
        </p>
      </div>

      <div className="prose prose-stone text-xs text-slate-700 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Information We Collect</h2>
          <p>
            When you request an appointment through our website, we collect only the necessary information to coordinate and confirm your visit:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>Patient Name:</strong> Used to identify your clinical visit.</li>
            <li><strong>Mobile Phone Number:</strong> Used solely to verify your booking, communicate time slot confirmation, or share directions.</li>
            <li><strong>Email Address (Optional):</strong> Used to send digital booking summaries if provided.</li>
            <li><strong>Treatment Selection & Clinical Notes (Optional):</strong> Preliminary notes regarding tooth sensitivity or dental concerns to assist the examining dentist.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. How Your Information Is Used</h2>
          <p>
            Your details are used exclusively for scheduling purposes by our front desk and dental staff. We never sell, rent, or lease patient contact details to third-party telemarketers or advertisers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Database Security & Access Control</h2>
          <p>
            All appointment records and personal information are stored using PostgreSQL database protection with Row Level Security (RLS) policies. Only authenticated clinic staff and practitioners are authorized to access patient records. Anonymous public visitors cannot access or browse appointment logs.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Retention & Cancellation</h2>
          <p>
            Patients may request cancellation or removal of their appointment contact records by contacting the clinic directly at {clinicSettings.phone} or by messaging our verified WhatsApp line.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Clinic Contact</h2>
          <p>
            For any queries regarding your appointment or personal data:
          </p>
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
            <p className="font-semibold text-slate-900">{clinicSettings.clinic_name}</p>
            <p className="text-slate-600 mt-0.5">{clinicSettings.address_line}, {clinicSettings.locality}, {clinicSettings.city} {clinicSettings.postal_code}</p>
            <p className="text-slate-600 mt-0.5">Phone: {clinicSettings.phone}</p>
          </div>
        </section>
      </div>
    </div>
  );
};
