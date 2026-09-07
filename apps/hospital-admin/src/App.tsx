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
  Power,
  Sun,
  Moon
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
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

  const isLight = theme === 'light';

  return (
    <div className={`h-screen w-screen overflow-hidden font-display flex transition-colors duration-300 antialiased ${
      isLight ? 'bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white' : 'bg-[#090D16] text-slate-100 selection:bg-blue-600 selection:text-white'
    }`}>
      {/* Sidebar Navigation */}
      <aside className={`w-80 h-full border-r backdrop-blur-md flex flex-col shrink-0 overflow-hidden transition-colors duration-300 ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.03] border-white/10'
      }`}>
        <div className={`px-5 py-4 flex items-center gap-3 border-b shrink-0 ${isLight ? 'border-slate-100' : 'border-white/10'}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-[0_0_20px_rgba(59,130,246,0.4)]">
            🏥
          </div>
          <div>
            <div className={`font-extrabold leading-none text-xs font-heading tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              AIIMS New Delhi — OPD Block
            </div>
            <div className="text-[10px] text-blue-500 font-semibold leading-none mt-1 font-mono">
              Facility Code: HOSP-DEL-AIIMS
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1.5 text-xs font-medium overflow-y-auto">
          <div className={`px-3 pb-1 text-[9px] font-bold uppercase tracking-wider font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  active
                    ? isLight
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20 scale-[1.01]'
                      : 'bg-blue-600 text-white font-bold shadow-[0_0_16px_rgba(59,130,246,0.4)] scale-[1.01]'
                    : isLight
                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 whitespace-nowrap ${
                    isLight
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Status */}
        <div className={`p-3 border-t shrink-0 ${isLight ? 'border-slate-100' : 'border-white/10'}`}>
          <div className={`flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl border ${
            isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px]">HIS Gateway Connected</span>
            </div>
            <span className="font-mono text-[10px]">Sync 100%</span>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Header */}
        <header className={`h-16 border-b flex items-center justify-between px-8 shrink-0 z-30 transition-colors duration-300 ${
          isLight ? 'bg-white/90 border-slate-200/80 backdrop-blur-md' : 'bg-white/[0.03] border-white/10 backdrop-blur-md'
        }`}>
          <div className="w-96 max-w-full relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full border rounded-xl pl-10 pr-4 py-2 text-xs transition-colors focus:outline-none ${
                isLight
                  ? 'bg-slate-100/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500'
                  : 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50'
              }`}
              placeholder="Search doctors, OPD rooms, patients, kiosk terminals..."
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Switcher Button */}
            <button
              type="button"
              onClick={() => setTheme(isLight ? 'dark' : 'light')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              {isLight ? (
                <>
                  <Sun size={14} className="text-amber-500" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon size={14} className="text-blue-400" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`relative w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            </button>

            <div className={`flex items-center gap-3 border-l pl-4 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-600 text-xs shadow-inner font-mono">
                ADMIN
              </div>
              <div className="text-xs">
                <div className={`font-bold leading-none font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>Dr. S. K. Gupta</div>
                <div className={`text-[10px] leading-none mt-1 font-mono ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>Medical Superintendent</div>
              </div>
            </div>
          </div>
        </header>

        {/* Notifications Modal */}
        {notificationsOpen && (
          <div className={`absolute top-16 right-8 z-40 w-80 border rounded-2xl shadow-2xl p-4 text-xs space-y-3 animate-fade-in ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/15'
          }`}>
            <div className={`flex items-center justify-between border-b pb-2 ${isLight ? 'border-slate-100' : 'border-white/10'}`}>
              <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Hospital Operational Alerts</span>
              <span className="text-[10px] font-mono text-blue-500 font-bold">2 New</span>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                <span className="font-bold block">Low Printer Paper</span>
                <span className="text-[10px] text-slate-500">KSK-DEL-017 at Emergency Triage has 15% paper left</span>
              </div>
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-800">
                <span className="font-bold block">Acute Red-Flag Triage Alert</span>
                <span className="text-[10px] text-slate-500">Chest Pain Patient routed to OPD Room 102</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Viewport */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1 overflow-y-auto animate-fade-in">
          {activeNav === 'overview' && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Today's Patient Intake", val: '1,482', sub: '+14% vs Yesterday', lightColor: 'bg-white border-blue-200 text-blue-900', darkColor: 'bg-blue-500/10 border-blue-500/20 text-blue-300' },
                  { label: 'Doctors On Duty', val: '32 Active', sub: 'Across 6 OPD Clinics', lightColor: 'bg-white border-emerald-200 text-emerald-900', darkColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' },
                  { label: 'Avg Patient Triage', val: '4.2 mins', sub: '85% Kiosk Offloading', lightColor: 'bg-white border-cyan-200 text-cyan-900', darkColor: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300' },
                  { label: 'Red-Flag Triage Alerts', val: '3 Priority', sub: 'Bypassed General Queue', lightColor: 'bg-white border-red-200 text-red-900', darkColor: 'bg-red-500/10 border-red-500/20 text-red-300' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 border rounded-2xl transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
                      isLight ? `${item.lightColor} shadow-xs` : `${item.darkColor} backdrop-blur-md`
                    }`}
                  >
                    <span className={`text-[11px] font-semibold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-blue-400'}`}>{item.label}</span>
                    <div className="text-3xl font-extrabold font-mono mt-1">{item.val}</div>
                    <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-blue-300'}`}>{item.sub}</span>
                  </div>
                ))}
              </div>

              {/* Live OPD Clinic Status & Active Queue Table */}
              <div className="grid grid-cols-12 gap-6">
                <div className={`col-span-7 border rounded-2xl p-5 space-y-4 transition-colors duration-300 ${
                  isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10 backdrop-blur-md'
                }`}>
                  <h3 className={`text-sm font-bold font-heading flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <Stethoscope size={16} className="text-blue-500" />
                    Doctor Consultation Roster & Queue Live Stream
                  </h3>

                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b font-semibold ${isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'}`}>
                        <th className="pb-3">Doctor</th>
                        <th className="pb-3">Department</th>
                        <th className="pb-3">Room</th>
                        <th className="pb-3">Queue</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">AI Verify</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y text-xs ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
                      {DOCTORS.map((d) => (
                        <tr key={d.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                          <td className={`py-3 font-bold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>{d.name}</td>
                          <td className={`py-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{d.dept}</td>
                          <td className={`py-3 font-mono ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>{d.room}</td>
                          <td className="py-3 font-mono font-bold text-blue-600">{d.patientsWaiting} Patients</td>
                          <td className="py-3">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                              d.status === 'Available'
                                ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : d.status === 'In Consultation'
                                ? isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                            }`}>
                              {d.status}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono text-emerald-600 font-bold">{d.aiVerificationRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Local Kiosk Hardware Telemetry Widget */}
                <div className={`col-span-5 border rounded-2xl p-5 space-y-4 transition-colors duration-300 ${
                  isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10 backdrop-blur-md'
                }`}>
                  <h3 className={`text-sm font-bold font-heading flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <HardDrive size={16} className="text-blue-500" />
                    Local Hospital Kiosk Hardware Status
                  </h3>

                  <div className="space-y-3 text-xs">
                    {kiosks.map((k) => (
                      <div key={k.code} className={`p-3 border rounded-xl space-y-2 transition-all hover:shadow-sm ${
                        isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-white/5 border-white/10'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-600">{k.code}</span>
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                            k.status === 'Online'
                              ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            {k.status}
                          </span>
                        </div>
                        <div className={`font-medium text-[11px] ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{k.location}</div>
                        <div className={`flex items-center justify-between text-[10px] font-mono pt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          <span>Paper: <strong className={k.printerPaper < 20 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>{k.printerPaper}%</strong></span>
                          <span>Mode: <strong className="text-indigo-600">{k.mode}</strong></span>
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
              <h2 className={`text-xl font-extrabold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>OPD Clinics & Capacity Overview</h2>
              <div className="grid grid-cols-3 gap-4 text-xs">
                {[
                  { name: 'Cardiology OPD', capacity: '62 / 80 Patients', doctors: '4 Doctors', status: 'Optimal' },
                  { name: 'General Medicine OPD', capacity: '142 / 150 Patients', doctors: '8 Doctors', status: 'High Load' },
                  { name: 'Pediatrics OPD', capacity: '55 / 60 Patients', doctors: '5 Doctors', status: 'Optimal' },
                  { name: 'Orthopedics OPD', capacity: '41 / 50 Patients', doctors: '4 Doctors', status: 'Optimal' },
                  { name: 'AYUSH Integrative OPD', capacity: '38 / 40 Patients', doctors: '3 Vaidyas', status: 'Optimal' },
                  { name: 'Radiology & Imaging Block', capacity: '28 / 30 Patients', doctors: '3 Doctors', status: 'Optimal' },
                ].map((dept, idx) => (
                  <div key={idx} className={`p-4 border rounded-2xl space-y-2 transition-all hover:scale-[1.01] ${
                    isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-sm font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>{dept.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        dept.status === 'High Load'
                          ? isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/20 text-amber-300'
                          : isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {dept.status}
                      </span>
                    </div>
                    <div className={isLight ? 'text-slate-500' : 'text-slate-400'}>Capacity: <strong className={`font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{dept.capacity}</strong></div>
                    <div className={isLight ? 'text-slate-500' : 'text-slate-400'}>Staffing: <strong className="text-blue-600 font-mono">{dept.doctors}</strong></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'doctors' && (
            <div className="space-y-6">
              <h2 className={`text-xl font-extrabold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>Doctor Shift Rosters & Triage Assignment</h2>
              <div className={`border rounded-2xl p-5 space-y-4 ${
                isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10 backdrop-blur-md'
              }`}>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={`border-b font-semibold ${isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'}`}>
                      <th className="pb-3">Doctor Name</th>
                      <th className="pb-3">Department</th>
                      <th className="pb-3">Assigned Room</th>
                      <th className="pb-3">Active Patients</th>
                      <th className="pb-3">Avg Duration</th>
                      <th className="pb-3 text-right">AI Summary Approval Rate</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-mono text-[11px] ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
                    {DOCTORS.map((d) => (
                      <tr key={d.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                        <td className={`py-3 font-sans font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{d.name}</td>
                        <td className={`py-3 font-sans ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{d.dept}</td>
                        <td className={isLight ? 'text-slate-500' : 'text-slate-400'}>{d.room}</td>
                        <td className="py-3 text-blue-600 font-bold">{d.patientsWaiting} Patients</td>
                        <td className={isLight ? 'text-slate-600' : 'text-slate-300'}>{d.avgConsultTime}</td>
                        <td className="py-3 text-right text-emerald-600 font-bold">{d.aiVerificationRate}</td>
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
                <h2 className={`text-xl font-extrabold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>Hospital Kiosk Fleet & Mode Controls</h2>
                <span className={`text-xs font-mono font-bold px-3 py-1 rounded-xl border ${
                  isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  4 Local Terminals Connected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {kiosks.map((k) => (
                  <div key={k.code} className={`p-5 border rounded-2xl space-y-4 ${
                    isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-blue-600 font-bold text-sm">{k.code}</span>
                        <div className={`font-bold text-sm mt-0.5 font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>{k.location}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                        k.status === 'Online'
                          ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {k.status}
                      </span>
                    </div>

                    <div className={`grid grid-cols-2 gap-2 text-xs font-mono p-3 rounded-xl border ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-slate-300'
                    }`}>
                      <div>13.56MHz RFID: <span className="text-emerald-600 font-bold">✓ {k.rfidReader}</span></div>
                      <div>OCR Camera: <span className="text-emerald-600 font-bold">✓ {k.ocrCamera}</span></div>
                      <div>Printer Paper: <span className={k.printerPaper < 20 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>{k.printerPaper}%</span></div>
                      <div>Firmware: <span>{k.firmware}</span></div>
                    </div>

                    <div className="space-y-1">
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>Switch Kiosk Operational Mode</span>
                      <div className="flex gap-2">
                        {(['General OPD', 'AYUSH Mode', 'Emergency Priority'] as LocalKiosk['mode'][]).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => toggleKioskMode(k.code, mode)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                              k.mode === mode
                                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                                : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
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
              <h2 className={`text-xl font-extrabold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>Local Hospital RFID Card Inventory</h2>
              <div className="grid grid-cols-4 gap-4 text-xs">
                {[
                  { label: 'Total Allocation', val: '2,500', lightColor: 'bg-white border-blue-200 text-blue-900', darkColor: 'bg-blue-500/10 border-blue-500/20' },
                  { label: 'Available Stock', val: '1,840', lightColor: 'bg-white border-emerald-200 text-emerald-900', darkColor: 'bg-emerald-500/10 border-emerald-500/20' },
                  { label: 'Issued to Patients', val: '610', lightColor: 'bg-white border-cyan-200 text-cyan-900', darkColor: 'bg-cyan-500/10 border-cyan-500/20' },
                  { label: 'Damaged / Returned', val: '50', lightColor: 'bg-white border-amber-200 text-amber-900', darkColor: 'bg-amber-500/10 border-amber-500/20' },
                ].map((item, idx) => (
                  <div key={idx} className={`p-4 border rounded-2xl transition-all hover:scale-[1.02] ${
                    isLight ? `${item.lightColor} shadow-xs` : `${item.darkColor}`
                  }`}>
                    <span className={`block text-[10px] uppercase font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</span>
                    <span className="text-3xl font-extrabold font-mono mt-1 block">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'abdm_his' && (
            <div className="space-y-6">
              <h2 className={`text-xl font-extrabold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>Hospital Information System (HIS) & ABDM Integration</h2>
              <div className={`p-4 border rounded-2xl text-xs flex items-center justify-between ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                  <div>
                    <span className="font-bold block">Hospital HIS Adapter Connected</span>
                    <span className={`text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>FHIR R4 Gateway: https://fhir.aiims.edu/r4/v1 • Health Facility Registry Linked</span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold bg-emerald-600 text-white px-3 py-1 rounded-xl shadow-xs">99.9% Uptime</span>
              </div>
            </div>
          )}

          {activeNav === 'incidents' && (
            <div className="space-y-6">
              <h2 className={`text-xl font-extrabold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>Local Technical Maintenance & Alerts</h2>
              <div className={`p-4 border rounded-2xl text-xs flex items-center justify-between ${
                isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}>
                <div>
                  <span className="font-bold block">Printer Paper Alert — KSK-DEL-017</span>
                  <span className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Emergency Triage Terminal paper level is at 15%. Technician notified.</span>
                </div>
                <button type="button" className="px-3 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm">
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
