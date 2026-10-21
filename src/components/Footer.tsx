import React from 'react';
import { Phone, MapPin, Clock, MessageSquare, ArrowUpRight } from 'lucide-react';
import { ClinicSettings, ClinicHours } from '../types';
import { getGroupedClinicHours } from '../lib/timeUtils';

interface FooterProps {
  onNavigate: (tab: string) => void;
  clinicSettings: ClinicSettings;
  clinicHours: ClinicHours[];
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, clinicSettings, clinicHours }) => {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand & Positioning */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-base">
                JS
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-base leading-tight">
                  Just Smile Dental
                </span>
                <span className="text-teal-400 text-xs font-medium">
                  & Implant Centre
                </span>
              </div>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              Your neighbourhood dental clinic in {clinicSettings.locality || 'Bengaluru'}. Providing comfortable routine checkups, painless root canals, and modern implant treatments with transparency and care.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-stone-400">
              <span className="text-emerald-400 font-medium">Verified Local Clinic</span>
              <span>·</span>
              <span>{clinicSettings.locality ? `${clinicSettings.locality}, ` : ''}{clinicSettings.city}</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 tracking-wide">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('services')}
                  className="hover:text-teal-400 transition-colors cursor-pointer text-left"
                >
                  Dental Treatments & Services
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-teal-400 transition-colors cursor-pointer text-left"
                >
                  About the Clinic & Dentists
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-teal-400 transition-colors cursor-pointer text-left"
                >
                  Clinic Hours & Directions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('lookup')}
                  className="hover:text-teal-400 transition-colors cursor-pointer text-left"
                >
                  Check Appointment Status
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-teal-400 transition-colors cursor-pointer text-left"
                >
                  Clinic Staff Portal
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-teal-400 transition-colors cursor-pointer text-left"
                >
                  Privacy Policy & Patient Data
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Hours & Timing */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 tracking-wide flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>Clinic Hours</span>
            </h4>
            <div className="space-y-2 text-sm text-stone-300">
              {getGroupedClinicHours(clinicHours).map((group, idx) => (
                <div key={idx} className="py-1.5 border-b border-stone-800 last:border-b-0 space-y-0.5">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-stone-300 font-medium">{group.daysLabel}</span>
                    <span className="font-semibold text-stone-100">{group.timeRange}</span>
                  </div>
                  {group.lunchBreak ? (
                    <div className="flex justify-between items-center text-xs text-stone-400">
                      <span>Lunch Break:</span>
                      <span className="text-teal-400 font-medium">{group.lunchBreak}</span>
                    </div>
                  ) : group.isOpen ? (
                    <div className="text-[11px] text-stone-400">
                      (No lunch break)
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-3">
              Prior appointment booking ensures zero waiting time in the clinic lounge.
            </p>
          </div>

          {/* Col 4: Contact & Directions */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4 tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-400" />
              <span>Location & Contact</span>
            </h4>
            <p className="text-xs text-stone-300 leading-relaxed mb-4">
              {clinicSettings.address_line}, {clinicSettings.locality}, {clinicSettings.city}, Karnataka {clinicSettings.postal_code}
            </p>
            <div className="space-y-2.5">
              <a
                href={`tel:${clinicSettings.phone.replace(/\s+/g, '')}`}
                className="flex items-center gap-2.5 text-sm font-medium text-stone-200 hover:text-teal-400 transition-colors"
              >
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{clinicSettings.phone}</span>
              </a>
              <a
                href={`https://wa.me/${clinicSettings.whatsapp_number}?text=Hello%20Just%20Smile%20Dental%20Clinic,%20I%20would%20like%20to%20inquire%20about%20an%20appointment.`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>Chat on WhatsApp</span>
              </a>
              <a
                href={clinicSettings.maps_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 transition-colors pt-1"
              >
                <span>Open in Google Maps</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p>© {new Date().getFullYear()} Just Smile Dental Clinic & Implant Centre. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('privacy')}
              className="hover:text-stone-300 transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="hover:text-stone-300 transition-colors"
            >
              Directions
            </button>
            <button
              onClick={() => onNavigate('admin')}
              className="hover:text-stone-300 transition-colors"
            >
              Staff Login
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
