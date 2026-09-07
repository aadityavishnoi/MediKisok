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
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Server,
  Wrench,
  CheckCircle2,
  Activity,
  Plus,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Power
} from 'lucide-react';

interface DoctorItem {
  id: string;
  name: string;
  dept: string;
  room: string;
  patientsWaiting: number;
  status: 'Available' | 'In Consultation' | 'Off Duty';
  avgConsultTime: string;
  aiVerificationRate: string;
}

interface LocalKiosk {
  code: string;
  location: string;
  firmware: string;
  heartbeat: string;
  status: 'Online' | 'Degraded' | 'Offline';
  rfidReader: 'Healthy' | 'Faulty';
  ocrCamera: 'Healthy' | 'Degraded';
  printerPaper: number; // percentage
  mode: 'General OPD' | 'AYUSH Mode' | 'Emergency Priority';
}

const DOCTORS: DoctorItem[] = [
  { id: 'DOC-01', name: 'Dr. Rohan Mehta', dept: 'Cardiology', room: 'OPD Room 102', patientsWaiting: 4, status: 'In Consultation', avgConsultTime: '4.2 mins', aiVerificationRate: '99.4%' },
  { id: 'DOC-02', name: 'Dr. Kavita Nair', dept: 'Pediatrics', room: 'OPD Room 204', patientsWaiting: 2, status: 'Available', avgConsultTime: '3.8 mins', aiVerificationRate: '100.0%' },
  { id: 'DOC-03', name: 'Dr. Vaidya Anant Sharma', dept: 'AYUSH OPD', room: 'AYUSH Wing 01', patientsWaiting: 6, status: 'In Consultation', avgConsultTime: '6.5 mins', aiVerificationRate: '98.8%' },
  { id: 'DOC-04', name: 'Dr. Sameer Joshi', dept: 'Orthopedics', room: 'OPD Room 108', patientsWaiting: 0, status: 'Off Duty', avgConsultTime: '5.0 mins', aiVerificationRate: '97.5%' },
  { id: 'DOC-05', name: 'Dr. Anjali Rao', dept: 'Radiology', room: 'Imaging Block B', patientsWaiting: 1, status: 'Available', avgConsultTime: '3.5 mins', aiVerificationRate: '100.0%' },
];

const LOCAL_FLEET: LocalKiosk[] = [
  { code: 'KSK-DEL-014', location: 'Main OPD Lobby Gate 1', firmware: 'v4.2.0', heartbeat: '2s ago', status: 'Online', rfidReader: 'Healthy', ocrCamera: 'Healthy', printerPaper: 85, mode: 'General OPD' },
  { code: 'KSK-DEL-015', location: 'Cardiology Wing Entrance', firmware: 'v4.2.0', heartbeat: '5s ago', status: 'Online', rfidReader: 'Healthy', ocrCamera: 'Healthy', printerPaper: 92, mode: 'General OPD' },
  { code: 'KSK-DEL-016', location: 'AYUSH Wellness Block', firmware: 'v4.2.0', heartbeat: '1s ago', status: 'Online', rfidReader: 'Healthy', ocrCamera: 'Healthy', printerPaper: 40, mode: 'AYUSH Mode' },
  { code: 'KSK-DEL-017', location: 'Emergency Triage Counter', firmware: 'v4.1.9', heartbeat: '18s ago', status: 'Degraded', rfidReader: 'Healthy', ocrCamera: 'Degraded', printerPaper: 15, mode: 'Emergency Priority' },
];

export default function App() {
  const [activeNav, setActiveNav] = useState('overview');
  const [search, setSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [kiosks, setKiosks] = useState<LocalKiosk[]>(LOCAL_FLEET);

  const toggleKioskMode = (code: string, newMode: LocalKiosk['mode']) => {
    setKiosks(kiosks.map(k => k.code === code ? { ...k, mode: newMode } : k));
  };

  const SIDEBAR_ITEMS = [
    { id: 'overview', label: 'Hospital Executive Overview', icon: LayoutDashboard },
    { id: 'departments', label: 'OPD Clinics & Capacity', icon: Building2, badge: '6 Active' },
    { id: 'doctors', label: 'Doctor Rosters & Queues', icon: Stethoscope, badge: '32 On Duty' },
    { id: 'fleet', label: 'Hospital Kiosk Fleet', icon: HardDrive, badge: '4 Terminals' },
    { id: 'rfid_inventory', label: 'Local RFID Stock', icon: CreditCard },
    { id: 'abdm_his', label: 'HIS & ABDM Integration', icon: Server, badge: 'Healthy' },
    { id: 'incidents', label: 'Maintenance & Alerts', icon: Wrench, badge: '1 Action' },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#090D16] text-slate-100 font-sans flex selection:bg-blue-600 selection:text-white antialiased">
      {/* Sidebar Navigation */}
      <aside className="w-80 h-full bg-white/[0.03] border-r border-white/10 backdrop-blur-md flex flex-col shrink-0 overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-3 border-b border-white/10 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            🏥
          </div>
          <div>
            <div className="font-extrabold text-white leading-none text-xs font-display tracking-tight">
              AIIMS New Delhi — OPD Block
            </div>
            <div className="text-[10px] text-blue-400 font-semibold leading-none mt-1 font-mono">
              Facility Code: HOSP-DEL-AIIMS
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1.5 text-xs font-medium overflow-y-auto">
          <div className="px-3 pb-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            Hospital Operations Modules
          </div>
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                  active
                    ? 'bg-blue-600 text-white font-bold shadow-[0_0_16px_rgba(59,130,246,0.4)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 whitespace-nowrap bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Status */}
        <div className="p-3 border-t border-white/10 shrink-0">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px]">HIS Gateway Connected</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-300">Sync 100%</span>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/[0.03] border-b border-white/10 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-30">
          <div className="w-96 max-w-full relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
              placeholder="Search doctors, OPD rooms, patients, kiosk terminals..."
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 transition-colors"
            >
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            </button>

            <div className="flex items-center gap-3 border-l border-white/10 pl-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-300 text-xs shadow-inner font-mono">
                ADMIN
              </div>
              <div className="text-xs">
                <div className="font-bold leading-none text-white font-display">Dr. S. K. Gupta</div>
                <div className="text-[10px] text-slate-400 leading-none mt-1 font-mono">Medical Superintendent</div>
              </div>
            </div>
          </div>
        </header>

        {/* Notifications Modal */}
        {notificationsOpen && (
          <div className="absolute top-16 right-8 z-40 w-80 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl p-4 text-xs space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-white">Hospital Operational Alerts</span>
              <span className="text-[10px] font-mono text-blue-400">2 New</span>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300">
                <span className="font-bold block">Low Printer Paper</span>
                <span className="text-[10px] text-slate-400">KSK-DEL-017 at Emergency Triage has 15% paper left</span>
              </div>
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300">
                <span className="font-bold block">Acute Red-Flag Triage Alert</span>
                <span className="text-[10px] text-slate-400">Chest Pain Patient routed to OPD Room 102</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Viewport */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1 overflow-y-auto">
          {activeNav === 'overview' && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl backdrop-blur-md">
                  <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">Today's Patient Intake</span>
                  <div className="text-3xl font-extrabold text-white font-mono mt-1">1,482</div>
                  <span className="text-[10px] text-blue-300">+14% vs Yesterday</span>
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl backdrop-blur-md">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">Doctors On Duty</span>
                  <div className="text-3xl font-extrabold text-white font-mono mt-1">32 Active</div>
                  <span className="text-[10px] text-emerald-300">Across 6 OPD Clinics</span>
                </div>

                <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl backdrop-blur-md">
                  <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">Avg Patient Triage</span>
                  <div className="text-3xl font-extrabold text-white font-mono mt-1">4.2 mins</div>
                  <span className="text-[10px] text-cyan-300">85% Kiosk Offloading</span>
                </div>

                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-md">
                  <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider block">Red-Flag Triage Alerts</span>
                  <div className="text-3xl font-extrabold text-white font-mono mt-1">3 Priority</div>
                  <span className="text-[10px] text-red-300">Bypassed General Queue</span>
                </div>
              </div>

              {/* Live OPD Clinic Status & Active Queue Table */}
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-7 bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Stethoscope size={16} className="text-blue-400" />
                    Doctor Consultation Roster & Queue Live Stream
                  </h3>

                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-semibold">
                        <th className="pb-3">Doctor</th>
                        <th className="pb-3">Department</th>
                        <th className="pb-3">Room</th>
                        <th className="pb-3">Queue</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">AI Verify</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {DOCTORS.map((d) => (
                        <tr key={d.id} className="hover:bg-white/5">
                          <td className="py-3 font-bold text-white">{d.name}</td>
                          <td className="py-3 text-slate-300">{d.dept}</td>
                          <td className="py-3 font-mono text-slate-400">{d.room}</td>
                          <td className="py-3 font-mono font-bold text-blue-400">{d.patientsWaiting} Patients</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              d.status === 'Available' ? 'bg-emerald-500/20 text-emerald-300' :
                              d.status === 'In Consultation' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-500/20 text-slate-400'
                            }`}>
                              {d.status}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono text-emerald-400 font-bold">{d.aiVerificationRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Local Kiosk Hardware Telemetry Widget */}
                <div className="col-span-5 bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <HardDrive size={16} className="text-blue-400" />
                    Local Hospital Kiosk Hardware Status
                  </h3>

                  <div className="space-y-3 text-xs">
                    {kiosks.map((k) => (
                      <div key={k.code} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-300">{k.code}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            k.status === 'Online' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {k.status}
                          </span>
                        </div>
                        <div className="text-slate-300 font-medium text-[11px]">{k.location}</div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                          <span>Paper: <strong className={k.printerPaper < 20 ? 'text-red-400' : 'text-emerald-400'}>{k.printerPaper}%</strong></span>
                          <span>Mode: <strong className="text-indigo-300">{k.mode}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeNav === 'departments' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">OPD Clinics & Capacity Overview</h2>
              <div className="grid grid-cols-3 gap-4 text-xs">
                {[
                  { name: 'Cardiology OPD', capacity: '62 / 80 Patients', doctors: '4 Doctors', status: 'Optimal' },
                  { name: 'General Medicine OPD', capacity: '142 / 150 Patients', doctors: '8 Doctors', status: 'High Load' },
                  { name: 'Pediatrics OPD', capacity: '55 / 60 Patients', doctors: '5 Doctors', status: 'Optimal' },
                  { name: 'Orthopedics OPD', capacity: '41 / 50 Patients', doctors: '4 Doctors', status: 'Optimal' },
                  { name: 'AYUSH Integrative OPD', capacity: '38 / 40 Patients', doctors: '3 Vaidyas', status: 'Optimal' },
                  { name: 'Radiology & Imaging Block', capacity: '28 / 30 Patients', doctors: '3 Doctors', status: 'Optimal' },
                ].map((dept, idx) => (
                  <div key={idx} className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{dept.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dept.status === 'High Load' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {dept.status}
                      </span>
                    </div>
                    <div className="text-slate-400 text-xs">Capacity: <strong className="text-white font-mono">{dept.capacity}</strong></div>
                    <div className="text-slate-400 text-xs">Staffing: <strong className="text-blue-300 font-mono">{dept.doctors}</strong></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'doctors' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Doctor Shift Rosters & Triage Assignment</h2>
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-semibold">
                      <th className="pb-3">Doctor Name</th>
                      <th className="pb-3">Department</th>
                      <th className="pb-3">Assigned Room</th>
                      <th className="pb-3">Active Patients</th>
                      <th className="pb-3">Avg Duration</th>
                      <th className="pb-3 text-right">AI Summary Approval Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                    {DOCTORS.map((d) => (
                      <tr key={d.id} className="hover:bg-white/5">
                        <td className="py-3 text-white font-bold">{d.name}</td>
                        <td className="py-3 text-slate-300">{d.dept}</td>
                        <td className="py-3 text-slate-400">{d.room}</td>
                        <td className="py-3 text-blue-400 font-bold">{d.patientsWaiting} Patients</td>
                        <td className="py-3 text-slate-300">{d.avgConsultTime}</td>
                        <td className="py-3 text-right text-emerald-400 font-bold">{d.aiVerificationRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeNav === 'fleet' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Hospital Kiosk Fleet & Mode Controls</h2>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                  4 Local Terminals Connected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {kiosks.map((k) => (
                  <div key={k.code} className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-blue-400 font-bold text-sm">{k.code}</span>
                        <div className="text-white font-bold text-sm mt-0.5">{k.location}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        k.status === 'Online' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {k.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10">
                      <div>13.56MHz RFID: <span className="text-emerald-400 font-bold">✓ {k.rfidReader}</span></div>
                      <div>OCR Camera: <span className="text-emerald-400 font-bold">✓ {k.ocrCamera}</span></div>
                      <div>Printer Paper: <span className={k.printerPaper < 20 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{k.printerPaper}%</span></div>
                      <div>Firmware: <span className="text-slate-200">{k.firmware}</span></div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Switch Kiosk Operational Mode</span>
                      <div className="flex gap-2">
                        {(['General OPD', 'AYUSH Mode', 'Emergency Priority'] as LocalKiosk['mode'][]).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => toggleKioskMode(k.code, mode)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                              k.mode === mode ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'rfid_inventory' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Local Hospital RFID Card Inventory</h2>
              <div className="grid grid-cols-4 gap-4 text-xs">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Allocation</span>
                  <span className="text-3xl font-extrabold text-white font-mono mt-1 block">2,500</span>
                </div>
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Available Stock</span>
                  <span className="text-3xl font-extrabold text-white font-mono mt-1 block">1,840</span>
                </div>
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Issued to Patients</span>
                  <span className="text-3xl font-extrabold text-white font-mono mt-1 block">610</span>
                </div>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Damaged / Returned</span>
                  <span className="text-3xl font-extrabold text-white font-mono mt-1 block">50</span>
                </div>
              </div>
            </div>
          )}

          {activeNav === 'abdm_his' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Hospital Information System (HIS) & ABDM Integration</h2>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} />
                  <div>
                    <span className="font-bold block">Hospital HIS Adapter Connected</span>
                    <span className="text-[10px] text-slate-400 font-mono">FHIR R4 Gateway: https://fhir.aiims.edu/r4/v1 • Health Facility Registry Linked</span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold bg-emerald-500/20 px-3 py-1 rounded-xl">99.9% Uptime</span>
              </div>
            </div>
          )}

          {activeNav === 'incidents' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Local Technical Maintenance & Alerts</h2>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300 flex items-center justify-between">
                <div>
                  <span className="font-bold block">Printer Paper Alert — KSK-DEL-017</span>
                  <span className="text-[10px] text-slate-400">Emergency Triage Terminal paper level is at 15%. Technician notified.</span>
                </div>
                <button type="button" className="px-3 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-xl">
                  Dispatch Staff
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
