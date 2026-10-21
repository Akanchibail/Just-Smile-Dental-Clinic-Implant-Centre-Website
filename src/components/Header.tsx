import React, { useState } from 'react';
import { Calendar, Phone, Menu, X, Clock, MapPin, ShieldCheck } from 'lucide-react';
import { ClinicSettings, ClinicHours } from '../types';
import { getHeaderHoursSummary } from '../lib/timeUtils';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string, serviceId?: string) => void;
  onOpenBooking: (serviceId?: string) => void;
  clinicSettings: ClinicSettings;
  clinicHours: ClinicHours[];
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  onOpenBooking,
  clinicSettings,
  clinicHours
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'services', label: 'Services' },
    { id: 'about', label: 'About & Doctors' },
    { id: 'contact', label: 'Hours & Location' },
    { id: 'lookup', label: 'Check Appointment' },
    { id: 'admin', label: 'Staff Portal' }
  ];

  const handleLinkClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const hoursSummary = getHeaderHoursSummary(clinicHours);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Top micro-bar for quick contact info */}
      <div className="bg-stone-900 text-stone-200 text-xs py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>{clinicSettings.locality ? `${clinicSettings.locality}, ` : ''}{clinicSettings.city}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{hoursSummary}</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`tel:${clinicSettings.phone.replace(/\s+/g, '')}`}
              className="flex items-center gap-1.5 hover:text-teal-300 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-teal-400" />
              <span>{clinicSettings.phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main 3-Zone Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-18">
          {/* Zone 1: Single Brand Wordmark */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left group shrink-0 focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-teal-900 transition-colors">
              JS
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap leading-tight group-hover:text-teal-900 transition-colors">
                Just Smile Dental
              </span>
              <span className="text-[11px] font-medium text-teal-800 tracking-wider uppercase whitespace-nowrap">
                & Implant Centre
              </span>
            </div>
          </button>

          {/* Zone 2: 4-5 Clean Single-Line Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 relative ${
                    isActive
                      ? 'text-teal-800 font-semibold'
                      : 'hover:text-slate-900 text-slate-600'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-[-18px] left-0 right-0 h-0.5 bg-teal-800 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <button
              onClick={() => onOpenBooking()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-teal-800 hover:bg-teal-900 active:scale-[0.99] transition-all shadow-sm whitespace-nowrap cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => onOpenBooking()}
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 whitespace-nowrap"
            >
              Book
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-stone-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id)}
              className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                currentTab === link.id
                  ? 'bg-teal-50 text-teal-900 font-semibold'
                  : 'text-slate-700 hover:bg-stone-50'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
            <a
              href={`tel:${clinicSettings.phone.replace(/\s+/g, '')}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg text-sm font-medium border border-stone-300 text-slate-800 hover:bg-stone-50"
            >
              <Phone className="w-4 h-4 text-teal-700" />
              <span>Call {clinicSettings.phone}</span>
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg text-sm font-semibold bg-teal-800 text-white hover:bg-teal-900"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment Online</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
