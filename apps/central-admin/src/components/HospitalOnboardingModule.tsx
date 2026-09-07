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
      case 'Operational': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Provisioned': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Approved': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'Under Verification': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Pending': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Building2 className="text-blue-400" />
            Hospital & Facility Registry (National Onboarding)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Central Authority Governance • 5-Stage Approval Pipeline (`Pending` → `Under Verification` → `Approved` → `Provisioned` → `Operational`)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
        >
          <Plus size={16} />
          Register New Facility
        </button>
      </div>

      {/* Onboarding Lifecycle Pipeline Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Pending Request', count: facilities.filter(f => f.status === 'Pending').length, color: 'border-purple-500/40 bg-purple-500/10 text-purple-300' },
          { label: 'Under Verification', count: facilities.filter(f => f.status === 'Under Verification').length, color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
          { label: 'Approved', count: facilities.filter(f => f.status === 'Approved').length, color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' },
          { label: 'Provisioned', count: facilities.filter(f => f.status === 'Provisioned').length, color: 'border-blue-500/40 bg-blue-500/10 text-blue-300' },
          { label: 'Operational', count: facilities.filter(f => f.status === 'Operational').length, color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
        ].map((item, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border ${item.color} backdrop-blur-md flex flex-col justify-between`}>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{item.label}</span>
            <div className="text-3xl font-extrabold font-mono mt-2">{item.count}</div>
          </div>
        ))}
      </div>

      {/* Main Grid: List + Detail View */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Facility List */}
        <div className="col-span-7 bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by hospital name, facility code, or state..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
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
            {filteredFacilities.map((fac) => (
              <div
                key={fac.id}
                onClick={() => setSelectedFacility(fac)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedFacility?.id === fac.id
                    ? 'bg-blue-600/15 border-blue-500/50 shadow-md shadow-blue-500/10'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">{fac.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-white/10 px-1.5 py-0.5 rounded">{fac.code}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {fac.district}, {fac.state} • <span className="text-blue-300 font-medium">{fac.type}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${statusBadgeColor(fac.status)}`}>
                    {fac.status}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Kiosks Allocated: <strong className="text-white font-mono">{fac.kiosksCount}</strong></span>
                  <span>ABDM: <strong className={fac.abdmStatus === 'Connected' ? 'text-emerald-400' : 'text-amber-400'}>{fac.abdmStatus}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Selected Facility Deep Governance */}
        <div className="col-span-5 bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-5">
          {selectedFacility ? (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {selectedFacility.id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadgeColor(selectedFacility.status)}`}>
                    {selectedFacility.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-2 leading-tight">{selectedFacility.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{selectedFacility.type} • {selectedFacility.state}</p>
              </div>

              {/* Workflow State Advance Actions */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Central Authority Pipeline Control</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateStatus(selectedFacility.id, 'Under Verification')}
                    className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-lg hover:bg-amber-500/30 transition-all"
                  >
                    Verify Documents
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(selectedFacility.id, 'Approved')}
                    className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold rounded-lg hover:bg-cyan-500/30 transition-all"
                  >
                    Approve Facility
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(selectedFacility.id, 'Provisioned')}
                    className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold rounded-lg hover:bg-blue-500/30 transition-all"
                  >
                    Provision Endpoints
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(selectedFacility.id, 'Operational')}
                    className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-lg hover:bg-emerald-500/30 transition-all"
                  >
                    Set Operational
                  </button>
                </div>
              </div>

              {/* Technical Infrastructure Settings */}
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-white/5 rounded-xl space-y-2 border border-white/10">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center gap-2">
                    <Server size={14} className="text-blue-400" />
                    FHIR R4 Gateway Endpoint
                  </div>
                  <div className="font-mono text-[11px] text-blue-300 bg-black/30 p-2 rounded-lg break-all">
                    {selectedFacility.fhirEndpoint}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 block">Doctor Capacity</span>
                    <span className="text-sm font-bold text-white font-mono">{selectedFacility.doctorCapacity} On Duty</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 block">Kiosk Fleet</span>
                    <span className="text-sm font-bold text-white font-mono">{selectedFacility.kiosksCount} Terminals</span>
                  </div>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 block">Supported Native Languages</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedFacility.languages.map((lang) => (
                      <span key={lang} className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-semibold rounded-md">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2">
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
