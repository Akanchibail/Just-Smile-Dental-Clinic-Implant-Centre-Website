import { Appointment, ClinicSettings, AppointmentStatus } from '../types';
import { formatDateReadable, formatTime12h } from './timeUtils';

export interface NotificationLog {
  id: string;
  appointmentId: string;
  bookingReference: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  channel: 'whatsapp' | 'sms' | 'email';
  type: 'confirmation' | 'cancellation' | 'reminder';
  status: 'sent' | 'delivered';
  sentAt: string;
  previewText: string;
}

const STORAGE_KEY = 'justsmile_notifications_log';

/**
 * Clean Indian/international phone numbers for WhatsApp and SMS protocols
 */
export function formatPhoneForMessaging(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

/**
 * Generate formatted notification messages for patient confirmation
 */
export function generateConfirmationMessage(
  appointment: Appointment,
  clinic: ClinicSettings
): { whatsapp: string; sms: string; emailSubject: string; emailBody: string } {
  const dateStr = formatDateReadable(appointment.appointment_date);
  const timeStr = `${formatTime12h(appointment.starts_at)} – ${formatTime12h(appointment.ends_at)}`;
  const doctorStr = appointment.practitioner_name || 'Assigned Dental Specialist';
  const clinicAddress = `${clinic.address_line}, ${clinic.locality}, ${clinic.city} - ${clinic.postal_code}`;

  const whatsapp =
`🦷 *JustSmile Dental Clinic — Appointment Confirmed!*

Dear *${appointment.patient_name}*,

Great news! Your dental consultation has been officially *CONFIRMED* by our clinic team.

📋 *Booking Ref:* ${appointment.booking_reference}
📅 *Date:* ${dateStr}
⏰ *Time Slot:* ${timeStr}
🩺 *Service:* ${appointment.service_name}
👨‍⚕️ *Doctor:* ${doctorStr}
📍 *Clinic Location:* ${clinicAddress}
📞 *Clinic Helpline:* ${clinic.phone}

💡 *Helpful Tips:*
• Please arrive 5–10 minutes prior to your time slot.
• If you need to make changes or have questions, reply directly to this WhatsApp chat or call us at ${clinic.phone}.

We look forward to welcoming you!
_Team JustSmile Dental Clinic_`;

  const sms =
`JustSmile Clinic: Hello ${appointment.patient_name}, your dental appointment (Ref: ${appointment.booking_reference}) is CONFIRMED for ${dateStr} at ${formatTime12h(appointment.starts_at)} with ${doctorStr}. Location: ${clinic.locality}, ${clinic.city}. Call: ${clinic.phone}`;

  const emailSubject = `Confirmed: Dental Appointment on ${dateStr} [${appointment.booking_reference}] - JustSmile Dental Clinic`;

  const emailBody =
`Dear ${appointment.patient_name},

Thank you for scheduling with JustSmile Dental Clinic. Your appointment is CONFIRMED.

==================================================
APPOINTMENT DETAILS
==================================================
• Booking Reference: ${appointment.booking_reference}
• Date: ${dateStr}
• Time: ${timeStr}
• Service / Treatment: ${appointment.service_name}
• Specialist: ${doctorStr}
• Patient Status: ${appointment.is_first_time ? 'First-time consultation' : 'Existing patient'}

==================================================
CLINIC LOCATION & CONTACT
==================================================
JustSmile Dental Clinic
${clinicAddress}
Phone: ${clinic.phone}
WhatsApp: ${clinic.whatsapp_number}
Google Maps: ${clinic.maps_url || 'Available on request'}

Please arrive 5 to 10 minutes prior to your scheduled time. If you need to reschedule or require assistance, feel free to call our desk at ${clinic.phone} or reply to this email.

Warm regards,
Reception & Clinical Care Team
JustSmile Dental Clinic
${clinic.phone} | ${clinic.city}`;

  return { whatsapp, sms, emailSubject, emailBody };
}

/**
 * Generate formatted notification messages for patient cancellation
 */
export function generateCancellationMessage(
  appointment: Appointment,
  clinic: ClinicSettings,
  reason?: string
): { whatsapp: string; sms: string; emailSubject: string; emailBody: string } {
  const dateStr = formatDateReadable(appointment.appointment_date);
  const timeStr = `${formatTime12h(appointment.starts_at)} – ${formatTime12h(appointment.ends_at)}`;

  const whatsapp =
`⚠️ *JustSmile Dental Clinic — Appointment Cancelled*

Dear *${appointment.patient_name}*,

This is to notify you that your dental appointment scheduled for *${dateStr}* at *${timeStr}* (Booking Ref: *${appointment.booking_reference}*) has been *CANCELLED* as requested${reason ? `\n_Note: ${reason}_` : ''}.

The reserved time slot has been reopened for other patients.

🔄 *Need to rebook?*
You can book a new convenient slot on our website anytime or chat with our desk directly on WhatsApp.

📞 *Clinic Helpline:* ${clinic.phone}
📍 *Address:* ${clinic.locality}, ${clinic.city}

Warm regards,
_JustSmile Dental Clinic Team_`;

  const sms =
`JustSmile Clinic: Hello ${appointment.patient_name}, your dental appointment on ${dateStr} at ${formatTime12h(appointment.starts_at)} (Ref: ${appointment.booking_reference}) has been CANCELLED. To reschedule, visit our website or call ${clinic.phone}.`;

  const emailSubject = `Notice: Dental Appointment Cancelled [${appointment.booking_reference}] - JustSmile Dental Clinic`;

  const emailBody =
`Dear ${appointment.patient_name},

This email confirms that your dental appointment with JustSmile Dental Clinic has been CANCELLED.

CANCELLATION SUMMARY:
• Booking Reference: ${appointment.booking_reference}
• Originally Scheduled: ${dateStr} at ${timeStr}
• Service: ${appointment.service_name}
${reason ? `• Reason / Notes: ${reason}\n` : ''}
Your reserved time slot has been released back into our scheduling system.

If this was done in error or if you wish to reschedule to another date, please contact our reception at ${clinic.phone} or visit our website to pick a new slot.

Warm regards,
Patient Services Team
JustSmile Dental Clinic
Phone: ${clinic.phone} | ${clinic.city}`;

  return { whatsapp, sms, emailSubject, emailBody };
}

/**
 * Open WhatsApp dispatch in browser/app
 */
export function openWhatsApp(phone: string, text: string): boolean {
  try {
    const cleanNumber = formatPhoneForMessaging(phone);
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  } catch (err) {
    console.error('Failed to open WhatsApp URL', err);
    return false;
  }
}

/**
 * Open native SMS dispatch
 */
export function openSMS(phone: string, text: string): boolean {
  try {
    const cleanNumber = phone.replace(/\D/g, '');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    const url = `sms:${cleanNumber}${separator}body=${encodeURIComponent(text)}`;
    window.location.href = url;
    return true;
  } catch (err) {
    console.error('Failed to open SMS link', err);
    return false;
  }
}

/**
 * Open default email client
 */
export function openEmail(email: string, subject: string, body: string): boolean {
  try {
    const url = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
    return true;
  } catch (err) {
    console.error('Failed to open mailto URL', err);
    return false;
  }
}

/**
 * Save notification log to local storage
 */
export function recordNotificationLog(log: Omit<NotificationLog, 'id' | 'sentAt'>): NotificationLog {
  const fullLog: NotificationLog = {
    ...log,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sentAt: new Date().toISOString()
  };

  try {
    const existing = getNotificationLogs();
    existing.unshift(fullLog);
    // Keep last 100 entries
    const trimmed = existing.slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Could not persist notification log:', e);
  }

  return fullLog;
}

/**
 * Get all notification logs or logs filtered by appointment ID
 */
export function getNotificationLogs(appointmentId?: string): NotificationLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const logs: NotificationLog[] = JSON.parse(raw);
    if (appointmentId) {
      return logs.filter(l => l.appointmentId === appointmentId || l.bookingReference === appointmentId);
    }
    return logs;
  } catch {
    return [];
  }
}
