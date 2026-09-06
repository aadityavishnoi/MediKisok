import React, { useState } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'devices' | 'staff'>('overview');

  const [devices] = useState([
    { code: 'KIOSK-DEV-001', location: 'Building A - Kiosk 1', status: 'ONLINE', firmware: 'v2.4.1', heartbeat: '10s ago' },
    { code: 'KIOSK-DEV-002', location: 'Building A - Kiosk 2', status: 'ONLINE', firmware: 'v2.4.1', heartbeat: '25s ago' },
    { code: 'KIOSK-DEV-003', location: 'Emergency Desk Kiosk', status: 'DEGRADED', firmware: 'v2.3.9', heartbeat: '2m ago' },
    { code: 'READER-ESP32-01', location: 'Registration Desk 1', status: 'ONLINE', firmware: 'v1.0.4', heartbeat: '5s ago' },
  ]);

  const [doctors] = useState([
    { name: 'Dr. Rajesh Sharma', dept: 'General Medicine', queue: 4, status: 'AVAILABLE' },
    { name: 'Dr. Eleanor Pena', dept: 'Cardiology', queue: 2, status: 'IN_CONSULT' },
    { name: 'Dr. Albert Flores', dept: 'Neurology', queue: 1, status: 'AVAILABLE' },
    { name: 'Dr. Jane Cooper', dept: 'Pediatrics', queue: 0, status: 'ON_LEAVE' },
  ]);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">AIIMS New Delhi — Facility Control</span>
            <h1 className="text-2xl font-bold text-slate-900">Hospital Administration & Operations</h1>
            <p className="text-sm text-slate-500">OPD queue pressure, doctor availability, and kiosk hardware fleet health</p>
          </div>
          <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-white shadow text-slate-900 font-semibold' : 'text-slate-600'}`}
            >
              OPD Metrics
            </button>
            <button
              onClick={() => setActiveTab('devices')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'devices' ? 'bg-white shadow text-slate-900 font-semibold' : 'text-slate-600'}`}
            >
              Hardware Fleet ({devices.length})
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'staff' ? 'bg-white shadow text-slate-900 font-semibold' : 'text-slate-600'}`}
            >
              Doctor Roster
            </button>
          </div>
        </header>

        {/* Operational Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Intake Sessions Today</span>
            <div className="text-3xl font-extrabold text-slate-900">412</div>
            <span className="text-xs font-semibold text-emerald-600">↑ +14% vs yesterday</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Intake Time</span>
            <div className="text-3xl font-extrabold text-slate-900">3.4 min</div>
            <span className="text-xs font-semibold text-blue-600">Target: &lt; 5 min</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Red Flag Alerts</span>
            <div className="text-3xl font-extrabold text-red-600">3</div>
            <span className="text-xs font-semibold text-red-600">Immediate Triage</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Connected Readers</span>
            <div className="text-3xl font-extrabold text-emerald-600">4 / 4</div>
            <span className="text-xs font-semibold text-emerald-600">100% Uptime</span>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900">OPD Department Queue Load</h2>
              <div className="space-y-3">
                {[
                  { name: 'General Medicine', count: 18, capacity: '75%' },
                  { name: 'Cardiology', count: 12, capacity: '60%' },
                  { name: 'Neurology', count: 6, capacity: '30%' },
                  { name: 'Pediatrics', count: 15, capacity: '70%' },
                ].map(dept => (
                  <div key={dept.name} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-semibold text-sm text-slate-800">{dept.name}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-slate-500 font-medium">{dept.count} In Queue</span>
                      <span className="px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">{dept.capacity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900">Recent Emergency Red-Flag Triage</h2>
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-red-800">
                    <span>Aarav Sharma — Severe Chest Pain</span>
                    <span>10 mins ago</span>
                  </div>
                  <p className="text-xs text-red-700">Triage Priority: CRITICAL. Routed to Dr. Eleanor Pena (Cardiology).</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'devices' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Registered Hardware Reader & Kiosk Fleet</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="p-3">Device Code</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Firmware</th>
                    <th className="p-3">Last Heartbeat</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {devices.map(d => (
                    <tr key={d.code} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{d.code}</td>
                      <td className="p-3 font-medium text-slate-800">{d.location}</td>
                      <td className="p-3 text-xs text-slate-500">{d.firmware}</td>
                      <td className="p-3 text-xs text-slate-500">{d.heartbeat}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          d.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Physician Availability & Live Queue</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map(doc => (
                <div key={doc.name} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{doc.name}</h3>
                    <p className="text-xs text-slate-500">{doc.dept}</p>
                    <span className="text-xs font-semibold text-blue-600">{doc.queue} Active Patients</span>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    doc.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                    doc.status === 'IN_CONSULT' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
