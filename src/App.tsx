import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BookingModal } from './components/BookingModal';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { BookingLookupPage } from './pages/BookingLookupPage';
import { AdminPage } from './pages/AdminPage';
import { PrivacyPage } from './pages/PrivacyPage';
import {
  Service,
  Practitioner,
  ClinicHours,
  ClinicSettings,
  Appointment,
  AppointmentStatus,
  PatientInquiry,
  InquiryStatus
} from './types';
import {
  fetchClinicSettings,
  fetchServices,
  fetchPractitioners,
  fetchClinicHours,
  fetchAppointments,
  updateAppointmentStatus,
  fetchPatientInquiries,
  updateInquiryStatus,
  updateClinicHours,
  updateClinicSettings,
  saveService
} from './lib/api';
import {
  INITIAL_CLINIC_SETTINGS,
  INITIAL_SERVICES,
  INITIAL_PRACTITIONERS,
  INITIAL_CLINIC_HOURS,
  INITIAL_APPOINTMENTS,
  INITIAL_INQUIRIES
} from './lib/mockData';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | undefined>(undefined);

  // Core data states
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(INITIAL_CLINIC_SETTINGS);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [practitioners, setPractitioners] = useState<Practitioner[]>(INITIAL_PRACTITIONERS);
  const [clinicHours, setClinicHours] = useState<ClinicHours[]>(INITIAL_CLINIC_HOURS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [inquiries, setInquiries] = useState<PatientInquiry[]>(INITIAL_INQUIRIES);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Notification message
  const [toastMessage, setToastMessage] = useState<string>('');

  const loadAllData = async () => {
    try {
      const [settingsData, servicesData, practitionersData, hoursData, appointmentsData, inquiriesData] = await Promise.all([
        fetchClinicSettings(),
        fetchServices(true),
        fetchPractitioners(true),
        fetchClinicHours(),
        fetchAppointments(),
        fetchPatientInquiries()
      ]);

      if (settingsData) setClinicSettings(settingsData);
      if (servicesData && servicesData.length > 0) setServices(servicesData);
      if (practitionersData && practitionersData.length > 0) setPractitioners(practitionersData);
      if (hoursData && hoursData.length > 0) setClinicHours(hoursData);
      if (appointmentsData) setAppointments(appointmentsData);
      if (inquiriesData) setInquiries(inquiriesData);
    } catch (e) {
      console.warn('Error loading clinic data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleOpenBooking = (serviceId?: string) => {
    setPreselectedServiceId(serviceId);
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    setPreselectedServiceId(undefined);
  };

  const handleNavigate = (tab: string, serviceId?: string) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (serviceId) {
      handleOpenBooking(serviceId);
    }
  };

  const handleBookingSuccess = (newApt: Appointment) => {
    setAppointments((prev) => [newApt, ...prev]);
    setToastMessage(`Booking request registered for ${newApt.patient_name} (Ref: ${newApt.booking_reference})`);
    setTimeout(() => setToastMessage(''), 5000);
  };

  const handleInquirySubmitted = (newInquiry: PatientInquiry) => {
    setInquiries((prev) => [newInquiry, ...prev]);
    setToastMessage(`Inquiry from ${newInquiry.patient_name} submitted directly to clinic front desk.`);
    setTimeout(() => setToastMessage(''), 5000);
  };

  const handleUpdateInquiryStatus = async (
    id: string,
    status: InquiryStatus,
    adminNotes?: string
  ): Promise<{ success: boolean }> => {
    // Optimistic update
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === id
          ? {
              ...inq,
              status,
              admin_notes: adminNotes !== undefined ? adminNotes : inq.admin_notes,
              updated_at: new Date().toISOString()
            }
          : inq
      )
    );
    const res = await updateInquiryStatus(id, status, adminNotes);
    return res;
  };

  const handleUpdateClinicHours = async (newHours: ClinicHours[]): Promise<{ success: boolean }> => {
    // 1. Instant optimistic update so booking modal reflects updated hours immediately
    setClinicHours(newHours);
    // 2. Persist to storage and Supabase
    const res = await updateClinicHours(newHours);
    setToastMessage('Clinic operating schedule and lunch break updated successfully.');
    setTimeout(() => setToastMessage(''), 4000);
    return res;
  };

  const handleUpdateClinicSettings = async (newSettings: ClinicSettings): Promise<{ success: boolean }> => {
    // 1. Instant optimistic React state update so all pages, modals, Header, and Footer update immediately
    setClinicSettings(newSettings);
    // 2. Persist to storage & Supabase
    const res = await updateClinicSettings(newSettings);
    setToastMessage('Clinic settings, contact info, and booking parameters updated successfully.');
    setTimeout(() => setToastMessage(''), 4000);
    return res;
  };

  const handleSaveService = async (service: Service): Promise<{ success: boolean }> => {
    // 1. Instant optimistic update so services page, booking modal, etc. update immediately
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === service.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = service;
        return copy;
      }
      return [...prev, service];
    });
    // 2. Persist to storage & Supabase
    const res = await saveService(service);
    setToastMessage(`Dental service "${service.name}" updated successfully.`);
    setTimeout(() => setToastMessage(''), 4000);
    return res;
  };

  const handleAppointmentStatusChange = async (
    id: string,
    newStatus: AppointmentStatus,
    note?: string
  ): Promise<{ success: boolean; backendUpdated: boolean; appointment?: Appointment; error?: string }> => {
    // 1. Optimistic instant React state update
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === id || apt.booking_reference === id
          ? {
              ...apt,
              status: newStatus,
              internal_admin_note: note !== undefined ? note : apt.internal_admin_note,
              updated_at: new Date().toISOString()
            }
          : apt
      )
    );

    // 2. Feedback toast message
    if (newStatus === 'cancelled') {
      setToastMessage(`Appointment marked as cancelled. That time slot is now available back on the website.`);
    } else if (newStatus === 'confirmed') {
      setToastMessage(`Appointment confirmed successfully.`);
    } else if (newStatus === 'completed') {
      setToastMessage(`Appointment marked as completed.`);
    }
    setTimeout(() => setToastMessage(''), 5000);

    // 3. Persist to Supabase RPC, direct update, and localStorage overrides
    const res = await updateAppointmentStatus(id, newStatus, note);

    // 4. Sync data from server in background
    loadAllData();
    return res;
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-slate-800 font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-teal-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-medium border border-teal-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Header with 3-Zone top bar contract */}
      <Header
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenBooking={handleOpenBooking}
        clinicSettings={clinicSettings}
        clinicHours={clinicHours}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            services={services}
            clinicSettings={clinicSettings}
            clinicHours={clinicHours}
            onOpenBooking={handleOpenBooking}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'services' && (
          <ServicesPage
            services={services}
            clinicSettings={clinicSettings}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {currentTab === 'about' && (
          <AboutPage
            practitioners={practitioners}
            clinicSettings={clinicSettings}
            onOpenBooking={() => handleOpenBooking()}
          />
        )}

        {currentTab === 'contact' && (
          <ContactPage
            clinicSettings={clinicSettings}
            clinicHours={clinicHours}
            onOpenBooking={() => handleOpenBooking()}
            onInquirySubmitted={handleInquirySubmitted}
          />
        )}

        {currentTab === 'lookup' && (
          <BookingLookupPage
            clinicSettings={clinicSettings}
            onOpenBooking={() => handleOpenBooking()}
            onAppointmentCancelled={(id) => handleAppointmentStatusChange(id, 'cancelled')}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPage
            appointments={appointments}
            inquiries={inquiries}
            services={services}
            practitioners={practitioners}
            clinicHours={clinicHours}
            clinicSettings={clinicSettings}
            onRefreshData={loadAllData}
            onUpdateStatus={handleAppointmentStatusChange}
            onUpdateInquiryStatus={handleUpdateInquiryStatus}
            onUpdateClinicHours={handleUpdateClinicHours}
            onUpdateClinicSettings={handleUpdateClinicSettings}
            onSaveService={handleSaveService}
          />
        )}

        {currentTab === 'privacy' && (
          <PrivacyPage clinicSettings={clinicSettings} />
        )}
      </main>

      {/* Guided Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
        services={services.filter((s) => s.is_active)}
        practitioners={practitioners.filter((p) => p.is_active)}
        clinicHours={clinicHours}
        clinicSettings={clinicSettings}
        existingAppointments={appointments}
        preselectedServiceId={preselectedServiceId}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        clinicSettings={clinicSettings}
        clinicHours={clinicHours}
      />
    </div>
  );
}
