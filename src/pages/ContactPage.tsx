import React, { useState } from 'react';
import {
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { ClinicSettings, ClinicHours, PatientInquiry } from '../types';
import { validateIndianPhone, formatTime12h } from '../lib/timeUtils';
import { submitPatientInquiry } from '../lib/api';

interface ContactPageProps {
  clinicSettings: ClinicSettings;
  clinicHours: ClinicHours[];
  onOpenBooking: () => void;
  onInquirySubmitted?: (inquiry: PatientInquiry) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  clinicSettings,
  clinicHours,
  onOpenBooking,
  onInquirySubmitted
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<PatientInquiry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    const phoneValidation = validateIndianPhone(phone);
    if (!phoneValidation.valid) {
      setError(phoneValidation.error || 'Please enter a valid Indian mobile number.');
      return;
    }

    if (!message.trim()) {
      setError('Please enter a brief message or question.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitPatientInquiry({
        name,
        phone,
        message
      });

      if (!res.success || !res.inquiry) {
        setError(res.error || 'Could not submit inquiry. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setSubmittedInquiry(res.inquiry);
      setSubmitted(true);
      onInquirySubmitted?.(res.inquiry);
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred while sending your note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
          Get in Touch
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Hours, Location & Contact
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          We are located in Devarachikkanahalli, Bengaluru. Reach out by phone, WhatsApp, or submit a message below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Contact Info & Hours */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Direct Actions Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Immediate Assistance
            </h3>

            <div className="space-y-3">
              <a
                href={`tel:${clinicSettings.phone.replace(/\s+/g, '')}`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 hover:border-teal-500 hover:bg-teal-50/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-teal-800" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-600 block">Call Reception</span>
                    <span className="text-sm font-bold text-slate-900 group-hover:text-teal-900">
                      {clinicSettings.phone}
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-teal-800" />
              </a>

              <a
                href={`https://wa.me/${clinicSettings.whatsapp_number}?text=Hello%20Just%20Smile%20Dental%20Clinic,%20I%20would%20like%20to%20inquire%20about%20dental%20treatments.`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-400 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <span className="text-xs text-emerald-700 block">Chat on WhatsApp</span>
                    <span className="text-sm font-bold text-emerald-950">
                      +91 99459 22684
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Location & Directions */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-800" />
              <span>Clinic Location</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              {clinicSettings.address_line}, {clinicSettings.locality}, {clinicSettings.city}, Karnataka {clinicSettings.postal_code}
            </p>
            <div className="pt-2">
              <a
                href={clinicSettings.maps_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-800 text-white text-xs font-semibold hover:bg-teal-900 transition-colors shadow-sm"
              >
                <MapPin className="w-4 h-4" />
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>

          {/* Operating Hours Table */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-800" />
              <span>Weekly Schedule</span>
            </h3>
            <div className="divide-y divide-stone-100 text-xs">
              {clinicHours.map((h) => (
                <div key={h.day_of_week} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-800">{h.day_name}</span>
                    {h.is_open && h.lunch_start && h.lunch_end ? (
                      <span className="block text-[11px] text-teal-800 font-medium">
                        Lunch: {formatTime12h(h.lunch_start)} – {formatTime12h(h.lunch_end)}
                      </span>
                    ) : h.is_open ? (
                      <span className="block text-[11px] text-slate-500">No lunch break</span>
                    ) : null}
                  </div>
                  <span className="text-slate-900 font-semibold">
                    {h.is_open ? `${formatTime12h(h.opening_time)} – ${formatTime12h(h.closing_time)}` : 'Closed'}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-600 pt-1">
              * Appointment slots pause during designated daily lunch breaks.
            </p>
          </div>
        </div>

        {/* Right: Contact & Quick Inquiry Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">
              Send an Inquiry or Appointment Note
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Have questions regarding treatments or scheduling? Send a note directly to our front desk.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 text-center bg-teal-50 rounded-xl border border-teal-200 space-y-3">
              <div className="w-12 h-12 bg-teal-100 text-teal-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Inquiry Received & Logged
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Thank you{submittedInquiry?.patient_name ? `, ${submittedInquiry.patient_name}` : ''}! Your message has been sent directly to the Just Smile front desk. Our coordinator will review your note and call you back shortly.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setSubmittedInquiry(null);
                    setName('');
                    setPhone('');
                    setMessage('');
                  }}
                  className="text-xs font-semibold text-teal-800 hover:underline cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Your Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anand Murthy"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Mobile Number (India) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 99459 22684 or 10-digit mobile"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Message / Treatment Question <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help? (e.g. inquire about dental implant procedure, root canal pricing, or book an appointment)"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onOpenBooking}
                  className="text-xs text-teal-800 font-semibold hover:underline cursor-pointer"
                >
                  Or use instant online booking →
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-60 text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
