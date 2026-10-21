import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Info,
  CalendarCheck
} from 'lucide-react';
import { Service, Practitioner, ClinicHours, ClinicSettings, TimeSlot, Appointment } from '../types';
import {
  calculateAvailableSlots,
  validateIndianPhone,
  formatDateReadable,
  formatTime12h
} from '../lib/timeUtils';
import { submitAppointmentBooking } from '../lib/api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  practitioners: Practitioner[];
  clinicHours: ClinicHours[];
  clinicSettings: ClinicSettings;
  existingAppointments: Appointment[];
  preselectedServiceId?: string;
  onBookingSuccess?: (appointment: Appointment) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  services,
  practitioners,
  clinicHours,
  clinicSettings,
  existingAppointments,
  preselectedServiceId,
  onBookingSuccess
}) => {
  // Wizard steps: 1: Service, 2: Doctor, 3: Date & Slot, 4: Patient Details, 5: Review & Submit, 6: Success
  const [step, setStep] = useState<number>(1);

  // Form states
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [patientEmail, setPatientEmail] = useState<string>('');
  const [isFirstTime, setIsFirstTime] = useState<boolean>(true);
  const [patientNote, setPatientNote] = useState<string>('');

  // Error & loading states
  const [phoneError, setPhoneError] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [generalError, setGeneralError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);

  // Initialize selected service if preselected or default to first
  useEffect(() => {
    if (preselectedServiceId) {
      setSelectedServiceId(preselectedServiceId);
    } else if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [preselectedServiceId, services]);

  // Set default date to tomorrow or today
  useEffect(() => {
    if (!selectedDate) {
      const today = new Date();
      // Format YYYY-MM-DD
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [selectedDate]);

  // Selected service object
  const currentService = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId) || services[0];
  }, [services, selectedServiceId]);

  // Selected practitioner object
  const currentPractitioner = useMemo(() => {
    return practitioners.find((p) => p.id === selectedPractitionerId);
  }, [practitioners, selectedPractitionerId]);

  // Day of week for selected date (0 = Sunday, 1 = Monday, ...)
  const selectedDayHours = useMemo(() => {
    if (!selectedDate) return clinicHours[1];
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay();
    return clinicHours.find((h) => h.day_of_week === dayOfWeek) || clinicHours[1];
  }, [selectedDate, clinicHours]);

  // Available slots for selected date & service
  const availableSlots = useMemo(() => {
    if (!selectedDate || !currentService || !selectedDayHours) return [];
    return calculateAvailableSlots({
      dateStr: selectedDate,
      serviceDuration: currentService.duration_minutes,
      clinicHours: selectedDayHours,
      existingAppointments,
      practitionerId: selectedPractitionerId || undefined,
      intervalMinutes: clinicSettings.booking_interval_minutes,
      minAdvanceHours: clinicSettings.min_advance_hours
    });
  }, [selectedDate, currentService, selectedDayHours, existingAppointments, selectedPractitionerId, clinicSettings]);

  // Generate date options (respecting max_advance_days from clinicSettings)
  const dateOptions = useMemo(() => {
    const dates: Array<{ dateStr: string; dayName: string; dayNum: number; monthName: string; isToday: boolean }> = [];
    const maxDays = clinicSettings?.max_advance_days && clinicSettings.max_advance_days > 0
      ? clinicSettings.max_advance_days
      : 30;
    const now = new Date();
    for (let i = 0; i < maxDays; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: i === 0
      });
    }
    return dates;
  }, [clinicSettings?.max_advance_days]);

  // Validation handlers
  const handlePhoneChange = (val: string) => {
    setPatientPhone(val);
    if (phoneError) setPhoneError('');
  };

  const handleNameChange = (val: string) => {
    setPatientName(val);
    if (nameError) setNameError('');
  };

  const handleStep4Next = () => {
    let hasError = false;
    if (!patientName.trim() || patientName.trim().length < 2) {
      setNameError('Please enter full name (at least 2 letters).');
      hasError = true;
    }

    const phoneValidation = validateIndianPhone(patientPhone);
    if (!phoneValidation.valid) {
      setPhoneError(phoneValidation.error || 'Please enter a valid Indian mobile number.');
      hasError = true;
    }

    if (!hasError) {
      setStep(5);
    }
  };

  // Submit appointment
  const handleSubmitBooking = async () => {
    setIsSubmitting(true);
    setGeneralError('');

    try {
      const res = await submitAppointmentBooking({
        serviceId: currentService.id,
        practitionerId: selectedPractitionerId || undefined,
        appointmentDate: selectedDate,
        startsAt: selectedSlot,
        durationMinutes: currentService.duration_minutes,
        patientName,
        patientPhone,
        patientEmail: patientEmail || undefined,
        isFirstTime,
        patientNote: patientNote || undefined
      });

      if (!res.success) {
        setGeneralError(res.error || 'Booking could not be completed. Please check details or choose another slot.');
        setIsSubmitting(false);
        // If slot conflict, go back to step 3
        if (res.error?.includes('slot') || res.error?.includes('booked')) {
          setStep(3);
          setSelectedSlot('');
        }
        return;
      }

      if (res.appointment) {
        setConfirmedBooking(res.appointment);
        if (onBookingSuccess) {
          onBookingSuccess(res.appointment);
        }
        setStep(6);
      }
    } catch (err: any) {
      setGeneralError(err.message || 'An unexpected error occurred while booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div>
            <span className="text-teal-300 text-xs font-semibold uppercase tracking-wider block">
              Just Smile Dental Clinic
            </span>
            <h3 className="text-lg font-bold text-white leading-tight">
              {step === 6 ? 'Appointment Request Received' : 'Book a Dental Consultation'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator (Steps 1 to 5) */}
        {step < 6 && (
          <div className="bg-stone-50 px-6 py-3 border-b border-stone-200">
            <div className="flex items-center justify-between text-xs text-stone-600">
              <span className={`font-semibold ${step >= 1 ? 'text-teal-800' : 'text-stone-400'}`}>
                1. Service
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
              <span className={`font-semibold ${step >= 2 ? 'text-teal-800' : 'text-stone-400'}`}>
                2. Doctor
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
              <span className={`font-semibold ${step >= 3 ? 'text-teal-800' : 'text-stone-400'}`}>
                3. Date & Time
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
              <span className={`font-semibold ${step >= 4 ? 'text-teal-800' : 'text-stone-400'}`}>
                4. Details
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
              <span className={`font-semibold ${step >= 5 ? 'text-teal-800' : 'text-stone-400'}`}>
                5. Review
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-stone-200 h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-teal-700 h-full transition-all duration-300 rounded-full"
                style={{ width: `${((step - 1) / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {generalError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Booking Notice</p>
                <p className="text-xs text-rose-700 mt-0.5">{generalError}</p>
              </div>
            </div>
          )}

          {/* STEP 1: SELECT SERVICE */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 1: Choose Dental Service</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Select the primary treatment or examination you wish to book.
                </p>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {services.map((service) => {
                  const isSelected = selectedServiceId === service.id;
                  return (
                    <div
                      key={service.id}
                      onClick={() => setSelectedServiceId(service.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-teal-700 bg-teal-50/50 shadow-sm'
                          : 'border-stone-200 hover:border-teal-400 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900">
                              {service.name}
                            </span>
                            {service.popular && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/70 px-1.5 py-0.5 rounded">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {service.description}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-semibold text-slate-900 block">
                            {service.price_display || 'Contact clinic'}
                          </span>
                          <span className="text-[11px] text-slate-600 flex items-center justify-end gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-600" />
                            <span>{service.duration_minutes} mins</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  disabled={!selectedServiceId}
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT DOCTOR */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 2: Choose Dental Practitioner</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Select a specific dentist or choose any available practitioner.
                </p>
              </div>

              <div className="space-y-3">
                {/* Any Available Dentist option */}
                <div
                  onClick={() => setSelectedPractitionerId('')}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedPractitionerId === ''
                      ? 'border-teal-700 bg-teal-50/50 shadow-sm'
                      : 'border-stone-200 hover:border-teal-400 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0">
                      ★
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-slate-900 block">
                        Any Available Dentist (Fastest Availability)
                      </span>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Our clinic coordinator will assign the first available qualified dental surgeon.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Specific practitioners */}
                {practitioners.map((doc) => {
                  const isSelected = selectedPractitionerId === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedPractitionerId(doc.id)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-teal-700 bg-teal-50/50 shadow-sm'
                          : 'border-stone-200 hover:border-teal-400 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-stone-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                          <User className="w-5 h-5 text-teal-700" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-slate-900">
                              {doc.display_name}
                            </span>
                            <span className="text-[11px] text-teal-800 font-medium bg-teal-50 px-2 py-0.5 rounded">
                              {doc.role}
                            </span>
                          </div>
                          <span className="text-xs text-slate-600 block mt-0.5">
                            {doc.qualifications}
                          </span>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {doc.bio}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-stone-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-stone-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <span>Select Date & Time</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DATE & SLOT */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 3: Select Date & Time</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {selectedDayHours?.is_open ? (
                    <span>
                      Hours for {selectedDayHours.day_name}: {formatTime12h(selectedDayHours.opening_time)} – {formatTime12h(selectedDayHours.closing_time)}
                      {selectedDayHours.lunch_start && selectedDayHours.lunch_end ? (
                        <span className="text-teal-900 font-semibold"> (Lunch Break: {formatTime12h(selectedDayHours.lunch_start)} – {formatTime12h(selectedDayHours.lunch_end)})</span>
                      ) : (
                        <span className="text-slate-500"> (No lunch break)</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-rose-600 font-medium">Clinic is closed on {selectedDayHours?.day_name || 'this day'}.</span>
                  )}
                </p>
              </div>

              {/* Horizontal scrollable date picker */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Select Consultation Date
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {dateOptions.map((item) => {
                    const isSelected = selectedDate === item.dateStr;
                    return (
                      <button
                        key={item.dateStr}
                        type="button"
                        onClick={() => {
                          setSelectedDate(item.dateStr);
                          setSelectedSlot('');
                        }}
                        className={`min-w-[70px] p-2.5 rounded-xl border text-center transition-all shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-teal-800 text-white border-teal-800 shadow-sm'
                            : 'bg-white border-stone-200 text-slate-700 hover:border-teal-500 hover:bg-stone-50'
                        }`}
                      >
                        <span className={`text-[11px] block uppercase ${isSelected ? 'text-teal-200' : 'text-slate-600'}`}>
                          {item.dayName}
                        </span>
                        <span className="text-base font-bold block leading-tight mt-0.5">
                          {item.dayNum}
                        </span>
                        <span className={`text-[10px] block ${isSelected ? 'text-teal-200' : 'text-slate-600'}`}>
                          {item.monthName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Available Slots Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Available Time Slots on {formatDateReadable(selectedDate)}
                  </label>
                  <span className="text-[11px] text-teal-800 font-medium">
                    {currentService?.duration_minutes} min duration
                  </span>
                </div>

                {!selectedDayHours?.is_open ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center">
                    The clinic is closed on this day. Please pick another date.
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-4 rounded-xl bg-stone-100 text-slate-600 text-xs text-center">
                    No open appointment slots remaining for this date. Please choose an alternate date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlot === slot.time24;
                      return (
                        <button
                          key={slot.time24}
                          type="button"
                          disabled={!slot.is_available}
                          onClick={() => setSelectedSlot(slot.time24)}
                          title={slot.reason || 'Available'}
                          className={`py-2 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                            isSelected
                              ? 'bg-teal-800 text-white border-teal-800 shadow-sm font-semibold'
                              : slot.is_available
                              ? 'bg-white border-stone-200 text-slate-800 hover:border-teal-500 hover:bg-teal-50 cursor-pointer'
                              : 'bg-stone-100/70 border-stone-200/50 text-stone-400 line-through cursor-not-allowed'
                          }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-stone-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-stone-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => setStep(4)}
                  className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <span>Patient Info</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PATIENT DETAILS */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 4: Patient Details</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  We use your phone number only to verify your appointment booking and share slot confirmation.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Patient Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Sumanth Kumar"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                      nameError
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-stone-300 focus:border-teal-700 focus:ring-teal-100'
                    }`}
                  />
                  {nameError && <p className="text-xs text-rose-600 mt-1">{nameError}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Mobile Number (India) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="+91 99459 22684 or 10-digit number"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                      phoneError
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-stone-300 focus:border-teal-700 focus:ring-teal-100'
                    }`}
                  />
                  {phoneError ? (
                    <p className="text-xs text-rose-600 mt-1">{phoneError}</p>
                  ) : (
                    <p className="text-[11px] text-slate-600 mt-1">
                      Our front-desk team will call or WhatsApp this number to confirm your time slot.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Email Address <span className="text-slate-600 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-slate-900 focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Patient Type
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="firstTime"
                        checked={isFirstTime}
                        onChange={() => setIsFirstTime(true)}
                        className="text-teal-700 focus:ring-teal-500"
                      />
                      <span>First-time patient</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="firstTime"
                        checked={!isFirstTime}
                        onChange={() => setIsFirstTime(false)}
                        className="text-teal-700 focus:ring-teal-500"
                      />
                      <span>Returning patient</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Symptoms or Notes for the Doctor <span className="text-slate-600 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={patientNote}
                    onChange={(e) => setPatientNote(e.target.value)}
                    placeholder="e.g. Mild sensitivity in lower tooth, need replacement crown, etc."
                    className="w-full px-3.5 py-2 rounded-lg border border-stone-300 text-sm text-slate-900 focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 border border-stone-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-stone-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleStep4Next}
                  className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <span>Review Booking</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & SUBMIT */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 5: Review Appointment Summary</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Please review the appointment details before final submission.
                </p>
              </div>

              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-stone-200">
                  <span className="text-slate-600">Selected Treatment:</span>
                  <span className="font-semibold text-slate-900 text-right">{currentService?.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-200">
                  <span className="text-slate-600">Estimated Duration:</span>
                  <span className="font-semibold text-slate-900">{currentService?.duration_minutes} minutes</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-200">
                  <span className="text-slate-600">Consultation Fee:</span>
                  <span className="font-semibold text-slate-900">{currentService?.price_display || 'Contact clinic'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-200">
                  <span className="text-slate-600">Practitioner:</span>
                  <span className="font-semibold text-slate-900">
                    {currentPractitioner?.display_name || 'Any Available Dental Surgeon'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-200">
                  <span className="text-slate-600">Date:</span>
                  <span className="font-semibold text-slate-900">{formatDateReadable(selectedDate)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-200">
                  <span className="text-slate-600">Requested Time:</span>
                  <span className="font-semibold text-teal-800 text-sm">{formatTime12h(selectedSlot)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-200">
                  <span className="text-slate-600">Patient:</span>
                  <span className="font-semibold text-slate-900">{patientName} ({isFirstTime ? 'First-time' : 'Returning'})</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600">Contact Mobile:</span>
                  <span className="font-semibold text-slate-900">{patientPhone}</span>
                </div>
                {patientNote && (
                  <div className="pt-2 text-stone-600 border-t border-stone-200">
                    <span className="font-semibold text-slate-700">Note:</span> {patientNote}
                  </div>
                )}
              </div>

              {/* Clinic Confirmation Notice */}
              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <p>
                  <strong>Initial Status: Pending Clinic Confirmation.</strong> Submitting this request reserves your slot subject to final confirmation by our clinic reception. We will contact you at {patientPhone}.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-4 py-2 border border-stone-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-stone-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitBooking}
                  className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Confirming Slot...</span>
                  ) : (
                    <>
                      <CalendarCheck className="w-4 h-4" />
                      <span>Confirm Appointment Request</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: BOOKING CONFIRMATION & LOOKUP INFO */}
          {step === 6 && confirmedBooking && (
            <div className="text-center space-y-5 py-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider block">
                  Request Successfully Recorded
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Thank You, {confirmedBooking.patient_name}!
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  Your appointment request has been securely registered in our clinic management system.
                </p>
              </div>

              {/* Reference Card */}
              <div className="bg-stone-50 rounded-xl p-5 border border-stone-200 text-left max-w-md mx-auto space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                  <span className="text-xs text-slate-600">Booking Reference</span>
                  <span className="text-sm font-bold font-mono text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                    {confirmedBooking.booking_reference}
                  </span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-slate-600">Status</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Pending Clinic Confirmation
                  </span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-slate-600">Service</span>
                  <span className="font-semibold text-slate-900">{confirmedBooking.service_name}</span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-slate-600">Date & Time</span>
                  <span className="font-semibold text-slate-900">
                    {formatDateReadable(confirmedBooking.appointment_date)} at {formatTime12h(confirmedBooking.starts_at)}
                  </span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-slate-600">Clinic Contact</span>
                  <span className="font-semibold text-slate-900">{clinicSettings.phone}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={`https://wa.me/${clinicSettings.whatsapp_number}?text=${encodeURIComponent(
                    `Hello Just Smile Dental Clinic! I have submitted an appointment request with Reference ${confirmedBooking.booking_reference} for ${confirmedBooking.service_name} on ${confirmedBooking.appointment_date} at ${confirmedBooking.starts_at}. Patient: ${confirmedBooking.patient_name}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send Confirmation via WhatsApp</span>
                </a>

                <a
                  href={`tel:${clinicSettings.phone.replace(/\s+/g, '')}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-slate-800 text-xs font-semibold transition-colors"
                >
                  <Phone className="w-4 h-4 text-teal-700" />
                  <span>Call Reception</span>
                </a>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-600 hover:text-slate-900 underline font-medium cursor-pointer"
                >
                  Done & Return to Website
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
