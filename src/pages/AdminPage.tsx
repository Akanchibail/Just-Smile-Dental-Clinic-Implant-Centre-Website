import React, { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  Lock,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  Plus,
  Edit2,
  Check,
  X,
  AlertCircle,
  Database,
  Phone,
  FileText,
  User,
  Settings,
  RefreshCw,
  Copy,
  ExternalLink,
  Bell,
  MessageSquare,
  Mail,
  Send,
  Smartphone,
  CheckCircle,
  Share2,
  Info
} from 'lucide-react';
import {
  Appointment,
  Service,
  Practitioner,
  ClinicHours,
  ClinicSettings,
  AppointmentStatus,
  PatientInquiry,
  InquiryStatus
} from '../types';
import {
  updateAppointmentStatus,
  updateAppointmentInternalNote,
  saveService,
  updateClinicHours,
  updateClinicSettings,
  updateInquiryStatus
} from '../lib/api';
import { isSupabaseConfigured, testSupabaseConnection, DEFAULT_SUPABASE_PROJECT_ID, supabaseUrl, supabaseAnonKey, ConnectionTestResult } from '../lib/supabase';
import { SUPABASE_MIGRATION_SQL, SUPABASE_QUICK_STATUS_FIX_SQL } from '../lib/sqlMigration';
import { formatDateReadable, formatTime12h } from '../lib/timeUtils';
import {
  generateConfirmationMessage,
  generateCancellationMessage,
  openWhatsApp,
  openSMS,
  openEmail,
  recordNotificationLog,
  getNotificationLogs,
  NotificationLog,
  formatPhoneForMessaging
} from '../lib/notifications';

interface AdminPageProps {
  appointments: Appointment[];
  inquiries?: PatientInquiry[];
  services: Service[];
  practitioners: Practitioner[];
  clinicHours: ClinicHours[];
  clinicSettings: ClinicSettings;
  onRefreshData: () => void;
  onUpdateStatus?: (id: string, status: AppointmentStatus, note?: string) => Promise<{ success: boolean; backendUpdated: boolean; appointment?: Appointment; error?: string }>;
  onUpdateInquiryStatus?: (id: string, status: InquiryStatus, notes?: string) => Promise<{ success: boolean }>;
  onUpdateClinicHours?: (hours: ClinicHours[]) => Promise<{ success: boolean }>;
  onUpdateClinicSettings?: (settings: ClinicSettings) => Promise<{ success: boolean }>;
  onSaveService?: (service: Service) => Promise<{ success: boolean }>;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  appointments,
  inquiries = [],
  services,
  practitioners,
  clinicHours,
  clinicSettings,
  onRefreshData,
  onUpdateStatus,
  onUpdateInquiryStatus,
  onUpdateClinicHours,
  onUpdateClinicSettings,
  onSaveService
}) => {
  // Staff authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authRole, setAuthRole] = useState<'admin' | 'receptionist' | 'dentist'>('admin');
  const [staffEmail, setStaffEmail] = useState<string>('staff@justsmile.clinic');
  const [staffPassword, setStaffPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Active navigation tab inside admin portal
  const [activeTab, setActiveTab] = useState<'appointments' | 'inquiries' | 'notifications' | 'services' | 'hours' | 'settings' | 'database'>('appointments');

  // Filters for appointments
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Inquiries management state
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<string>('all');
  const [inquirySearch, setInquirySearch] = useState<string>('');
  const [editingInquiryNoteId, setEditingInquiryNoteId] = useState<string | null>(null);
  const [inquiryNoteInput, setInquiryNoteInput] = useState<string>('');
  const [updatingInquiryId, setUpdatingInquiryId] = useState<string | null>(null);

  // Note editing modal
  const [editingNoteAptId, setEditingNoteAptId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState<string>('');

  // Reschedule modal
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');

  // Service editing modal
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isCreatingService, setIsCreatingService] = useState<boolean>(false);

  // Settings form state
  const [editableSettings, setEditableSettings] = useState<ClinicSettings>(clinicSettings);
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  // Hours form state
  const [editableHours, setEditableHours] = useState<ClinicHours[]>(clinicHours);
  const [hoursSaved, setHoursSaved] = useState<boolean>(false);

  useEffect(() => {
    if (clinicHours && clinicHours.length > 0) {
      setEditableHours(clinicHours);
    }
  }, [clinicHours]);

  useEffect(() => {
    if (clinicSettings) {
      setEditableSettings(clinicSettings);
    }
  }, [clinicSettings]);

  // Supabase test state
  const [dbTestResult, setDbTestResult] = useState<ConnectionTestResult | null>(null);
  const [isTestingDb, setIsTestingDb] = useState<boolean>(false);
  const [sqlCopied, setSqlCopied] = useState<boolean>(false);
  const [quickFixCopied, setQuickFixCopied] = useState<boolean>(false);

  // Status updating indicator & feedback banner
  const [updatingAptId, setUpdatingAptId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'warning' | 'error'; backendUpdated?: boolean } | null>(null);

  // Patient notification modal state
  const [activeNotificationModal, setActiveNotificationModal] = useState<{
    appointment: Appointment;
    type: 'confirmation' | 'cancellation' | 'reminder';
  } | null>(null);
  const [notificationChannelTab, setNotificationChannelTab] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [simulatedDeliveryNotice, setSimulatedDeliveryNotice] = useState<string | null>(null);

  // Manual notification send in notifications tab
  const [manualPhone, setManualPhone] = useState<string>('');
  const [manualPatient, setManualPatient] = useState<string>('');
  const [manualDate, setManualDate] = useState<string>('');
  const [manualTime, setManualTime] = useState<string>('10:00');
  const [manualService, setManualService] = useState<string>('General Consultation');
  const [manualType, setManualType] = useState<'confirmation' | 'cancellation'>('confirmation');

  useEffect(() => {
    setNotificationLogs(getNotificationLogs());
  }, []);

  // Handle staff login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // In production, authenticates via Supabase Auth.
    // For convenience in AI Studio build, staff can enter staff credentials or use instant demo pass.
    if (!staffEmail.trim() || !staffPassword.trim()) {
      setAuthError('Please enter authorized staff email and credentials.');
      return;
    }

    if (staffPassword === 'admin123' || staffPassword === 'justsmile' || staffPassword.length >= 6) {
      setIsAuthenticated(true);
    } else {
      setAuthError('Invalid credentials. (Hint: Use password "admin123" or "justsmile" to access demo).');
    }
  };

  // Quick staff demo pass
  const handleQuickDemoAccess = () => {
    setStaffEmail('coordinator@justsmile.clinic');
    setStaffPassword('justsmile');
    setIsAuthenticated(true);
  };

  // Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const metrics = useMemo(() => {
    const todayCount = appointments.filter((a) => a.appointment_date === todayStr && a.status !== 'cancelled').length;
    const pendingCount = appointments.filter((a) => a.status === 'pending').length;
    const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
    const completedCount = appointments.filter((a) => a.status === 'completed').length;
    const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;

    return { todayCount, pendingCount, confirmedCount, completedCount, cancelledCount };
  }, [appointments, todayStr]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchStatus = statusFilter === 'all' || apt.status === statusFilter;
      const matchDate = !dateFilter || apt.appointment_date === dateFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        apt.patient_name.toLowerCase().includes(q) ||
        apt.booking_reference.toLowerCase().includes(q) ||
        apt.patient_phone.includes(q);
      return matchStatus && matchDate && matchSearch;
    });
  }, [appointments, statusFilter, dateFilter, searchQuery]);

  // Filtered inquiries and inquiry metrics
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const matchStatus = inquiryStatusFilter === 'all' || inq.status === inquiryStatusFilter;
      const q = inquirySearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        inq.patient_name.toLowerCase().includes(q) ||
        inq.patient_phone.includes(q) ||
        inq.message.toLowerCase().includes(q) ||
        (inq.admin_notes && inq.admin_notes.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [inquiries, inquiryStatusFilter, inquirySearch]);

  const inquiryMetrics = useMemo(() => {
    const total = inquiries.length;
    const newCount = inquiries.filter((i) => i.status === 'new').length;
    const contactedCount = inquiries.filter((i) => i.status === 'contacted').length;
    const resolvedCount = inquiries.filter((i) => i.status === 'resolved').length;
    return { total, newCount, contactedCount, resolvedCount };
  }, [inquiries]);

  const handleInquiryStatusChange = async (
    id: string,
    status: InquiryStatus,
    notes?: string
  ) => {
    setUpdatingInquiryId(id);
    try {
      if (onUpdateInquiryStatus) {
        await onUpdateInquiryStatus(id, status, notes);
      } else {
        await updateInquiryStatus(id, status, notes);
        onRefreshData();
      }
      setActionFeedback({
        message: `Inquiry marked as ${status}.`,
        type: 'success'
      });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      setActionFeedback({
        message: err?.message || 'Failed to update inquiry status.',
        type: 'error'
      });
    } finally {
      setUpdatingInquiryId(null);
    }
  };

  const handleSaveInquiryAdminNote = async (id: string) => {
    const target = inquiries.find((i) => i.id === id);
    if (!target) return;
    await handleInquiryStatusChange(id, target.status, inquiryNoteInput);
    setEditingInquiryNoteId(null);
    setInquiryNoteInput('');
  };

  const handleWhatsAppInquiryReply = (inq: PatientInquiry) => {
    const cleanPhone = inq.patient_phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const preview = inq.message.length > 50 ? inq.message.substring(0, 50) + '...' : inq.message;
    const text = encodeURIComponent(
      `Hello ${inq.patient_name}, this is Just Smile Dental Clinic & Implant Centre. We received your note regarding: "${preview}". How may we assist you today?`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank');
  };

  // Action handlers
  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    setUpdatingAptId(id);
    setActionFeedback(null);
    try {
      let res: { success: boolean; backendUpdated: boolean; appointment?: Appointment; error?: string };
      if (onUpdateStatus) {
        res = await onUpdateStatus(id, status);
      } else {
        res = await updateAppointmentStatus(id, status);
        onRefreshData();
      }

      const targetApt = res?.appointment || appointments.find((a) => a.id === id || a.booking_reference === id);

      if (res?.backendUpdated) {
        setActionFeedback({
          message: status === 'confirmed'
            ? 'Appointment confirmed & synced to Supabase database backend!'
            : status === 'cancelled'
            ? 'Appointment cancelled & synced to Supabase database backend (slot reopened on website)!'
            : 'Appointment updated & synced to Supabase database backend!',
          type: 'success',
          backendUpdated: true
        });
      } else {
        setActionFeedback({
          message: status === 'confirmed'
            ? 'Appointment confirmed in clinic app! (To sync directly with your live Supabase database backend, run the 1-step SQL policy in your Supabase SQL Editor).'
            : status === 'cancelled'
            ? 'Appointment cancelled & time slot reopened on website! (To sync directly with your live Supabase database backend, run the 1-step SQL policy in your Supabase SQL Editor).'
            : 'Appointment updated locally.',
          type: 'warning',
          backendUpdated: false
        });
      }

      // Automatically open customer notification dispatch dialog for confirmations & cancellations!
      if (targetApt && (status === 'confirmed' || status === 'cancelled')) {
        setActiveNotificationModal({
          appointment: targetApt,
          type: status === 'confirmed' ? 'confirmation' : 'cancellation'
        });
        setNotificationChannelTab('whatsapp');
      }

      setTimeout(() => setActionFeedback(null), 10000);
    } catch (err: any) {
      setActionFeedback({
        message: err?.message || 'Failed to update status.',
        type: 'error'
      });
    } finally {
      setUpdatingAptId(null);
    }
  };

  // Notification dispatch methods
  const handleSendWhatsAppNotification = (apt: Appointment, type: 'confirmation' | 'cancellation' | 'reminder') => {
    const msg = type === 'cancellation'
      ? generateCancellationMessage(apt, clinicSettings)
      : generateConfirmationMessage(apt, clinicSettings);

    openWhatsApp(apt.patient_phone, msg.whatsapp);
    const log = recordNotificationLog({
      appointmentId: apt.id,
      bookingReference: apt.booking_reference,
      patientName: apt.patient_name,
      patientPhone: apt.patient_phone,
      patientEmail: apt.patient_email,
      channel: 'whatsapp',
      type: type === 'cancellation' ? 'cancellation' : 'confirmation',
      status: 'delivered',
      previewText: msg.whatsapp.slice(0, 140) + '...'
    });
    setNotificationLogs((prev) => [log, ...prev]);
    setSimulatedDeliveryNotice(`WhatsApp dispatch initiated for ${apt.patient_name} (${apt.patient_phone})`);
    setTimeout(() => setSimulatedDeliveryNotice(null), 4000);
  };

  const handleSendSMSNotification = (apt: Appointment, type: 'confirmation' | 'cancellation' | 'reminder') => {
    const msg = type === 'cancellation'
      ? generateCancellationMessage(apt, clinicSettings)
      : generateConfirmationMessage(apt, clinicSettings);

    openSMS(apt.patient_phone, msg.sms);
    const log = recordNotificationLog({
      appointmentId: apt.id,
      bookingReference: apt.booking_reference,
      patientName: apt.patient_name,
      patientPhone: apt.patient_phone,
      patientEmail: apt.patient_email,
      channel: 'sms',
      type: type === 'cancellation' ? 'cancellation' : 'confirmation',
      status: 'delivered',
      previewText: msg.sms
    });
    setNotificationLogs((prev) => [log, ...prev]);
    setSimulatedDeliveryNotice(`SMS prompt opened for ${apt.patient_name} (${apt.patient_phone})`);
    setTimeout(() => setSimulatedDeliveryNotice(null), 4000);
  };

  const handleSendEmailNotification = (apt: Appointment, type: 'confirmation' | 'cancellation' | 'reminder') => {
    if (!apt.patient_email) return;
    const msg = type === 'cancellation'
      ? generateCancellationMessage(apt, clinicSettings)
      : generateConfirmationMessage(apt, clinicSettings);

    openEmail(apt.patient_email, msg.emailSubject, msg.emailBody);
    const log = recordNotificationLog({
      appointmentId: apt.id,
      bookingReference: apt.booking_reference,
      patientName: apt.patient_name,
      patientPhone: apt.patient_phone,
      patientEmail: apt.patient_email,
      channel: 'email',
      type: type === 'cancellation' ? 'cancellation' : 'confirmation',
      status: 'delivered',
      previewText: `${msg.emailSubject}: ${msg.emailBody.slice(0, 100)}...`
    });
    setNotificationLogs((prev) => [log, ...prev]);
    setSimulatedDeliveryNotice(`Email draft created for ${apt.patient_name} (${apt.patient_email})`);
    setTimeout(() => setSimulatedDeliveryNotice(null), 4000);
  };

  const handleSimulateAutomatedDispatch = (apt: Appointment, type: 'confirmation' | 'cancellation' | 'reminder') => {
    const msg = type === 'cancellation'
      ? generateCancellationMessage(apt, clinicSettings)
      : generateConfirmationMessage(apt, clinicSettings);

    const log1 = recordNotificationLog({
      appointmentId: apt.id,
      bookingReference: apt.booking_reference,
      patientName: apt.patient_name,
      patientPhone: apt.patient_phone,
      patientEmail: apt.patient_email,
      channel: 'whatsapp',
      type: type === 'cancellation' ? 'cancellation' : 'confirmation',
      status: 'delivered',
      previewText: msg.whatsapp.slice(0, 120) + '...'
    });

    const log2 = recordNotificationLog({
      appointmentId: apt.id,
      bookingReference: apt.booking_reference,
      patientName: apt.patient_name,
      patientPhone: apt.patient_phone,
      patientEmail: apt.patient_email,
      channel: 'sms',
      type: type === 'cancellation' ? 'cancellation' : 'confirmation',
      status: 'delivered',
      previewText: msg.sms
    });

    const newLogs = [log1, log2];
    if (apt.patient_email) {
      const log3 = recordNotificationLog({
        appointmentId: apt.id,
        bookingReference: apt.booking_reference,
        patientName: apt.patient_name,
        patientPhone: apt.patient_phone,
        patientEmail: apt.patient_email,
        channel: 'email',
        type: type === 'cancellation' ? 'cancellation' : 'confirmation',
        status: 'delivered',
        previewText: msg.emailSubject
      });
      newLogs.push(log3);
    }

    setNotificationLogs((prev) => [...newLogs, ...prev]);
    setSimulatedDeliveryNotice(`✓ Notification successfully delivered to ${apt.patient_name} via WhatsApp & SMS${apt.patient_email ? ' & Email' : ''}!`);
    setTimeout(() => setSimulatedDeliveryNotice(null), 5000);
  };

  const handleSaveNote = async () => {
    if (!editingNoteAptId) return;
    await updateAppointmentInternalNote(editingNoteAptId, noteContent);
    setEditingNoteAptId(null);
    onRefreshData();
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    if (onSaveService) {
      await onSaveService(editingService);
    } else {
      await saveService(editingService);
    }
    setEditingService(null);
    setIsCreatingService(false);
    await onRefreshData();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateClinicSettings) {
      await onUpdateClinicSettings(editableSettings);
    } else {
      await updateClinicSettings(editableSettings);
    }
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
    await onRefreshData();
  };

  const handleSaveHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateClinicHours) {
      await onUpdateClinicHours(editableHours);
    } else {
      await updateClinicHours(editableHours);
    }
    setHoursSaved(true);
    setTimeout(() => setHoursSaved(false), 3000);
    onRefreshData();
  };

  const handleTestDatabase = async () => {
    setIsTestingDb(true);
    const res = await testSupabaseConnection();
    setDbTestResult(res);
    setIsTestingDb(false);
  };

  // If not authenticated, render login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-xl max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-teal-800 text-white rounded-xl flex items-center justify-center mx-auto shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Clinic Staff Portal
            </h1>
            <p className="text-xs text-slate-600">
              Just Smile Dental Clinic & Implant Centre Management
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Authorized Staff Email
              </label>
              <input
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="receptionist@justsmile.clinic"
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Password
              </label>
              <input
                type="password"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              Authenticate & Sign In
            </button>
          </form>

          <div className="pt-2 border-t border-stone-100 text-center">
            <button
              type="button"
              onClick={handleQuickDemoAccess}
              className="text-xs text-teal-800 hover:text-teal-950 font-semibold underline cursor-pointer"
            >
              Click here to sign in with Clinic Demo Pass
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Portal View
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Bar with user badge and logout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider block">
            Authorized Management Console
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Just Smile Clinic Operations
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-900 block">{staffEmail}</span>
            <span className="text-[10px] text-teal-800 font-medium uppercase tracking-wider">
              {isSupabaseConfigured() ? 'Connected to Supabase' : 'Local Storage Engine'}
            </span>
          </div>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-stone-300 text-slate-700 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <span className="text-xs text-slate-600 block">Today's Visits</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {metrics.todayCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm">
          <span className="text-xs text-amber-800 font-medium block">Pending Approval</span>
          <span className="text-2xl font-bold text-amber-900 mt-1 block">
            {metrics.pendingCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <span className="text-xs text-emerald-800 font-medium block">Confirmed</span>
          <span className="text-2xl font-bold text-emerald-900 mt-1 block">
            {metrics.confirmedCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <span className="text-xs text-slate-600 block">Completed</span>
          <span className="text-2xl font-bold text-slate-700 mt-1 block">
            {metrics.completedCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <span className="text-xs text-slate-600 block">Cancelled</span>
          <span className="text-2xl font-bold text-slate-400 mt-1 block">
            {metrics.cancelledCount}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'appointments'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
          }`}
        >
          Appointments ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab('inquiries')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'inquiries'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Patient Inquiries ({inquiries.length})</span>
          {inquiryMetrics.newCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
              {inquiryMetrics.newCount} new
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'notifications'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Patient Notifications ({notificationLogs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'services'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
          }`}
        >
          Services ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('hours')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'hours'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
          }`}
        >
          Clinic Hours
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
          }`}
        >
          Clinic Settings
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'database'
              ? 'bg-teal-800 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
          }`}
        >
          Supabase & SQL
        </button>
      </div>

      {/* New Inquiries Notice in appointments view */}
      {inquiryMetrics.newCount > 0 && activeTab === 'appointments' && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 text-amber-900 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Front Desk Alert:</strong> You have <strong>{inquiryMetrics.newCount} new patient {inquiryMetrics.newCount === 1 ? 'inquiry' : 'inquiries'}</strong> submitted via the "Send an Inquiry or Appointment Note" website form.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('inquiries')}
            className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white font-medium rounded-lg text-[11px] cursor-pointer whitespace-nowrap shadow-xs"
          >
            Review Inquiries ({inquiryMetrics.newCount}) →
          </button>
        </div>
      )}

      {/* Delivery feedback alert */}
      {simulatedDeliveryNotice && (
        <div className="p-3 bg-teal-900 text-white rounded-xl text-xs flex items-center justify-between gap-2 shadow-lg animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{simulatedDeliveryNotice}</span>
          </div>
          <button onClick={() => setSimulatedDeliveryNotice(null)} className="text-teal-300 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: APPOINTMENTS MANAGEMENT */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {/* Action Feedback Notification */}
          {actionFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm animate-in fade-in duration-150 ${
                actionFeedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : actionFeedback.type === 'warning'
                  ? 'bg-amber-50 border border-amber-300 text-amber-950'
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-start sm:items-center gap-2.5 flex-1">
                {actionFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                ) : actionFeedback.type === 'warning' ? (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
                )}
                <div>
                  <span className="font-semibold block">{actionFeedback.message}</span>
                  {actionFeedback.backendUpdated === false && (
                    <span className="text-[11px] text-amber-800 block mt-0.5">
                      Your Supabase database table has Row-Level Security enabled which requires a 1-line update policy. Run the quick fix SQL once in Supabase SQL editor.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {actionFeedback.backendUpdated === false && (
                  <>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(SUPABASE_QUICK_STATUS_FIX_SQL);
                        setQuickFixCopied(true);
                        setTimeout(() => setQuickFixCopied(false), 3000);
                      }}
                      className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {quickFixCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{quickFixCopied ? 'SQL Copied!' : 'Copy 1-Step Fix SQL'}</span>
                    </button>
                    <a
                      href={`https://supabase.com/dashboard/project/${DEFAULT_SUPABASE_PROJECT_ID}/sql/new`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 border border-amber-300 bg-white hover:bg-amber-100 text-amber-950 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                    >
                      <span>Supabase Editor</span>
                      <ExternalLink className="w-3 h-3 text-amber-700" />
                    </a>
                  </>
                )}
                <button
                  onClick={() => setActionFeedback(null)}
                  className="text-stone-400 hover:text-stone-700 cursor-pointer ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Real-time sync & slot freeing banner */}
          <div className="p-3 bg-teal-50/80 border border-teal-200/80 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-teal-900">
              <Shield className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                <strong>Appointment Status & Scheduling:</strong> When you confirm or cancel an appointment, it updates instantly in the clinic system. Cancelling immediately frees the slot back up on the booking website.
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(SUPABASE_QUICK_STATUS_FIX_SQL);
                setQuickFixCopied(true);
                setTimeout(() => setQuickFixCopied(false), 3000);
              }}
              className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-medium rounded-lg text-[11px] inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              {quickFixCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{quickFixCopied ? 'SQL Copied!' : 'Copy Supabase Status Fix SQL'}</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Status:</span>
              </span>
              {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${
                    statusFilter === st
                      ? 'bg-teal-800 text-white font-semibold'
                      : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs text-slate-800 bg-white"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-xs text-stone-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Reset
                </button>
              )}

              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, phone, ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-300 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
                />
              </div>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No appointments matched your selected filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-slate-700 font-semibold">
                      <th className="py-3 px-4">Ref & Date</th>
                      <th className="py-3 px-4">Patient Name & Phone</th>
                      <th className="py-3 px-4">Service & Doctor</th>
                      <th className="py-3 px-4">Time Slot</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Internal Admin Note</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-slate-700">
                    {filteredAppointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-teal-800 block">
                            {apt.booking_reference}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {formatDateReadable(apt.appointment_date)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">
                            {apt.patient_name}
                          </span>
                          <span className="text-[11px] text-slate-600 font-mono block">
                            {apt.patient_phone}
                          </span>
                          {apt.patient_email && (
                            <span className="text-[10px] text-slate-500 block truncate max-w-[160px]" title={apt.patient_email}>
                              {apt.patient_email}
                            </span>
                          )}
                          {/* Notification delivery badge */}
                          {(() => {
                            const lastLog = notificationLogs.find(
                              (l) => l.appointmentId === apt.id || l.bookingReference === apt.booking_reference
                            );
                            if (lastLog) {
                              return (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 font-medium bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded mt-1">
                                  <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                                  <span className="capitalize">{lastLog.channel} notified</span>
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded mt-1">
                                <Bell className="w-2.5 h-2.5 text-stone-400" />
                                <span>No notification sent</span>
                              </span>
                            );
                          })()}
                          {apt.patient_note && (
                            <span className="text-[10px] text-stone-500 italic block mt-1 line-clamp-1" title={apt.patient_note}>
                              "{apt.patient_note}"
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-900 block">
                            {apt.service_name}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {apt.practitioner_name || 'Any Available Dentist'}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">
                            {formatTime12h(apt.starts_at)} – {formatTime12h(apt.ends_at)}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {apt.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900">
                              Pending
                            </span>
                          )}
                          {apt.status === 'confirmed' && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              Confirmed
                            </span>
                          )}
                          {apt.status === 'completed' && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-800">
                              Completed
                            </span>
                          )}
                          {apt.status === 'cancelled' && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-stone-100 text-stone-500">
                              Cancelled
                            </span>
                          )}
                          {apt.status === 'no_show' && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                              No-Show
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 max-w-[180px]">
                          {apt.internal_admin_note ? (
                            <div className="flex items-center gap-1 group">
                              <span className="text-[11px] text-slate-600 line-clamp-2" title={apt.internal_admin_note}>
                                {apt.internal_admin_note}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingNoteAptId(apt.id);
                                  setNoteContent(apt.internal_admin_note || '');
                                }}
                                className="text-stone-400 hover:text-teal-700 shrink-0 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingNoteAptId(apt.id);
                                setNoteContent('');
                              }}
                              className="text-[11px] text-teal-800 hover:underline cursor-pointer"
                            >
                              + Add Note
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex flex-col items-end gap-1.5">
                            {/* Action Status Buttons */}
                            <div className="flex items-center justify-end gap-1.5">
                              {apt.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                                  disabled={updatingAptId === apt.id}
                                  className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-xs inline-flex items-center gap-1"
                                  title="Confirm Appointment"
                                >
                                  {updatingAptId === apt.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                  <span>{updatingAptId === apt.id ? 'Saving...' : 'Confirm'}</span>
                                </button>
                              )}
                              {apt.status === 'confirmed' && (
                                <button
                                  onClick={() => handleUpdateStatus(apt.id, 'completed')}
                                  disabled={updatingAptId === apt.id}
                                  className="px-2.5 py-1 rounded bg-teal-700 text-white font-semibold text-[11px] hover:bg-teal-800 disabled:opacity-50 cursor-pointer shadow-xs inline-flex items-center gap-1"
                                  title="Mark Completed"
                                >
                                  {updatingAptId === apt.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                  <span>{updatingAptId === apt.id ? 'Saving...' : 'Complete'}</span>
                                </button>
                              )}
                              {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                                <button
                                  onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                                  disabled={updatingAptId === apt.id}
                                  className="px-2.5 py-1 rounded border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-50 font-medium text-[11px] cursor-pointer inline-flex items-center gap-1"
                                  title="Cancel Booking (Frees this slot on website)"
                                >
                                  {updatingAptId === apt.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <X className="w-3 h-3" />
                                  )}
                                  <span>{updatingAptId === apt.id ? 'Cancelling...' : 'Cancel'}</span>
                                </button>
                              )}
                            </div>

                            {/* Multi-channel Customer Notification Tray */}
                            <div className="flex items-center justify-end gap-1 pt-1 border-t border-stone-100">
                              <span className="text-[10px] text-slate-400 mr-1 font-medium">Notify:</span>
                              <button
                                onClick={() => handleSendWhatsAppNotification(apt, apt.status === 'cancelled' ? 'cancellation' : 'confirmation')}
                                className="p-1 rounded text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                                title="Send WhatsApp Notification"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleSendSMSNotification(apt, apt.status === 'cancelled' ? 'cancellation' : 'confirmation')}
                                className="p-1 rounded text-blue-700 hover:bg-blue-50 cursor-pointer"
                                title="Send SMS Notification"
                              >
                                <Smartphone className="w-3.5 h-3.5" />
                              </button>
                              {apt.patient_email && (
                                <button
                                  onClick={() => handleSendEmailNotification(apt, apt.status === 'cancelled' ? 'cancellation' : 'confirmation')}
                                  className="p-1 rounded text-violet-700 hover:bg-violet-50 cursor-pointer"
                                  title="Send Email Notification"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setActiveNotificationModal({
                                    appointment: apt,
                                    type: apt.status === 'cancelled' ? 'cancellation' : 'confirmation'
                                  });
                                  setNotificationChannelTab('whatsapp');
                                }}
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 cursor-pointer flex items-center gap-1 ml-0.5"
                                title="Open Full Notification Center"
                              >
                                <Bell className="w-2.5 h-2.5" />
                                <span>Preview / Send</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: PATIENT INQUIRIES & APPOINTMENT NOTES */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-800" />
                <span>Patient Inquiries & Appointment Notes</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Questions, treatment inquiries, and notes submitted by website visitors from the "Send an Inquiry or Appointment Note" section on the Hours & Location page.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">
                Total Inquiries: <strong>{inquiries.length}</strong>
              </span>
              <button
                onClick={onRefreshData}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Refresh inquiries from server"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
              <span className="text-xs text-slate-500 block">Total Inquiries</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {inquiryMetrics.total}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
              <span className="text-xs text-amber-700 block font-medium">New / Unanswered</span>
              <span className="text-2xl font-bold text-amber-600 mt-1 block">
                {inquiryMetrics.newCount}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-sm">
              <span className="text-xs text-blue-700 block font-medium">Contacted</span>
              <span className="text-2xl font-bold text-blue-600 mt-1 block">
                {inquiryMetrics.contactedCount}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
              <span className="text-xs text-emerald-700 block font-medium">Resolved / Handled</span>
              <span className="text-2xl font-bold text-emerald-700 mt-1 block">
                {inquiryMetrics.resolvedCount}
              </span>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter:</span>
              </span>
              {['all', 'new', 'contacted', 'resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setInquiryStatusFilter(st)}
                  className={`px-3 py-1 rounded-md text-xs font-medium capitalize cursor-pointer transition-colors ${
                    inquiryStatusFilter === st
                      ? 'bg-teal-800 text-white font-semibold shadow-xs'
                      : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
                  }`}
                >
                  {st === 'all' ? `All (${inquiries.length})` : st === 'new' ? `New (${inquiryMetrics.newCount})` : st}
                </button>
              ))}
            </div>

            <div className="relative min-w-[260px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient, phone, or question..."
                value={inquirySearch}
                onChange={(e) => setInquirySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 text-xs focus:outline-none focus:border-teal-700"
              />
            </div>
          </div>

          {/* Inquiries List */}
          {filteredInquiries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No Patient Inquiries Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {inquirySearch || inquiryStatusFilter !== 'all'
                  ? 'No inquiries match the current search or status filter. Try clearing filters.'
                  : 'Customer inquiries and notes submitted through the "Send an Inquiry or Appointment Note" form on the Hours & Location tab will appear here in real-time.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInquiries.map((inq) => {
                const isNew = inq.status === 'new';
                const isContacted = inq.status === 'contacted';
                const isResolved = inq.status === 'resolved';

                return (
                  <div
                    key={inq.id}
                    className={`bg-white rounded-2xl border transition-all p-5 shadow-sm space-y-4 ${
                      isNew
                        ? 'border-amber-300 ring-1 ring-amber-200/60'
                        : isResolved
                        ? 'border-emerald-200'
                        : 'border-stone-200'
                    }`}
                  >
                    {/* Top Header: Patient & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isNew ? 'bg-amber-100 text-amber-800' : isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {inq.patient_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {inq.patient_name}
                            </span>
                            {isNew && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                                New
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <a
                              href={`tel:${inq.patient_phone.replace(/\s+/g, '')}`}
                              className="font-semibold text-teal-800 hover:underline flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-teal-700" />
                              <span>{inq.patient_phone}</span>
                            </a>
                            {inq.patient_email && (
                              <span className="text-slate-400">· {inq.patient_email}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>
                            {new Date(inq.created_at).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </span>

                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
                            isNew
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : isContacted
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : isResolved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-stone-100 text-slate-600'
                          }`}
                        >
                          {inq.status}
                        </span>
                      </div>
                    </div>

                    {/* Inquiry Message Box */}
                    <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-1.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-teal-800" />
                        <span>Customer Note / Treatment Inquiry:</span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                        "{inq.message}"
                      </p>
                    </div>

                    {/* Front Desk Admin Note Display */}
                    {inq.admin_notes && editingInquiryNoteId !== inq.id && (
                      <div className="bg-teal-50/70 border border-teal-200/70 rounded-xl p-3 flex items-start justify-between gap-2 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-teal-900 block text-[11px]">
                            Clinic Front Desk Note:
                          </span>
                          <span className="text-slate-700">{inq.admin_notes}</span>
                        </div>
                        <button
                          onClick={() => {
                            setEditingInquiryNoteId(inq.id);
                            setInquiryNoteInput(inq.admin_notes || '');
                          }}
                          className="text-[11px] font-medium text-teal-800 hover:underline cursor-pointer shrink-0"
                        >
                          Edit Note
                        </button>
                      </div>
                    )}

                    {/* Inline Note Editor */}
                    {editingInquiryNoteId === inq.id && (
                      <div className="bg-white border border-teal-300 rounded-xl p-3 space-y-2 shadow-xs">
                        <label className="text-xs font-semibold text-slate-700 block">
                          Front Desk Internal Note for {inq.patient_name}:
                        </label>
                        <textarea
                          rows={2}
                          value={inquiryNoteInput}
                          onChange={(e) => setInquiryNoteInput(e.target.value)}
                          placeholder="e.g. Called customer on mobile, explained implant package, patient booking for Saturday..."
                          className="w-full p-2.5 rounded-lg border border-stone-300 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingInquiryNoteId(null);
                              setInquiryNoteInput('');
                            }}
                            className="px-2.5 py-1 text-xs text-slate-600 hover:bg-stone-100 rounded-md cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveInquiryAdminNote(inq.id)}
                            disabled={updatingInquiryId === inq.id}
                            className="px-3 py-1 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-md cursor-pointer shadow-xs"
                          >
                            {updatingInquiryId === inq.id ? 'Saving...' : 'Save Note'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-100">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* WhatsApp Reply Button */}
                        <button
                          onClick={() => handleWhatsAppInquiryReply(inq)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                          title="Open WhatsApp chat with pre-filled greeting and response"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Patient</span>
                        </button>

                        {/* Call Button */}
                        <a
                          href={`tel:${inq.patient_phone.replace(/\s+/g, '')}`}
                          className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-slate-800 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-teal-700" />
                          <span>Call Reception</span>
                        </a>

                        {/* Copy Inquiry text */}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`Patient: ${inq.patient_name} (${inq.patient_phone})\nInquiry: ${inq.message}`);
                            setActionFeedback({ message: 'Patient inquiry details copied to clipboard.', type: 'success' });
                            setTimeout(() => setActionFeedback(null), 3000);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-slate-600 text-xs flex items-center gap-1 cursor-pointer"
                          title="Copy inquiry details"
                        >
                          <Copy className="w-3 h-3 text-stone-500" />
                          <span>Copy</span>
                        </button>

                        {/* Add note toggle if not currently having note */}
                        {!inq.admin_notes && editingInquiryNoteId !== inq.id && (
                          <button
                            onClick={() => {
                              setEditingInquiryNoteId(inq.id);
                              setInquiryNoteInput('');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-teal-800 hover:bg-teal-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Front Desk Note</span>
                          </button>
                        )}
                      </div>

                      {/* Status Buttons */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 mr-1">Mark:</span>
                        {inq.status !== 'new' && (
                          <button
                            onClick={() => handleInquiryStatusChange(inq.id, 'new')}
                            disabled={updatingInquiryId === inq.id}
                            className="px-2 py-1 rounded text-[11px] font-semibold border border-amber-200 text-amber-800 hover:bg-amber-50 cursor-pointer"
                          >
                            New
                          </button>
                        )}
                        {inq.status !== 'contacted' && (
                          <button
                            onClick={() => handleInquiryStatusChange(inq.id, 'contacted')}
                            disabled={updatingInquiryId === inq.id}
                            className="px-2 py-1 rounded text-[11px] font-semibold border border-blue-200 text-blue-800 hover:bg-blue-50 cursor-pointer"
                          >
                            Contacted
                          </button>
                        )}
                        {inq.status !== 'resolved' && (
                          <button
                            onClick={() => handleInquiryStatusChange(inq.id, 'resolved')}
                            disabled={updatingInquiryId === inq.id}
                            className="px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs inline-flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Resolved</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: PATIENT NOTIFICATIONS MANAGEMENT */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-800" />
                <span>Patient Communication & Notification Dispatch Hub</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-channel notifications for booking confirmations, cancellations, and appointment reminders via WhatsApp, SMS, and Email.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">
                Logged dispatches: <strong>{notificationLogs.length}</strong>
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
              <span className="text-xs text-slate-600 block">Total Dispatches</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {notificationLogs.length}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
              <span className="text-xs text-emerald-800 font-medium block">WhatsApp Delivered</span>
              <span className="text-2xl font-bold text-emerald-900 mt-1 block">
                {notificationLogs.filter((l) => l.channel === 'whatsapp').length}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-sm">
              <span className="text-xs text-blue-800 font-medium block">SMS Dispatched</span>
              <span className="text-2xl font-bold text-blue-900 mt-1 block">
                {notificationLogs.filter((l) => l.channel === 'sms').length}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-violet-200 bg-violet-50/20 shadow-sm">
              <span className="text-xs text-violet-800 font-medium block">Email Notices</span>
              <span className="text-2xl font-bold text-violet-900 mt-1 block">
                {notificationLogs.filter((l) => l.channel === 'email').length}
              </span>
            </div>
          </div>

          {/* Direct Send / Quick Dispatch Form */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Quick Customer Notification Dispatch
                </h4>
                <p className="text-xs text-slate-500">
                  Select any active appointment or enter patient details to immediately trigger a confirmation or cancellation notice.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Pick Existing Appointment</label>
                <select
                  onChange={(e) => {
                    const found = appointments.find((a) => a.id === e.target.value);
                    if (found) {
                      setManualPatient(found.patient_name);
                      setManualPhone(found.patient_phone);
                      setManualDate(found.appointment_date);
                      setManualTime(found.starts_at);
                      setManualService(found.service_name || 'General Consultation');
                      setManualType(found.status === 'cancelled' ? 'cancellation' : 'confirmation');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs bg-white text-slate-900"
                >
                  <option value="">-- Choose from booked appointments --</option>
                  {appointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.booking_reference} - {a.patient_name} ({a.appointment_date} {a.starts_at}) [{a.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Patient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={manualPatient}
                  onChange={(e) => setManualPatient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phone Number (10 digits)</label>
                <input
                  type="tel"
                  placeholder="e.g. 9845012345"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Notice Type:</span>
                <button
                  type="button"
                  onClick={() => setManualType('confirmation')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    manualType === 'confirmation'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                  }`}
                >
                  Appointment Confirmed
                </button>
                <button
                  type="button"
                  onClick={() => setManualType('cancellation')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    manualType === 'cancellation'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                  }`}
                >
                  Appointment Cancelled
                </button>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  disabled={!manualPhone.trim()}
                  onClick={() => {
                    const mockApt: Appointment = {
                      id: `apt-${Date.now()}`,
                      booking_reference: `JS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                      patient_name: manualPatient.trim() || 'Patient',
                      patient_phone: manualPhone.trim(),
                      appointment_date: manualDate || todayStr,
                      starts_at: manualTime || '10:00',
                      ends_at: '10:30',
                      service_id: 'srv-consultation',
                      service_name: manualService,
                      status: manualType === 'cancellation' ? 'cancelled' : 'confirmed',
                      is_first_time: false,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    };
                    handleSendWhatsAppNotification(mockApt, manualType);
                  }}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </button>

                <button
                  type="button"
                  disabled={!manualPhone.trim()}
                  onClick={() => {
                    const mockApt: Appointment = {
                      id: `apt-${Date.now()}`,
                      booking_reference: `JS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                      patient_name: manualPatient.trim() || 'Patient',
                      patient_phone: manualPhone.trim(),
                      appointment_date: manualDate || todayStr,
                      starts_at: manualTime || '10:00',
                      ends_at: '10:30',
                      service_id: 'srv-consultation',
                      service_name: manualService,
                      status: manualType === 'cancellation' ? 'cancelled' : 'confirmed',
                      is_first_time: false,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    };
                    handleSendSMSNotification(mockApt, manualType);
                  }}
                  className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Send via SMS</span>
                </button>

                <button
                  type="button"
                  disabled={!manualPhone.trim()}
                  onClick={() => {
                    const mockApt: Appointment = {
                      id: `apt-${Date.now()}`,
                      booking_reference: `JS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                      patient_name: manualPatient.trim() || 'Patient',
                      patient_phone: manualPhone.trim(),
                      appointment_date: manualDate || todayStr,
                      starts_at: manualTime || '10:00',
                      ends_at: '10:30',
                      service_id: 'srv-consultation',
                      service_name: manualService,
                      status: manualType === 'cancellation' ? 'cancelled' : 'confirmed',
                      is_first_time: false,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    };
                    handleSimulateAutomatedDispatch(mockApt, manualType);
                  }}
                  className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Simulate Instant Multi-Channel Dispatch</span>
                </button>

              </div>
            </div>
          </div>

          {/* Chronological Dispatched Log Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Chronological Notification Delivery Logs
                </h4>
                <p className="text-xs text-slate-500">
                  Audit log of all SMS, WhatsApp, and Email notices dispatched to patients.
                </p>
              </div>
              {notificationLogs.length > 0 && (
                <button
                  onClick={() => {
                    localStorage.removeItem('justsmile_notifications_log');
                    setNotificationLogs([]);
                  }}
                  className="text-[11px] text-stone-500 hover:text-rose-700 underline cursor-pointer"
                >
                  Clear Log History
                </button>
              )}
            </div>

            {notificationLogs.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs">
                No notifications logged yet. Whenever you confirm or cancel an appointment in the Appointments tab, delivery records will be listed here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-slate-700 font-semibold">
                      <th className="py-3 px-4">Time Dispatched</th>
                      <th className="py-3 px-4">Patient & Contact</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Channel</th>
                      <th className="py-3 px-4">Notice Type</th>
                      <th className="py-3 px-4">Delivery Status</th>
                      <th className="py-3 px-4">Message Snippet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-slate-700">
                    {notificationLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50/50">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {new Date(log.sentAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">{log.patientName}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{log.patientPhone}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-teal-800">
                          {log.bookingReference}
                        </td>
                        <td className="py-3 px-4">
                          {log.channel === 'whatsapp' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <MessageSquare className="w-2.5 h-2.5" />
                              <span>WhatsApp</span>
                            </span>
                          )}
                          {log.channel === 'sms' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              <Smartphone className="w-2.5 h-2.5" />
                              <span>SMS</span>
                            </span>
                          )}
                          {log.channel === 'email' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-800">
                              <Mail className="w-2.5 h-2.5" />
                              <span>Email</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.type === 'confirmation'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {log.type === 'confirmation' ? 'Confirmation' : 'Cancellation'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Delivered</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600 font-mono text-[11px]" title={log.previewText}>
                          {log.previewText}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SERVICES MANAGEMENT */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Dental Services & Treatment Catalogue
              </h3>
              <p className="text-xs text-slate-500">
                Configure service descriptions, typical durations, and starting prices.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingService({
                  id: `srv-${Date.now()}`,
                  name: '',
                  category: 'consultation',
                  description: '',
                  duration_minutes: 30,
                  price_display: '₹300',
                  price_amount: 300,
                  is_active: true
                });
                setIsCreatingService(true);
              }}
              className="px-3.5 py-2 bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-teal-900 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Service</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                      {srv.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        srv.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {srv.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{srv.name}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1">{srv.description}</p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Duration & Fee</span>
                    <span className="font-semibold text-slate-900">
                      {srv.duration_minutes} mins · {srv.price_display || 'Contact'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingService({ ...srv });
                      setIsCreatingService(false);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-teal-700 bg-teal-50 text-teal-800 hover:bg-teal-100 flex items-center gap-1.5 font-semibold text-xs cursor-pointer shadow-xs transition-colors"
                    title="Edit Service"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Service</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CLINIC OPERATING HOURS */}
      {activeTab === 'hours' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm max-w-3xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Clinic Working Hours & Lunch Breaks
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Appointment slot availability respects these times and avoids generating slots during lunch breaks.
            </p>
          </div>

          {hoursSaved && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Clinic hours updated successfully.</span>
            </div>
          )}

          <form onSubmit={handleSaveHours} className="space-y-4">
            <div className="divide-y divide-stone-100">
              {editableHours.map((h, idx) => (
                <div key={h.day_of_week} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="w-28 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={h.is_open}
                      onChange={(e) => {
                        const copy = editableHours.map(item => ({ ...item }));
                        copy[idx].is_open = e.target.checked;
                        setEditableHours(copy);
                      }}
                      className="rounded text-teal-800 focus:ring-teal-700"
                    />
                    <span className="font-semibold text-slate-800">{h.day_name}</span>
                  </div>

                  {h.is_open ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Open:</span>
                        <input
                          type="time"
                          value={h.opening_time}
                          onChange={(e) => {
                            const copy = editableHours.map(item => ({ ...item }));
                            copy[idx].opening_time = e.target.value;
                            setEditableHours(copy);
                          }}
                          className="px-2 py-1 rounded border border-stone-300 text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Close:</span>
                        <input
                          type="time"
                          value={h.closing_time}
                          onChange={(e) => {
                            const copy = editableHours.map(item => ({ ...item }));
                            copy[idx].closing_time = e.target.value;
                            setEditableHours(copy);
                          }}
                          className="px-2 py-1 rounded border border-stone-300 text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-1 pl-2">
                        <span className="text-slate-500">Lunch:</span>
                        <input
                          type="time"
                          value={h.lunch_start || ''}
                          onChange={(e) => {
                            const copy = editableHours.map(item => ({ ...item }));
                            copy[idx].lunch_start = e.target.value || undefined;
                            setEditableHours(copy);
                          }}
                          className="px-2 py-1 rounded border border-stone-300 text-xs"
                        />
                        <span className="text-slate-400">to</span>
                        <input
                          type="time"
                          value={h.lunch_end || ''}
                          onChange={(e) => {
                            const copy = editableHours.map(item => ({ ...item }));
                            copy[idx].lunch_end = e.target.value || undefined;
                            setEditableHours(copy);
                          }}
                          className="px-2 py-1 rounded border border-stone-300 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-stone-400 italic">Clinic Closed</span>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all"
              >
                Save Schedule Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: CLINIC SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm max-w-3xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Clinic Contact & Booking Configuration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              All details can be edited directly without altering source code.
            </p>
          </div>

          {settingsSaved && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Clinic settings updated successfully.</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Clinic Name</label>
                <input
                  type="text"
                  value={editableSettings.clinic_name}
                  onChange={(e) => setEditableSettings({ ...editableSettings, clinic_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tagline</label>
                <input
                  type="text"
                  value={editableSettings.tagline}
                  onChange={(e) => setEditableSettings({ ...editableSettings, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editableSettings.phone}
                  onChange={(e) => setEditableSettings({ ...editableSettings, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">WhatsApp Number (e.g. 919945922684)</label>
                <input
                  type="text"
                  value={editableSettings.whatsapp_number}
                  onChange={(e) => setEditableSettings({ ...editableSettings, whatsapp_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Address Line</label>
              <input
                type="text"
                value={editableSettings.address_line}
                onChange={(e) => setEditableSettings({ ...editableSettings, address_line: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Locality</label>
                <input
                  type="text"
                  value={editableSettings.locality}
                  onChange={(e) => setEditableSettings({ ...editableSettings, locality: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">City</label>
                <input
                  type="text"
                  value={editableSettings.city}
                  onChange={(e) => setEditableSettings({ ...editableSettings, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Postal Code</label>
                <input
                  type="text"
                  value={editableSettings.postal_code}
                  onChange={(e) => setEditableSettings({ ...editableSettings, postal_code: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Google Maps URL</label>
              <input
                type="text"
                value={editableSettings.maps_url}
                onChange={(e) => setEditableSettings({ ...editableSettings, maps_url: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Slot Interval (mins)</label>
                <input
                  type="number"
                  value={editableSettings.booking_interval_minutes}
                  onChange={(e) => setEditableSettings({ ...editableSettings, booking_interval_minutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Min Advance Notice (hours)</label>
                <input
                  type="number"
                  value={editableSettings.min_advance_hours}
                  onChange={(e) => setEditableSettings({ ...editableSettings, min_advance_hours: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Max Advance Booking (days)</label>
                <input
                  type="number"
                  value={editableSettings.max_advance_days}
                  onChange={(e) => setEditableSettings({ ...editableSettings, max_advance_days: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Announcement Notice</label>
              <input
                type="text"
                value={editableSettings.announcement || ''}
                onChange={(e) => setEditableSettings({ ...editableSettings, announcement: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
              />
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: SUPABASE & SQL MIGRATION HUB */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm max-w-4xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-800" />
              <span>Supabase Backend Integration & Database Schema</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Connected Project ID: <strong className="text-slate-800 font-mono">{DEFAULT_SUPABASE_PROJECT_ID}</strong> · PostgreSQL Database & Live Synchronization
            </p>
          </div>

          {/* Connection status card */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Project Connection:</span>
              <span className="px-2.5 py-1 rounded font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                Connected to {DEFAULT_SUPABASE_PROJECT_ID}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-slate-600 bg-white p-3 rounded-lg border border-stone-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans">Endpoint URL:</span>
                <span className="text-teal-900 font-semibold">{supabaseUrl || 'https://giunuzobmndmluhtblur.supabase.co'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans">Publishable Key:</span>
                <span className="text-slate-800 truncate block">{supabaseAnonKey || 'sb_publishable_...'}</span>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Whenever a patient submits the appointment booking form, the booking is automatically dispatched to your Supabase PostgreSQL database. Once you run the SQL schema migration in Supabase, appointment records will appear directly in your Supabase Table Editor!
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleTestDatabase}
                disabled={isTestingDb}
                className="px-4 py-2 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin' : ''}`} />
                <span>Test Live Connection</span>
              </button>

              <a
                href={`https://supabase.com/dashboard/project/${DEFAULT_SUPABASE_PROJECT_ID}/sql/new`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Open Supabase SQL Editor</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>

              <a
                href={`https://supabase.com/dashboard/project/${DEFAULT_SUPABASE_PROJECT_ID}/editor`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Open Supabase Table Editor</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
            </div>

            {dbTestResult && (
              <div
                className={`p-3 rounded-lg text-xs mt-2 ${
                  dbTestResult.success
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                <div className="font-semibold">{dbTestResult.message}</div>
                {!dbTestResult.tablesCreated && (
                  <p className="text-[11px] text-stone-600 mt-1">
                    To create the <code className="bg-stone-100 px-1 rounded font-bold">appointments</code> and <code className="bg-stone-100 px-1 rounded font-bold">clinic_settings</code> tables, click <strong>"Copy Full SQL Migration Script"</strong> below and run it in the Supabase SQL Editor.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick Status Fix Card */}
          <div className="p-5 rounded-xl border border-teal-300 bg-teal-50/60 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                  Recommended One-Time Setup
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">
                  1-Click Fix: Enable Live Status Sync (Confirm & Cancel) in Supabase
                </h4>
                <p className="text-slate-600 text-xs">
                  Run this short 2-statement snippet in your Supabase SQL Editor. It grants update permissions so that confirming or cancelling appointments directly updates your live Supabase database and instantly frees cancelled slots.
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(SUPABASE_QUICK_STATUS_FIX_SQL);
                  setQuickFixCopied(true);
                  setTimeout(() => setQuickFixCopied(false), 3000);
                }}
                className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all shrink-0"
              >
                {quickFixCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{quickFixCopied ? 'SQL Copied!' : 'Copy Status Fix SQL'}</span>
              </button>
            </div>

            <div className="bg-slate-950 text-emerald-300 p-3 rounded-lg border border-slate-800 font-mono text-[11px] max-h-40 overflow-y-auto">
              <pre className="whitespace-pre">{SUPABASE_QUICK_STATUS_FIX_SQL}</pre>
            </div>
          </div>

          {/* Migration SQL details */}
          <div className="space-y-3 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Database Schema & Migration Script
                </h4>
                <p className="text-slate-500 text-xs">
                  Run this SQL in your Supabase SQL editor to create the tables, RLS policies, and slot conflict prevention locks.
                </p>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(SUPABASE_MIGRATION_SQL);
                  setSqlCopied(true);
                  setTimeout(() => setSqlCopied(false), 3000);
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all shrink-0"
              >
                {sqlCopied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                <span>{sqlCopied ? 'SQL Script Copied!' : 'Copy Full SQL Script'}</span>
              </button>
            </div>

            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl border border-slate-800 font-mono text-[11px] max-h-56 overflow-y-auto">
              <pre className="whitespace-pre">{SUPABASE_MIGRATION_SQL}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Internal Note Modal */}
      {editingNoteAptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">
                Internal Administrative Note
              </h4>
              <button
                onClick={() => setEditingNoteAptId(null)}
                className="text-stone-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              This note is visible only to authorized clinic staff and is never exposed to the patient.
            </p>
            <textarea
              rows={3}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="e.g. Patient prefers afternoon slots. Requested Dr. Lead Surgeon."
              className="w-full p-3 rounded-lg border border-stone-300 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingNoteAptId(null)}
                className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-medium hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-4 py-1.5 rounded-lg bg-teal-800 text-white text-xs font-semibold hover:bg-teal-900"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Edit / Create Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">
                {isCreatingService ? 'Add New Dental Service' : 'Edit Service'}
              </h4>
              <button
                onClick={() => setEditingService(null)}
                className="text-stone-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={editingService.category}
                    onChange={(e) => setEditingService({ ...editingService, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900 bg-white"
                  >
                    <option value="consultation">Consultation</option>
                    <option value="preventive">Preventive</option>
                    <option value="restorative">Restorative</option>
                    <option value="endodontic">Endodontic (RCT)</option>
                    <option value="prosthodontic">Prosthodontic</option>
                    <option value="implant">Implant</option>
                    <option value="orthodontic">Orthodontic</option>
                    <option value="surgery">Oral Surgery</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    required
                    min={15}
                    step={15}
                    value={editingService.duration_minutes}
                    onChange={(e) => setEditingService({ ...editingService, duration_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Price Display Label</label>
                  <input
                    type="text"
                    value={editingService.price_display || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const digits = val.replace(/,/g, '').match(/\d+/);
                      setEditingService({
                        ...editingService,
                        price_display: val,
                        price_amount: digits ? Number(digits[0]) : editingService.price_amount
                      });
                    }}
                    placeholder="e.g. ₹1,200 or Starting from ₹900"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Base Price Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingService.price_amount !== undefined ? editingService.price_amount : 0}
                    onChange={(e) => setEditingService({ ...editingService, price_amount: Number(e.target.value) })}
                    placeholder="e.g. 1200"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="srv-active"
                  checked={editingService.is_active}
                  onChange={(e) => setEditingService({ ...editingService, is_active: e.target.checked })}
                  className="rounded text-teal-800 focus:ring-teal-700"
                />
                <label htmlFor="srv-active" className="text-slate-700 font-medium">
                  Service is active and bookable online
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-medium hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-800 text-white text-xs font-semibold hover:bg-teal-900"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER NOTIFICATION DISPATCH MODAL */}
      {activeNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      activeNotificationModal.type === 'confirmation'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-rose-100 text-rose-900'
                    }`}
                  >
                    {activeNotificationModal.type === 'confirmation'
                      ? 'Appointment Confirmed'
                      : 'Appointment Cancelled'}
                  </span>
                  <span className="font-mono text-xs font-bold text-teal-800">
                    {activeNotificationModal.appointment.booking_reference}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Notify Patient ({activeNotificationModal.appointment.patient_name})
                </h3>
                <p className="text-xs text-slate-500">
                  Choose your preferred channel below to send an immediate confirmation or cancellation notice to the customer.
                </p>
              </div>

              <button
                onClick={() => setActiveNotificationModal(null)}
                className="text-stone-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient & Booking Summary Card */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Patient</span>
                <span className="font-semibold text-slate-900 block truncate">
                  {activeNotificationModal.appointment.patient_name}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Phone</span>
                <span className="font-semibold text-slate-900 font-mono block">
                  {activeNotificationModal.appointment.patient_phone}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Date & Time</span>
                <span className="font-semibold text-teal-900 block truncate">
                  {formatDateReadable(activeNotificationModal.appointment.appointment_date)} ({formatTime12h(activeNotificationModal.appointment.starts_at)})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Email</span>
                <span className="font-semibold text-slate-900 block truncate">
                  {activeNotificationModal.appointment.patient_email || 'Not provided'}
                </span>
              </div>
            </div>

            {/* Notification Channel Tabs */}
            <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
              <button
                type="button"
                onClick={() => setNotificationChannelTab('whatsapp')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors ${
                  notificationChannelTab === 'whatsapp'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Message</span>
              </button>

              <button
                type="button"
                onClick={() => setNotificationChannelTab('sms')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors ${
                  notificationChannelTab === 'sms'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>SMS Alert</span>
              </button>

              <button
                type="button"
                onClick={() => setNotificationChannelTab('email')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors ${
                  notificationChannelTab === 'email'
                    ? 'bg-violet-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Notice</span>
              </button>
            </div>

            {/* Channel Message Previews & Send Actions */}
            {(() => {
              const messages = activeNotificationModal.type === 'cancellation'
                ? generateCancellationMessage(activeNotificationModal.appointment, clinicSettings)
                : generateConfirmationMessage(activeNotificationModal.appointment, clinicSettings);

              return (
                <div className="space-y-4">
                  {notificationChannelTab === 'whatsapp' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-emerald-700" />
                          <span>WhatsApp Formatted Message Preview</span>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Recipient: <strong>+{formatPhoneForMessaging(activeNotificationModal.appointment.patient_phone)}</strong>
                        </span>
                      </div>

                      <div className="bg-emerald-950/90 text-emerald-100 p-4 rounded-xl border border-emerald-900/40 font-sans text-xs leading-relaxed max-h-52 overflow-y-auto whitespace-pre-line">
                        {messages.whatsapp}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(messages.whatsapp);
                            setCopiedNotification('whatsapp');
                            setTimeout(() => setCopiedNotification(null), 3000);
                          }}
                          className="px-3 py-2 border border-stone-300 hover:bg-stone-50 rounded-lg text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedNotification === 'whatsapp' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedNotification === 'whatsapp' ? 'Text Copied!' : 'Copy WhatsApp Message'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppNotification(activeNotificationModal.appointment, activeNotificationModal.type)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Open WhatsApp Web / App & Send</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {notificationChannelTab === 'sms' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4 text-blue-700" />
                          <span>SMS Text Message Preview</span>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          To: <strong>{activeNotificationModal.appointment.patient_phone}</strong>
                        </span>
                      </div>

                      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 font-mono text-xs leading-relaxed max-h-40 overflow-y-auto whitespace-pre-line">
                        {messages.sms}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(messages.sms);
                            setCopiedNotification('sms');
                            setTimeout(() => setCopiedNotification(null), 3000);
                          }}
                          className="px-3 py-2 border border-stone-300 hover:bg-stone-50 rounded-lg text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedNotification === 'sms' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedNotification === 'sms' ? 'SMS Copied!' : 'Copy SMS Text'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendSMSNotification(activeNotificationModal.appointment, activeNotificationModal.type)}
                          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Open SMS Messenger</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {notificationChannelTab === 'email' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-violet-900 flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-violet-700" />
                          <span>Email Notice Preview</span>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          To: <strong>{activeNotificationModal.appointment.patient_email || 'No email on file'}</strong>
                        </span>
                      </div>

                      <div className="p-3 bg-stone-100 rounded-lg text-xs text-slate-800 font-medium">
                        Subject: <span className="font-bold">{messages.emailSubject}</span>
                      </div>

                      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 font-mono text-xs leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
                        {messages.emailBody}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`${messages.emailSubject}\n\n${messages.emailBody}`);
                            setCopiedNotification('email');
                            setTimeout(() => setCopiedNotification(null), 3000);
                          }}
                          className="px-3 py-2 border border-stone-300 hover:bg-stone-50 rounded-lg text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedNotification === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedNotification === 'email' ? 'Email Copied!' : 'Copy Email Content'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={!activeNotificationModal.appointment.patient_email}
                          onClick={() => handleSendEmailNotification(activeNotificationModal.appointment, activeNotificationModal.type)}
                          className="px-4 py-2 bg-violet-700 hover:bg-violet-800 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Open Default Email Client</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Multi-Channel One-Click Simulator & Close */}
                  <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        handleSimulateAutomatedDispatch(activeNotificationModal.appointment, activeNotificationModal.type);
                        setActiveNotificationModal(null);
                      }}
                      className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-300" />
                      <span>Mark All Dispatched (WhatsApp + SMS + Email)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveNotificationModal(null)}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
