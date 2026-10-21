import React from 'react';
import { ShieldCheck, UserCheck, Stethoscope, Sparkles, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { Practitioner, ClinicSettings } from '../types';
import { INITIAL_PRACTITIONERS } from '../lib/mockData';
import implantTechImg from '../assets/images/dental_implant_tech_1792213176914.jpg';
import receptionImg from '../assets/images/clinic_reception_interior_1792213176737.jpg';

interface AboutPageProps {
  practitioners?: Practitioner[];
  clinicSettings: ClinicSettings;
  onOpenBooking: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  practitioners = [],
  clinicSettings,
  onOpenBooking
}) => {
  // Ensure we always have practitioner profiles to display even if database table is not yet seeded
  const displayPractitioners = practitioners && practitioners.length > 0 ? practitioners : INITIAL_PRACTITIONERS;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* 1. Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
          Neighbourhood Dental Practice
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          About Just Smile Dental Clinic & Implant Centre
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Founded on principles of gentle clinical care, patient comfort, and transparent communication, we serve patients and families across Devarachikkanahalli and BTM 4th Stage in Bengaluru.
        </p>
      </div>

      {/* 2. Clinic Philosophy & Environment Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
            Our Care Standard
          </span>
          <h2 className="text-2xl font-bold text-slate-900">
            A Patient-First Dental Experience Without Fear or Pressure
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We understand that many patients experience anxiety when visiting the dentist. At Just Smile Dental Clinic, we prioritize creating a calm, unhurried atmosphere. Before initiating any procedure, we take time to examine your teeth, explain conditions in plain language, show intraoral findings, and answer all questions.
          </p>
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700">
                <strong className="text-slate-900">Conservative & Ethical Dentistry:</strong> We preserve natural tooth structure whenever possible and never recommend unnecessary interventions.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700">
                <strong className="text-slate-900">High-Precision Dental Implants:</strong> Modern titanium implants placed with thorough digital planning for stability, function, and aesthetics.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700">
                <strong className="text-slate-900">Multi-Step Autoclave Sterilization:</strong> All dental handpieces and surgical instruments undergo rigorous multi-stage sanitization.
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-lg border border-stone-200">
          <img
            src={implantTechImg}
            alt="Sterile clinical dental model and instruments"
            className="w-full h-full object-cover aspect-[4/3]"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* 3. Verified Practitioner Profiles */}
      <div className="space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
            Clinical Team
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Verified Dental Practitioners
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            All practitioners possess verified dental qualifications and ongoing clinical training.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {displayPractitioners.map((doc) => {
            const specialtiesList = Array.isArray(doc?.specialties) && doc.specialties.length > 0
              ? doc.specialties
              : ['General Dentistry', 'Oral Health', 'Consultations'];

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:border-teal-400 transition-all space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-lg shrink-0">
                    <UserCheck className="w-6 h-6 text-teal-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {doc.display_name}
                    </h3>
                    <span className="text-xs font-semibold text-teal-800 block">
                      {doc.role}
                    </span>
                    <span className="text-xs text-slate-600 block mt-0.5">
                      {doc.qualifications}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed border-t border-stone-100 pt-3">
                  {doc.bio}
                </p>

                <div>
                  <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Core Clinical Focus
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {specialtiesList.map((spec, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-stone-100 text-slate-700 px-2.5 py-1 rounded-md"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Hygiene & Infection Control Guarantee */}
      <div className="bg-stone-50 rounded-2xl p-8 border border-stone-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700">
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Autoclaved Instrumentation</span>
            </h4>
            <p className="leading-relaxed text-slate-600">
              Class B vacuum autoclaving ensures sterile instruments for every examination and surgical procedure.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-700" />
              <span>Disinfected Operatories</span>
            </h4>
            <p className="leading-relaxed text-slate-600">
              Chairs, handpieces, and contact surfaces are wiped down with hospital-grade disinfectant between each patient.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-teal-700" />
              <span>Dedicated Consultation Time</span>
            </h4>
            <p className="leading-relaxed text-slate-600">
              Schedules are capped to eliminate rushed visits and ensure complete attention to each patient.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
