import { Service, Practitioner, ClinicHours, ClinicSettings, Appointment, PatientInquiry } from '../types';

export const INITIAL_CLINIC_SETTINGS: ClinicSettings = {
  id: 'clinic-settings-01',
  clinic_name: 'Just Smile Dental Clinic & Implant Centre',
  tagline: 'Gentle, Professional Dental Care & Modern Implants in Bengaluru',
  phone: '+91 99459 22684',
  phone_secondary: '+91 99459 22684',
  whatsapp_number: '919945922684',
  address_line: '1st Floor, No. 990, Sir M. Visvesvaraya Road, near Faith Old Age Home, above Maruti Medicals, Royal Shelters',
  locality: 'Devarachikkanahalli / BTM 4th Stage',
  city: 'Bengaluru',
  postal_code: '560076',
  maps_url: 'https://maps.app.goo.gl/RUmyw1Atifn41ELw5',
  timezone: 'Asia/Kolkata',
  booking_interval_minutes: 30,
  min_advance_hours: 2,
  max_advance_days: 30,
  cancellation_policy: 'Please inform the clinic at least 3 hours in advance if you need to reschedule or cancel your visit.',
  announcement: 'Walk-ins welcomed subject to slot availability. Advance appointment booking recommended for zero waiting time.'
};

export const INITIAL_SERVICES: Service[] = [
  {
    id: 'srv-consultation',
    name: 'Comprehensive Oral Examination & Consultation',
    category: 'consultation',
    description: 'Detailed intra-oral assessment, digital screening, discussion of oral health condition, and customized treatment planning with clear explanations.',
    duration_minutes: 30,
    price_display: '₹300',
    price_amount: 300,
    is_active: true,
    popular: true
  },
  {
    id: 'srv-cleaning',
    name: 'Teeth Cleaning, Scaling & Polishing',
    category: 'preventive',
    description: 'Ultrasonic scaling to gently remove hardened plaque, tartar buildup, and superficial stains. Prevents gum disease and freshens breath.',
    duration_minutes: 45,
    price_display: '₹1,200',
    price_amount: 1200,
    is_active: true,
    popular: true
  },
  {
    id: 'srv-fillings',
    name: 'Tooth-Colored Composite Fillings',
    category: 'restorative',
    description: 'Aesthetic, biocompatible dental restorations to repair cavities, minor chips, and tooth wear while preserving maximum natural tooth structure.',
    duration_minutes: 45,
    price_display: 'Starting from ₹900',
    price_amount: 900,
    is_active: true,
    popular: true
  },
  {
    id: 'srv-extraction',
    name: 'Painless Tooth Extraction',
    category: 'surgery',
    description: 'Gentle, local-anesthesia-supported removal of severely damaged or non-restorable teeth with post-operative healing care.',
    duration_minutes: 45,
    price_display: 'Starting from ₹1,000',
    price_amount: 1000,
    is_active: true
  },
  {
    id: 'srv-rct',
    name: 'Single & Multi-Sitting Root Canal Treatment (RCT)',
    category: 'endodontic',
    description: 'Precision endodontic therapy using rotary instruments to remove deep infection, relieve severe toothache, and save your natural tooth.',
    duration_minutes: 60,
    price_display: 'Starting from ₹3,500',
    price_amount: 3500,
    is_active: true,
    popular: true
  },
  {
    id: 'srv-crowns',
    name: 'Ceramic Crowns & Fixed Dental Bridges',
    category: 'prosthodontic',
    description: 'Custom-shaded zirconia and ceramic crowns to protect root-canal treated teeth or replace missing teeth with natural bite stability.',
    duration_minutes: 60,
    price_display: 'Starting from ₹4,500',
    price_amount: 4500,
    is_active: true
  },
  {
    id: 'srv-dentures',
    name: 'Complete & Removable Partial Dentures',
    category: 'prosthodontic',
    description: 'Custom-fit prosthetics for seniors and adults with missing teeth to restore natural chewing function and facial profile support.',
    duration_minutes: 45,
    price_display: 'Contact clinic for details',
    price_amount: 0,
    is_active: true
  },
  {
    id: 'srv-implants',
    name: 'Dental Implants & Implant Consultation',
    category: 'implant',
    description: 'Permanent titanium implant fixtures to replace single or multiple missing teeth with natural-feeling tooth roots and crowns.',
    duration_minutes: 60,
    price_display: 'Contact clinic for 3D scan & plan',
    price_amount: 0,
    is_active: true,
    popular: true
  },
  {
    id: 'srv-braces',
    name: 'Braces & Clear Aligners Consultation',
    category: 'orthodontic',
    description: 'Evaluation for malocclusion, irregular teeth spacing, bite alignment, and modern aesthetic invisible aligner options.',
    duration_minutes: 45,
    price_display: '₹500 consultation',
    price_amount: 500,
    is_active: true
  },
  {
    id: 'srv-surgery',
    name: 'Wisdom Tooth & Specialist Oral Surgery Consultation',
    category: 'surgery',
    description: 'Specialist consultation for impacted third molars (wisdom teeth), minor cyst enucleation, and pre-prosthetic surgeries.',
    duration_minutes: 45,
    price_display: '₹500 consultation',
    price_amount: 500,
    is_active: true
  }
];

export const INITIAL_PRACTITIONERS: Practitioner[] = [
  {
    id: 'dr-lead',
    display_name: 'Lead Dental Surgeon & Implantologist',
    qualifications: 'BDS, Certified in Oral Implantology',
    role: 'Chief Dental Officer',
    bio: 'Experienced clinical dental surgeon with over a decade of dedication to gentle, minimally invasive general dentistry, precision root canals, and modern implant restorations.',
    is_active: true,
    specialties: ['General Dentistry', 'Dental Implants', 'Root Canal Therapy', 'Crowns & Bridges']
  },
  {
    id: 'dr-ortho',
    display_name: 'Consultant Orthodontist',
    qualifications: 'MDS (Orthodontics & Dentofacial Orthopedics)',
    role: 'Visiting Specialist',
    bio: 'Visiting orthodontist specializing in teeth alignment, modern ceramic braces, and digital clear aligner treatment for teens and adults.',
    is_active: true,
    specialties: ['Braces', 'Clear Aligners', 'Teeth Alignment']
  }
];

export const INITIAL_CLINIC_HOURS: ClinicHours[] = [
  { day_of_week: 0, day_name: 'Sunday', is_open: true, opening_time: '10:00', closing_time: '14:00', lunch_start: undefined, lunch_end: undefined },
  { day_of_week: 1, day_name: 'Monday', is_open: true, opening_time: '10:00', closing_time: '21:00', lunch_start: '14:00', lunch_end: '15:00' },
  { day_of_week: 2, day_name: 'Tuesday', is_open: true, opening_time: '10:00', closing_time: '21:00', lunch_start: '14:00', lunch_end: '15:00' },
  { day_of_week: 3, day_name: 'Wednesday', is_open: true, opening_time: '10:00', closing_time: '21:00', lunch_start: '14:00', lunch_end: '15:00' },
  { day_of_week: 4, day_name: 'Thursday', is_open: true, opening_time: '10:00', closing_time: '21:00', lunch_start: '14:00', lunch_end: '15:00' },
  { day_of_week: 5, day_name: 'Friday', is_open: true, opening_time: '10:00', closing_time: '21:00', lunch_start: '14:00', lunch_end: '15:00' },
  { day_of_week: 6, day_name: 'Saturday', is_open: true, opening_time: '10:00', closing_time: '21:00', lunch_start: '14:00', lunch_end: '15:00' }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-demo-01',
    booking_reference: 'JS-2026-9481',
    patient_name: 'Rajesh Sharma',
    patient_phone: '+91 98450 12345',
    patient_email: 'rajesh.s@example.com',
    service_id: 'srv-consultation',
    service_name: 'Comprehensive Oral Examination & Consultation',
    practitioner_id: 'dr-lead',
    practitioner_name: 'Lead Dental Surgeon & Implantologist',
    appointment_date: new Date().toISOString().split('T')[0],
    starts_at: '11:00',
    ends_at: '11:30',
    status: 'confirmed',
    is_first_time: false,
    patient_note: 'Routine checkup and slight tooth sensitivity on lower left molar',
    internal_admin_note: 'Patient confirmed over phone. Ready for examination chair 1.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'apt-demo-02',
    booking_reference: 'JS-2026-5219',
    patient_name: 'Ananya Rao',
    patient_phone: '+91 99801 77412',
    patient_email: 'ananya.rao@example.com',
    service_id: 'srv-cleaning',
    service_name: 'Teeth Cleaning, Scaling & Polishing',
    practitioner_id: 'dr-lead',
    practitioner_name: 'Lead Dental Surgeon & Implantologist',
    appointment_date: new Date().toISOString().split('T')[0],
    starts_at: '16:30',
    ends_at: '17:15',
    status: 'pending',
    is_first_time: true,
    patient_note: 'First dental cleaning in 2 years, gentle scaling requested',
    internal_admin_note: '',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString()
  }
];

export const INITIAL_INQUIRIES: PatientInquiry[] = [
  {
    id: 'inq-sample-01',
    patient_name: 'Anand Murthy',
    patient_phone: '+91 99459 22684',
    message: 'Hello, I want to inquire about single tooth implant procedure duration and cost estimation. Can you call me back?',
    status: 'new',
    created_at: new Date(Date.now() - 14400000).toISOString(),
    updated_at: new Date(Date.now() - 14400000).toISOString()
  }
];
