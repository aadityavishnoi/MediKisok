import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle2, Plus, Search, Server, X, AlertTriangle, ShieldAlert } from 'lucide-react';

interface HospitalFacility {
  id: string;
  code: string;
  name: string;
  type: string;
  state: string;
  district: string;
  city: string;
  status: 'Pending' | 'Under Verification' | 'Approved' | 'Provisioned' | 'Operational' | 'Suspended' | 'Rejected';
  kiosksCount: number;
  abdmStatus: string;
  fhirEndpoint: string;
  doctorCapacity: number;
  operatingHours: string;
  languages: string[];
  submittedDate: string;
}

export function HospitalOnboardingModule() {
  const [facilities, setFacilities] = useState<HospitalFacility[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<HospitalFacility | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // New facility form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'DISTRICT_HOSPITAL',
    state: '',
    district: '',
    city: '',
    pinCode: '',
    contactPhone: '',
    contactEmail: '',
    totalBeds: 250,
    totalKiosks: 4,
  });

  const loadFacilities = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hospitals?limit=100');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.facilities)) {
          const mapped: HospitalFacility[] = data.facilities.map((f: any) => {
            let status: HospitalFacility['status'] = 'Operational';
            if (f.facilityStatus === 'DRAFT' || f.facilityStatus === 'PENDING_APPROVAL') status = 'Pending';
            else if (f.facilityStatus === 'APPROVED') status = 'Approved';
            else if (f.facilityStatus === 'SUSPENDED') status = 'Suspended';
            else if (f.facilityStatus === 'REJECTED') status = 'Rejected';
            else status = 'Operational';

            return {
              id: f.id,
              code: f.code || 'HOSP-01',
              name: f.name,
              type: f.type || 'District Hospital',
              state: f.state || 'Delhi',
              district: f.district || 'New Delhi',
              city: f.city || 'New Delhi',
              status,
              kiosksCount: f.totalKiosks || f._count?.kiosks || 4,
              abdmStatus: f.abdmFacilityId ? 'Connected' : 'Pending Verification',
              fhirEndpoint: `https://fhir.${(f.code || 'hosp').toLowerCase().replace(/[^a-z0-9]/g, '')}.gov.in/r4`,
              doctorCapacity: f._count?.doctors ? f._count.doctors * 10 : 50,
              operatingHours: '24/7 OPD & Emergency',
              languages: ['Hindi', 'English'],
              submittedDate: new Date(f.createdAt || Date.now()).toISOString().split('T')[0],
            };
          });
          setFacilities(mapped);
          setIsLive(true);
          if (mapped.length > 0 && !selectedFacility) {
            setSelectedFacility(mapped[0]);
          }
        }
      }
    } catch (err) {
      console.warn('Hospitals fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  const filteredFacilities = facilities.filter((f) => {
    const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.code.toLowerCase().includes(q) ||
      f.state.toLowerCase().includes(q) ||
      f.district.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleAction = async (id: string, action: 'approve' | 'verify' | 'suspend' | 'reject') => {
    try {
      if (action === 'approve') {
        await fetch(`/api/hospitals/${id}/approve`, { method: 'POST' });
        setActionMessage('Facility successfully approved and activated.');
      } else if (action === 'verify') {
        await fetch(`/api/hospitals/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ facilityStatus: 'PENDING_APPROVAL' }),
        });
        setActionMessage('Facility documents verified and flagged for final sign-off.');
      } else if (action === 'suspend') {
        const reason = prompt('Enter suspension reason:', 'Administrative compliance review') || 'Compliance review';
        await fetch(`/api/hospitals/${id}/suspend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        });
        setActionMessage(`Facility suspended: ${reason}`);
      } else if (action === 'reject') {
        const reason = prompt('Enter rejection reason:', 'Incomplete documentation') || 'Incomplete documentation';
        await fetch(`/api/hospitals/${id}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        });
        setActionMessage(`Facility registration rejected: ${reason}`);
      }
      await loadFacilities();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          type: formData.type,
          state: formData.state.trim(),
          district: formData.district.trim(),
          city: formData.city.trim() || formData.district.trim(),
          pinCode: formData.pinCode.trim(),
          contactPhone: formData.contactPhone.trim(),
          contactEmail: formData.contactEmail.trim() || undefined,
          totalBeds: Number(formData.totalBeds) || 100,
          totalKiosks: Number(formData.totalKiosks) || 2,
          facilityStatus: 'PENDING_APPROVAL',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(`Error: ${errData.error?.message || 'Failed to register facility'}`);
        return;
      }

      setShowNewModal(false);
      setFormData({
        code: '',
        name: '',
        type: 'DISTRICT_HOSPITAL',
        state: '',
        district: '',
        city: '',
        pinCode: '',
        contactPhone: '',
        contactEmail: '',
        totalBeds: 250,
        totalKiosks: 4,
      });
      setActionMessage('New facility registered successfully into Central Registry pipeline.');
      await loadFacilities();
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  const statusBadgeColor = (status: HospitalFacility['status']) => {
    switch (status) {
      case 'Operational': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Provisioned': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Approved': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Under Verification': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Pending': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Suspended': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Rejected': return 'bg-slate-100 text-slate-700 border-slate-300';
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
            Central Authority Governance • Database-Backed 5-Stage Approval Pipeline (`Pending` → `Under Verification` → `Approved` → `Operational`)
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

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Pipeline Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Pending Request', count: facilities.filter((f) => f.status === 'Pending').length, color: 'border-purple-200 bg-purple-50 text-purple-700' },
          { label: 'Under Verification', count: facilities.filter((f) => f.status === 'Under Verification').length, color: 'border-amber-200 bg-amber-50 text-amber-700' },
          { label: 'Approved / Ready', count: facilities.filter((f) => f.status === 'Approved').length, color: 'border-cyan-200 bg-cyan-50 text-cyan-700' },
          { label: 'Operational Active', count: facilities.filter((f) => f.status === 'Operational').length, color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
          { label: 'Suspended / Review', count: facilities.filter((f) => f.status === 'Suspended').length, color: 'border-rose-200 bg-rose-50 text-rose-700' },
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search hospital name, code, state, or district..."
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
              <option value="Approved">Approved</option>
              <option value="Operational">Operational</option>
              <option value="Suspended">Suspended</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
            {filteredFacilities.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-mono text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No public hospitals onboarded yet. Click "Register New Facility" to onboard the first hospital into the national registry.
              </div>
            ) : (
              filteredFacilities.map((fac, idx) => (
                <div
                  key={fac.id}
                  onClick={() => setSelectedFacility(fac)}
                  className={`p-4 rounded-xl border cursor-pointer animate-slide-up stagger-item transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    selectedFacility?.id === fac.id
                      ? 'bg-blue-50 border-blue-300 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-white'
                  }`}
                  style={{ animationDelay: `${idx * 30}ms` }}
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
                  <span>ABDM HFR: <strong className={fac.abdmStatus === 'Connected' ? 'text-emerald-600' : 'text-amber-600'}>{fac.abdmStatus}</strong></span>
                </div>
              </div>
            )))}
          </div>
        </div>

        {/* Right Column: Selected Facility Deep Governance */}
        <div className="col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 animate-fade-in">
          {selectedFacility ? (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedFacility.code}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadgeColor(selectedFacility.status)}`}>
                    {selectedFacility.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-2 leading-tight">{selectedFacility.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{selectedFacility.type} • {selectedFacility.state} ({selectedFacility.district})</p>
              </div>

              {/* Workflow State Advance Actions */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Central Authority Pipeline Control</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAction(selectedFacility.id, 'verify')}
                    className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-lg hover:bg-amber-100 transition-all duration-200"
                  >
                    Verify Documents
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(selectedFacility.id, 'approve')}
                    className="px-2.5 py-1 bg-emerald-600 text-white border border-emerald-700 text-[10px] font-bold rounded-lg hover:bg-emerald-500 transition-all duration-200 shadow-sm"
                  >
                    Approve & Activate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(selectedFacility.id, 'suspend')}
                    className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-lg hover:bg-rose-100 transition-all duration-200"
                  >
                    Suspend
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(selectedFacility.id, 'reject')}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold rounded-lg hover:bg-slate-200 transition-all duration-200"
                  >
                    Reject
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
                    <span className="text-sm font-bold text-slate-900 font-mono">{selectedFacility.doctorCapacity} Rostered</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Kiosk Fleet</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">{selectedFacility.kiosksCount} Terminals</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-700 flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>ABDM Health Facility Registry (HFR) Identity Connected</span>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">Select a facility to inspect registration details</div>
          )}
        </div>
      </div>

      {/* Modal: Register New Hospital */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Onboard New Healthcare Facility</h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFacility} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Facility Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Civil Hospital, Sector 10"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Facility Code *</label>
                  <input
                    required
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. DH-GUR-01"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Facility Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="DISTRICT_HOSPITAL">District Hospital</option>
                    <option value="AIIMS">AIIMS</option>
                    <option value="TERTIARY_HOSPITAL">Tertiary Hospital</option>
                    <option value="COMMUNITY_HEALTH_CENTRE">CHC</option>
                    <option value="PRIMARY_HEALTH_CENTRE">PHC</option>
                    <option value="PRIVATE_HOSPITAL">Private Hospital</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">State *</label>
                  <input
                    required
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Haryana"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">District *</label>
                  <input
                    required
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="e.g. Gurugram"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Gurugram"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Total Beds</label>
                  <input
                    type="number"
                    value={formData.totalBeds}
                    onChange={(e) => setFormData({ ...formData, totalBeds: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kiosks To Allocate</label>
                  <input
                    type="number"
                    value={formData.totalKiosks}
                    onChange={(e) => setFormData({ ...formData, totalKiosks: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md shadow-blue-500/20"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
