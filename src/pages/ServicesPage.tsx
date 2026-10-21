import React, { useState, useMemo } from 'react';
import { Clock, Search, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Service, ClinicSettings } from '../types';

interface ServicesPageProps {
  services: Service[];
  clinicSettings: ClinicSettings;
  onOpenBooking: (serviceId?: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({
  services,
  clinicSettings,
  onOpenBooking
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: 'All Treatments' },
    { id: 'consultation', label: 'Consultations' },
    { id: 'preventive', label: 'Cleanings & Preventive' },
    { id: 'restorative', label: 'Fillings' },
    { id: 'endodontic', label: 'Root Canal' },
    { id: 'implant', label: 'Implants' },
    { id: 'prosthodontic', label: 'Crowns & Dentures' },
    { id: 'orthodontic', label: 'Braces' },
    { id: 'surgery', label: 'Oral Surgery' }
  ];

  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      const matchesCategory =
        selectedCategory === 'all' || srv.category === selectedCategory;
      const matchesSearch =
        srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        srv.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
          Comprehensive Dental Directory
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Dental Services & Treatments
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          From preventive scaling and cavity restorations to single-tooth implants and complex endodontics, explore treatments delivered with gentle clinical precision.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
        {/* Category Segmented Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-800 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-stone-200 hover:border-teal-500 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search treatments..."
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-stone-300 text-xs text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-teal-700 bg-white"
          />
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
          <p className="text-slate-600 text-sm">No services matched your search or category filter.</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="mt-3 text-xs font-semibold text-teal-800 hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl border border-stone-200 p-6 flex flex-col justify-between hover:border-teal-500 hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider">
                    {service.category}
                  </span>
                  <span className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                    <span>{service.duration_minutes} mins</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                  {service.name}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-600 block">Consultation / Starting Fee</span>
                  <span className="text-xs font-bold text-slate-900">
                    {service.price_display || 'Contact clinic'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenBooking(service.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-teal-800 text-white hover:bg-teal-900 transition-all cursor-pointer shadow-sm"
                >
                  <span>Book This Service</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transparent Pricing & Medical Advice Notice */}
      <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200/80 text-xs text-slate-600 space-y-2">
        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span>Note on Clinical Treatment Durations & Starting Fees</span>
        </h4>
        <p className="leading-relaxed">
          Stated durations are estimated clinical times for single appointments. Complex procedures such as multi-rooted root canals, multi-unit dental bridges, or dental implant surgical placements may require multiple stages or specialized 3D scans. Transparent fee estimates are discussed and approved by the patient prior to starting clinical treatment.
        </p>
      </div>
    </div>
  );
};
