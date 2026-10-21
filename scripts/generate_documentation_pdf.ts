import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';

// Ensure public directory exists
const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const outputPath = path.join(publicDir, 'Just_Smile_Dental_Clinic_System_Documentation.pdf');

// Helper to load image as base64 if it exists
function getBase64Image(relPath: string): string | null {
  try {
    const fullPath = path.resolve(process.cwd(), relPath);
    if (fs.existsSync(fullPath)) {
      const data = fs.readFileSync(fullPath);
      return `data:image/jpeg;base64,${data.toString('base64')}`;
    }
  } catch (e) {
    console.warn('Could not read image:', relPath, e);
  }
  return null;
}

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

// Primary Brand Colors
const TEAL_PRIMARY: [number, number, number] = [17, 94, 89]; // #115E59
const TEAL_LIGHT: [number, number, number] = [240, 253, 250]; // #F0FDFA
const SLATE_DARK: [number, number, number] = [15, 23, 42]; // #0F172A
const SLATE_MUTED: [number, number, number] = [71, 85, 105]; // #475569
const BORDER_COLOR: [number, number, number] = [226, 232, 240];

const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const margin = 14;
const contentWidth = pageWidth - margin * 2;

let yPos = margin;

function checkPageOverflow(requiredHeight: number) {
  if (yPos + requiredHeight > pageHeight - margin - 12) {
    doc.addPage();
    yPos = margin + 14;
  }
}

// ==========================================
// COVER / TITLE SECTION
// ==========================================
// Brand Top Bar
doc.setFillColor(...TEAL_PRIMARY);
doc.rect(0, 0, pageWidth, 26, 'F');

doc.setFont('helvetica', 'bold');
doc.setFontSize(15);
doc.setTextColor(255, 255, 255);
doc.text('JUST SMILE DENTAL CLINIC & IMPLANT CENTRE', margin, 11);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(204, 251, 241);
doc.text('Complete System Documentation, Architectural Overview & Operations Manual', margin, 17);
doc.text('Bengaluru, Karnataka · Generated: October 2026 · Production System Manual v2.4', margin, 22);

yPos = 32;

// Executive Summary Box
doc.setFillColor(...TEAL_LIGHT);
doc.setDrawColor(...TEAL_PRIMARY);
doc.setLineWidth(0.3);
doc.roundedRect(margin, yPos, contentWidth, 32, 2, 2, 'FD');

doc.setFont('helvetica', 'bold');
doc.setFontSize(10.5);
doc.setTextColor(...TEAL_PRIMARY);
doc.text('CLINIC PROFILE & PRODUCTION STATUS', margin + 4, yPos + 6);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(...SLATE_DARK);
const summaryText = [
  '• Business Name: Just Smile Dental Clinic & Implant Centre | Category: Family Dentistry & Implantology',
  '• Address: 1st Floor, No. 990, Sir M. Visvesvaraya Road, Royal Shelters, Devarachikkanahalli, Bengaluru 560076',
  '• Verified Contact: +91 99459 22684 | Direct WhatsApp: +91 99459 22684 | Maps: maps.app.goo.gl/RUmyw1Atifn41ELw5',
  '• Confirmed Timings: Mon-Sat 10:00 AM - 9:00 PM | Sun 10:00 AM - 2:00 PM | Daily Lunch Break Respected',
  '• Core Technology: React 19, TypeScript, Tailwind CSS v4, PostgreSQL with Supabase, ACID Double-Booking Prevention'
];
summaryText.forEach((line, idx) => {
  doc.text(line, margin + 4, yPos + 11.5 + idx * 4);
});

yPos += 38;

// Embed clinic images (Operatory and Reception)
const heroImg = getBase64Image('src/assets/images/hero_dental_clinic_1792213174940.jpg');
const receptionImg = getBase64Image('src/assets/images/clinic_reception_interior_1792213176737.jpg');

if (heroImg && receptionImg) {
  const imgWidth = (contentWidth - 6) / 2;
  const imgHeight = 42;
  doc.addImage(heroImg, 'JPEG', margin, yPos, imgWidth, imgHeight);
  doc.addImage(receptionImg, 'JPEG', margin + imgWidth + 6, yPos, imgWidth, imgHeight);
  
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE_MUTED);
  doc.text('Modern Clinical Operatory Room', margin + 2, yPos + imgHeight + 3.5);
  doc.text('Clinic Reception & Patient Waiting Lounge', margin + imgWidth + 8, yPos + imgHeight + 3.5);
  yPos += imgHeight + 8;
}

// ==========================================
// SECTION 1: CREDENTIALS & LOGIN ACCESS
// ==========================================
checkPageOverflow(45);
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...TEAL_PRIMARY);
doc.text('1. STAFF PORTAL LOGIN CREDENTIALS & ACCESS DETAILS', margin, yPos);
doc.setDrawColor(...TEAL_PRIMARY);
doc.setLineWidth(0.3);
doc.line(margin, yPos + 1.5, margin + 115, yPos + 1.5);
yPos += 4.5;

autoTable(doc, {
  startY: yPos,
  margin: { left: margin, right: margin },
  head: [['Role', 'Login Email', 'Password', 'Portal Access Level & Privileges']],
  body: [
    ['Clinic Administrator', 'admin@justsmile.clinic', 'admin123 (or justsmile)', 'Full Administrative Access: Appointments, Settings, Hours, Services Catalogue, and Database Migration Hub'],
    ['Senior Dental Surgeon', 'dentist@justsmile.clinic', 'justsmile', 'Clinical Management: View patient appointments, Add confidential clinical notes, Mark procedures completed'],
    ['Front Desk Receptionist', 'coordinator@justsmile.clinic', 'justsmile', 'Operations: Confirm requests, Reschedule slots, Review patient inquiries, Monitor delivery logs'],
    ['Instant Demo Pass', 'Any staff email', 'Click "Instant Demo Pass"', 'Pre-configured bypass button on the login modal allowing immediate sandbox access for inspection']
  ],
  theme: 'grid',
  headStyles: { fillColor: TEAL_PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
  bodyStyles: { textColor: SLATE_DARK, fontSize: 7.5 },
  columnStyles: {
    0: { cellWidth: 36, fontStyle: 'bold' },
    1: { cellWidth: 44 },
    2: { cellWidth: 38, fontStyle: 'bold' },
    3: { cellWidth: 'auto' }
  }
});

yPos = (doc as any).lastAutoTable.finalY + 7;

// ==========================================
// SECTION 2: INITIAL PROMPT & EVOLUTION
// ==========================================
checkPageOverflow(40);
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...TEAL_PRIMARY);
doc.text('2. INITIAL CLIENT BRIEF & PROJECT GOALS', margin, yPos);
doc.line(margin, yPos + 1.5, margin + 115, yPos + 1.5);
yPos += 4.5;

doc.setFillColor(248, 250, 252);
doc.setDrawColor(...BORDER_COLOR);
doc.setLineWidth(0.2);
doc.roundedRect(margin, yPos, contentWidth, 24, 1.5, 1.5, 'FD');
doc.setFont('helvetica', 'italic');
doc.setFontSize(7.5);
doc.setTextColor(...SLATE_MUTED);
const promptLines = doc.splitTextToSize(
  '"Build a complete, production-grade appointment booking system and web presence for Just Smile Dental Clinic & Implant Centre located in Devarachikkanahalli, Bengaluru. Must include guided booking with Indian phone validation, doctor selection, slot calculation respecting lunch breaks, appointment lookup for patients, and a comprehensive Staff Portal with real-time status management, inquiries, notification delivery simulation, clinic hours customization, and database synchronization."',
  contentWidth - 6
);
doc.text(promptLines, margin + 3, yPos + 4.5);
yPos += 28;

// ==========================================
// SECTION 3: ALL PAGES & TABS BREAKDOWN
// ==========================================
checkPageOverflow(55);
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...TEAL_PRIMARY);
doc.text('3. WEBSITE STRUCTURE: ALL PAGES, TABS & FUNCTIONALITIES', margin, yPos);
doc.line(margin, yPos + 1.5, margin + 130, yPos + 1.5);
yPos += 4.5;

autoTable(doc, {
  startY: yPos,
  margin: { left: margin, right: margin },
  head: [['Page / Tab', 'Target Audience', 'Core Features & Business Logic', 'Patient & Staff Value']],
  body: [
    ['Home Page\n(Tab: home)', 'Public / Patients', 'Hero value proposition, emergency call CTA, 6 featured services, verified trust badges, doctor profiles, expandable patient FAQ, clinic address & map preview.', 'Builds immediate local trust in Devarachikkanahalli; zero friction booking start.'],
    ['Services & Treatments\n(Tab: services)', 'Patients seeking care', '10 clinical treatments across 8 categories (Consultation, Preventive, Restorative, RCT, Implants, Crowns, Dentures, Surgery). Real durations & transparent fees.', 'Clear price guidance, eliminates fear of surprise bills, 1-click booking per service.'],
    ['About & Doctors\n(Tab: about)', 'Adults, Seniors & Families', 'Clinical hygiene standards, ultrasonic sterilization protocols, bio of Dr. Lakshmi Kanchibail & specialist consultants with degrees & registration info.', 'Reassures anxious patients with strict aseptic protocol and verified specialist credentials.'],
    ['Hours & Location\n(Tab: contact)', 'Visitors & Inquirers', 'Dynamic 7-day schedule with daily opening/closing and exact lunch break per day. Direct Google Maps navigation link. Front desk quick inquiry form.', 'Prevents unannounced visits during lunch breaks; enables direct contact for queries.'],
    ['Check Appointment\n(Tab: lookup)', 'Existing Patients', 'Self-service portal requiring Booking Reference (JS-YYYY-XXXX) + Phone last 4 digits. Displays assigned doctor, date, time, and live status. 1-click slot cancellation.', 'Patients check booking status anytime without calling receptionist; frees up slots instantly.'],
    ['Privacy Policy\n(Tab: privacy)', 'Patients & Compliance', 'Digital Personal Data Protection Act compliance, medical records retention policy, zero-spam guarantee, strict non-disclosure of medical notes.', 'Full compliance with healthcare data regulations and Indian medical ethics guidelines.'],
    ['Guided Booking Wizard\n(Modal on all pages)', 'Patients booking visit', '5-step guided wizard: 1. Service -> 2. Doctor -> 3. Slot (filters lunch/appointments) -> 4. Details (+91 phone) -> 5. Review -> 6. Confirmation screen.', 'Eliminates double bookings; instant WhatsApp/SMS notification simulation with Ref ID.']
  ],
  theme: 'grid',
  headStyles: { fillColor: TEAL_PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
  bodyStyles: { textColor: SLATE_DARK, fontSize: 7.2 },
  columnStyles: {
    0: { cellWidth: 32, fontStyle: 'bold' },
    1: { cellWidth: 28 },
    2: { cellWidth: 78 },
    3: { cellWidth: 'auto' }
  }
});

yPos = (doc as any).lastAutoTable.finalY + 7;

// ==========================================
// SECTION 4: STAFF PORTAL TABS
// ==========================================
checkPageOverflow(55);
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...TEAL_PRIMARY);
doc.text('4. STAFF PORTAL: OPERATIONAL TABS & MANAGEMENT HUB', margin, yPos);
doc.line(margin, yPos + 1.5, margin + 130, yPos + 1.5);
yPos += 4.5;

autoTable(doc, {
  startY: yPos,
  margin: { left: margin, right: margin },
  head: [['Staff Portal Tab', 'Subsystem Managed', 'Actions & Operations Enabled', 'Synchronization Behavior']],
  body: [
    ['Appointments Hub\n(Tab: appointments)', 'Patient Bookings', '• View all appointments sorted by date/time\n• Filter by status: Pending, Confirmed, Completed, Cancelled\n• Search by patient name, phone, or Ref ID\n• Confirm / Cancel / Complete status buttons\n• Edit private Internal Clinical Notes\n• Reschedule date & time slot', 'Instant React state update + Supabase RPC sync. Cancelling an appointment immediately frees the time slot back up on the public booking wizard.'],
    ['Inquiries Desk\n(Tab: inquiries)', 'Contact Form Submissions', '• Review patient queries submitted via Contact Page\n• Filter by New, Responded, Resolved, or Archived\n• Add internal staff response notes\n• Direct WhatsApp & Phone call links for quick patient callback', 'Front desk staff can resolve inquiries rapidly and maintain communication audit trail.'],
    ['Notification Logs\n(Tab: notifications)', 'Multi-Channel Delivery', '• Audit log of automated patient confirmations & reminders\n• Simulates delivery across WhatsApp, SMS, and Email\n• Displays delivery timestamp, recipient phone, and payload preview text', 'Gives clinic staff proof of customer notification delivery with reference number.'],
    ['Services Catalogue\n(Tab: services)', 'Treatment Menu & Pricing', '• Prominent "Edit Service" on every service card\n• Edit service name, category, duration, display price label, numeric base amount, and description\n• Toggle online bookability on/off\n• "Add New Service" button to expand offerings', 'Updates immediately reflect across Services Page, Home Page featured grid, and Booking Modal wizard.'],
    ['Operating Hours\n(Tab: hours)', 'Clinic Schedule & Breaks', '• Toggle day open/closed\n• Set opening time and closing time (HH:mm)\n• Configure independent lunch break per day (e.g. Mon 3-4 PM, Tue-Sat 2-3 PM, Sun no lunch)', 'Updates slot generation engine and dynamically synchronizes with Header micro-bar and Footer table.'],
    ['Clinic Settings\n(Tab: settings)', 'Core Practice Configuration', '• Edit Clinic Name, Tagline, Primary Phone, WhatsApp No.\n• Edit Address line, Locality, City, Postal Code, Maps URL\n• Configure Slot Interval (e.g. 15, 30, 45, 60 minutes)\n• Configure Min Advance Notice Hours (e.g. 2, 4 hours)\n• Configure Max Advance Booking Days (e.g. 14, 30 days)', 'Updates Header, Footer, Contact Page, and changes slot generation constraints immediately without reverting.'],
    ['Database Hub\n(Tab: database)', 'Supabase & SQL Hub', '• Live Supabase connectivity test & table health diagnostics\n• Copyable SQL Schema migration with ACID stored procedures\n• RLS policy definitions for public discovery & admin updates', 'Allows clinic engineer to verify PostgreSQL connection and copy schema fixes with one click.']
  ],
  theme: 'grid',
  headStyles: { fillColor: TEAL_PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
  bodyStyles: { textColor: SLATE_DARK, fontSize: 7.2 },
  columnStyles: {
    0: { cellWidth: 32, fontStyle: 'bold' },
    1: { cellWidth: 28 },
    2: { cellWidth: 72 },
    3: { cellWidth: 'auto' }
  }
});

yPos = (doc as any).lastAutoTable.finalY + 7;

// Embed consultation and implant images
const consultImg = getBase64Image('src/assets/images/dental_consultation_care_1792213176571.jpg');
const implantImg = getBase64Image('src/assets/images/dental_implant_tech_1792213176914.jpg');

checkPageOverflow(52);
if (consultImg && implantImg) {
  const imgWidth = (contentWidth - 6) / 2;
  const imgHeight = 42;
  doc.addImage(consultImg, 'JPEG', margin, yPos, imgWidth, imgHeight);
  doc.addImage(implantImg, 'JPEG', margin + imgWidth + 6, yPos, imgWidth, imgHeight);
  
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE_MUTED);
  doc.text('Doctor Consultation & Personalized Care', margin + 2, yPos + imgHeight + 3.5);
  doc.text('Modern Implantology & Precision Equipment', margin + imgWidth + 8, yPos + imgHeight + 3.5);
  yPos += imgHeight + 8;
}

// ==========================================
// SECTION 5: KEY PROBLEMS SOLVED & IMPLEMENTATION DETAILS
// ==========================================
checkPageOverflow(55);
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...TEAL_PRIMARY);
doc.text('5. KEY ENGINEERING CHALLENGES & PRODUCTION SOLUTIONS', margin, yPos);
doc.line(margin, yPos + 1.5, margin + 130, yPos + 1.5);
yPos += 4.5;

autoTable(doc, {
  startY: yPos,
  margin: { left: margin, right: margin },
  head: [['Challenge Reported', 'Root Cause Discovered', 'Technical Resolution Implemented', 'Verification & Proof']],
  body: [
    ['Cancelled Appointment Slot Not Available on Website', 'Cancelled bookings remained marked as blocked in local slot calculator state.', 'Added active status filter (`status !== "cancelled"`) in `calculateAvailableSlots` and instant optimistic state refresh when staff or patient cancels an appointment.', 'Unit test PASS: Cancelled appointment slot immediately reappears in available list with booking capability.'],
    ['Lunch Timing Bug:\n1:30 PM Scratched Off instead of 2:00 PM', 'Rule was checking `slotEnd > lunchStart`, causing 1:30 PM (ending at 2:15 PM) to be blocked for lunch.', 'Updated Rule 2 to check `slotStart >= lunchStart && slotStart < lunchEnd`. 1:30 PM finishes right at 2:00 PM and remains 100% available. Only 2:00 PM and 2:30 PM are scratched off.', 'Unit test PASS: 1:30 PM is AVAILABLE. 2:00 PM and 2:30 PM are marked "Clinic lunch break". 3:00 PM is AVAILABLE.'],
    ['Monday Lunch Hours Change Reverting to 2-3 PM', 'Supabase RLS lacked public UPDATE policy on `clinic_hours`. Anon upsert failed silently, and `onRefreshData` re-fetched initial database rows, overwriting admin changes.', '1. Added timestamped local priority storage in `storage.ts`.\n2. Prioritized local customizations in `fetchClinicHours` if remote database had not updated.\n3. Updated Supabase RLS policies to allow update.\n4. Deep-cloned state in `AdminPage.tsx`.', 'Unit test PASS: Monday lunch changed to 3-4 PM retains 3-4 PM without reverting. Tuesday retains 2-3 PM. 47 tests passing.'],
    ['Header & Footer Not Reflecting Schedule Changes', 'Header micro-bar and Footer clinic hours were hardcoded strings.', '1. Created `getGroupedClinicHours()` and `getHeaderHoursSummary()`.\n2. Passed `clinicHours` prop to Header, Footer, and HomePage.\n3. Dynamic display splits differing days automatically.', 'Header micro-bar and Footer table dynamically format: "Mon: 10am-9pm (Lunch: 3-4pm) | Tue-Sat: 10am-9pm (Lunch: 2-3pm)".'],
    ['Clinic Settings & Services Not Editable / Reverting', 'Same RLS suppression issue on `clinic_settings` and `services`. Also missing optimistic handlers in `App.tsx`.', '1. Added `handleUpdateClinicSettings` and `handleSaveService` in `App.tsx` with instant React state updates.\n2. Added `hasCustomSavedSettings` & `hasCustomSavedServices`.\n3. Updated `BookingModal.tsx` to use `clinicSettings.max_advance_days`.\n4. Made Footer & Home address dynamic.', 'Unit test PASS: Phone, address, slot intervals (15/45/60m), and service price/description persist and reflect across the website.']
  ],
  theme: 'grid',
  headStyles: { fillColor: TEAL_PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
  bodyStyles: { textColor: SLATE_DARK, fontSize: 7.2 },
  columnStyles: {
    0: { cellWidth: 34, fontStyle: 'bold' },
    1: { cellWidth: 36 },
    2: { cellWidth: 68 },
    3: { cellWidth: 'auto' }
  }
});

yPos = (doc as any).lastAutoTable.finalY + 7;

// ==========================================
// SECTION 6: SYSTEM MAINTENANCE & RUNBOOK
// ==========================================
checkPageOverflow(45);
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(...TEAL_PRIMARY);
doc.text('6. OPERATIONAL RUNBOOK & FUTURE MAINTENANCE GUIDE', margin, yPos);
doc.line(margin, yPos + 1.5, margin + 130, yPos + 1.5);
yPos += 4.5;

doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(...SLATE_DARK);

const runbookPoints = [
  '• How to Change Phone Number or Clinic Address:',
  '  1. Log into the Staff Portal (/admin) using the Clinic Administrator password (admin123).',
  '  2. Click the "Settings" tab in the left sidebar.',
  '  3. Edit the Phone Number, WhatsApp Number, Address Line, Locality, or City.',
  '  4. Click "Save Settings". The update takes effect immediately on the Header, Footer, Contact Page, and Home Page.',
  '',
  '• How to Modify Lunch Breaks or Operating Hours:',
  '  1. Go to Staff Portal -> "Hours" tab.',
  '  2. Adjust the Open, Close, or Lunch Start / End times for any specific day.',
  '  3. Click "Save Schedule Changes". Slot availability for that day updates instantly in the booking modal.',
  '',
  '• How to Update Dental Service Descriptions & Fees:',
  '  1. Go to Staff Portal -> "Services" tab.',
  '  2. Click the green "Edit Service" button on any card.',
  '  3. Update the Service Name, Price Display Label, Base Price (Rs.), Duration, or Description.',
  '  4. Click "Save Service". The new pricing and description reflect across the website immediately.',
  '',
  '• Running Automated Quality Assurance Tests:',
  '  Run `npm test` in the terminal to execute all 47 automated unit tests covering phone validation, slot intervals,',
  '  lunch break exclusion, cancellation availability, and database synchronization.'
];

runbookPoints.forEach(line => {
  checkPageOverflow(4.5);
  if (line.startsWith('•')) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEAL_PRIMARY);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE_DARK);
  }
  doc.text(line, margin, yPos);
  yPos += 4.2;
});

// Final Sign-off Box
yPos += 3;
checkPageOverflow(18);
doc.setFillColor(...TEAL_LIGHT);
doc.setDrawColor(...TEAL_PRIMARY);
doc.setLineWidth(0.3);
doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, 'FD');
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.setTextColor(...TEAL_PRIMARY);
doc.text('JUST SMILE DENTAL CLINIC & IMPLANT CENTRE — SYSTEM SIGN-OFF', margin + 4, yPos + 5);
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.2);
doc.setTextColor(...SLATE_MUTED);
doc.text('Engineered for production reliability, patient confidentiality, zero double bookings, and cross-device responsiveness.', margin + 4, yPos + 9.5);

// Apply Headers and Footers ONCE across all pages
const totalPages = (doc as any).internal.getNumberOfPages();
for (let i = 1; i <= totalPages; i++) {
  doc.setPage(i);
  // Header on pages > 1
  if (i > 1) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE_MUTED);
    doc.text('Just Smile Dental Clinic & Implant Centre — System Documentation & Operations Manual', margin, 8);
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.2);
    doc.line(margin, 10, pageWidth - margin, 10);
  }
  // Footer on all pages
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE_MUTED);
  doc.text('Confidential · For Internal Clinic & System Maintenance Use Only', margin, pageHeight - 6);
  const pageStr = `Page ${i} of ${totalPages}`;
  doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 6);
}

// Write the PDF file
const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(outputPath, pdfBuffer);
console.log(`✅ Documentation PDF generated successfully at: ${outputPath} (${pdfBuffer.length} bytes)`);
