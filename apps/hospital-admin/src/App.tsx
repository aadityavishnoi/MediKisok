import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Stethoscope,
  HardDrive,
  FileBarChart,
  Settings,
  Users,
  Clock,
  AlertTriangle,
  Activity,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Sidebar, Topbar, StatCard } from '@medikiosk/ui';

export default function App() {
  const [nav, setNav] = useState('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [departments] = useState([
    { name: 'General Medicine', count: 42, avgWait: '12 min', maxCap: 50 },
    { name: 'Cardiology', count: 28, avgWait: '18 min', maxCap: 35 },
    { name: 'Neurology', count: 14, avgWait: '8 min', maxCap: 20 },
    { name: 'Pediatrics', count: 22, avgWait: '10 min', maxCap: 30 },
    { name: 'Orthopedics', count: 18, avgWait: '15 min', maxCap: 25 },
  ]);

  const [doctors] = useState([
    { name: 'Dr. Rajesh Sharma', dept: 'General Medicine', status: 'AVAILABLE', room: 'OPD 101' },
    { name: 'Dr. Eleanor Pena', dept: 'Cardiology', status: 'IN_CONSULTATION', room: 'OPD 304' },
    { name: 'Dr. Albert Flores', dept: 'Neurology', status: 'AVAILABLE', room: 'OPD 202' },
    { name: 'Dr. Jane Cooper', dept: 'Pediatrics', status: 'OFF_DUTY', room: 'OPD 105' },
    { name: 'Dr. Rohan Mehta', dept: 'Cardiology', status: 'IN_CONSULTATION', room: 'OPD 305' },
  ]);

  const [fleet] = useState([
    { code: 'KIOSK-DELHI-001', location: 'Building A - Main Entrance', firmware: 'v2.4.1-prod', heartbeat: '5s ago', status: 'ONLINE' },
    { code: 'KIOSK-DELHI-002', location: 'Building A - OPD Waiting Area', firmware: 'v2.4.1-prod', heartbeat: '12s ago', status: 'ONLINE' },
    { code: 'KIOSK-DELHI-003', location: 'Emergency Triage Room 1', firmware: 'v2.3.9-patch', heartbeat: '2m ago', status: 'DEGRADED' },
    { code: 'READER-NFC-0104', location: 'Registration Counter 3', firmware: 'v1.0.4-esp', heartbeat: '3s ago', status: 'ONLINE' },
    { code: 'KIOSK-DELHI-004', location: 'Cardiology Wing Corridor', firmware: 'v2.4.0-prod', heartbeat: '45m ago', status: 'OFFLINE' },
  ]);

  const filteredFleet = fleet.filter(item => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSearch = item.code.toLowerCase().includes(search.toLowerCase()) || item.location.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeKey={nav}
        onNavigate={setNav}
        items={[
          { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
          { key: 'departments', label: 'Departments', icon: <Building2 size={18} /> },
          { key: 'doctors', label: 'Doctor Roster', icon: <Stethoscope size={18} /> },
          { key: 'fleet', label: 'Hardware Fleet', icon: <HardDrive size={18} /> },
          { key: 'reports', label: 'Analytics Reports', icon: <FileBarChart size={18} /> },
          { key: 'settings', label: 'Settings', icon: <Settings size={18} /> },
        ]}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar
          title="MediCore AI"
          subtitle="Hospital Operations & Facility Control"
          search={search}
          onSearchChange={setSearch}
          user={{ name: 'Facility Admin', avatar: '' }}
        />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top 4 Executive Stat Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Intake Volume Today"
              value={412}
              delta="↑ 14% vs yesterday"
              deltaType="positive"
              icon={<Users size={20} />}
              iconBg="bg-blue-100 text-blue-700"
            />
            <StatCard
              label="Avg Intake Time"
              value="3.4 min"
              delta="Target: < 5 min"
              deltaType="positive"
              icon={<Clock size={20} />}
              iconBg="bg-emerald-100 text-emerald-700"
            />
            <StatCard
              label="Red Flags Today"
              value={3}
              delta="Immediate Triage"
              deltaType="negative"
              icon={<AlertTriangle size={20} />}
              iconBg="bg-red-100 text-red-700"
            />
            <StatCard
              label="Reader Uptime %"
              value="99.8%"
              delta="Hardware Nominal"
              deltaType="positive"
              icon={<Activity size={20} />}
              iconBg="bg-indigo-100 text-indigo-700"
            />
          </div>

          {/* 2-Column Row: Department Queue Load (Left 7 cols) & Doctor Availability (Right 5 cols) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left 7 Cols: Horizontal Bar Chart - Department Queue Load */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Department Queue Load</h2>
                  <p className="text-xs text-slate-500">Live OPD intake volume vs max facility capacity</p>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">Real-time Feed</span>
              </div>

              <div className="space-y-4">
                {departments.map((dept) => {
                  const pct = Math.round((dept.count / dept.maxCap) * 100);
                  return (
                    <div key={dept.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">{dept.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 font-medium">{dept.count} in queue</span>
                          <span className="text-slate-400 font-mono">Avg Wait: {dept.avgWait}</span>
                        </div>
                      </div>
                      <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 5 Cols: Doctor Availability List */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Doctor Availability</h2>
                  <p className="text-xs text-slate-500">Active clinician status & room assignment</p>
                </div>
                <span className="text-xs font-semibold text-slate-400">{doctors.length} Roster</span>
              </div>

              <div className="space-y-3">
                {doctors.map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                        {doc.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{doc.name}</p>
                        <p className="text-[11px] text-slate-400">{doc.dept} • {doc.room}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      doc.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' :
                      doc.status === 'IN_CONSULTATION' ? 'bg-blue-50 text-blue-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {doc.status === 'AVAILABLE' ? 'Available' : doc.status === 'IN_CONSULTATION' ? 'In Consult' : 'Off Duty'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Full-Width Table: Live Hardware Device Fleet */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-0">
            {/* Table Toolbar */}
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Live Hardware Device Fleet</h2>
                <p className="text-xs text-slate-500">Connected kiosks, touch units, and RFID readers telemetry</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  {['ALL', 'ONLINE', 'DEGRADED', 'OFFLINE'].map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        statusFilter === st ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Kiosk / Device Code</th>
                    <th className="px-5 py-3.5">Location</th>
                    <th className="px-5 py-3.5">Firmware Version</th>
                    <th className="px-5 py-3.5">Last Heartbeat</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFleet.map((row) => (
                    <tr key={row.code} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">{row.code}</td>
                      <td className="px-5 py-4 font-bold text-slate-800">{row.location}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{row.firmware}</td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-400">{row.heartbeat}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          row.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-700' :
                          row.status === 'DEGRADED' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            row.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' :
                            row.status === 'DEGRADED' ? 'bg-amber-500' :
                            'bg-red-500'
                          }`} />
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
