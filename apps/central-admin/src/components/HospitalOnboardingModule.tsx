import React, { useState } from 'react';
import { Building2, CheckCircle2, Clock, ShieldAlert, Plus, Search, Filter, ExternalLink, Activity, Server, FileText, ArrowRight, Layers, Lock, Cpu } from 'lucide-react';

interface HospitalFacility {
  id: string;
  code: string;
  name: string;
  type: 'Government General' | 'AIIMS' | 'District Hospital' | 'Medical College' | 'Private Super-specialty';
  state: string;
  district: string;
  status: 'Pending' | 'Under Verification' | 'Approved' | 'Provisioned' | 'Operational';
  kiosksCount: number;
  abdmStatus: 'Connected' | 'Pending Verification' | 'Not Configured';
  fhirEndpoint: string;
  doctorCapacity: number;
  operatingHours: string;
  languages: string[];
  submittedDate: string;
}

const INITIAL_FACILITIES: HospitalFacility[] = [
  {
    id: 'FAC-DEL-001',
    code: 'HOSP-DEL-AIIMS',
    name: 'AIIMS New Delhi — Main OPD Block',
    type: 'AIIMS',
    state: 'Delhi NCR',
    district: 'New Delhi',
    status: 'Operational',
    kiosksCount: 42,
    abdmStatus: 'Connected',
    fhirEndpoint: 'https://fhir.aiims.edu/r4/v1',
    doctorCapacity: 350,
    operatingHours: '24/7 OPD & Emergency',
    languages: ['Hindi', 'English', 'Punjabi'],
    submittedDate: '2026-08-01',
  },
  {
    id: 'FAC-MH-014',
    code: 'HOSP-MH-KEM',
    name: 'KEM Hospital & Seth GS Medical College',
    type: 'Medical College',
    state: 'Maharashtra',
    district: 'Mumbai City',
    status: 'Operational',
    kiosksCount: 28,
    abdmStatus: 'Connected',
    fhirEndpoint: 'https://fhir.kem.edu.in/api/v2',
    doctorCapacity: 220,
    operatingHours: '08:00 AM - 08:00 PM',
    languages: ['Marathi', 'Hindi', 'English', 'Gujarati'],
    submittedDate: '2026-08-10',
  },
  {
    id: 'FAC-KA-008',
    code: 'HOSP-KA-BOWRING',
    name: 'Bowring & Lady Curzon Hospital',
    type: 'District Hospital',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    status: 'Provisioned',
    kiosksCount: 15,
    abdmStatus: 'Connected',
    fhirEndpoint: 'https://fhir.karnataka.gov.in/bowring',
    doctorCapacity: 110,
    operatingHours: '08:00 AM - 06:00 PM',
    languages: ['Kannada', 'English', 'Tamil', 'Telugu'],
    submittedDate: '2026-08-20',
  },
  {
    id: 'FAC-UP-042',
    code: 'HOSP-UP-VARANASI',
    name: 'Varanasi District Civil Hospital',
    type: 'District Hospital',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    status: 'Under Verification',
    kiosksCount: 12,
    abdmStatus: 'Pending Verification',
    fhirEndpoint: 'https://fhir-preview.up.gov.in/varanasi',
    doctorCapacity: 85,
    operatingHours: '08:00 AM - 05:00 PM',
    languages: ['Hindi', 'Bhojpuri', 'English'],
    submittedDate: '2026-09-02',
  },
  {
    id: 'FAC-TN-019',
    code: 'HOSP-TN-MADURAI',
    name: 'Government Rajaji Hospital Madurai',
    type: 'Government General',
    state: 'Tamil Nadu',
    district: 'Madurai',
    status: 'Pending',
    kiosksCount: 20,
    abdmStatus: 'Not Configured',
    fhirEndpoint: 'Pending Assignment',
    doctorCapacity: 160,
    operatingHours: '07:00 AM - 09:00 PM',
    languages: ['Tamil', 'English'],
    submittedDate: '2026-09-05',
  },
];

export function HospitalOnboardingModule() {
  const [facilities, setFacilities] = useState<HospitalFacility[]>(INITIAL_FACILITIES);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedFacility, setSelectedFacility] = useState<HospitalFacility | null>(facilities[0]);
  const [showNewModal, setShowNewModal] = useState(false);

  const filteredFacilities = facilities.filter(f => {
    if (statusFilter === 'All') return true;
    return f.status === statusFilter;
  });

  const updateStatus = (id: string, newStatus: HospitalFacility['status']) => {
    setFacilities(facilities.map(f => f.id === id ? { ...f, status: newStatus } : f));
    if (selectedFacility && selectedFacility.id === id) {
      setSelectedFacility({ ...selectedFacility, status: newStatus });
    }
  };

  const statusBadgeColor = (status: HospitalFacility['status']) => {
    switch (status) {
      case 'Operational': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Provisioned': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Approved': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Under Verification': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Pending': return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 font-display">
            <Building2 className="text-blue-600" />
            Hospital & Facility Registry (National Onboarding)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Central Authority Governance • 5-Stage Approval Pipeline (`Pending` → `Under Verification` → `Approved` → `Provisioned` → `Operational`)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all duration-200"
        >
          <Plus size={16} />
          Register New Facility
        </button>
      </div>

      {/* Onboarding Lifecycle Pipeline Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Pending Request', count: facilities.filter(f => f.status === 'Pending').length, color: 'border-purple-200 bg-purple-50 text-purple-700' },
          { label: 'Under Verification', count: facilities.filter(f => f.status === 'Under Verification').length, color: 'border-amber-200 bg-amber-50 text-amber-700' },
          { label: 'Approved', count: facilities.filter(f => f.status === 'Approved').length, color: 'border-cyan-200 bg-cyan-50 text-cyan-700' },
          { label: 'Provisioned', count: facilities.filter(f => f.status === 'Provisioned').length, color: 'border-blue-200 bg-blue-50 text-blue-700' },
          { label: 'Operational', count: facilities.filter(f => f.status === 'Operational').length, color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
        ].map((item, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl border ${item.color} flex flex-col justify-between animate-slide-up stagger-item transition-all duration-200 hover:shadow-md`}
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{item.label}</span>
            <div className="text-3xl font-extrabold font-mono mt-2">{item.count}</div>
          </div>
        ))}
      </div>

      {/* Main Grid: List + Detail View */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Facility List */}
        <div className="col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by hospital name, facility code, or state..."
                className="w-full bg-slate-100 border border-transparent rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:bg-white focus:border-blue-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-100 border border-transparent rounded-xl px-3 py-2 text-xs text-slate-700 transition-all duration-200 focus:outline-none focus:bg-white focus:border-blue-400"
            >
              <option value="All">All Pipeline Stages</option>
              <option value="Pending">Pending</option>
              <option value="Under Verification">Under Verification</option>
              <option value="Approved">Approved</option>
              <option value="Provisioned">Provisioned</option>
              <option value="Operational">Operational</option>
            </select>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
            {filteredFacilities.map((fac, idx) => (
              <div
                key={fac.id}
                onClick={() => setSelectedFacility(fac)}
                className={`p-4 rounded-xl border cursor-pointer animate-slide-up stagger-item transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  selectedFacility?.id === fac.id
                    ? 'bg-blue-50 border-blue-300 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:bg-white'
                }`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{fac.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{fac.code}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {fac.district}, {fac.state} • <span className="text-blue-600 font-medium">{fac.type}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${statusBadgeColor(fac.status)}`}>
                    {fac.status}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Kiosks Allocated: <strong className="text-slate-900 font-mono">{fac.kiosksCount}</strong></span>
                  <span>ABDM: <strong className={fac.abdmStatus === 'Connected' ? 'text-emerald-600' : 'text-amber-600'}>{fac.abdmStatus}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Selected Facility Deep Governance */}
        <div className="col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 animate-fade-in">
          {selectedFacility ? (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedFacility.id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadgeColor(selectedFacility.status)}`}>
                    {selectedFacility.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-2 leading-tight">{selectedFacility.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{selectedFacility.type} • {selectedFacility.state}</p>
              </div>

              {/* Workflow State Advance Actions */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Central Authority Pipeline Control</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateStatus(selectedFacility.id, 'Under Verification')}
                    className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-lg hover:bg-amber-100 transition-all duration-200"
                  >
                    Verify Documents
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(selectedFacility.id, 'Approved')}
                    className="px-2.5 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200 text-[10px] font-bold rounded-lg hover:bg-cyan-100 transition-all duration-200"
                  >
                    Approve Facility
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(selectedFacility.id, 'Provisioned')}
                    className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-lg hover:bg-blue-100 transition-all duration-200"
                  >
                    Provision Endpoints
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(selectedFacility.id, 'Operational')}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-lg hover:bg-emerald-100 transition-all duration-200"
                  >
                    Set Operational
                  </button>
                </div>
              </div>

              {/* Technical Infrastructure Settings */}
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-2">
                    <Server size={14} className="text-blue-600" />
                    FHIR R4 Gateway Endpoint
                  </div>
                  <div className="font-mono text-[11px] text-blue-700 bg-slate-100 p-2 rounded-lg break-all">
                    {selectedFacility.fhirEndpoint}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Doctor Capacity</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">{selectedFacility.doctorCapacity} On Duty</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Kiosk Fleet</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">{selectedFacility.kiosksCount} Terminals</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 block">Supported Native Languages</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedFacility.languages.map((lang) => (
                      <span key={lang} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold rounded-md">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-700 flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>ABDM Health Facility Registry (HFR) Id Linked</span>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">Select a facility to inspect registration details</div>
          )}
        </div>
      </div>
    </div>
  );
}
