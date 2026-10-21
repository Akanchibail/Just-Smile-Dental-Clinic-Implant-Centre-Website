import React, { useState } from 'react';
import {
  Search,
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { Appointment, ClinicSettings } from '../types';
import { lookupAppointment, updateAppointmentStatus } from '../lib/api';
import { formatDateReadable, formatTime12h } from '../lib/timeUtils';
import { generateConfirmationMessage, generateCancellationMessage, openWhatsApp } from '../lib/notifications';

interface BookingLookupPageProps {
  clinicSettings: ClinicSettings;
  onOpenBooking: () => void;
  onAppointmentCancelled?: (id: string) => void;
}

export const BookingLookupPage: React.FC<BookingLookupPageProps> = ({
  clinicSettings,
  onOpenBooking,
  onAppointmentCancelled
}) => {
  const [bookingRef, setBookingRef] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  // Cancellation state
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAppointment(null);
    setCancelSuccess(false);

    if (!bookingRef.trim()) {
      setError('Please enter your booking reference (e.g. JS-2026-9481).');
      return;
    }
    if (!phoneDigits.trim()) {
      setError('Please enter at least the last 4 digits of your phone number.');
      return;
    }

    setIsSearching(true);
    try {
      const res = await lookupAppointment(bookingRef, phoneDigits);
      if (!res.success || !res.appointment) {
        setError(res.error || 'Appointment record not found or phone number does not match.');
      } else {
        setAppointment(res.appointment);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search appointment.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!appointment) return;
    setIsCancelling(true);
    try {
      const note = cancelReason ? `Patient requested cancellation: ${cancelReason}` : 'Cancelled by patient online';
      await updateAppointmentStatus(appointment.id, 'cancelled', note);
      setAppointment({ ...appointment, status: 'cancelled' });
      setCancelSuccess(true);
      if (onAppointmentCancelled) {
        onAppointmentCancelled(appointment.id);
      }
    } catch (err: any) {
      setError('Failed to cancel appointment. Please call the clinic directly.');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmed by Clinic</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Clinic Confirmation</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600">
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Visit Completed</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded text-xs font-medium bg-stone-100 text-stone-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
          Patient Portal
        </span>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Check Your Appointment Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          Enter your unique booking reference and verified phone number to review appointment details or request a change.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Booking Reference <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={bookingRef}
                onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
                placeholder="e.g. JS-2026-9481"
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs font-mono uppercase text-slate-900 focus:outline-none focus:border-teal-700"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Last 4 Digits of Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={10}
                value={phoneDigits}
                onChange={(e) => setPhoneDigits(e.target.value)}
                placeholder="e.g. 2345 or full number"
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-600">
              Demo sample ref: <code className="font-semibold text-teal-800">JS-2026-9481</code> (phone: <code className="font-semibold text-teal-800">2345</code>)
            </span>
            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 rounded-lg bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isSearching ? 'Verifying...' : 'Find Appointment'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Appointment Details Result */}
      {appointment && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                Appointment Record
              </span>
              <h3 className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                {appointment.booking_reference}
              </h3>
            </div>
            <div>{getStatusBadge(appointment.status)}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-slate-600 block">Patient Name</span>
              <span className="font-bold text-slate-900 text-sm">{appointment.patient_name}</span>
              <span className="text-[11px] text-slate-600 block">
                {appointment.is_first_time ? 'First-time patient' : 'Returning patient'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-slate-600 block">Treatment / Service</span>
              <span className="font-bold text-slate-900 text-sm">{appointment.service_name}</span>
              <span className="text-[11px] text-slate-600 block">
                Doctor: {appointment.practitioner_name || 'Assigned on arrival'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-slate-600 block">Scheduled Date</span>
              <span className="font-bold text-slate-900 text-sm">
                {formatDateReadable(appointment.appointment_date)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
              <span className="text-slate-600 block">Time Slot</span>
              <span className="font-bold text-teal-800 text-sm">
                {formatTime12h(appointment.starts_at)} – {formatTime12h(appointment.ends_at)}
              </span>
            </div>
          </div>

          {appointment.patient_note && (
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
              <span className="font-semibold text-slate-700 block mb-0.5">Your Note:</span>
              <p className="text-slate-600">{appointment.patient_note}</p>
            </div>
          )}

          {/* Quick Support Actions */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href={`https://wa.me/${clinicSettings.whatsapp_number}?text=${encodeURIComponent(
                `Hello Just Smile Dental Clinic! I would like to inquire about my appointment ${appointment.booking_reference} on ${appointment.appointment_date} at ${appointment.starts_at}.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contact Clinic on WhatsApp</span>
            </a>

            <a
              href={`tel:${clinicSettings.phone.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-slate-800 text-xs font-semibold transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-teal-700" />
              <span>Call Clinic</span>
            </a>

            {appointment.status !== 'cancelled' && (
              <button
                type="button"
                onClick={() => setCancelReason(cancelReason ? '' : 'Need to cancel')}
                className="text-xs text-rose-700 hover:underline font-medium cursor-pointer ml-auto"
              >
                Request Cancellation
              </button>
            )}
          </div>

          {/* Cancellation Form */}
          {cancelReason && appointment.status !== 'cancelled' && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-3">
              <h4 className="font-bold text-rose-900">Cancel Appointment Request</h4>
              <p className="text-rose-700">
                Are you sure you want to cancel this booking? If you only need to reschedule, you can chat with reception on WhatsApp.
              </p>
              <input
                type="text"
                placeholder="Reason for cancellation (optional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-rose-300 text-xs bg-white text-slate-900 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleCancelAppointment}
                  className="px-3.5 py-1.5 rounded-md bg-rose-700 text-white font-semibold text-xs hover:bg-rose-800 cursor-pointer"
                >
                  {isCancelling ? 'Processing...' : 'Confirm Cancellation'}
                </button>
                <button
                  type="button"
                  onClick={() => setCancelReason('')}
                  className="px-3 py-1.5 rounded-md text-stone-600 hover:text-slate-900 text-xs cursor-pointer"
                >
                  Keep Appointment
                </button>
              </div>
            </div>
          )}

          {/* Direct Patient Notification Action */}
          <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-teal-900">
              <MessageSquare className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Want a copy on your mobile? Get your full {appointment.status === 'cancelled' ? 'cancellation notice' : 'appointment confirmation pass'} directly on WhatsApp.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const msg = appointment.status === 'cancelled'
                  ? generateCancellationMessage(appointment, clinicSettings)
                  : generateConfirmationMessage(appointment, clinicSettings);
                openWhatsApp(appointment.patient_phone, msg.whatsapp);
              }}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send Copy to my WhatsApp</span>
            </button>
          </div>

          {cancelSuccess && (
            <div className="p-3.5 rounded-xl bg-stone-100 text-stone-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Appointment status updated to cancelled. Your slot has been released back into the clinic booking schedule.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
