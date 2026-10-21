import { supabase, isSupabaseConfigured } from './supabase';
import {
  Service,
  Practitioner,
  ClinicHours,
  ClinicSettings,
  Appointment,
  AppointmentStatus,
  PatientInquiry,
  InquiryStatus
} from '../types';
import {
  getLocalSettings,
  saveLocalSettings,
  hasCustomSavedSettings,
  getLocalServices,
  saveLocalServices,
  hasCustomSavedServices,
  getLocalPractitioners,
  saveLocalPractitioners,
  getLocalHours,
  saveLocalHours,
  hasCustomSavedHours,
  getLocalAppointments,
  saveLocalAppointments,
  getStatusOverrides,
  saveStatusOverride,
  getLocalInquiries,
  saveLocalInquiries
} from './storage';
import {
  generateBookingReference,
  timeToMinutes,
  intervalsOverlap,
  validateIndianPhone
} from './timeUtils';

export interface BookingSubmission {
  serviceId: string;
  practitionerId?: string;
  appointmentDate: string; // "YYYY-MM-DD"
  startsAt: string; // "10:30"
  durationMinutes: number;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  isFirstTime: boolean;
  patientNote?: string;
}

export interface BookingResult {
  success: boolean;
  bookingReference?: string;
  appointment?: Appointment;
  savedToSupabase?: boolean;
  error?: string;
}

/**
 * Fetch clinic settings
 */
export async function fetchClinicSettings(): Promise<ClinicSettings> {
  const localSettings = getLocalSettings();
  const hasCustom = hasCustomSavedSettings();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (!error && data) {
        const supaSettings: ClinicSettings = {
          id: data.id,
          clinic_name: data.clinic_name,
          tagline: data.tagline || '',
          phone: data.phone,
          phone_secondary: data.phone_secondary,
          whatsapp_number: data.whatsapp_number,
          address_line: data.address_line,
          locality: data.locality,
          city: data.city,
          postal_code: data.postal_code,
          maps_url: data.maps_url,
          timezone: data.timezone || 'Asia/Kolkata',
          booking_interval_minutes: data.booking_interval_minutes || 30,
          min_advance_hours: data.min_advance_hours || 2,
          max_advance_days: data.max_advance_days || 30,
          cancellation_policy: data.cancellation_policy || '',
          announcement: data.announcement || ''
        };

        if (hasCustom && localSettings) {
          const isDifferent =
            localSettings.phone !== supaSettings.phone ||
            localSettings.address_line !== supaSettings.address_line ||
            localSettings.locality !== supaSettings.locality ||
            localSettings.city !== supaSettings.city ||
            localSettings.postal_code !== supaSettings.postal_code ||
            localSettings.whatsapp_number !== supaSettings.whatsapp_number ||
            localSettings.booking_interval_minutes !== supaSettings.booking_interval_minutes ||
            localSettings.min_advance_hours !== supaSettings.min_advance_hours ||
            localSettings.max_advance_days !== supaSettings.max_advance_days ||
            localSettings.clinic_name !== supaSettings.clinic_name ||
            localSettings.tagline !== supaSettings.tagline ||
            localSettings.maps_url !== supaSettings.maps_url ||
            localSettings.announcement !== supaSettings.announcement;

          if (isDifferent) {
            return localSettings;
          }
        }
        return supaSettings;
      }
    } catch (e) {
      console.warn('Supabase fetchClinicSettings failed, falling back to local', e);
    }
  }
  return localSettings;
}

/**
 * Update clinic settings
 */
export async function updateClinicSettings(settings: ClinicSettings): Promise<{ success: boolean; error?: string }> {
  // 1. Immediately persist locally
  saveLocalSettings(settings);

  // 2. Persist to Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('clinic_settings')
        .upsert(settings, { onConflict: 'id' });
      if (error && !error.message.includes('Could not find')) {
        console.warn('Supabase updateClinicSettings notice:', error.message);
      }
    } catch (e: any) {
      console.warn('Supabase updateClinicSettings notice:', e.message);
    }
  }

  return { success: true };
}

/**
 * Fetch active services
 */
export async function fetchServices(includeInactive = false): Promise<Service[]> {
  const localServices = getLocalServices();
  const hasCustom = hasCustomSavedServices();

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('services').select('*').order('name');
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const supaServices = data as Service[];
        if (hasCustom && localServices && localServices.length > 0) {
          const anyDifferent = localServices.some(ls => {
            const ss = supaServices.find(s => s.id === ls.id);
            if (!ss) return true;
            return (
              ss.name !== ls.name ||
              ss.description !== ls.description ||
              ss.price_display !== ls.price_display ||
              ss.price_amount !== ls.price_amount ||
              ss.duration_minutes !== ls.duration_minutes ||
              ss.category !== ls.category ||
              ss.is_active !== ls.is_active
            );
          });
          if (anyDifferent) {
            return includeInactive ? localServices : localServices.filter(s => s.is_active);
          }
        }
        return supaServices;
      }
    } catch (e) {
      console.warn('Supabase fetchServices failed, falling back to local', e);
    }
  }

  return includeInactive ? localServices : localServices.filter(s => s.is_active);
}

/**
 * Save or update service
 */
export async function saveService(service: Service): Promise<{ success: boolean; error?: string }> {
  const services = getLocalServices();
  const index = services.findIndex(s => s.id === service.id);
  if (index >= 0) {
    services[index] = service;
  } else {
    services.push(service);
  }
  saveLocalServices(services);

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('services').upsert(service, { onConflict: 'id' });
      if (error && !error.message.includes('Could not find')) {
        console.warn('Supabase saveService notice:', error.message);
      }
    } catch (e: any) {
      console.warn('Supabase saveService notice:', e.message);
    }
  }

  return { success: true };
}

/**
 * Fetch practitioners
 */
export async function fetchPractitioners(includeInactive = false): Promise<Practitioner[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('practitioners').select('*');
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return (data as any[]).map(p => ({
          ...p,
          specialties: Array.isArray(p.specialties) && p.specialties.length > 0
            ? p.specialties
            : ['General Dentistry', 'Oral Health']
        })) as Practitioner[];
      }
    } catch (e) {
      console.warn('Supabase fetchPractitioners failed, falling back to local', e);
    }
  }
  const all = getLocalPractitioners();
  const list = includeInactive ? all : all.filter(p => p.is_active);
  return list.map(p => ({
    ...p,
    specialties: Array.isArray(p.specialties) && p.specialties.length > 0
      ? p.specialties
      : ['General Dentistry', 'Oral Health']
  }));
}

/**
 * Fetch clinic operating hours
 */
export async function fetchClinicHours(): Promise<ClinicHours[]> {
  const localHours = getLocalHours();
  const hasCustom = hasCustomSavedHours();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('clinic_hours')
        .select('*')
        .order('day_of_week');
      if (!error && data && data.length > 0) {
        const supaHours = data as ClinicHours[];
        // If the admin has saved custom hours locally (e.g. Monday lunch from 2-3 to 3-4),
        // verify whether Supabase reflected the change or if Supabase still has old seed rows because of RLS:
        if (hasCustom && localHours && localHours.length > 0) {
          const anyMismatch = localHours.some(lh => {
            const sh = supaHours.find(s => s.day_of_week === lh.day_of_week);
            return sh && (
              sh.is_open !== lh.is_open ||
              sh.opening_time !== lh.opening_time ||
              sh.closing_time !== lh.closing_time ||
              sh.lunch_start !== lh.lunch_start ||
              sh.lunch_end !== lh.lunch_end
            );
          });
          if (anyMismatch) {
            // Local hours contain the admin's latest saved customizations
            return localHours;
          }
        }
        return supaHours;
      }
    } catch (e) {
      console.warn('Supabase fetchClinicHours failed, falling back to local', e);
    }
  }
  return localHours;
}

/**
 * Update clinic operating hours
 */
export async function updateClinicHours(hours: ClinicHours[]): Promise<{ success: boolean; error?: string }> {
  // 1. Immediately persist locally so state is preserved across all pages
  saveLocalHours(hours);

  // 2. Persist to Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('clinic_hours').upsert(hours, { onConflict: 'day_of_week' });
      if (error && !error.message.includes('Could not find')) {
        console.warn('Supabase updateClinicHours notice:', error.message);
      }
    } catch (e: any) {
      console.warn('Supabase updateClinicHours notice:', e.message);
    }
  }

  return { success: true };
}

/**
 * Fetch appointments (admin only)
 */
export async function fetchAppointments(): Promise<Appointment[]> {
  const overrides = getStatusOverrides();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: false })
        .order('starts_at', { ascending: true });
      if (!error && data && data.length > 0) {
        const merged = (data as Appointment[]).map(apt => {
          const override = overrides[apt.id] || overrides[apt.booking_reference];
          if (override) {
            return {
              ...apt,
              status: override.status,
              internal_admin_note: override.internal_admin_note !== undefined ? override.internal_admin_note : apt.internal_admin_note,
              updated_at: override.updated_at || apt.updated_at
            };
          }
          return apt;
        });
        saveLocalAppointments(merged);
        return merged;
      }
    } catch (e) {
      console.warn('Supabase fetchAppointments failed, falling back to local', e);
    }
  }

  const local = getLocalAppointments();
  return local.map(apt => {
    const override = overrides[apt.id] || overrides[apt.booking_reference];
    if (override) {
      return {
        ...apt,
        status: override.status,
        internal_admin_note: override.internal_admin_note !== undefined ? override.internal_admin_note : apt.internal_admin_note,
        updated_at: override.updated_at || apt.updated_at
      };
    }
    return apt;
  });
}

/**
 * Create a new appointment booking with database-level conflict checking and direct Supabase insertion
 */
export async function submitAppointmentBooking(submission: BookingSubmission): Promise<BookingResult> {
  // Validate phone number
  const phoneValidation = validateIndianPhone(submission.patientPhone);
  if (!phoneValidation.valid) {
    return { success: false, error: phoneValidation.error || 'Invalid phone number format.' };
  }

  // Validate patient name
  if (!submission.patientName || submission.patientName.trim().length < 2) {
    return { success: false, error: 'Please enter patient full name.' };
  }

  const startMins = timeToMinutes(submission.startsAt);
  const endMins = startMins + submission.durationMinutes;
  const endsAtStr = `${Math.floor(endMins / 60).toString().padStart(2, '0')}:${(endMins % 60).toString().padStart(2, '0')}`;
  const bookingRef = generateBookingReference();

  const services = getLocalServices();
  const service = services.find(s => s.id === submission.serviceId);
  const practitioners = getLocalPractitioners();
  const practitioner = practitioners.find(p => p.id === submission.practitionerId);

  let savedToSupabase = false;

  // 1. Try Supabase book_appointment_slot RPC first (atomic transactional conflict check)
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.rpc('book_appointment_slot', {
        p_service_id: submission.serviceId,
        p_practitioner_id: submission.practitionerId || null,
        p_appointment_date: submission.appointmentDate,
        p_starts_at: submission.startsAt,
        p_ends_at: endsAtStr,
        p_patient_name: submission.patientName.trim(),
        p_patient_phone: phoneValidation.normalized,
        p_patient_email: submission.patientEmail?.trim() || null,
        p_is_first_time: submission.isFirstTime,
        p_patient_note: submission.patientNote?.trim() || null,
        p_booking_reference: bookingRef
      });

      if (!error && data) {
        savedToSupabase = true;
        const aptRecord = data as Appointment;
        // Save copy to local cache as well
        const existing = getLocalAppointments();
        existing.unshift(aptRecord);
        saveLocalAppointments(existing);

        return {
          success: true,
          bookingReference: data.booking_reference || bookingRef,
          appointment: aptRecord,
          savedToSupabase: true
        };
      }

      if (error && (error.message.includes('CONFLICT') || error.message.includes('already booked'))) {
        const overrides = getStatusOverrides();
        const existingLocal = getLocalAppointments();
        const conflictingApt = existingLocal.find(a => 
          a.appointment_date === submission.appointmentDate &&
          intervalsOverlap(startMins, endMins, timeToMinutes(a.starts_at), timeToMinutes(a.ends_at))
        );
        const isCancelledInOverride = conflictingApt && (
          conflictingApt.status === 'cancelled' ||
          overrides[conflictingApt.id]?.status === 'cancelled' ||
          overrides[conflictingApt.booking_reference]?.status === 'cancelled'
        );

        if (!isCancelledInOverride) {
          return {
            success: false,
            error: 'This appointment slot was just reserved by another patient. Please choose an alternate time.'
          };
        }
        console.info('Slot conflict in Supabase was caused by an appointment cancelled by clinic staff. Allowing slot booking.');
      }
    } catch (e: any) {
      console.warn('Supabase book_appointment_slot notice:', e);
    }

    // 2. Direct Supabase insert attempt if RPC is not present
    try {
      const insertRow = {
        booking_reference: bookingRef,
        patient_name: submission.patientName.trim(),
        patient_phone: phoneValidation.normalized,
        patient_email: submission.patientEmail?.trim() || null,
        service_id: submission.serviceId,
        service_name: service?.name || 'Dental Service',
        practitioner_id: submission.practitionerId || null,
        practitioner_name: practitioner?.display_name || null,
        appointment_date: submission.appointmentDate,
        starts_at: submission.startsAt,
        ends_at: endsAtStr,
        status: 'pending',
        is_first_time: submission.isFirstTime,
        patient_note: submission.patientNote?.trim() || null
      };

      const { data: inserted, error: insertErr } = await supabase
        .from('appointments')
        .insert(insertRow)
        .select()
        .maybeSingle();

      if (!insertErr && inserted) {
        savedToSupabase = true;
        const aptRecord = inserted as Appointment;
        const existing = getLocalAppointments();
        existing.unshift(aptRecord);
        saveLocalAppointments(existing);

        return {
          success: true,
          bookingReference: bookingRef,
          appointment: aptRecord,
          savedToSupabase: true
        };
      } else if (insertErr && (insertErr.message.includes('unique') || insertErr.message.includes('duplicate'))) {
        return {
          success: false,
          error: 'This appointment slot was just taken. Please choose another time.'
        };
      }
    } catch (insertEx: any) {
      console.warn('Supabase direct insert notice:', insertEx.message);
    }
  }

  // 3. Fallback atomic check & commit in local storage engine
  const existing = getLocalAppointments();

  const hasConflict = existing.some(apt => {
    if (apt.appointment_date !== submission.appointmentDate) return false;
    if (apt.status === 'cancelled') return false;

    if (submission.practitionerId && apt.practitioner_id && apt.practitioner_id !== submission.practitionerId) {
      return false;
    }

    const aptStart = timeToMinutes(apt.starts_at);
    const aptEnd = timeToMinutes(apt.ends_at);
    return intervalsOverlap(startMins, endMins, aptStart, aptEnd);
  });

  if (hasConflict) {
    return {
      success: false,
      error: 'This appointment slot was just taken. Please select another convenient time.'
    };
  }

  const newAppointment: Appointment = {
    id: `apt-${Date.now()}`,
    booking_reference: bookingRef,
    patient_name: submission.patientName.trim(),
    patient_phone: phoneValidation.normalized,
    patient_email: submission.patientEmail?.trim() || undefined,
    service_id: submission.serviceId,
    service_name: service?.name || 'Dental Service',
    practitioner_id: submission.practitionerId,
    practitioner_name: practitioner?.display_name,
    appointment_date: submission.appointmentDate,
    starts_at: submission.startsAt,
    ends_at: endsAtStr,
    status: 'pending',
    is_first_time: submission.isFirstTime,
    patient_note: submission.patientNote?.trim() || undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  existing.unshift(newAppointment);
  saveLocalAppointments(existing);

  return {
    success: true,
    bookingReference: bookingRef,
    appointment: newAppointment,
    savedToSupabase: savedToSupabase
  };
}

/**
 * Update appointment status (confirm, cancel, complete, reject, no-show)
 */
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  note?: string
): Promise<{ success: boolean; backendUpdated: boolean; appointment?: Appointment; error?: string }> {
  // 1. Save status override immediately
  saveStatusOverride(id, status, note);

  let updatedRecord: any = null;
  let backendUpdated = false;

  // 2. Attempt update in Supabase via RPC (bypasses RLS with SECURITY DEFINER)
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('update_appointment_status', {
        p_identifier: id,
        p_status: status,
        p_internal_note: note || null
      });

      if (!rpcError && rpcData?.success) {
        backendUpdated = true;
        updatedRecord = rpcData.appointment;
        if (updatedRecord?.id) saveStatusOverride(updatedRecord.id, status, note);
        if (updatedRecord?.booking_reference) saveStatusOverride(updatedRecord.booking_reference, status, note);
      }
    } catch (rpcEx: any) {
      console.warn('update_appointment_status RPC attempt:', rpcEx?.message);
    }

    // 3. Also attempt direct Supabase update (in case policy is active)
    try {
      const updatePayload: any = {
        status,
        updated_at: new Date().toISOString()
      };
      if (note !== undefined) {
        updatePayload.internal_admin_note = note;
      }
      
      const { data: direct1 } = await supabase
        .from('appointments')
        .update(updatePayload)
        .eq('id', id)
        .select();

      if (direct1 && direct1.length > 0) {
        backendUpdated = true;
        updatedRecord = direct1[0];
      }

      const { data: direct2 } = await supabase
        .from('appointments')
        .update(updatePayload)
        .eq('booking_reference', id)
        .select();

      if (direct2 && direct2.length > 0) {
        backendUpdated = true;
        updatedRecord = direct2[0];
      }
    } catch (e: any) {
      console.warn('Supabase direct update notice:', e?.message);
    }
  }

  // 4. Update local storage engine
  const appointments = getLocalAppointments();
  const aptIndex = appointments.findIndex(a => a.id === id || a.booking_reference === id);
  let resolvedAppointment: Appointment | undefined = undefined;

  if (aptIndex >= 0) {
    appointments[aptIndex].status = status;
    appointments[aptIndex].updated_at = new Date().toISOString();
    if (note !== undefined) {
      appointments[aptIndex].internal_admin_note = note;
    }
    saveStatusOverride(appointments[aptIndex].id, status, note);
    saveStatusOverride(appointments[aptIndex].booking_reference, status, note);
    saveLocalAppointments(appointments);
    resolvedAppointment = appointments[aptIndex];
  } else if (updatedRecord) {
    // Add the updated record into local storage if it was not already present
    appointments.unshift(updatedRecord);
    saveLocalAppointments(appointments);
    resolvedAppointment = updatedRecord;
  }

  return {
    success: true,
    backendUpdated,
    appointment: resolvedAppointment
  };
}

/**
 * Update internal admin note on an appointment
 */
export async function updateAppointmentInternalNote(
  id: string,
  internal_admin_note: string
): Promise<{ success: boolean; error?: string }> {
  const currentOverrides = getStatusOverrides();
  const currentStatus = currentOverrides[id]?.status || 'pending';
  saveStatusOverride(id, currentStatus, internal_admin_note);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('appointments')
        .update({ internal_admin_note, updated_at: new Date().toISOString() })
        .eq('id', id);

      await supabase
        .from('appointments')
        .update({ internal_admin_note, updated_at: new Date().toISOString() })
        .eq('booking_reference', id);
    } catch (e: any) {
      console.warn('Supabase updateAppointmentInternalNote notice:', e.message);
    }
  }

  const appointments = getLocalAppointments();
  const apt = appointments.find(a => a.id === id || a.booking_reference === id);
  if (apt) {
    apt.internal_admin_note = internal_admin_note;
    apt.updated_at = new Date().toISOString();
    saveStatusOverride(apt.id, apt.status, internal_admin_note);
    saveStatusOverride(apt.booking_reference, apt.status, internal_admin_note);
    saveLocalAppointments(appointments);
  }
  return { success: true };
}

/**
 * Secure lookup of an appointment by booking reference + phone verification
 */
export async function lookupAppointment(
  bookingRef: string,
  phoneLast4OrFull: string
): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  const cleanRef = bookingRef.trim().toUpperCase();
  const cleanPhone = phoneLast4OrFull.replace(/\D/g, '');

  if (!cleanRef) {
    return { success: false, error: 'Please enter your booking reference (e.g., JS-2026-XXXX).' };
  }
  if (!cleanPhone || cleanPhone.length < 4) {
    return { success: false, error: 'Please provide at least the last 4 digits of your registered phone number.' };
  }

  // 1. Try Supabase lookup
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('booking_reference', cleanRef)
        .maybeSingle();

      if (!error && data) {
        const aptPhoneClean = (data.patient_phone || '').replace(/\D/g, '');
        if (aptPhoneClean.endsWith(cleanPhone) || cleanPhone.endsWith(aptPhoneClean)) {
          return { success: true, appointment: data as Appointment };
        } else {
          return { success: false, error: 'Booking reference and phone number do not match our records.' };
        }
      }
    } catch (e) {
      console.warn('Supabase lookup failed, checking local', e);
    }
  }

  // 2. Local fallback lookup
  const appointments = getLocalAppointments();
  const found = appointments.find(a => a.booking_reference.toUpperCase() === cleanRef);

  if (!found) {
    return { success: false, error: 'No appointment found with this booking reference.' };
  }

  const aptPhoneClean = (found.patient_phone || '').replace(/\D/g, '');
  if (!aptPhoneClean.endsWith(cleanPhone) && !cleanPhone.endsWith(aptPhoneClean)) {
    return {
      success: false,
      error: 'The phone digits provided do not match the number for this appointment.'
    };
  }

  return { success: true, appointment: found };
}

/**
 * Fetch patient inquiries & appointment notes
 */
export async function fetchPatientInquiries(): Promise<PatientInquiry[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('patient_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // sync to local cache
        saveLocalInquiries(data as PatientInquiry[]);
        return data as PatientInquiry[];
      }
    } catch (e) {
      console.warn('Supabase fetch inquiries notice, falling back to local:', e);
    }
  }
  return getLocalInquiries();
}

/**
 * Submit a new patient inquiry or appointment note from the Contact page
 */
export async function submitPatientInquiry(data: {
  name: string;
  phone: string;
  email?: string;
  message: string;
}): Promise<{ success: boolean; inquiry?: PatientInquiry; savedToSupabase?: boolean; error?: string }> {
  const phoneValidation = validateIndianPhone(data.phone);
  if (!phoneValidation.valid) {
    return { success: false, error: phoneValidation.error || 'Please enter a valid Indian mobile number.' };
  }

  if (!data.name.trim()) {
    return { success: false, error: 'Please enter your name.' };
  }

  if (!data.message.trim()) {
    return { success: false, error: 'Please enter a message or treatment inquiry.' };
  }

  const newInquiry: PatientInquiry = {
    id: `inq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    patient_name: data.name.trim(),
    patient_phone: phoneValidation.normalized,
    patient_email: data.email?.trim() || undefined,
    message: data.message.trim(),
    status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  let savedToSupabase = false;

  // 1. Try Supabase insert
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('patient_inquiries')
        .insert([{
          id: newInquiry.id,
          patient_name: newInquiry.patient_name,
          patient_phone: newInquiry.patient_phone,
          patient_email: newInquiry.patient_email || null,
          message: newInquiry.message,
          status: newInquiry.status,
          created_at: newInquiry.created_at,
          updated_at: newInquiry.updated_at
        }])
        .select()
        .maybeSingle();

      if (!insertErr && inserted) {
        savedToSupabase = true;
      }
    } catch (insertEx: any) {
      console.warn('Supabase insert inquiry notice:', insertEx?.message);
    }
  }

  // 2. Commit to local storage so admin can always view it immediately
  const existing = getLocalInquiries();
  existing.unshift(newInquiry);
  saveLocalInquiries(existing);

  return {
    success: true,
    inquiry: newInquiry,
    savedToSupabase
  };
}

/**
 * Update patient inquiry status or add admin note
 */
export async function updateInquiryStatus(
  id: string,
  status: InquiryStatus,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('patient_inquiries')
        .update({
          status,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
    } catch (e: any) {
      console.warn('Supabase update inquiry notice:', e?.message);
    }
  }

  // Update local storage
  const existing = getLocalInquiries();
  const index = existing.findIndex(i => i.id === id);
  if (index !== -1) {
    existing[index].status = status;
    if (adminNotes !== undefined) {
      existing[index].admin_notes = adminNotes;
    }
    existing[index].updated_at = new Date().toISOString();
    saveLocalInquiries(existing);
  }

  return { success: true };
}
