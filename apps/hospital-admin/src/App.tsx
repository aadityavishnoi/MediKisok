import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Stethoscope,
  HardDrive,
  FileBarChart,
  Settings,
  Users,
  Timer,
  AlertOctagon,
  Wifi,
  Search,
  Bell,
  ChevronRight
} from 'lucide-react';

export default function App() {
  const [activeNav, setActiveNav] = useState('overview');
  const [search, setSearch] = useState('');
  const [fleetSearch, setFleetSearch] = useState('');

  const depts = [
    { name: 'Cardiology', val: 62 },
    { name: 'General OPD', val: 84 },
    { name: 'Orthopedics', val: 41 },
    { name: 'Pediatrics', val: 55 },
    { name: 'Radiology', val: 28 },
  ];

  const docs = [
    { name: 'Dr. Rohan Mehta', dept: 'Cardiology', status: 'Available', badge: 'bg-emerald-50 text-emerald-700 font-semibold' },
    { name: 'Dr. Kavita Nair', dept: 'Pediatrics', status: 'In Consultation', badge: 'bg-blue-50 text-blue-900 font-semibold' },
    { name: 'Dr. Sameer Joshi', dept: 'Orthopedics', status: 'Off Duty', badge: 'bg-slate-100 text-slate-500 font-semibold' },
    { name: 'Dr. Anjali Rao', dept: 'Radiology', status: 'Available', badge: 'bg-emerald-50 text-emerald-700 font-semibold' },
  ];

  const fleet = [
    { code: 'KSK-014', location: 'Main Lobby', firmware: 'v2.3.1', heartbeat: '12s ago', status: 'Online', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
    { code: 'KSK-015', location: 'Cardiology Wing', firmware: 'v2.3.1', heartbeat: '8s ago', status: 'Online', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
    { code: 'KSK-016', location: 'OPD Block B', firmware: 'v2.2.9', heartbeat: '2m ago', status: 'Degraded', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
    { code: 'KSK-017', location: 'Emergency Entrance', firmware: 'v2.3.1', heartbeat: '—', status: 'Offline', badge: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
  ];

  const filteredFleet = fleet.filter(item =>
    item.code.toLowerCase().includes(fleetSearch.toLowerCase()) ||
    item.location.toLowerCase().includes(fleetSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex selection:bg-blue-600 selection:text-white">
      {/* Sidebar */}
      <aside className="w-60 h-screen sticky top-0 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="px-5 py-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
            M
          </div>
          <div>
            <div className="font-extrabold text-slate-900 leading-none text-base font-display">MediCore AI</div>
            <div className="text-xs text-slate-400 leading-none mt-1">Hospital Admin</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm font-medium">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'departments', label: 'Departments', icon: Building2 },
            { id: 'doctors', label: 'Doctors', icon: Stethoscope },
            { id: 'fleet', label: 'Hardware Fleet', icon: HardDrive },
            { id: 'reports', label: 'Reports', icon: FileBarChart },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  active
                    ? 'bg-blue-500 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="w-96 max-w-full relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Search departments, kiosks..."
            />
          </div>

          <div className="flex items-center gap-4">
            <button type="button" className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-900 text-xs">
                S
              </div>
              <div className="text-sm">
                <div className="font-semibold leading-none text-slate-900">Sunita Rao</div>
                <div className="text-xs text-slate-400 leading-none mt-1">Facility Manager</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="p-6 space-y-5 max-w-7xl mx-auto w-full">
          {/* Top 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                <Users size={20} />
              </div>
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Intake Volume Today</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1 font-display">318</div>
              <div className="text-xs text-emerald-600 font-semibold mt-1">↑ 9% from yesterday</div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                <Timer size={20} />
              </div>
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Avg Intake Time</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1 font-display">6.4<span className="text-lg">m</span></div>
              <div className="text-xs text-red-600 font-semibold mt-1">↑ 1.1m from yesterday</div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mb-3">
                <AlertOctagon size={20} />
              </div>
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Red Flags Today</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1 font-display">5</div>
              <div className="text-xs text-slate-400 font-semibold mt-1">Same as yesterday</div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
                <Wifi size={20} />
              </div>
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Reader Uptime</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1 font-display">99.2%</div>
              <div className="text-xs text-emerald-600 font-semibold mt-1">↑ 0.4% from yesterday</div>
            </div>
          </div>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Department Queue Load (Left 7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-bold text-base mb-4 text-slate-900 font-display">Department Queue Load</h2>
              <div className="space-y-4">
                {depts.map((d) => (
                  <div key={d.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{d.name}</span>
                      <span className="text-slate-400 font-medium">{d.val} in queue</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${d.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor Availability (Right 5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-bold text-base mb-4 text-slate-900 font-display">Doctor Availability</h2>
              <div className="space-y-3">
                {docs.map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-900 text-xs">
                        {doc.name.split(' ').map((n) => n[0]).slice(-2).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{doc.name}</div>
                        <div className="text-xs text-slate-400">{doc.dept}</div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs ${doc.badge}`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Hardware Device Fleet */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h2 className="font-bold text-base text-slate-900 font-display">Live Hardware Device Fleet</h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  value={fleetSearch}
                  onChange={(e) => setFleetSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs w-56 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Search kiosk code, location..."
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs border-b border-slate-100 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Kiosk Code</th>
                    <th className="pb-3 font-semibold">Location</th>
                    <th className="pb-3 font-semibold">Firmware</th>
                    <th className="pb-3 font-semibold">Last Heartbeat</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredFleet.map((r) => (
                    <tr key={r.code} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 font-bold text-slate-900 font-mono">{r.code}</td>
                      <td className="py-3 text-slate-600 font-medium">{r.location}</td>
                      <td className="py-3 text-slate-400 text-xs font-mono">{r.firmware}</td>
                      <td className="py-3 text-slate-400 text-xs">{r.heartbeat}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${r.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${r.dot} animate-pulse`} />
                          {r.status}
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
