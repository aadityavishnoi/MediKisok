import React, { useState } from 'react';
import { AlertCircle, ShieldAlert, CheckCircle2, Clock, Wrench, UserCheck, Search, Filter } from 'lucide-react';

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

const INITIAL_INCIDENTS: Incident[] = [
  { id: 'INC-2941', kioskId: 'MK-DEL-00421', facilityName: 'District Hospital X', state: 'Delhi NCR', issue: 'RFID Reader Unresponsive', severity: 'HIGH', detectedTime: '09:42 AM', status: 'Technician Assigned', assignedTechnician: 'Rajesh Kumar (Field Eng)', slaRemaining: '45 mins' },
  { id: 'INC-2940', kioskId: 'MK-UP-00310', facilityName: 'Varanasi Civil Hospital', state: 'Uttar Pradesh', issue: 'Network Gateway Timeout (504)', severity: 'CRITICAL', detectedTime: '08:15 AM', status: 'In Progress', assignedTechnician: 'NOC Central Team', slaRemaining: '12 mins' },
  { id: 'INC-2938', kioskId: 'MK-MH-00190', facilityName: 'KEM Hospital Mumbai', state: 'Maharashtra', issue: 'Prescription OCR Camera Misalignment', severity: 'MEDIUM', detectedTime: '07:30 AM', status: 'Open', assignedTechnician: 'Unassigned', slaRemaining: '2 hours' },
  { id: 'INC-2935', kioskId: 'MK-KA-00912', facilityName: 'Bowring Hospital Bengaluru', state: 'Karnataka', issue: 'Thermal Printer Paper Out', severity: 'LOW', detectedTime: '06:00 AM', status: 'Resolved', assignedTechnician: 'Hospital Staff', slaRemaining: 'Completed' },
];

export function IncidentsOperationsModule() {
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);

  const resolveIncident = (id: string) => {
    setIncidents(incidents.map(inc => inc.id === id ? { ...inc, status: 'Resolved', slaRemaining: 'Completed' } : inc));
  };

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
        <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold font-mono animate-fade-in">
          3 Active Incidents
        </span>
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
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border ${
                inc.severity === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' :
                inc.severity === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {inc.id}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-slate-900">{inc.issue}</span>
                  <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    Kiosk: {inc.kioskId}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    inc.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-50 text-amber-700'
                  }`}>
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
                <span className="text-slate-500 block text-[10px]">SLA Time Remaining</span>
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
    </div>
  );
}
