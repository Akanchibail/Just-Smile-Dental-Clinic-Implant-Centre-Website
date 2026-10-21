import React, { useState } from 'react';
import {
  Calendar,
  Phone,
  Clock,
  MapPin,
  Check,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  HeartPulse,
  Award
} from 'lucide-react';
import { Service, ClinicSettings, ClinicHours } from '../types';
import { getGroupedClinicHours } from '../lib/timeUtils';
import heroClinicImg from '../assets/images/hero_dental_clinic_1792213174940.jpg';
import careImg from '../assets/images/dental_consultation_care_1792213176571.jpg';
import receptionImg from '../assets/images/clinic_reception_interior_1792213176737.jpg';

interface HomePageProps {
  services: Service[];
  clinicSettings: ClinicSettings;
  clinicHours: ClinicHours[];
  onOpenBooking: (serviceId?: string) => void;
  onNavigate: (tab: string, serviceId?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  services,
  clinicSettings,
  clinicHours,
  onOpenBooking,
  onNavigate
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const featuredServices = services.filter((s) => s.popular || s.is_active).slice(0, 6);

  const faqs = [
    {
      q: 'Do I need an appointment before visiting Just Smile Dental Clinic?',
      a: 'We strongly recommend booking an appointment online or calling our reception ahead of your visit. This ensures zero waiting time and guarantees dedicated clinical time for your examination.'
    },
    {
      q: 'Is root canal treatment (RCT) painful at the clinic?',
      a: 'Modern root canal treatments are performed under effective local anesthesia, making the procedure virtually painless. Our priority is patient comfort and gentle, anxiety-free care.'
    },
    {
      q: 'What is the consultation fee at Just Smile Dental Clinic?',
      a: 'A comprehensive oral examination and specialist consultation is ₹300, which includes a thorough intraoral assessment and discussion of any required treatment plan.'
    },
    {
      q: 'Are dental implants permanent?',
      a: 'Yes, titanium dental implants fuse directly with the jawbone (osseointegration) and act as artificial tooth roots. With good oral hygiene and routine checkups, implants are designed to last for decades.'
    },
    {
      q: 'Where exactly is the clinic located in Bengaluru?',
      a: 'The clinic is on the 1st Floor, No. 990, Sir M. Visvesvaraya Road, near Faith Old Age Home, above Maruti Medicals, Royal Shelters, Devarachikkanahalli / BTM 4th Stage, Bengaluru.'
    }
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 sm:pt-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Column: Headline, Value Proposition, Action CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-900 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                <span>{clinicSettings.locality ? `${clinicSettings.locality} · ` : ''}{clinicSettings.city}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-[1.15] text-balance">
                Gentle, Professional Dental Care & Modern Implants
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Experience comprehensive, anxiety-free dentistry designed for adults, seniors, and families. From routine checkups and precision root canals to modern dental implants, we provide clear explanations and transparent treatment plans.
              </p>

              {/* Call-to-actions */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  onClick={() => onOpenBooking()}
                  className="px-6 py-3.5 rounded-xl bg-teal-800 hover:bg-teal-900 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-teal-950/10 flex items-center gap-2.5 transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book an Appointment</span>
                </button>

                <a
                  href={`tel:${clinicSettings.phone.replace(/\s+/g, '')}`}
                  className="px-5 py-3.5 rounded-xl border border-stone-300 hover:border-slate-400 bg-white text-slate-800 font-semibold text-sm hover:bg-stone-50 flex items-center gap-2 transition-all"
                >
                  <Phone className="w-4 h-4 text-teal-700" />
                  <span>Call {clinicSettings.phone}</span>
                </a>
              </div>

              {/* Quick trust strip */}
              <div className="pt-6 border-t border-stone-200 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block text-sm">10 AM – 9 PM</span>
                  <span className="text-slate-600">Flexible Evening Hours</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-sm">Clear Explanations</span>
                  <span className="text-slate-600">Zero Pressure Care</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block text-sm">Sterile Clinical Hub</span>
                  <span className="text-slate-600">Multi-Step Sanitization</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Asset */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-stone-200/80 bg-stone-100 aspect-[4/3] lg:aspect-[5/4]">
                <img
                  src={heroClinicImg}
                  alt="Modern clean operatory room at Just Smile Dental Clinic"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-5">
                  <div className="text-white space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-300">
                      Modern Clinical Environment
                    </span>
                    <p className="text-sm font-medium text-stone-100">
                      Clean, calm operatory room designed to minimize patient anxiety
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE-STEP EASY APPOINTMENT PROCESS */}
      <section className="bg-stone-100/70 py-12 border-y border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
              Convenient & Transparent
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              How Your Appointment Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-stone-200/90 shadow-sm relative">
              <div className="text-teal-800 font-bold text-xs uppercase tracking-wider mb-2">
                Step 01
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Select Service & Date
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose the dental service you need and select your preferred consultation date and available time slot online.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-stone-200/90 shadow-sm relative">
              <div className="text-teal-800 font-bold text-xs uppercase tracking-wider mb-2">
                Step 02
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Slot Reservation & Confirmation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive an immediate booking reference. Our clinic reception confirms your arrival window over call or WhatsApp.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-stone-200/90 shadow-sm relative">
              <div className="text-teal-800 font-bold text-xs uppercase tracking-wider mb-2">
                Step 03
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Gentle Oral Consultation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Arrive at the clinic in Devarachikkanahalli for an unhurried clinical exam, digital review, and transparent treatment plan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED SERVICES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
              Comprehensive Dental Treatments
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Popular Dental Care Services
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              From routine scaling to advanced implant surgery, all treatments are performed with modern instruments and sterilization protocols.
            </p>
          </div>
          <button
            onClick={() => onNavigate('services')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800 hover:text-teal-900 group shrink-0 cursor-pointer"
          >
            <span>View All 10 Services</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl border border-stone-200 p-6 flex flex-col justify-between hover:border-teal-400 hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">
                    {service.category}
                  </span>
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                    <span>{service.duration_minutes} min</span>
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                  {service.name}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {service.description}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-600 block">Consultation / Starting Fee</span>
                  <span className="text-xs font-bold text-slate-900">
                    {service.price_display || 'Contact clinic'}
                  </span>
                </div>
                <button
                  onClick={() => onOpenBooking(service.id)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-900 hover:bg-teal-800 hover:text-white transition-all cursor-pointer"
                >
                  Book Service
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. WHY PATIENTS CHOOSE JUST SMILE */}
      <section className="bg-teal-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-teal-800/80 aspect-[4/3]">
                <img
                  src={careImg}
                  alt="Dentist discussing treatment gently with patient"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
                Patient-Centred Philosophy
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Designed for Comfort, Transparency, and Lasting Oral Health
              </h2>
              <p className="text-sm text-stone-300 leading-relaxed">
                Many patients delay dental care due to anxiety or fear of surprise charges. At Just Smile Dental Clinic, we operate on complete clinical honesty: we thoroughly show and explain your oral health status, present all available treatment choices, and let you decide with confidence.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-teal-900/40 border border-teal-800/60 space-y-1">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400" />
                    <span>Gentle & Anxiety-Free</span>
                  </h4>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Local anesthesia protocols and patient-first pacing ensure relaxed appointments.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-teal-900/40 border border-teal-800/60 space-y-1">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400" />
                    <span>Transparent Pricing</span>
                  </h4>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Clear estimates provided upfront prior to initiating any dental procedure.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-teal-900/40 border border-teal-800/60 space-y-1">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400" />
                    <span>Implant & Specialist Care</span>
                  </h4>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Single and multi-tooth implant restoration, surgical extractions, and orthodontics.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-teal-900/40 border border-teal-800/60 space-y-1">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-400" />
                    <span>Strict Sterilization</span>
                  </h4>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Medical autoclave autoclaving and sealed sterile pouches for each patient.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LOCATION, HOURS & CONTACT CARD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left: Clinic Info */}
            <div className="p-8 lg:p-10 space-y-6">
              <div>
                <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
                  Find Us in Bengaluru
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  Clinic Hours & Directions
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Conveniently situated in Devarachikkanahalli, above Maruti Medicals.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-teal-800 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">Address</span>
                    <p className="text-slate-600 leading-relaxed">
                      {clinicSettings.address_line}, {clinicSettings.locality}, {clinicSettings.city}, Karnataka {clinicSettings.postal_code}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-teal-800 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-900 block">Working Schedule</span>
                    {getGroupedClinicHours(clinicHours).map((group, idx) => (
                      <p key={idx} className="text-slate-600 text-xs">
                        <span className="font-medium text-slate-800">{group.daysLabel}:</span> {group.timeRange}
                        {group.lunchBreak ? (
                          <span className="text-teal-800 font-medium"> (Lunch: {group.lunchBreak})</span>
                        ) : group.isOpen ? (
                          <span className="text-slate-500"> (No lunch break)</span>
                        ) : null}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-teal-800 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">Direct Line</span>
                    <a
                      href={`tel:${clinicSettings.phone.replace(/\s+/g, '')}`}
                      className="text-teal-800 font-semibold hover:underline"
                    >
                      {clinicSettings.phone}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={clinicSettings.maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-lg bg-teal-800 text-white font-semibold text-xs hover:bg-teal-900 transition-colors inline-flex items-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Get Driving Directions</span>
                </a>
                <button
                  onClick={() => onOpenBooking()}
                  className="px-4 py-2.5 rounded-lg border border-stone-300 text-slate-800 font-semibold text-xs hover:bg-stone-50 transition-colors"
                >
                  Book Appointment
                </button>
              </div>
            </div>

            {/* Right: Reception visual */}
            <div className="relative bg-stone-100 min-h-[280px]">
              <img
                src={receptionImg}
                alt="Clinic reception and waiting area"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-stone-900/20" />
            </div>
          </div>
        </div>
      </section>

      {/* 6. FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
            Clear Answers
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="border border-stone-200 rounded-xl bg-white overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-slate-900 hover:text-teal-900 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-600 transition-transform ${
                      isOpen ? 'rotate-180 text-teal-800' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-stone-100 bg-stone-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. FINAL APPOINTMENT CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-2xl text-white p-8 sm:p-12 text-center shadow-lg relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
              Experience Gentle Dentistry
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Ready to Book Your Dental Consultation?
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Reserve your preferred time slot online. Our reception team will reach out to confirm your booking and answer any preliminary questions.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onOpenBooking()}
                className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
              >
                Book Appointment Online
              </button>
              <a
                href={`tel:${clinicSettings.phone.replace(/\s+/g, '')}`}
                className="px-5 py-3 rounded-xl border border-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition-colors"
              >
                Call Reception: {clinicSettings.phone}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
