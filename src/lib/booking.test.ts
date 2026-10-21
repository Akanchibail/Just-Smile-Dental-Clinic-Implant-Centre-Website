import {
  validateIndianPhone,
  generateBookingReference,
  timeToMinutes,
  minutesToTime,
  intervalsOverlap,
  calculateAvailableSlots,
  getGroupedClinicHours,
  getHeaderHoursSummary
} from './timeUtils';
import { ClinicHours, Appointment, ClinicSettings, Service } from '../types';
import {
  getLocalSettings,
  saveLocalSettings,
  getLocalServices,
  saveLocalServices
} from './storage';
import {
  fetchClinicSettings,
  updateClinicSettings,
  fetchServices,
  saveService
} from './api';

function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  console.log('--- Running Booking & Scheduling Tests ---');

  // Test 1: Indian Phone Validation
  const validPhone1 = validateIndianPhone('+91 99459 22684');
  assert(validPhone1.valid && validPhone1.normalized === '+91 99459 22684', 'Validate +91 formatted phone');

  const validPhone2 = validateIndianPhone('9845012345');
  assert(validPhone2.valid && validPhone2.normalized === '+91 98450 12345', 'Validate raw 10-digit mobile');

  const invalidPhone1 = validateIndianPhone('1234567890');
  assert(!invalidPhone1.valid, 'Reject phone starting with invalid digit (1)');

  const invalidPhone2 = validateIndianPhone('9845');
  assert(!invalidPhone2.valid, 'Reject too short phone');

  // Test 2: Booking Reference Format
  const ref = generateBookingReference();
  const currentYear = new Date().getFullYear();
  assert(ref.startsWith(`JS-${currentYear}-`) && ref.length === 12, `Generate booking reference format: ${ref}`);

  // Test 3: Time Conversions
  assert(timeToMinutes('10:30') === 630, 'Convert 10:30 to 630 minutes');
  assert(minutesToTime(630) === '10:30', 'Convert 630 minutes to 10:30');

  // Test 4: Overlap Logic
  // A: 10:00 - 11:00 (600 - 660), B: 10:30 - 11:30 (630 - 690) -> Overlap!
  assert(intervalsOverlap(600, 660, 630, 690) === true, 'Detect overlapping time intervals');
  // Adjacent slots: 10:00 - 10:30 (600 - 630) and 10:30 - 11:00 (630 - 660) -> No overlap!
  assert(intervalsOverlap(600, 630, 630, 660) === false, 'Allow adjacent back-to-back intervals');

  // Test 5: Slot Calculation with Lunch Break & Existing Appointment
  const mockHours: ClinicHours = {
    day_of_week: 1,
    day_name: 'Monday',
    is_open: true,
    opening_time: '10:00',
    closing_time: '12:00', // 2 hours window: 10:00, 10:30, 11:00, 11:30
    lunch_start: undefined,
    lunch_end: undefined
  };

  const mockExisting: Appointment[] = [
    {
      id: 'apt-test-1',
      booking_reference: 'JS-2026-TEST',
      patient_name: 'Test Patient',
      patient_phone: '+91 99999 99999',
      service_id: 'srv-test',
      appointment_date: '2026-12-01',
      starts_at: '10:30',
      ends_at: '11:00',
      status: 'confirmed',
      is_first_time: false,
      created_at: '',
      updated_at: ''
    }
  ];

  const slots = calculateAvailableSlots({
    dateStr: '2026-12-01', // Future date
    serviceDuration: 30,
    clinicHours: mockHours,
    existingAppointments: mockExisting,
    intervalMinutes: 30,
    minAdvanceHours: 0
  });

  assert(slots.length === 4, `Generated 4 time slots (got ${slots.length})`);
  const slot1030 = slots.find(s => s.time24 === '10:30');
  const slot1000 = slots.find(s => s.time24 === '10:00');
  assert(slot1030 !== undefined && !slot1030.is_available, '10:30 slot marked unavailable due to active confirmed appointment');
  assert(slot1000 !== undefined && slot1000.is_available, '10:00 slot remains available');

  // Test 6: Verify Cancelling Appointment Makes Slot Available Again
  const cancelledExisting: Appointment[] = [
    {
      ...mockExisting[0],
      status: 'cancelled' // Cancelled appointment
    }
  ];

  const slotsAfterCancellation = calculateAvailableSlots({
    dateStr: '2026-12-01',
    serviceDuration: 30,
    clinicHours: mockHours,
    existingAppointments: cancelledExisting,
    intervalMinutes: 30,
    minAdvanceHours: 0
  });

  const slot1030AfterCancel = slotsAfterCancellation.find(s => s.time24 === '10:30');
  assert(
    slot1030AfterCancel !== undefined && slot1030AfterCancel.is_available === true,
    '10:30 slot becomes AVAILABLE BACK on website once appointment is cancelled'
  );

  // Test 7: Verify Pending Appointment Blocks Slot, But Cancelled Does Not
  const pendingExisting: Appointment[] = [
    {
      ...mockExisting[0],
      status: 'pending'
    }
  ];
  const slotsWithPending = calculateAvailableSlots({
    dateStr: '2026-12-01',
    serviceDuration: 30,
    clinicHours: mockHours,
    existingAppointments: pendingExisting,
    intervalMinutes: 30,
    minAdvanceHours: 0
  });
  const slot1030Pending = slotsWithPending.find(s => s.time24 === '10:30');
  assert(slot1030Pending !== undefined && !slot1030Pending.is_available, 'Pending appointment reserves slot until cancelled');

  // Test 8: Lunch Break 2:00 PM to 3:00 PM (14:00 to 15:00)
  // 1:30 PM must be OPEN; only 2:00 PM and 2:30 PM must be scratched off for lunch
  const lunchHoursMon: ClinicHours = {
    day_of_week: 1,
    day_name: 'Monday',
    is_open: true,
    opening_time: '10:00',
    closing_time: '21:00',
    lunch_start: '14:00',
    lunch_end: '15:00'
  };

  const lunchSlots = calculateAvailableSlots({
    dateStr: '2026-12-01',
    serviceDuration: 45, // Even with 45-min service
    clinicHours: lunchHoursMon,
    existingAppointments: [],
    intervalMinutes: 30,
    minAdvanceHours: 0
  });

  const slot130 = lunchSlots.find(s => s.time24 === '13:30');
  const slot200 = lunchSlots.find(s => s.time24 === '14:00');
  const slot230 = lunchSlots.find(s => s.time24 === '14:30');
  const slot300 = lunchSlots.find(s => s.time24 === '15:00');

  assert(slot130 !== undefined && slot130.is_available === true, '1:30 PM slot is AVAILABLE and NOT scratched off');
  assert(slot200 !== undefined && slot200.is_available === false && slot200.reason === 'Clinic lunch break', '2:00 PM is scratched off for Clinic lunch break');
  assert(slot230 !== undefined && slot230.is_available === false && slot230.reason === 'Clinic lunch break', '2:30 PM is scratched off for Clinic lunch break');
  assert(slot300 !== undefined && slot300.is_available === true, '3:00 PM slot is AVAILABLE after lunch ends');

  // Test 9: Future Admin Changes to Lunch Hours dynamically reflect in booking
  // Admin changes lunch break to 1:00 PM - 2:00 PM (13:00 to 14:00)
  const modifiedLunchHours: ClinicHours = {
    ...lunchHoursMon,
    lunch_start: '13:00',
    lunch_end: '14:00'
  };

  const modifiedSlots = calculateAvailableSlots({
    dateStr: '2026-12-01',
    serviceDuration: 30,
    clinicHours: modifiedLunchHours,
    existingAppointments: [],
    intervalMinutes: 30,
    minAdvanceHours: 0
  });

  const modSlot100 = modifiedSlots.find(s => s.time24 === '13:00');
  const modSlot130 = modifiedSlots.find(s => s.time24 === '13:30');
  const modSlot200 = modifiedSlots.find(s => s.time24 === '14:00');
  const modSlot230 = modifiedSlots.find(s => s.time24 === '14:30');

  assert(modSlot100 !== undefined && modSlot100.is_available === false && modSlot100.reason === 'Clinic lunch break', 'When lunch is 1-2 PM, 1:00 PM is scratched off');
  assert(modSlot130 !== undefined && modSlot130.is_available === false && modSlot130.reason === 'Clinic lunch break', 'When lunch is 1-2 PM, 1:30 PM is scratched off');
  assert(modSlot200 !== undefined && modSlot200.is_available === true, 'When lunch is 1-2 PM, 2:00 PM becomes AVAILABLE');
  assert(modSlot230 !== undefined && modSlot230.is_available === true, 'When lunch is 1-2 PM, 2:30 PM is AVAILABLE');

  // Test 10: Monday Lunch specifically changed from 3:00 PM to 4:00 PM (15:00 to 16:00)
  const mondayLunch3to4: ClinicHours = {
    day_of_week: 1,
    day_name: 'Monday',
    is_open: true,
    opening_time: '10:00',
    closing_time: '21:00',
    lunch_start: '15:00',
    lunch_end: '16:00'
  };

  const mondaySlots = calculateAvailableSlots({
    dateStr: '2026-12-07', // Monday
    serviceDuration: 30,
    clinicHours: mondayLunch3to4,
    existingAppointments: [],
    intervalMinutes: 30,
    minAdvanceHours: 0
  });

  const monSlot130 = mondaySlots.find(s => s.time24 === '13:30');
  const monSlot200 = mondaySlots.find(s => s.time24 === '14:00');
  const monSlot230 = mondaySlots.find(s => s.time24 === '14:30');
  const monSlot300 = mondaySlots.find(s => s.time24 === '15:00');
  const monSlot330 = mondaySlots.find(s => s.time24 === '15:30');
  const monSlot400 = mondaySlots.find(s => s.time24 === '16:00');

  assert(monSlot130 !== undefined && monSlot130.is_available === true, 'Monday: 1:30 PM is AVAILABLE');
  assert(monSlot200 !== undefined && monSlot200.is_available === true, 'Monday: 2:00 PM is AVAILABLE when lunch moved to 3-4');
  assert(monSlot230 !== undefined && monSlot230.is_available === true, 'Monday: 2:30 PM is AVAILABLE when lunch moved to 3-4');
  assert(monSlot300 !== undefined && monSlot300.is_available === false && monSlot300.reason === 'Clinic lunch break', 'Monday: 3:00 PM is SCRATCHED OFF for lunch break');
  assert(monSlot330 !== undefined && monSlot330.is_available === false && monSlot330.reason === 'Clinic lunch break', 'Monday: 3:30 PM is SCRATCHED OFF for lunch break');
  assert(monSlot400 !== undefined && monSlot400.is_available === true, 'Monday: 4:00 PM is AVAILABLE after lunch ends');

  // Test 11: Footer / Header grouping with Monday differing from Tue-Sat
  const fullWeekHours: ClinicHours[] = [
    { day_of_week: 0, day_name: 'Sunday', is_open: true, opening_time: '10:00', closing_time: '14:00', lunch_start: undefined, lunch_end: undefined },
    mondayLunch3to4,
    { day_of_week: 2, day_name: 'Tuesday', is_open: true, opening_time: '10:00', closing_time: '21:00', lunch_start: '14:00', lunch_end: '15:00' },
    { day_of_week: 3, day_name: 'Wednesday', is_open: true, opening_time: '10:00', closing_time: '21:00', lunch_start: '14:00', lunch_end: '15:00' },
    { day_of_week: 4, day_name: 'Thursday', is_open: true, opening_time: '10:00', closing_time: '21:00', lunch_start: '14:00', lunch_end: '15:00' },
    { day_of_week: 5, day_name: 'Friday', is_open: true, opening_time: '10:00', closing_time: '21:00', lunch_start: '14:00', lunch_end: '15:00' },
    { day_of_week: 6, day_name: 'Saturday', is_open: true, opening_time: '10:00', closing_time: '21:00', lunch_start: '14:00', lunch_end: '15:00' }
  ];

  const grouped = getGroupedClinicHours(fullWeekHours);
  assert(grouped.length === 3, 'Grouped hours splits Monday, Tuesday–Saturday, and Sunday');
  assert(grouped[0].daysLabel === 'Monday' && grouped[0].lunchBreak === '3:00 PM – 4:00 PM', 'Group 1 is Monday with 3-4 PM lunch');
  assert(grouped[1].daysLabel === 'Tuesday – Saturday' && grouped[1].lunchBreak === '2:00 PM – 3:00 PM', 'Group 2 is Tuesday–Saturday with 2-3 PM lunch');
  assert(grouped[2].daysLabel === 'Sunday' && grouped[2].lunchBreak === undefined, 'Group 3 is Sunday with no lunch break');

  const headerSummary = getHeaderHoursSummary(fullWeekHours);
  assert(headerSummary.includes('3:00 PM – 4:00 PM') || headerSummary.includes('Monday'), 'Header summary reflects Monday schedule change');

  // Test 12: Slot Interval Changes (15 mins vs 30 mins vs 60 mins)
  const sundayHours: ClinicHours = {
    day_of_week: 0,
    day_name: 'Sunday',
    is_open: true,
    opening_time: '10:00',
    closing_time: '12:00', // 2 hours
    lunch_start: undefined,
    lunch_end: undefined
  };

  const slotsInterval15 = calculateAvailableSlots({
    dateStr: '2026-12-06',
    serviceDuration: 15,
    clinicHours: sundayHours,
    existingAppointments: [],
    intervalMinutes: 15,
    minAdvanceHours: 0
  });
  // 10:00, 10:15, 10:30, 10:45, 11:00, 11:15, 11:30, 11:45 = 8 slots
  assert(slotsInterval15.length === 8, '15-min interval generates 8 slots in 2-hour window');
  assert(slotsInterval15[1].time24 === '10:15', 'Second slot is 10:15 for 15-min interval');

  const slotsInterval60 = calculateAvailableSlots({
    dateStr: '2026-12-06',
    serviceDuration: 30,
    clinicHours: sundayHours,
    existingAppointments: [],
    intervalMinutes: 60,
    minAdvanceHours: 0
  });
  // 10:00, 11:00 = 2 slots
  assert(slotsInterval60.length === 2, '60-min interval generates 2 slots in 2-hour window');
  assert(slotsInterval60[0].time24 === '10:00' && slotsInterval60[1].time24 === '11:00', 'Slots are 10:00 and 11:00 for 60-min interval');

  // Test 13: Min Advance Notice Hours for Today
  const todayStr = new Date().toISOString().split('T')[0];
  const slotsTodayMinAdvance = calculateAvailableSlots({
    dateStr: todayStr,
    serviceDuration: 30,
    clinicHours: {
      day_of_week: 1,
      day_name: 'Monday',
      is_open: true,
      opening_time: '08:00',
      closing_time: '22:00',
      lunch_start: undefined,
      lunch_end: undefined
    },
    existingAppointments: [],
    intervalMinutes: 30,
    minAdvanceHours: 4
  });
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  const pastOrNearSlots = slotsTodayMinAdvance.filter(s => timeToMinutes(s.time24) < nowMins + 4 * 60);
  assert(
    pastOrNearSlots.every(s => !s.is_available && s.reason?.includes('advance notice required')),
    'Slots within 4 hours advance notice are disabled for today'
  );

  // Test 14: Clinic Settings Persistence (Address, Phone, etc.)
  const customSettings: ClinicSettings = {
    ...getLocalSettings(),
    clinic_name: 'Just Smile Dental & Implant Super Centre',
    phone: '+91 80 4123 9999',
    address_line: 'Suite 401, Apex Towers, 100ft Road',
    locality: 'Koramangala 4th Block',
    city: 'Bengaluru',
    postal_code: '560034',
    booking_interval_minutes: 45,
    min_advance_hours: 3,
    max_advance_days: 14
  };

  saveLocalSettings(customSettings);
  const fetchedSettings = getLocalSettings();
  assert(fetchedSettings.phone === '+91 80 4123 9999', 'Updated phone is saved and retrieved');
  assert(fetchedSettings.address_line === 'Suite 401, Apex Towers, 100ft Road', 'Updated address is saved and retrieved');
  assert(fetchedSettings.locality === 'Koramangala 4th Block', 'Updated locality is saved');
  assert(fetchedSettings.booking_interval_minutes === 45, 'Updated booking interval is saved');
  assert(fetchedSettings.max_advance_days === 14, 'Updated max advance days is saved');

  // Test 15: Services Editing Persistence (Price, Description, Name)
  const sampleService: Service = {
    id: 'srv-consultation',
    name: 'Specialist Intra-Oral Examination & Digital OPG',
    category: 'consultation',
    description: 'Updated comprehensive diagnosis with 3D intraoral scanner imaging.',
    duration_minutes: 45,
    price_display: '₹500 consultation',
    price_amount: 500,
    is_active: true
  };

  saveService(sampleService);
  const updatedServices = getLocalServices();
  const foundUpdated = updatedServices.find(s => s.id === 'srv-consultation');
  assert(foundUpdated !== undefined, 'Service was updated in local services');
  assert(foundUpdated?.name === 'Specialist Intra-Oral Examination & Digital OPG', 'Service name was updated');
  assert(foundUpdated?.price_display === '₹500 consultation', 'Service price display was updated');
  assert(Boolean(foundUpdated?.description.includes('3D intraoral scanner')), 'Service description was updated');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
