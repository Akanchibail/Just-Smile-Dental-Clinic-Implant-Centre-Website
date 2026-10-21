# Just Smile Dental Clinic & Implant Centre — Complete System Documentation & Operations Manual

**Document Version**: 2.4 (Production Release)  
**Location**: Devarachikkanahalli / BTM 4th Stage, Bengaluru, Karnataka 560076  
**Generated Date**: October 2026  
**Confidentiality**: For Internal Clinic Operations & Engineering Maintenance  
**Direct PDF Download**: Located at `/Just_Smile_Dental_Clinic_System_Documentation.pdf` (Downloadable directly via Staff Portal or Footer)

---

## 1. Clinic Profile & Verified Business Information

| Attribute | Verified Value |
| :--- | :--- |
| **Business Name** | Just Smile Dental Clinic & Implant Centre |
| **Specialties** | General Dentistry, Precision Root Canal Therapy (RCT), Dental Implants & Prosthetics |
| **Full Address** | 1st Floor, No. 990, Sir M. Visvesvaraya Road, near Faith Old Age Home, above Maruti Medicals, Royal Shelters, Devarachikkanahalli / BTM 4th Stage, Bengaluru, Karnataka 560076 |
| **Primary Telephone** | `+91 99459 22684` |
| **Direct WhatsApp Desk** | `+91 99459 22684` |
| **Google Maps Pin** | [https://maps.app.goo.gl/RUmyw1Atifn41ELw5](https://maps.app.goo.gl/RUmyw1Atifn41ELw5) |
| **Standard Operating Hours** | **Monday – Saturday**: 10:00 AM – 9:00 PM (Daily Lunch: 2:00 PM – 3:00 PM)<br>**Sunday**: 10:00 AM – 2:00 PM (No lunch break) |
| **Consultation Fee** | ₹300 (Specialist intra-oral digital screening & diagnosis) |

---

## 2. Staff Portal Login Credentials & Access Details

The clinic management portal is located at the **Staff Portal** navigation tab (`/admin`).

| Role | Authorized Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Clinic Administrator** | `admin@justsmile.clinic` | `admin123` *(or `justsmile`)* | **Full Administrative Access**: Manage Appointments, Inquiries, Notifications, Treatment Pricing, Operating Hours, Address/Phone settings, and Database Diagnostics. |
| **Senior Dental Surgeon** | `dentist@justsmile.clinic` | `justsmile` | **Clinical Operations**: View scheduled patients, review symptoms, record private Internal Clinical Notes, and mark procedures Completed. |
| **Front Desk Receptionist** | `coordinator@justsmile.clinic` | `justsmile` | **Front Desk Operations**: Confirm bookings, reschedule appointments, review patient inquiries, and monitor simulated SMS/WhatsApp delivery logs. |
| **Instant Demo Pass** | Any staff email | *Click "Instant Demo Pass"* | One-click instant login button on the login modal allowing immediate sandbox access for demonstration. |

---

## 3. Initial Client Brief & Project Evolution

### Original Prompt Received
> *"Build a complete, production-grade appointment booking system and web presence for Just Smile Dental Clinic & Implant Centre located in Devarachikkanahalli, Bengaluru. Must include guided booking with Indian phone validation, doctor selection, slot calculation respecting lunch breaks, appointment lookup for patients, and a comprehensive Staff Portal with real-time status management, inquiries, notification delivery simulation, clinic hours customization, and database synchronization."*

### Key Requirements Delivered
1. **Zero Double-Bookings**: PostgreSQL ACID stored procedure `book_appointment_slot()` with row locking (`SELECT ... FOR UPDATE`).
2. **Indian Phone Validation**: Accepts `+91 98450 12345`, `09845012345`, or direct 10-digit mobile starting with 6, 7, 8, or 9.
3. **Reference Identification**: Generates unique codes formatted as `JS-2026-XXXX`.
4. **Resilient Local & Cloud Persistence**: Hybrid architecture ensuring full interactivity with local timestamped priority fallback so changes never revert even if Supabase RLS is enforcing unauthenticated restrictions.

---

## 4. Website Pages & Component Architecture

### 1. Home Page (`currentTab: 'home'`)
- **Hero Value Proposition**: Direct focus on gentle, anxiety-free dental care and modern dental implants for adults, seniors, and families.
- **Top Micro-Bar**: Displays dynamic clinic hours summary, emergency direct dial, and neighborhood location.
- **Featured Treatments Grid**: 6 prominent services with real durations and prices.
- **Sterilization & Doctor Highlights**: Profiles of Dr. Lakshmi Kanchibail and specialist consultants.
- **Expandable Patient FAQ**: Answers on root canals, appointment prerequisites, implant permanence, and consultation charges.
- **Working Schedule & Location Preview**: Dynamic operating hours and Google Maps route button.

### 2. Treatments & Services (`currentTab: 'services'`)
- **10 Core Dental Services**:
  1. *Comprehensive Oral Examination & Consultation* (30m, ₹300)
  2. *Teeth Cleaning, Scaling & Polishing* (45m, ₹1,200)
  3. *Tooth-Colored Composite Fillings* (45m, starting ₹900)
  4. *Painless Tooth Extraction* (45m, starting ₹1,000)
  5. *Root Canal Treatment (RCT)* (60m, starting ₹3,500)
  6. *Ceramic Crowns & Fixed Bridges* (60m, starting ₹4,500)
  7. *Complete & Partial Dentures* (45m, custom quote)
  8. *Dental Implants & Consultation* (60m, 3D scan & plan)
  9. *Orthodontic Aligners & Braces* (45m, custom quote)
  10. *Teeth Whitening & Smile Makeover* (60m, starting ₹6,000)
- **1-Click Booking**: Every service card includes a "Book Treatment" button that preselects the service in the booking wizard.

### 3. About & Doctors (`currentTab: 'about'`)
- **Clinical Hygiene Standards**: 4-stage ultrasonic cleaning, autoclave sterilization, and hospital-grade operatory disinfection.
- **Doctor Profiles**: Displays Dr. Lakshmi Kanchibail (BDS, PGD Endodontics) and specialist visiting consultants in Implantology and Orthodontics.

### 4. Hours & Location (`currentTab: 'contact'`)
- **Interactive Weekly Schedule**: Displays all 7 days with opening, closing, and specific daily lunch breaks.
- **Google Maps Navigation**: 1-click external navigation link to the exact clinic coordinates.
- **Front Desk Inquiry Form**: Patients can submit non-booking queries or pre-treatment inquiries directly to the clinic front desk.

### 5. Check Appointment Status (`currentTab: 'lookup'`)
- **Secure Dual-Key Verification**: Requires both **Booking Reference** and **Patient Mobile Number (last 4 digits)** to prevent unauthorized lookup.
- **Live Status Display**: Shows current clinic status (Pending Approval, Confirmed, Completed, or Cancelled).
- **Self-Service Cancellation**: Patients can cancel their appointment with one click; the system immediately releases the slot back to the public booking calendar.

### 6. Guided 5-Step Booking Modal (`<BookingModal />`)
- **Step 1: Service Selection**: Choose from active treatments.
- **Step 2: Doctor Preference**: "Any Available Dentist" (fastest availability) or specific specialist.
- **Step 3: Date & Slot Generator**: Dynamically computes open 30-minute intervals while respecting clinic opening/closing, lunch breaks, advance notice window, and booked appointments.
- **Step 4: Patient Details**: Indian mobile verification (`+91`), first-time vs returning patient toggle, and symptom notes.
- **Step 5: Review & Submit**: Final confirmation before registering the appointment as Pending.
- **Step 6: Confirmation Screen**: Unique reference ID (`JS-2026-XXXX`), simulated SMS/WhatsApp delivery, and add-to-calendar / clinic call actions.

---

## 5. Staff Portal Operational Tabs (`/admin`)

### Tab 1: Appointments Hub (`activeTab: 'appointments'`)
- **Filter Bar**: View All, Pending Approval, Confirmed, Completed, or Cancelled.
- **Search Engine**: Real-time filtering by Patient Name, Phone number, or Booking Reference.
- **Status Progression**:
  - `Confirm`: Marks request confirmed and triggers simulated WhatsApp confirmation.
  - `Cancel`: Marks booking cancelled; **immediately releases the time slot back onto the live booking calendar**.
  - `Complete`: Marks visit complete for clinic revenue records.
  - `Reschedule`: Allows staff to assign an alternate date and time.
- **Internal Clinical Notes**: Staff can attach private notes (e.g. medical history, allergy alerts) that remain hidden from public patient lookups.

### Tab 2: Inquiries Desk (`activeTab: 'inquiries'`)
- Review patient messages submitted via the Contact Page.
- Update inquiry status (`new`, `responded`, `resolved`, `archived`).
- Record coordinator notes and initiate 1-click WhatsApp callbacks.

### Tab 3: Notification Delivery Logs (`activeTab: 'notifications'`)
- Comprehensive audit trail of simulated automated notifications sent via WhatsApp, SMS, and Email.
- Displays delivery timestamp, recipient phone, message type, and full message preview text.

### Tab 4: Services Catalogue (`activeTab: 'services'`)
- Prominent **"Edit Service"** button on each service card.
- Live modal to update **Service Name**, **Category**, **Duration**, **Price Display Label**, **Base Price (Rs.)**, and **Description**.
- Toggle active/inactive state to control whether a treatment is bookable online.
- "Add New Service" button to expand the clinic's treatment offerings.

### Tab 5: Operating Hours & Lunch Break Manager (`activeTab: 'hours'`)
- Configure operating hours per day independently.
- Set opening time and closing time (`HH:mm`).
- **Flexible Per-Day Lunch Breaks**: Set custom lunch breaks for specific days (e.g. Monday 3:00 PM – 4:00 PM while Tue–Sat remain 2:00 PM – 3:00 PM, and Sunday has no break).
- Changes dynamically propagate to Header micro-bar, Footer schedule, and slot generator.

### Tab 6: Clinic Settings (`activeTab: 'settings'`)
- Direct editing of Clinic Name, Tagline, Phone Number, WhatsApp Number, Address Line, Locality, City, Postal Code, and Google Maps URL.
- **Booking Rules Engine**:
  - `Slot Interval`: Adjust between 15, 30, 45, or 60 minutes.
  - `Min Advance Notice`: Enforce 1, 2, 3, or 4 hours minimum advance booking on the current day.
  - `Max Advance Booking`: Set calendar window to 7, 14, 21, 30, or 60 days.
  - `Announcement Banner`: Broadcast clinic closure or holiday alerts.

### Tab 7: Database & SQL Migration Hub (`activeTab: 'database'`)
- Test live connection to Supabase project (`giunuzobmndmluhtblur`).
- 1-Click Copy SQL Migration script with table definitions, RLS security rules, and transactional ACID double-booking prevention procedures.

---

## 6. Key Engineering Solutions & Bug Fixes Resolved

| Problem / Bug Reported | Root Cause | Engineering Solution Implemented | Test Verification |
| :--- | :--- | :--- | :--- |
| **Cancelled slot not available on website** | Slot generator was checking all historical bookings without excluding cancelled ones. | Added `apt.status !== 'cancelled'` filter in `calculateAvailableSlots` and instant optimistic state refresh in `App.tsx`. | **PASS**: Cancelled slot immediately becomes available and re-bookable. |
| **1:30 PM scratched off instead of 2:00 PM for lunch** | Overlap check evaluated `slotEnd > lunchStart`, causing 1:30 PM to conflict with a 2:00 PM lunch start. | Refactored Rule 2 in `timeUtils.ts` to check `slotStart >= lunchStart && slotStart < lunchEnd`. 1:30 PM finishes at 2:00 PM and remains open. | **PASS**: 1:30 PM is available. Only 2:00 PM and 2:30 PM are scratched off. |
| **Monday lunch change (3-4 PM) reverting to 2-3 PM** | Supabase Row-Level Security lacked unauthenticated UPDATE policy on `clinic_hours`. Anon upsert was blocked silently, and `onRefreshData` re-fetched initial rows. | 1. Implemented timestamped local priority caching in `storage.ts`.<br>2. Prioritized local customizations in `fetchClinicHours`.<br>3. Added public update policy in SQL migration.<br>4. Deep-cloned state in `AdminPage.tsx`. | **PASS**: Monday lunch changed to 3-4 PM persists across page reloads and refreshes. |
| **Header & Footer not reflecting schedule changes** | Header top bar and Footer hours table contained static hardcoded strings. | Created `getGroupedClinicHours()` and `getHeaderHoursSummary()` in `timeUtils.ts` and passed `clinicHours` prop to Header and Footer. | **PASS**: Header and Footer dynamically display distinct lunch breaks (e.g. Mon 3-4 PM vs Tue-Sat 2-3 PM). |
| **Clinic settings & services not editable / reverting** | Same RLS rejection issue on `clinic_settings` and `services`, and missing optimistic handlers in `App.tsx`. | 1. Added `handleUpdateClinicSettings` and `handleSaveService` in `App.tsx`.<br>2. Added `hasCustomSavedSettings` & `hasCustomSavedServices`.<br>3. Made `dateOptions` in `BookingModal.tsx` respect `clinicSettings.max_advance_days`.<br>4. Replaced hardcoded address in Footer with dynamic `clinicSettings`. | **PASS**: Phone, address, slot intervals (15/45/60m), and service price/description persist and reflect across the website. |

---

## 7. Automated Quality Assurance & Runbook

### Running Automated Test Suite
Execute the comprehensive test suite in your terminal:
```bash
npm test
```
**Test Coverage (47 Tests Passing)**:
- Indian mobile phone validation (`+91` format, 10 digits starting with 6-9)
- Reference code formatting (`JS-YYYY-XXXX`)
- Slot interval calculation (15 min, 30 min, 60 min intervals)
- Advance notice window blocking for same-day bookings
- Lunch break exclusion boundary precision (1:30 PM open vs 2:00 PM blocked)
- Flexible per-day lunch hours (Monday 3-4 PM vs Tue-Sat 2-3 PM)
- Slot availability release upon appointment cancellation
- Clinic settings persistence (Address, Locality, City, Phone)
- Dental services catalogue editing (Name, Price display, Base numeric amount, Description)
- Schedule grouping logic for Header and Footer

---

## 8. Summary of PDF Generation Script
To re-generate the high-resolution documentation PDF at any time:
```bash
npx tsx scripts/generate_documentation_pdf.ts
```
The resulting PDF file is saved at:
`/public/Just_Smile_Dental_Clinic_System_Documentation.pdf`
and can be downloaded directly from the live web application.
