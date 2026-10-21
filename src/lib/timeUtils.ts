import { ClinicHours, Appointment, TimeSlot } from '../types';

/**
 * Validate phone number for India:
 * Supports +91 9845012345, 98450 12345, 09845012345, or direct 10 digits starting with 6, 7, 8, or 9.
 */
export function validateIndianPhone(phone: string): { valid: boolean; normalized: string; error?: string } {
  if (!phone || !phone.trim()) {
    return { valid: false, normalized: '', error: 'Phone number is required.' };
  }

  // Remove spaces, hyphens, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Extract core 10 digits
  let coreNumber = '';
  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    coreNumber = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    coreNumber = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    coreNumber = cleaned.slice(1);
  } else if (cleaned.length === 10) {
    coreNumber = cleaned;
  } else {
    return {
      valid: false,
      normalized: phone,
      error: 'Please enter a valid 10-digit mobile number (e.g., +91 99459 22684).'
    };
  }

  if (!/^[6-9]\d{9}$/.test(coreNumber)) {
    return {
      valid: false,
      normalized: phone,
      error: 'Mobile number must start with 6, 7, 8, or 9.'
    };
  }

  return {
    valid: true,
    normalized: `+91 ${coreNumber.slice(0, 5)} ${coreNumber.slice(5)}`
  };
}

/**
 * Generate unique human-readable booking reference: JS-YYYY-XXXX
 */
export function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `JS-${year}-${randomPart}`;
}

/**
 * Convert "HH:mm" to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Convert minutes from midnight to "HH:mm"
 */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Format "HH:mm" to 12-hour display string "10:30 AM"
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Format YYYY-MM-DD to a nice readable date string
 */
export function formatDateReadable(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Check if two time intervals overlap
 */
export function intervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

/**
 * Calculate available booking slots for a clinic day
 */
export function calculateAvailableSlots(params: {
  dateStr: string;
  serviceDuration: number;
  clinicHours: ClinicHours;
  existingAppointments: Appointment[];
  practitionerId?: string;
  intervalMinutes?: number;
  minAdvanceHours?: number;
}): TimeSlot[] {
  const {
    dateStr,
    serviceDuration,
    clinicHours,
    existingAppointments,
    practitionerId,
    intervalMinutes = 30,
    minAdvanceHours = 2
  } = params;

  if (!clinicHours.is_open) {
    return [];
  }

  const openMins = timeToMinutes(clinicHours.opening_time);
  const closeMins = timeToMinutes(clinicHours.closing_time);
  const lunchStartMins = clinicHours.lunch_start ? timeToMinutes(clinicHours.lunch_start) : null;
  const lunchEndMins = clinicHours.lunch_end ? timeToMinutes(clinicHours.lunch_end) : null;

  // Filter appointments for this date and not cancelled
  const activeBookings = existingAppointments.filter((apt) => {
    if (apt.appointment_date !== dateStr) return false;
    if (apt.status === 'cancelled') return false;
    // If practitioner is specified, only conflict with that practitioner or appointments with no practitioner assigned
    if (practitionerId && apt.practitioner_id && apt.practitioner_id !== practitionerId) {
      return false;
    }
    return true;
  });

  // Check if date is today for minimum advance hours constraint
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = dateStr === todayStr;
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const earliestAllowedMins = isToday ? currentMins + minAdvanceHours * 60 : 0;

  const slots: TimeSlot[] = [];

  for (let slotStart = openMins; slotStart + serviceDuration <= closeMins; slotStart += intervalMinutes) {
    const slotEnd = slotStart + serviceDuration;
    const time24 = minutesToTime(slotStart);
    const timeDisplay = formatTime12h(time24);

    // Rule 1: Cannot book past or too soon today
    if (isToday && slotStart < earliestAllowedMins) {
      slots.push({
        time: timeDisplay,
        time24,
        is_available: false,
        reason: 'Too close to current time (advance notice required)'
      });
      continue;
    }

    // Rule 2: Cannot be during clinic lunch break (slots starting between lunch_start and lunch_end)
    if (lunchStartMins !== null && lunchEndMins !== null) {
      if (slotStart >= lunchStartMins && slotStart < lunchEndMins) {
        slots.push({
          time: timeDisplay,
          time24,
          is_available: false,
          reason: 'Clinic lunch break'
        });
        continue;
      }
    }

    // Rule 3: Cannot overlap with active existing appointments
    let hasConflict = false;
    let conflictReason = '';

    for (const apt of activeBookings) {
      const aptStart = timeToMinutes(apt.starts_at);
      const aptEnd = timeToMinutes(apt.ends_at);

      if (intervalsOverlap(slotStart, slotEnd, aptStart, aptEnd)) {
        hasConflict = true;
        conflictReason = 'Slot already booked';
        break;
      }
    }

    if (hasConflict) {
      slots.push({
        time: timeDisplay,
        time24,
        is_available: false,
        reason: conflictReason
      });
    } else {
      slots.push({
        time: timeDisplay,
        time24,
        is_available: true
      });
    }
  }

  return slots;
}

export interface GroupedClinicHours {
  daysLabel: string;
  timeRange: string;
  lunchBreak?: string;
  isOpen: boolean;
}

/**
 * Group consecutive or matching clinic hours into human-readable day groups
 * Handles cases where Monday has a different lunch break (e.g. 3:00 PM - 4:00 PM)
 * or where all Mon-Sat are identical, and displays them cleanly for Header, Footer, and Contact page.
 */
export function getGroupedClinicHours(hours: ClinicHours[]): GroupedClinicHours[] {
  if (!hours || hours.length === 0) return [];

  // Sort days starting with Monday (1) through Saturday (6), then Sunday (0)
  const orderedDays = [...hours].sort((a, b) => {
    const orderA = a.day_of_week === 0 ? 7 : a.day_of_week;
    const orderB = b.day_of_week === 0 ? 7 : b.day_of_week;
    return orderA - orderB;
  });

  const groups: GroupedClinicHours[] = [];

  for (let i = 0; i < orderedDays.length; i++) {
    const current = orderedDays[i];
    const lunchKey = current.lunch_start && current.lunch_end
      ? `${formatTime12h(current.lunch_start)} – ${formatTime12h(current.lunch_end)}`
      : undefined;
    const timeRange = current.is_open
      ? `${formatTime12h(current.opening_time)} – ${formatTime12h(current.closing_time)}`
      : 'Closed';

    // Check if subsequent consecutive days have the exact same schedule & lunch
    let endIdx = i;
    while (
      endIdx + 1 < orderedDays.length &&
      orderedDays[endIdx + 1].is_open === current.is_open &&
      orderedDays[endIdx + 1].opening_time === current.opening_time &&
      orderedDays[endIdx + 1].closing_time === current.closing_time &&
      orderedDays[endIdx + 1].lunch_start === current.lunch_start &&
      orderedDays[endIdx + 1].lunch_end === current.lunch_end
    ) {
      endIdx++;
    }

    let daysLabel = current.day_name;
    if (endIdx > i) {
      const endDay = orderedDays[endIdx];
      daysLabel = `${current.day_name} – ${endDay.day_name}`;
      i = endIdx; // advance loop
    }

    groups.push({
      daysLabel,
      timeRange,
      lunchBreak: lunchKey,
      isOpen: current.is_open
    });
  }

  return groups;
}

/**
 * Returns a concise summary text for micro-bars (e.g. Header)
 */
export function getHeaderHoursSummary(hours: ClinicHours[]): string {
  const groups = getGroupedClinicHours(hours);
  if (groups.length === 0) return 'Mon-Sat: 10:00 AM - 9:00 PM | Sun: 10:00 AM - 2:00 PM';

  // Build schedule part
  const scheduleParts = groups.map(g => `${g.daysLabel}: ${g.timeRange}`);
  const scheduleText = scheduleParts.join(' | ');

  // Build lunch part
  const lunchDays = hours.filter(h => h.is_open && h.lunch_start && h.lunch_end);
  if (lunchDays.length === 0) {
    return scheduleText;
  }

  // Check if lunch hours are uniform across all lunch-observing days
  const uniqueLunches = Array.from(new Set(lunchDays.map(h => `${h.lunch_start}-${h.lunch_end}`)));
  if (uniqueLunches.length === 1) {
    const sample = lunchDays[0];
    const lunchStr = `${formatTime12h(sample.lunch_start!)} – ${formatTime12h(sample.lunch_end!)}`;
    return `${scheduleText} · Lunch Break: ${lunchStr}`;
  } else {
    // Distinct lunch hours (e.g. Monday 3-4 PM vs Tue-Sat 2-3 PM)
    const lunchDescriptions = groups
      .filter(g => g.lunchBreak)
      .map(g => `${g.daysLabel.replace(' – ', '–')}: ${g.lunchBreak}`);
    return `${scheduleText} · Lunch: ${lunchDescriptions.join(', ')}`;
  }
}
