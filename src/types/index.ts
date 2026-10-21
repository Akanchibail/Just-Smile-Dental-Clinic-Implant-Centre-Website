export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export type InquiryStatus = 'new' | 'contacted' | 'resolved' | 'archived';

export interface PatientInquiry {
  id: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  message: string;
  status: InquiryStatus;
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Service {
  id: string;
  name: string;
  category: 'consultation' | 'preventive' | 'restorative' | 'endodontic' | 'prosthodontic' | 'implant' | 'orthodontic' | 'surgery';
  description: string;
  duration_minutes: number;
  price_display?: string; // Optional starting price verified by clinic
  price_amount?: number;
  is_active: boolean;
  popular?: boolean;
}

export interface Practitioner {
  id: string;
  display_name: string;
  qualifications: string;
  role: string;
  bio: string;
  image_url?: string;
  is_active: boolean;
  specialties: string[];
}

export interface ClinicHours {
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  day_name: string;
  is_open: boolean;
  opening_time: string; // "10:00"
  closing_time: string; // "21:00"
  lunch_start?: string; // "14:00"
  lunch_end?: string;   // "15:00"
}

export interface Appointment {
  id: string;
  booking_reference: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  service_id: string;
  service_name?: string;
  practitioner_id?: string;
  practitioner_name?: string;
  appointment_date: string; // "YYYY-MM-DD"
  starts_at: string; // ISO 8601 string or HH:mm
  ends_at: string;   // ISO 8601 string or HH:mm
  status: AppointmentStatus;
  is_first_time: boolean;
  patient_note?: string;
  internal_admin_note?: string;
  created_at: string;
  updated_at: string;
}

export interface ClinicSettings {
  id: string;
  clinic_name: string;
  tagline: string;
  phone: string;
  phone_secondary?: string;
  whatsapp_number: string;
  address_line: string;
  locality: string;
  city: string;
  postal_code: string;
  maps_url: string;
  timezone: string;
  booking_interval_minutes: number;
  min_advance_hours: number;
  max_advance_days: number;
  cancellation_policy: string;
  announcement?: string;
}

export interface TimeSlot {
  time: string; // "10:30 AM"
  time24: string; // "10:30"
  is_available: boolean;
  reason?: string;
}
