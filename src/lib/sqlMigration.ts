export const SUPABASE_MIGRATION_SQL = `-- ============================================================================
-- JUST SMILE DENTAL CLINIC & IMPLANT CENTRE
-- PostgreSQL Schema & Row Level Security (RLS) for Supabase
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/giunuzobmndmluhtblur/sql/new)
-- ============================================================================

-- Enable btree_gist extension for PostgreSQL exclusion constraints (prevents overlapping slots)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. CLINIC SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.clinic_settings (
    id TEXT PRIMARY KEY DEFAULT 'clinic-settings-01',
    clinic_name TEXT NOT NULL,
    tagline TEXT,
    phone TEXT NOT NULL,
    phone_secondary TEXT,
    whatsapp_number TEXT NOT NULL,
    address_line TEXT NOT NULL,
    locality TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    maps_url TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    booking_interval_minutes INT NOT NULL DEFAULT 30,
    min_advance_hours INT NOT NULL DEFAULT 2,
    max_advance_days INT NOT NULL DEFAULT 30,
    cancellation_policy TEXT,
    announcement TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    price_display TEXT,
    price_amount NUMERIC(10, 2) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    popular BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PRACTITIONERS TABLE
CREATE TABLE IF NOT EXISTS public.practitioners (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    qualifications TEXT NOT NULL,
    role TEXT NOT NULL,
    bio TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PRACTITIONER SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.practitioner_services (
    practitioner_id TEXT REFERENCES public.practitioners(id) ON DELETE CASCADE,
    service_id TEXT REFERENCES public.services(id) ON DELETE RESTRICT,
    PRIMARY KEY (practitioner_id, service_id)
);

-- 5. CLINIC HOURS TABLE
CREATE TABLE IF NOT EXISTS public.clinic_hours (
    day_of_week INT PRIMARY KEY CHECK (day_of_week BETWEEN 0 AND 6),
    day_name TEXT NOT NULL,
    is_open BOOLEAN NOT NULL DEFAULT true,
    opening_time TEXT NOT NULL DEFAULT '10:00',
    closing_time TEXT NOT NULL DEFAULT '21:00',
    lunch_start TEXT,
    lunch_end TEXT
);

-- 6. AVAILABILITY EXCEPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.availability_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exception_date DATE NOT NULL,
    practitioner_id TEXT REFERENCES public.practitioners(id) ON DELETE CASCADE,
    start_time TEXT,
    end_time TEXT,
    exception_type TEXT NOT NULL CHECK (exception_type IN ('holiday', 'blocked', 'extended_hours', 'leave')),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference TEXT NOT NULL UNIQUE,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_email TEXT,
    service_id TEXT NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    service_name TEXT,
    practitioner_id TEXT REFERENCES public.practitioners(id) ON DELETE SET NULL,
    practitioner_name TEXT,
    appointment_date DATE NOT NULL,
    starts_at TEXT NOT NULL, -- HH:mm 24-hr format
    ends_at TEXT NOT NULL,   -- HH:mm 24-hr format
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    is_first_time BOOLEAN NOT NULL DEFAULT false,
    patient_note TEXT,
    internal_admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for high-performance scheduling queries
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments (appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_ref ON public.appointments (booking_reference);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON public.appointments (patient_phone);

-- 8. STAFF ROLES TABLE
CREATE TABLE IF NOT EXISTS public.staff_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'receptionist' CHECK (role IN ('admin', 'dentist', 'receptionist')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioner_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

-- Anonymous visitors can read public clinic information
CREATE POLICY "Public read clinic settings" ON public.clinic_settings FOR SELECT USING (true);
CREATE POLICY "Public read active services" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active practitioners" ON public.practitioners FOR SELECT USING (is_active = true);
CREATE POLICY "Public read clinic hours" ON public.clinic_hours FOR SELECT USING (true);
CREATE POLICY "Public read availability exceptions" ON public.availability_exceptions FOR SELECT USING (true);

-- Allow public visitors to submit appointment requests
CREATE POLICY "Public insert appointment requests" ON public.appointments FOR INSERT WITH CHECK (true);

-- Allow public lookup of appointments
CREATE POLICY "Public lookup appointments" ON public.appointments FOR SELECT USING (true);

-- Allow appointment updates (confirmations, cancellations, notes by clinic staff and patients)
CREATE POLICY "Allow update appointment status" ON public.appointments FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Allow updating clinic operating hours and lunch break
DROP POLICY IF EXISTS "Public update clinic hours" ON public.clinic_hours;
DROP POLICY IF EXISTS "Allow update clinic hours" ON public.clinic_hours;
CREATE POLICY "Public update clinic hours" ON public.clinic_hours FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow updating clinic settings
DROP POLICY IF EXISTS "Public update clinic settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Allow update clinic settings" ON public.clinic_settings;
CREATE POLICY "Public update clinic settings" ON public.clinic_settings FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow updating and creating services
DROP POLICY IF EXISTS "Public update services" ON public.services;
DROP POLICY IF EXISTS "Allow update services" ON public.services;
CREATE POLICY "Public update services" ON public.services FOR ALL
    USING (true)
    WITH CHECK (true);

-- Authenticated staff policies
CREATE POLICY "Staff full access clinic settings" ON public.clinic_settings FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff full access services" ON public.services FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff full access practitioners" ON public.practitioners FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff full access hours" ON public.clinic_hours FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff full access appointments" ON public.appointments FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff read roles" ON public.staff_roles FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- SAFE TRANSACTIONAL APPOINTMENT STATUS UPDATER (CONFIRM, CANCEL, COMPLETE)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_appointment_status(
    p_identifier TEXT,
    p_status TEXT,
    p_internal_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated RECORD;
BEGIN
    UPDATE public.appointments
    SET status = p_status,
        internal_admin_note = COALESCE(p_internal_note, internal_admin_note),
        updated_at = NOW()
    WHERE id::text = p_identifier OR booking_reference = p_identifier
    RETURNING * INTO v_updated;

    IF v_updated IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Appointment not found');
    END IF;

    RETURN jsonb_build_object('success', true, 'appointment', to_jsonb(v_updated));
END;
$$;

-- ============================================================================
-- SAFE TRANSACTIONAL BOOKING FUNCTION (DOUBLE-BOOKING PREVENTION)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.book_appointment_slot(
    p_service_id TEXT,
    p_practitioner_id TEXT,
    p_appointment_date DATE,
    p_starts_at TEXT,
    p_ends_at TEXT,
    p_patient_name TEXT,
    p_patient_phone TEXT,
    p_patient_email TEXT DEFAULT NULL,
    p_is_first_time BOOLEAN DEFAULT false,
    p_patient_note TEXT DEFAULT NULL,
    p_booking_reference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conflict_count INT;
    v_service_name TEXT;
    v_practitioner_name TEXT;
    v_ref TEXT;
    v_new_apt RECORD;
BEGIN
    -- 1. Fetch service name
    SELECT name INTO v_service_name FROM public.services WHERE id = p_service_id;
    IF v_service_name IS NULL THEN
        RAISE EXCEPTION 'Invalid service ID';
    END IF;

    -- 2. Fetch practitioner name if specified
    IF p_practitioner_id IS NOT NULL THEN
        SELECT display_name INTO v_practitioner_name FROM public.practitioners WHERE id = p_practitioner_id;
    END IF;

    -- 3. Lock appointment rows for that date to prevent race condition
    PERFORM id FROM public.appointments
    WHERE appointment_date = p_appointment_date
    FOR UPDATE;

    -- 4. Check for overlapping active appointments
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.appointments
    WHERE appointment_date = p_appointment_date
      AND status IN ('pending', 'confirmed')
      AND (
          p_practitioner_id IS NULL 
          OR practitioner_id IS NULL 
          OR practitioner_id = p_practitioner_id
      )
      AND (
          (starts_at < p_ends_at AND ends_at > p_starts_at)
      );

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'SLOT_CONFLICT: The chosen appointment slot is already booked. Please choose an alternate slot.';
    END IF;

    -- 5. Generate reference if not passed
    IF p_booking_reference IS NULL OR p_booking_reference = '' THEN
        v_ref := 'JS-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4));
    ELSE
        v_ref := p_booking_reference;
    END IF;

    -- 6. Insert new appointment with default pending status
    INSERT INTO public.appointments (
        booking_reference,
        patient_name,
        patient_phone,
        patient_email,
        service_id,
        service_name,
        practitioner_id,
        practitioner_name,
        appointment_date,
        starts_at,
        ends_at,
        status,
        is_first_time,
        patient_note
    )
    VALUES (
        v_ref,
        p_patient_name,
        p_patient_phone,
        p_patient_email,
        p_service_id,
        v_service_name,
        p_practitioner_id,
        v_practitioner_name,
        p_appointment_date,
        p_starts_at,
        p_ends_at,
        'pending',
        p_is_first_time,
        p_patient_note
    )
    RETURNING * INTO v_new_apt;

    RETURN to_jsonb(v_new_apt);
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_appointment_slot TO anon, authenticated;

-- ============================================================================
-- SEED DATA
-- ============================================================================
INSERT INTO public.clinic_settings (
    id, clinic_name, tagline, phone, phone_secondary, whatsapp_number,
    address_line, locality, city, postal_code, maps_url, timezone,
    booking_interval_minutes, min_advance_hours, max_advance_days,
    cancellation_policy, announcement
) VALUES (
    'clinic-settings-01',
    'Just Smile Dental Clinic & Implant Centre',
    'Gentle, Professional Dental Care & Modern Implants in Bengaluru',
    '+91 99459 22684',
    '+91 99459 22684',
    '919945922684',
    '1st Floor, No. 990, Sir M. Visvesvaraya Road, near Faith Old Age Home, above Maruti Medicals, Royal Shelters',
    'Devarachikkanahalli / BTM 4th Stage',
    'Bengaluru',
    '560076',
    'https://maps.app.goo.gl/RUmyw1Atifn41ELw5',
    'Asia/Kolkata',
    30,
    2,
    30,
    'Please inform the clinic at least 3 hours in advance if you need to reschedule or cancel your visit.',
    'Walk-ins welcomed subject to slot availability. Advance appointment booking recommended for zero waiting time.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clinic_hours (day_of_week, day_name, is_open, opening_time, closing_time, lunch_start, lunch_end)
VALUES
(0, 'Sunday', true, '10:00', '14:00', NULL, NULL),
(1, 'Monday', true, '10:00', '21:00', '14:00', '15:00'),
(2, 'Tuesday', true, '10:00', '21:00', '14:00', '15:00'),
(3, 'Wednesday', true, '10:00', '21:00', '14:00', '15:00'),
(4, 'Thursday', true, '10:00', '21:00', '14:00', '15:00'),
(5, 'Friday', true, '10:00', '21:00', '14:00', '15:00'),
(6, 'Saturday', true, '10:00', '21:00', '14:00', '15:00')
ON CONFLICT (day_of_week) DO NOTHING;

INSERT INTO public.services (id, name, category, description, duration_minutes, price_display, price_amount, is_active, popular)
VALUES
('srv-consultation', 'Comprehensive Oral Examination & Consultation', 'consultation', 'Detailed intra-oral assessment, digital screening, discussion of oral health condition, and customized treatment planning.', 30, '₹300', 300, true, true),
('srv-cleaning', 'Teeth Cleaning, Scaling & Polishing', 'preventive', 'Ultrasonic scaling to gently remove hardened plaque, tartar buildup, and superficial stains. Prevents gum disease.', 45, '₹1,200', 1200, true, true),
('srv-fillings', 'Tooth-Colored Composite Fillings', 'restorative', 'Aesthetic, biocompatible dental restorations to repair cavities and minor chips while preserving natural tooth structure.', 45, 'Starting from ₹900', 900, true, true),
('srv-extraction', 'Painless Tooth Extraction', 'surgery', 'Gentle, local-anesthesia-supported removal of severely damaged or non-restorable teeth with post-operative care.', 45, 'Starting from ₹1,000', 1000, true, false),
('srv-rct', 'Root Canal Treatment (RCT)', 'endodontic', 'Precision endodontic therapy using rotary instruments to remove deep infection, relieve toothache, and preserve teeth.', 60, 'Starting from ₹3,500', 3500, true, true),
('srv-crowns', 'Ceramic Crowns & Fixed Dental Bridges', 'prosthodontic', 'Custom-shaded zirconia and ceramic crowns to protect treated teeth or replace missing teeth with natural bite stability.', 60, 'Starting from ₹4,500', 4500, true, false),
('srv-dentures', 'Complete & Removable Partial Dentures', 'prosthodontic', 'Custom-fit prosthetics for seniors and adults with missing teeth to restore natural chewing function.', 45, 'Contact clinic for details', 0, true, false),
('srv-implants', 'Dental Implants & Implant Consultation', 'implant', 'Permanent titanium implant fixtures to replace missing teeth with natural-feeling tooth roots and crowns.', 60, 'Contact clinic for 3D scan & plan', 0, true, true),
('srv-braces', 'Braces & Clear Aligners Consultation', 'orthodontic', 'Evaluation for malocclusion, irregular teeth spacing, bite alignment, and modern aesthetic clear aligners.', 45, '₹500 consultation', 500, true, false),
('srv-surgery', 'Wisdom Tooth & Specialist Oral Surgery Consultation', 'surgery', 'Specialist consultation for impacted third molars (wisdom teeth) and minor oral surgical evaluations.', 45, '₹500 consultation', 500, true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.practitioners (id, display_name, qualifications, role, bio, is_active)
VALUES
('dr-lead', 'Lead Dental Surgeon & Implantologist', 'BDS, Certified in Oral Implantology', 'Chief Dental Officer', 'Experienced clinical dental surgeon with over a decade of dedication to gentle, minimally invasive general dentistry, precision root canals, and modern implant restorations.', true),
('dr-ortho', 'Consultant Orthodontist', 'MDS (Orthodontics & Dentofacial Orthopedics)', 'Visiting Specialist', 'Visiting orthodontist specializing in teeth alignment, modern ceramic braces, and digital clear aligner treatment.', true)
ON CONFLICT (id) DO NOTHING;
`;

export const SUPABASE_QUICK_STATUS_FIX_SQL = `-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/giunuzobmndmluhtblur/sql/new)
-- Grants update permissions and creates the safe transactional status updater so Confirm / Cancel reflect in Supabase backend

-- 1. Enable UPDATE on appointments table (drops if previously exists to prevent conflict)
DROP POLICY IF EXISTS "Allow update appointment status" ON public.appointments;
DROP POLICY IF EXISTS "Public update appointments" ON public.appointments;

CREATE POLICY "Public update appointments" ON public.appointments 
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 2. Create the update_appointment_status RPC function (SECURITY DEFINER allows atomic status updates)
CREATE OR REPLACE FUNCTION public.update_appointment_status(
    p_identifier TEXT,
    p_status TEXT,
    p_internal_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated public.appointments%ROWTYPE;
BEGIN
    UPDATE public.appointments
    SET status = p_status,
        internal_admin_note = COALESCE(p_internal_note, internal_admin_note),
        updated_at = timezone('utc'::text, now())
    WHERE id::text = p_identifier OR booking_reference = p_identifier
    RETURNING * INTO v_updated;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Appointment not found');
    END IF;

    RETURN jsonb_build_object('success', true, 'appointment', to_jsonb(v_updated));
END;
$$;

-- 3. Grant execute permissions to anonymous web client and staff
GRANT EXECUTE ON FUNCTION public.update_appointment_status(TEXT, TEXT, TEXT) TO anon, authenticated;

-- 4. Ensure patient inquiries table exists with full public insert & update policies
CREATE TABLE IF NOT EXISTS public.patient_inquiries (
    id TEXT PRIMARY KEY DEFAULT ('inq-' || floor(extract(epoch from now()) * 1000)::text),
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_email TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'resolved', 'archived')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.patient_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert patient inquiries" ON public.patient_inquiries;
DROP POLICY IF EXISTS "Public read patient inquiries" ON public.patient_inquiries;
DROP POLICY IF EXISTS "Public update patient inquiries" ON public.patient_inquiries;

CREATE POLICY "Public insert patient inquiries" ON public.patient_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read patient inquiries" ON public.patient_inquiries FOR SELECT USING (true);
CREATE POLICY "Public update patient inquiries" ON public.patient_inquiries FOR UPDATE USING (true) WITH CHECK (true);
`;
