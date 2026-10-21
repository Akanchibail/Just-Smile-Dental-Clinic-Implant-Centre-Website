import {
  Service,
  Practitioner,
  ClinicHours,
  ClinicSettings,
  Appointment,
  AppointmentStatus,
  PatientInquiry
} from '../types';
import {
  INITIAL_CLINIC_SETTINGS,
  INITIAL_SERVICES,
  INITIAL_PRACTITIONERS,
  INITIAL_CLINIC_HOURS,
  INITIAL_APPOINTMENTS,
  INITIAL_INQUIRIES
} from './mockData';

const SETTINGS_KEY = 'just_smile_clinic_settings_v1';
const SERVICES_KEY = 'just_smile_clinic_services_v1';
const PRACTITIONERS_KEY = 'just_smile_clinic_practitioners_v1';
const HOURS_KEY = 'just_smile_clinic_hours_v1';
const APPOINTMENTS_KEY = 'just_smile_clinic_appointments_v1';
const STATUS_OVERRIDES_KEY = 'just_smile_status_overrides_v1';
const INQUIRIES_KEY = 'just_smile_clinic_inquiries_v1';

// In-memory fallback map for environments where window.localStorage is not accessible
const memoryStorage = new Map<string, string>();

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch {
    // ignore
  }
  return memoryStorage.get(key) || null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // ignore
  }
  memoryStorage.set(key, value);
}

const SETTINGS_SAVED_AT_KEY = 'just_smile_clinic_settings_saved_at_v1';
const SERVICES_SAVED_AT_KEY = 'just_smile_clinic_services_saved_at_v1';

export function getLocalSettings(): ClinicSettings {
  try {
    const data = safeGetItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : INITIAL_CLINIC_SETTINGS;
  } catch {
    return INITIAL_CLINIC_SETTINGS;
  }
}

export function saveLocalSettings(settings: ClinicSettings): void {
  try {
    safeSetItem(SETTINGS_KEY, JSON.stringify(settings));
    safeSetItem(SETTINGS_SAVED_AT_KEY, new Date().toISOString());
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function hasCustomSavedSettings(): boolean {
  try {
    return safeGetItem(SETTINGS_SAVED_AT_KEY) !== null || safeGetItem(SETTINGS_KEY) !== null;
  } catch {
    return false;
  }
}

export function getLocalServices(): Service[] {
  try {
    const data = safeGetItem(SERVICES_KEY);
    return data ? JSON.parse(data) : INITIAL_SERVICES;
  } catch {
    return INITIAL_SERVICES;
  }
}

export function saveLocalServices(services: Service[]): void {
  try {
    safeSetItem(SERVICES_KEY, JSON.stringify(services));
    safeSetItem(SERVICES_SAVED_AT_KEY, new Date().toISOString());
  } catch (e) {
    console.error('Failed to save services', e);
  }
}

export function hasCustomSavedServices(): boolean {
  try {
    return safeGetItem(SERVICES_SAVED_AT_KEY) !== null || safeGetItem(SERVICES_KEY) !== null;
  } catch {
    return false;
  }
}

export function getLocalPractitioners(): Practitioner[] {
  try {
    const data = safeGetItem(PRACTITIONERS_KEY);
    return data ? JSON.parse(data) : INITIAL_PRACTITIONERS;
  } catch {
    return INITIAL_PRACTITIONERS;
  }
}

export function saveLocalPractitioners(practitioners: Practitioner[]): void {
  try {
    safeSetItem(PRACTITIONERS_KEY, JSON.stringify(practitioners));
  } catch (e) {
    console.error('Failed to save practitioners', e);
  }
}

const HOURS_SAVED_AT_KEY = 'just_smile_clinic_hours_saved_at_v1';

export function getLocalHours(): ClinicHours[] {
  try {
    const data = safeGetItem(HOURS_KEY);
    return data ? JSON.parse(data) : INITIAL_CLINIC_HOURS;
  } catch {
    return INITIAL_CLINIC_HOURS;
  }
}

export function saveLocalHours(hours: ClinicHours[]): void {
  try {
    safeSetItem(HOURS_KEY, JSON.stringify(hours));
    safeSetItem(HOURS_SAVED_AT_KEY, new Date().toISOString());
  } catch (e) {
    console.error('Failed to save clinic hours', e);
  }
}

export function hasCustomSavedHours(): boolean {
  try {
    return safeGetItem(HOURS_SAVED_AT_KEY) !== null || safeGetItem(HOURS_KEY) !== null;
  } catch {
    return false;
  }
}

export function getLocalAppointments(): Appointment[] {
  try {
    const data = safeGetItem(APPOINTMENTS_KEY);
    return data ? JSON.parse(data) : INITIAL_APPOINTMENTS;
  } catch {
    return INITIAL_APPOINTMENTS;
  }
}

export function saveLocalAppointments(appointments: Appointment[]): void {
  try {
    safeSetItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
  } catch (e) {
    console.error('Failed to save appointments', e);
  }
}

export interface StatusOverride {
  status: AppointmentStatus;
  internal_admin_note?: string;
  updated_at: string;
}

export function getStatusOverrides(): Record<string, StatusOverride> {
  try {
    const data = safeGetItem(STATUS_OVERRIDES_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveStatusOverride(idOrRef: string, status: AppointmentStatus, note?: string): void {
  try {
    const overrides = getStatusOverrides();
    overrides[idOrRef] = {
      status,
      internal_admin_note: note,
      updated_at: new Date().toISOString()
    };
    safeSetItem(STATUS_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.error('Failed to save status override', e);
  }
}

export function getLocalInquiries(): PatientInquiry[] {
  try {
    const data = safeGetItem(INQUIRIES_KEY);
    return data ? JSON.parse(data) : INITIAL_INQUIRIES;
  } catch {
    return INITIAL_INQUIRIES;
  }
}

export function saveLocalInquiries(inquiries: PatientInquiry[]): void {
  try {
    safeSetItem(INQUIRIES_KEY, JSON.stringify(inquiries));
  } catch (e) {
    console.error('Failed to save inquiries', e);
  }
}
