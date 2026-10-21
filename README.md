# Just Smile Dental Clinic & Implant Centre — Appointment Booking System

A production-minded, responsive dental clinic web application and appointment booking system built for **Just Smile Dental Clinic & Implant Centre**, located in Devarachikkanahalli / BTM 4th Stage, Bengaluru, Karnataka, India.

---

## 1. Business Information & Verified Details

- **Business Name**: Just Smile Dental Clinic & Implant Centre
- **Category**: General Dentistry, Family Dental Care, Root Canal Therapy, and Dental Implants
- **Address**: 1st Floor, No. 990, Sir M. Visvesvaraya Road, near Faith Old Age Home, above Maruti Medicals, Royal Shelters, Devarachikkanahalli / BTM 4th Stage, Bengaluru, Karnataka 560076
- **Phone**: `+91 99459 22684`
- **WhatsApp Support**: `+91 99459 22684`
- **Google Maps Location**: [https://maps.app.goo.gl/RUmyw1Atifn41ELw5](https://maps.app.goo.gl/RUmyw1Atifn41ELw5)
- **Confirmed Operating Hours**:
  - Monday – Saturday: `10:00 AM – 9:00 PM` (Lunch break: `2:00 PM – 3:00 PM`)
  - Sunday: `10:00 AM – 2:00 PM`

---

## 2. Key Features

1. **Guided 5-Step Mobile-Friendly Booking Flow**:
   - **Step 1: Service Selection**: Select from 10 clinical services with estimated duration and starting consultation fees.
   - **Step 2: Dentist Selection**: "Any Available Dentist" for fastest availability or specific dental surgeon.
   - **Step 3: Real-Time Slot Generation**: Computes open time slots considering clinic working hours, lunch breaks, advance notice window, and existing bookings.
   - **Step 4: Patient Details**: Form with Indian phone validation (`+91` 10-digit format starting with 6-9), first-time/returning status, and symptoms note.
   - **Step 5: Review & Submission**: Summary review with initial status marked as **Pending Clinic Confirmation**.
   - **Step 6: Confirmation Screen**: Unique reference ID (`JS-2026-XXXX`), WhatsApp confirmation click-to-chat, and clinic call options.

2. **Database-Level Double Booking Prevention**:
   - Stored procedure `book_appointment_slot()` in PostgreSQL uses `SELECT ... FOR UPDATE` row locks and exclusion checks in a single ACID transaction to guarantee that concurrent users cannot book conflicting slots.
   - Immediate feedback and fallback to select another slot if a collision occurs.

3. **Patient Appointment Lookup & Status Verification**:
   - Secure verification requiring both **Booking Reference** and **Phone Number (last 4 digits)**.
   - View scheduled date, time, assigned doctor, and clinic status.
   - Request cancellation or reschedule via WhatsApp.

4. **Staff Admin Operations Portal (`/admin`)**:
   - Staff authentication with role verification (Admin, Dentist, Receptionist).
   - KPI metrics: Today's visits, Pending approvals, Confirmed, Completed, Cancelled.
   - Search by reference, patient name, or phone number.
   - Filter by date, status, and service.
   - Actions: Confirm request, Complete visit, Cancel, and add Internal Admin Notes (hidden from patients).
   - Dynamic service editor (prices, durations, descriptions).
   - Clinic hours and settings editor (phone, address, lunch breaks, slot intervals).
   - Live Supabase connection diagnostic panel.

5. **Design System & Aesthetics**:
   - Deep teal (`#115E59` / `#0F766E`) and obsidian slate palette with clean off-white background.
   - Typography: Plus Jakarta Sans for body prose, Outfit for headings.
   - Strict 3-zone header contract, zero decorative fake stats or pulsing dots.
   - High-fidelity visual assets for modern clinical operatory, consultation care, and reception.
   - Fully responsive for mobile, tablet, and desktop.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend / Database**: Supabase (PostgreSQL 15+), Row Level Security (RLS)
- **Time Handling**: Asia/Kolkata (IST, UTC+05:30)
- **Local Fallback**: Persistent client-side storage engine ensuring full interactivity even before Supabase API keys are supplied.

---

## 4. Supabase Setup & Database Migration

### Step 1: Create a Supabase Project
1. Create a new project at [https://supabase.com](https://supabase.com).
2. Choose **ap-south-1 (Mumbai)** or your preferred region.

### Step 2: Run Database Migration
Open the **SQL Editor** in your Supabase dashboard and execute the SQL file located at:
```bash
supabase/migrations/20261017000000_init_dental_schema.sql
```
This migration creates:
- `clinic_settings` table
- `services` table (10 dental treatments pre-seeded)
- `practitioners` table (dental surgeons pre-seeded)
- `clinic_hours` table (Monday–Sunday hours pre-seeded)
- `appointments` table (with indexes on reference, date, and phone)
- `staff_roles` table
- Row Level Security (RLS) policies allowing public service discovery while safeguarding private patient records
- `book_appointment_slot` transactional function preventing double bookings.

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase URL and public Anon key:
```env
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 5. Local Development & Testing

### Install Dependencies:
```bash
npm install
```

### Run Automated Unit Tests:
```bash
npm test
```
Tests:
- Indian phone number validation
- Booking reference generation
- Interval overlap logic
- Slot calculation respecting lunch breaks and existing bookings
- Conflict detection

### Start Development Server:
```bash
npm run dev
```
Visit `http://localhost:3000` in your browser.

### Build for Production:
```bash
npm run build
```

---

## 6. Staff Admin Credentials

- Navigate to the **Staff Portal** tab in the navigation bar or visit `/admin`.
- Enter authorized staff email (e.g. `receptionist@justsmile.clinic`) and credentials.


---

## 7. Owner Review & Verification Checklist Before Public Launch

- [ ] Confirm clinic contact phone number: `+91 99459 22684`.
- [ ] Confirm dentist qualification degrees (e.g. BDS, MDS).
- [ ] Review starting consultation fees and service descriptions via the Admin Portal.
- [ ] Connect the live Supabase project URL and anon key in production hosting environment variables.
