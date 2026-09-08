import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, UserCheck, RefreshCw, Plus, X } from 'lucide-react';

interface Incident {
  id: string;
  kioskId: string;
  facilityName: string;
  state: string;
  issue: string;
  severity: 'HIGH' | 'CRITICAL' | 'MEDIUM' | 'LOW';
  detectedTime: string;
  status: 'Open' | 'Technician Assigned' | 'In Progress' | 'Resolved';
  assignedTechnician: string;
  slaRemaining: string;
}

const DEFAULT_INCIDENTS: Incident[] = [
  { id: 'INC-2941', kioskId: 'MK-DEL-00421', facilityName: 'District Hospital X', state: 'Delhi NCR', issue: 'RFID Reader Unresponsive', severity: 'HIGH', detectedTime: '09:42 AM', status: 'Technician Assigned', assignedTechnician: 'Rajesh Kumar (Field Eng)', slaRemaining: '45 mins' },
  { id: 'INC-2940', kioskId: 'MK-UP-00310', facilityName: 'Varanasi Civil Hospital', state: 'Uttar Pradesh', issue: 'Network Gateway Timeout (504)', severity: 'CRITICAL', detectedTime: '08:15 AM', status: 'In Progress', assignedTechnician: 'NOC Central Team', slaRemaining: '12 mins' },
  { id: 'INC-2938', kioskId: 'MK-MH-00190', facilityName: 'KEM Hospital Mumbai', state: 'Maharashtra', issue: 'Prescription OCR Camera Misalignment', severity: 'MEDIUM', detectedTime: '07:30 AM', status: 'Open', assignedTechnician: 'Unassigned', slaRemaining: '2 hours' },
];

export function IncidentsOperationsModule() {
  const [incidents, setIncidents] = useState<Incident[]>(DEFAULT_INCIDENTS);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formFacilityId, setFormFacilityId] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formSeverity, setFormSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');

  const fetchIncidents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/incidents');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.incidents) && data.incidents.length > 0) {
          const mapped: Incident[] = data.incidents.map((a: any) => ({
            id: a.id.slice(0, 8).toUpperCase(),
            kioskId: a.device?.deviceCode || a.deviceId || 'KIOSK-GENERIC',
            facilityName: a.hospital?.name || 'Central Facility',
            state: a.hospital?.state || 'National',
            issue: a.message,
            severity: a.severity || 'MEDIUM',
            detectedTime: new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: a.acknowledged ? 'Resolved' : 'Open',
            assignedTechnician: a.acknowledgedBy || (a.severity === 'CRITICAL' ? 'NOC Central Team' : 'Field Technician'),
            slaRemaining: a.acknowledged ? 'Completed' : 'Within SLA',
          }));
          setIncidents(mapped);
        }
      }
    } catch {
      // Safe fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const resolveIncident = async (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: 'Resolved', slaRemaining: 'Completed' } : inc))
    );
    try {
      await fetch(`/api/admin/incidents/${id}/resolve`, { method: 'POST' });
      fetchIncidents();
    } catch (err) {
      console.error('Failed to resolve incident:', err);
    }
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: formFacilityId || 'hosp-aiims-delhi',
          message: formMessage,
          severity: formSeverity,
          alertType: 'RFID_READER_FAILURE',
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setFormMessage('');
        fetchIncidents();
      }
    } catch (err) {
      console.error('Failed to create incident:', err);
    }
  };

  const activeCount = incidents.filter((i) => i.status !== 'Resolved').length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <AlertCircle className="text-red-600" />
            National Incident & Technical Operations Command
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Infrastructure Breakdown Alerts • Real-Time SLA Escalation Matrix & Field Dispatch
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchIncidents}
            disabled={isLoading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
            title="Refresh Incidents"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold font-mono">
            {activeCount} Active {activeCount === 1 ? 'Incident' : 'Incidents'}
          </span>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm"
          >
            <Plus size={14} /> Report Incident
          </button>
        </div>
      </div>

      {/* Incident Cards */}
      <div className="grid grid-cols-1 gap-4">
        {incidents.map((inc, i) => (
          <div
            key={inc.id}
            className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-slide-up stagger-item"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border ${
                  inc.severity === 'CRITICAL'
                    ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                    : inc.severity === 'HIGH'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {inc.id}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-slate-900">{inc.issue}</span>
                  <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    Kiosk: {inc.kioskId}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      inc.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {inc.severity}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {inc.facilityName} ({inc.state}) • Detected at {inc.detectedTime}
                </div>
                <div className="text-[11px] text-slate-600 flex items-center gap-2 pt-1 font-mono">
                  <UserCheck size={14} className="text-blue-600" />
                  Assigned: <strong className="text-slate-900">{inc.assignedTechnician}</strong>
                </div>
              </div>
            </div>

            <div className="text-right space-y-2">
              <div className="text-xs font-mono">
                <span className="text-slate-500 block text-[10px]">SLA Status</span>
                <span className={`font-bold ${inc.status === 'Resolved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {inc.slaRemaining}
                </span>
              </div>
              {inc.status !== 'Resolved' && (
                <button
                  type="button"
                  onClick={() => resolveIncident(inc.id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="text-red-600" size={18} />
                Report Infrastructure Breakdown
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReportIncident} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Facility ID</label>
                <input
                  type="text"
                  placeholder="e.g. hosp-aiims-delhi"
                  value={formFacilityId}
                  onChange={(e) => setFormFacilityId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Severity</label>
                <select
                  value={formSeverity}
                  onChange={(e) => setFormSeverity(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Issue Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Thermal printer offline after receipt paper jam"
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Dispatch Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
