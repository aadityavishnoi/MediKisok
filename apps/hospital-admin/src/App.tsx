import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Building2,
  Stethoscope,
  HardDrive,
  CreditCard,
  Server,
  Wrench,
  CheckCircle2,
  Activity,
  Plus,
  AlertTriangle,
  RefreshCw,
  Search,
  Bell,
  Sun,
  Moon,
  Clock,
  UserCheck,
  PhoneCall,
  Flame,
  Check,
  X,
  AlertOctagon,
  ChevronRight
} from 'lucide-react';

interface Hospital {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  facilityStatus: string;
}

interface Department {
  id: string;
  hospitalId: string;
  name: string;
  code: string;
  floor?: string;
  roomNumber?: string;
  active: boolean;
  headOfDepartment?: string;
  doctors?: any[];
  _count?: { triageQueues: number };
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  department?: string;
  roomNumber?: string;
  status: 'AVAILABLE' | 'IN_CONSULTATION' | 'ON_BREAK' | 'OFF_DUTY';
  qualification?: string;
  avgConsultMinutes?: number;
  patientsWaiting?: number;
}

interface Kiosk {
  id: string;
  deviceCode: string;
  location?: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'MAINTENANCE';
  printerPaperPercent?: number;
  firmwareVersion?: string;
  ipAddress?: string;
  kioskType?: string;
}

interface QueueItem {
  id: string;
  tokenNumber: string;
  patientName: string;
  patientPhone?: string;
  patientAge?: number;
  gender?: string;
  priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  status: 'WAITING' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'NO_SHOW';
  departmentName?: string;
  doctorName?: string;
  roomNumber?: string;
  estimatedWaitMins?: number;
  createdAt: string;
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeNav, setActiveNav] = useState('overview');
  const [search, setSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hospital state
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');

  // Operational Data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [overviewMetrics, setOverviewMetrics] = useState<any>(null);

  // Modals
  const [showAddHospitalModal, setShowAddHospitalModal] = useState(false);
  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    code: '',
    type: 'DISTRICT_HOSPITAL',
    state: 'Delhi',
    district: 'New Delhi',
    city: 'New Delhi',
    totalBeds: 200,
    totalKiosks: 4,
  });

  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', floor: 'Ground Floor', roomNumber: 'OPD 101', headOfDepartment: '' });

  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [doctorForm, setDoctorForm] = useState({ name: '', email: '', department: 'General Medicine', roomNumber: 'OPD 102', qualification: 'MBBS, MD', password: 'Password@123' });

  const [showAddKioskModal, setShowAddKioskModal] = useState(false);
  const [kioskForm, setKioskForm] = useState({ deviceCode: '', location: 'Main OPD Lobby', kioskType: 'SELF_SERVICE', firmwareVersion: 'v4.2.0' });

  const isLight = theme === 'light';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initial load of hospitals
  useEffect(() => {
    async function fetchHospitals() {
      try {
        const res = await fetch('/api/hospitals?limit=50');
        if (res.ok) {
          const data = await res.json();
          const list = data.facilities || data.hospitals || [];
          setHospitals(list);
          if (list.length > 0) {
            setSelectedHospitalId((prev) => (prev && list.some((h: any) => h.id === prev) ? prev : list[0].id));
          }
        }
      } catch (err) {
        console.error('Failed to fetch hospitals:', err);
      }
    }
    fetchHospitals();
  }, []);

  // Fetch operational data when hospital changes
  const loadHospitalData = useCallback(async () => {
    if (!selectedHospitalId) return;
    setLoading(true);
    try {
      const [deptRes, docRes, kioskRes, queueRes, overviewRes] = await Promise.all([
        fetch(`/api/hospitals/${selectedHospitalId}/departments`),
        fetch(`/api/hospitals/${selectedHospitalId}/doctors`),
        fetch(`/api/hospitals/${selectedHospitalId}/kiosks`),
        fetch(`/api/queues?hospitalId=${selectedHospitalId}&limit=50`),
        fetch(`/api/hospitals/${selectedHospitalId}/overview`),
      ]);

      if (deptRes.ok) {
        const d = await deptRes.json();
        setDepartments(d.departments || []);
      }
      if (docRes.ok) {
        const doc = await docRes.json();
        setDoctors(doc.doctors || []);
      }
      if (kioskRes.ok) {
        const k = await kioskRes.json();
        setKiosks(k.kiosks || []);
      }
      if (queueRes.ok) {
        const q = await queueRes.json();
        setQueueItems(q.queue || q.items || []);
      }
      if (overviewRes.ok) {
        const o = await overviewRes.json();
        setOverviewMetrics(o);
      }
    } catch (err) {
      console.error('Error fetching hospital operations:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedHospitalId]);

  useEffect(() => {
    loadHospitalData();
    const interval = setInterval(loadHospitalData, 10000);
    return () => clearInterval(interval);
  }, [loadHospitalData]);

  // Actions: Hospital Facility Create
  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalForm.name || !hospitalForm.code) return;
    try {
      const res = await fetch('/api/hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: hospitalForm.name.trim(),
          code: hospitalForm.code.trim().toUpperCase(),
          type: hospitalForm.type,
          state: hospitalForm.state.trim() || 'Delhi',
          district: hospitalForm.district.trim() || 'New Delhi',
          city: hospitalForm.city.trim() || 'New Delhi',
          totalBeds: Number(hospitalForm.totalBeds) || 100,
          totalKiosks: Number(hospitalForm.totalKiosks) || 2,
          facilityStatus: 'ACTIVE',
        }),
      });
      if (res.ok) {
        const d = await res.json();
        const created = d.hospital || d.facility;
        showToast(`Hospital "${hospitalForm.name}" registered successfully`);
        setShowAddHospitalModal(false);
        setHospitalForm({
          name: '',
          code: '',
          type: 'DISTRICT_HOSPITAL',
          state: 'Delhi',
          district: 'New Delhi',
          city: 'New Delhi',
          totalBeds: 200,
          totalKiosks: 4,
        });
        const hRes = await fetch('/api/hospitals?limit=50');
        if (hRes.ok) {
          const hData = await hRes.json();
          const list = hData.facilities || hData.hospitals || [];
          setHospitals(list);
          if (created?.id) {
            setSelectedHospitalId(created.id);
          }
        }
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error?.message || 'Failed to create hospital'}`);
      }
    } catch {
      showToast('Network error creating hospital');
    }
  };

  // Actions: Department Create & Toggle
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/hospitals/${selectedHospitalId}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptForm),
      });
      if (res.ok) {
        showToast(`Department "${deptForm.name}" created successfully in CockroachDB`);
        setShowAddDeptModal(false);
        setDeptForm({ name: '', code: '', floor: 'Ground Floor', roomNumber: 'OPD 101', headOfDepartment: '' });
        loadHospitalData();
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error?.message || 'Failed to create department'}`);
      }
    } catch (err) {
      showToast('Network error creating department');
    }
  };

  const handleToggleDepartmentActive = async (deptId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/hospitals/${selectedHospitalId}/departments/${deptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus }),
      });
      if (res.ok) {
        showToast(`Department status updated to ${!currentStatus ? 'Active' : 'Inactive'}`);
        loadHospitalData();
      }
    } catch (err) {
      showToast('Failed to toggle department status');
    }
  };

  // Actions: Doctor Create & Status Toggle
  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/hospitals/${selectedHospitalId}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctorForm),
      });
      if (res.ok) {
        showToast(`Doctor "${doctorForm.name}" registered to roster`);
        setShowAddDoctorModal(false);
        setDoctorForm({ name: '', email: '', department: 'General Medicine', roomNumber: 'OPD 102', qualification: 'MBBS, MD', password: 'Password@123' });
        loadHospitalData();
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error?.message || 'Failed to add doctor'}`);
      }
    } catch (err) {
      showToast('Network error registering doctor');
    }
  };

  const handleToggleDoctorStatus = async (doctorId: string, current: string) => {
    const next = current === 'AVAILABLE' ? 'IN_CONSULTATION' : current === 'IN_CONSULTATION' ? 'OFF_DUTY' : 'AVAILABLE';
    try {
      const res = await fetch(`/api/hospitals/doctors/${doctorId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        showToast(`Doctor status updated to ${next}`);
        loadHospitalData();
      }
    } catch (err) {
      showToast('Failed to toggle doctor status');
    }
  };

  // Actions: Kiosk Register
  const handleCreateKiosk = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/hospitals/${selectedHospitalId}/kiosks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kioskForm),
      });
      if (res.ok) {
        showToast(`Kiosk "${kioskForm.deviceCode}" enrolled into fleet`);
        setShowAddKioskModal(false);
        setKioskForm({ deviceCode: '', location: 'Main OPD Lobby', kioskType: 'SELF_SERVICE', firmwareVersion: 'v4.2.0' });
        loadHospitalData();
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error?.message || 'Failed to register kiosk'}`);
      }
    } catch (err) {
      showToast('Network error enrolling kiosk');
    }
  };

  // Actions: Queue Operations
  const handleCallNext = async (ticketId: string, doctorId?: string, roomNumber?: string) => {
    try {
      const res = await fetch('/api/queue/call-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, doctorId, roomNumber }),
      });
      if (res.ok) {
        showToast('Patient called to consultation room');
        loadHospitalData();
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error?.message || 'Failed to call patient'}`);
      }
    } catch {
      showToast('Failed to call patient');
    }
  };

  const handleStartConsultation = async (ticketId: string) => {
    try {
      const res = await fetch('/api/queue/in-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });
      if (res.ok) {
        showToast('Consultation started');
        loadHospitalData();
      }
    } catch {
      showToast('Failed to start consultation');
    }
  };

  const handleEmergencyOverride = async (ticketId: string) => {
    try {
      const res = await fetch('/api/queue/reprioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, priority: 'EMERGENCY' }),
      });
      if (res.ok) {
        showToast('🚨 Emergency override applied! Patient moved to top of queue');
        loadHospitalData();
      }
    } catch {
      showToast('Failed to reprioritize');
    }
  };

  const handleMarkNoShow = async (ticketId: string) => {
    try {
      const res = await fetch('/api/queue/no-show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });
      if (res.ok) {
        showToast('Patient marked as No-Show');
        loadHospitalData();
      }
    } catch {
      showToast('Failed to update ticket');
    }
  };

  const selectedHospital = hospitals.find(h => h.id === selectedHospitalId);

  const SIDEBAR_ITEMS = [
    { id: 'overview', label: 'Hospital Executive Overview', icon: LayoutDashboard },
    { id: 'opd_queue', label: 'Live OPD Queue Operations', icon: Activity, badge: `${queueItems.filter(q => q.status === 'WAITING' || q.status === 'CALLED').length} Waiting` },
    { id: 'departments', label: 'OPD Clinics & Capacity', icon: Building2, badge: `${departments.length} Clinics` },
    { id: 'doctors', label: 'Doctor Rosters & Queues', icon: Stethoscope, badge: `${doctors.length} Doctors` },
    { id: 'fleet', label: 'Hospital Kiosk Fleet', icon: HardDrive, badge: `${kiosks.length} Terminals` },
    { id: 'rfid_inventory', label: 'Local RFID Stock', icon: CreditCard },
    { id: 'abdm_his', label: 'HIS & ABDM Integration', icon: Server, badge: 'Healthy' },
    { id: 'incidents', label: 'Maintenance & Alerts', icon: Wrench, badge: 'Active' },
  ];

  return (
    <div className={`h-screen w-screen overflow-hidden font-display flex transition-colors duration-300 antialiased ${
      isLight ? 'bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white' : 'bg-[#090D16] text-slate-100 selection:bg-blue-600 selection:text-white'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <CheckCircle2 size={18} className="text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`w-80 h-full border-r backdrop-blur-md flex flex-col shrink-0 overflow-hidden transition-colors duration-300 ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.03] border-white/10'
      }`}>
        <div className={`px-5 py-4 border-b shrink-0 ${isLight ? 'border-slate-100' : 'border-white/10'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-[0_0_20px_rgba(59,130,246,0.4)]">
              🏥
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-extrabold text-xs font-heading tracking-tight truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {selectedHospital?.name || 'MediKiosk Hospital Admin'}
              </div>
              <div className="text-[10px] text-blue-500 font-semibold mt-0.5 font-mono">
                {selectedHospital?.code || 'FACILITY_TENANT'}
              </div>
            </div>
          </div>

          {/* Hospital Switcher */}
          <div className="mt-3 space-y-1.5">
            {hospitals.length > 0 ? (
              <select
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
                className={`w-full text-xs rounded-xl px-2.5 py-1.5 border font-semibold focus:outline-none ${
                  isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.city || h.state})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-[11px] text-amber-500 font-medium">No facility loaded</div>
            )}
            <button
              type="button"
              onClick={() => setShowAddHospitalModal(true)}
              className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] font-bold transition-all"
            >
              <Plus size={12} /> + Add Facility / Hospital
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1.5 text-xs font-medium overflow-y-auto">
          <div className={`px-3 pb-1 text-[9px] font-bold uppercase tracking-wider font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Operational Modules
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
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20 scale-[1.01]'
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
                    active
                      ? 'bg-white/20 text-white'
                      : isLight
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
              <span className="text-[11px]">CockroachDB Live</span>
            </div>
            <span className="font-mono text-[10px]">Active</span>
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
              placeholder="Search doctors, queues, clinics, kiosks..."
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action Toolbar Buttons */}
            <div className="flex items-center gap-1.5 border-r pr-3 border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowAddHospitalModal(true)}
                title="Add New Hospital / Facility"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <Plus size={13} />
                <span>+ Hospital</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddDoctorModal(true)}
                title="Add New Doctor to Facility Roster"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <Plus size={13} />
                <span>+ Doctor</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddKioskModal(true)}
                title="Enroll New Kiosk Terminal"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <Plus size={13} />
                <span>+ Kiosk</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddDeptModal(true)}
                title="Create OPD Department"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <Plus size={13} />
                <span>+ Dept</span>
              </button>
            </div>

            <button
              type="button"
              onClick={loadHospitalData}
              title="Refresh live data from CockroachDB"
              className={`p-2 rounded-xl border transition-all ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-blue-500' : ''} />
            </button>

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
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon size={14} className="text-blue-400" />
                  <span>Dark</span>
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
              <span className="text-[10px] font-mono text-blue-500 font-bold">2 Live</span>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                <span className="font-bold block">Live Queue Active</span>
                <span className="text-[10px] text-slate-600">{queueItems.length} patients currently in facility queue</span>
              </div>
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-800">
                <span className="font-bold block">Kiosk Fleet Status</span>
                <span className="text-[10px] text-slate-600">{kiosks.filter(k => k.status === 'ONLINE').length} terminals active</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Viewport */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1 overflow-y-auto animate-fade-in">
          {/* TAB 1: OVERVIEW */}
          {activeNav === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                {[
                  {
                    label: "Active Patient Queue",
                    val: `${queueItems.filter(q => q.status === 'WAITING' || q.status === 'CALLED').length} Waiting`,
                    sub: '● Live CockroachDB Stream',
                    lightColor: 'bg-white border-blue-200 text-blue-900',
                    darkColor: 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                  },
                  {
                    label: 'Doctors On Duty',
                    val: `${doctors.filter(d => d.status === 'AVAILABLE' || d.status === 'IN_CONSULTATION').length} Active`,
                    sub: `Across ${departments.length} Registered Clinics`,
                    lightColor: 'bg-white border-emerald-200 text-emerald-900',
                    darkColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  },
                  {
                    label: 'Fleet Kiosks Online',
                    val: `${kiosks.filter(k => k.status === 'ONLINE').length} / ${kiosks.length || 4} Online`,
                    sub: '● Heartbeat Telemetry Live',
                    lightColor: 'bg-white border-cyan-200 text-cyan-900',
                    darkColor: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
                  },
                  {
                    label: 'Emergency Overrides',
                    val: `${queueItems.filter(q => q.priority === 'EMERGENCY').length} Urgent`,
                    sub: 'Instant Triage Priority',
                    lightColor: 'bg-white border-red-200 text-red-900',
                    darkColor: 'bg-red-500/10 border-red-500/20 text-red-300'
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 border rounded-2xl transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
                      isLight ? `${item.lightColor} shadow-xs` : `${item.darkColor} backdrop-blur-md`
                    }`}
                  >
                    <span className={`text-[11px] font-semibold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-blue-400'}`}>{item.label}</span>
                    <div className="text-3xl font-extrabold mt-1">{item.val}</div>
                    <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-blue-300'}`}>{item.sub}</span>
                  </div>
                ))}
              </div>

              {/* Doctor Roster & Local Fleet */}
              <div className="grid grid-cols-12 gap-6">
                <div className={`col-span-7 border rounded-2xl p-5 space-y-4 ${
                  isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10 backdrop-blur-md'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-bold font-heading flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      <Stethoscope size={16} className="text-blue-500" />
                      Doctor Consultation Roster
                    </h3>
                    <button
                      onClick={() => setShowAddDoctorModal(true)}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-700"
                    >
                      <Plus size={13} /> Add Doctor
                    </button>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b font-semibold ${isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'}`}>
                        <th className="pb-3">Doctor</th>
                        <th className="pb-3">Department</th>
                        <th className="pb-3">Room</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y text-xs ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
                      {doctors.slice(0, 6).map((d) => (
                        <tr key={d.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                          <td className={`py-3 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{d.name}</td>
                          <td className={`py-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{d.department || 'General'}</td>
                          <td className={`py-3 font-mono ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>{d.roomNumber || 'Room 101'}</td>
                          <td className="py-3">
                            <button
                              onClick={() => handleToggleDoctorStatus(d.id, d.status)}
                              className={`px-2.5 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                d.status === 'AVAILABLE'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : d.status === 'IN_CONSULTATION'
                                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                                  : 'bg-slate-100 text-slate-600 border-slate-300'
                              }`}
                            >
                              {d.status}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={`col-span-5 border rounded-2xl p-5 space-y-4 ${
                  isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10 backdrop-blur-md'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-bold font-heading flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      <HardDrive size={16} className="text-blue-500" />
                      Kiosk Fleet Telemetry
                    </h3>
                    <button
                      onClick={() => setShowAddKioskModal(true)}
                      className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-indigo-700"
                    >
                      <Plus size={13} /> Enroll
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    {kiosks.slice(0, 4).map((k) => (
                      <div key={k.id} className={`p-3 border rounded-xl space-y-2 ${
                        isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-white/5 border-white/10'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-600">{k.deviceCode}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            k.status === 'ONLINE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                          }`}>
                            {k.status}
                          </span>
                        </div>
                        <div className={`text-[11px] ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>{k.location || 'OPD Lobby'}</div>
                        <div className="text-[10px] font-mono text-slate-500">Paper: <strong>{k.printerPaperPercent ?? 85}%</strong> • {k.firmwareVersion || 'v4.2.0'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE OPD QUEUE OPERATIONS */}
          {activeNav === 'opd_queue' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-extrabold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>Live OPD Queue Operations & Flow</h2>
                  <p className="text-xs text-slate-500 mt-1">Real-time token calling, consultation dispatching, and emergency prioritization</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold">
                    {queueItems.length} Total Registered in Queue
                  </span>
                </div>
              </div>

              {/* Queue Table */}
              <div className={`border rounded-2xl p-5 space-y-4 ${
                isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10 backdrop-blur-md'
              }`}>
                {queueItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No patients currently waiting in the OPD queue. Patients register at Patient Kiosk or reception.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b font-semibold ${isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'}`}>
                        <th className="pb-3">Token #</th>
                        <th className="pb-3">Patient Name</th>
                        <th className="pb-3">Department</th>
                        <th className="pb-3">Priority</th>
                        <th className="pb-3">Queue Status</th>
                        <th className="pb-3">Wait Time</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y text-xs ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
                      {queueItems
                        .filter(q => !search || q.patientName.toLowerCase().includes(search.toLowerCase()) || q.tokenNumber.includes(search))
                        .map((q) => (
                        <tr key={q.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                          <td className="py-3 font-mono font-extrabold text-blue-600 text-sm">
                            {q.tokenNumber}
                          </td>
                          <td className="py-3">
                            <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{q.patientName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {q.gender || 'M'} • {q.patientAge ? `${q.patientAge}y` : 'Adult'}
                            </div>
                          </td>
                          <td className={`py-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                            {q.departmentName || 'General OPD'}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                              q.priority === 'EMERGENCY'
                                ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                                : q.priority === 'URGENT'
                                ? 'bg-amber-50 text-amber-700 border-amber-300'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}>
                              {q.priority}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              q.status === 'CALLED'
                                ? 'bg-blue-600 text-white animate-pulse'
                                : q.status === 'IN_CONSULTATION'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-300'
                                : q.status === 'WAITING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-300'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {q.status}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-slate-500">
                            {q.estimatedWaitMins ? `~${q.estimatedWaitMins} mins` : 'Immediate'}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {q.status === 'WAITING' && (
                                <>
                                  <button
                                    onClick={() => handleCallNext(q.id)}
                                    title="Call patient into consultation"
                                    className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-bold hover:bg-blue-700 flex items-center gap-1 shadow-xs"
                                  >
                                    <PhoneCall size={12} /> Call
                                  </button>
                                  {q.priority !== 'EMERGENCY' && (
                                    <button
                                      onClick={() => handleEmergencyOverride(q.id)}
                                      title="Mark Emergency Priority"
                                      className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-[11px] font-bold hover:bg-red-200"
                                    >
                                      <Flame size={12} />
                                    </button>
                                  )}
                                </>
                              )}

                              {q.status === 'CALLED' && (
                                <button
                                  onClick={() => handleStartConsultation(q.id)}
                                  className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700 shadow-xs"
                                >
                                  In Consult
                                </button>
                              )}

                              {q.status !== 'COMPLETED' && q.status !== 'NO_SHOW' && (
                                <button
                                  onClick={() => handleMarkNoShow(q.id)}
                                  title="Mark as No-Show"
                                  className="px-2 py-1 text-slate-400 hover:text-red-500 rounded-lg text-[11px]"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: OPD CLINICS & DEPARTMENTS */}
          {activeNav === 'departments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-extrabold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>OPD Clinics & Capacity Overview</h2>
                  <p className="text-xs text-slate-500 mt-1">Configurable departments, assigned rooms, and capacity limits</p>
                </div>
                <button
                  onClick={() => setShowAddDeptModal(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 shadow-sm"
                >
                  <Plus size={15} /> Create Department
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs">
                {departments.map((dept) => (
                  <div key={dept.id} className={`p-4 border rounded-2xl space-y-3 transition-all ${
                    isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`font-bold text-sm font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>{dept.name}</span>
                        <span className="text-[10px] font-mono text-blue-500 ml-2">[{dept.code}]</span>
                      </div>
                      <button
                        onClick={() => handleToggleDepartmentActive(dept.id, dept.active)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          dept.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {dept.active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                    <div className="space-y-1 text-slate-500">
                      <div>Room: <strong className="text-slate-800 font-mono">{dept.roomNumber || 'Room 101'}</strong> ({dept.floor || 'Ground'})</div>
                      <div>Head: <strong className="text-slate-800">{dept.headOfDepartment || 'Unassigned'}</strong></div>
                      <div>Doctors: <strong className="text-blue-600 font-mono">{dept.doctors?.length || 0} assigned</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DOCTORS */}
          {activeNav === 'doctors' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-extrabold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>Doctor Shift Rosters & Triage Assignment</h2>
                  <p className="text-xs text-slate-500 mt-1">Medical practitioner registry, OPD room allocation, and availability controls</p>
                </div>
                <button
                  onClick={() => setShowAddDoctorModal(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 shadow-sm"
                >
                  <Plus size={15} /> Add Doctor
                </button>
              </div>

              <div className={`border rounded-2xl p-5 space-y-4 ${
                isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10 backdrop-blur-md'
              }`}>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={`border-b font-semibold ${isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'}`}>
                      <th className="pb-3">Doctor Name</th>
                      <th className="pb-3">Department</th>
                      <th className="pb-3">Assigned Room</th>
                      <th className="pb-3">Qualification</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Avg Consult</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-xs ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
                    {doctors.map((d) => (
                      <tr key={d.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                        <td className="py-3">
                          <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{d.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{d.email}</div>
                        </td>
                        <td className={`py-3 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{d.department || 'General Medicine'}</td>
                        <td className={`py-3 font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{d.roomNumber || 'Room 101'}</td>
                        <td className="py-3 font-mono text-slate-500">{d.qualification || 'MBBS'}</td>
                        <td className="py-3">
                          <button
                            onClick={() => handleToggleDoctorStatus(d.id, d.status)}
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold border transition-all ${
                              d.status === 'AVAILABLE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : d.status === 'IN_CONSULTATION'
                                ? 'bg-blue-50 text-blue-700 border-blue-300'
                                : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}
                          >
                            {d.status}
                          </button>
                        </td>
                        <td className="py-3 text-right font-mono text-emerald-600 font-bold">
                          {d.avgConsultMinutes || 4.5} mins
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: FLEET */}
          {activeNav === 'fleet' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-extrabold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>Hospital Kiosk Fleet & Mode Controls</h2>
                  <p className="text-xs text-slate-500 mt-1">Local kiosk terminal telemetry, paper levels, and firmware versions</p>
                </div>
                <button
                  onClick={() => setShowAddKioskModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-700 shadow-sm"
                >
                  <Plus size={15} /> Enroll New Kiosk
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {kiosks.map((k) => (
                  <div key={k.id} className={`p-5 border rounded-2xl space-y-4 ${
                    isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-blue-600 font-bold text-sm">{k.deviceCode}</span>
                        <div className={`font-bold text-sm mt-0.5 font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>{k.location || 'OPD Lobby'}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                        k.status === 'ONLINE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}>
                        {k.status}
                      </span>
                    </div>

                    <div className={`grid grid-cols-2 gap-2 text-xs font-mono p-3 rounded-xl border ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-slate-300'
                    }`}>
                      <div>Printer Paper: <strong className={(k.printerPaperPercent ?? 85) < 20 ? 'text-red-600' : 'text-emerald-600'}>{k.printerPaperPercent ?? 85}%</strong></div>
                      <div>Firmware: <span>{k.firmwareVersion || 'v4.2.0'}</span></div>
                      <div>Type: <span>{k.kioskType || 'SELF_SERVICE'}</span></div>
                      <div>IP: <span>{k.ipAddress || '10.0.4.12'}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: RFID INVENTORY */}
          {activeNav === 'rfid_inventory' && (
            <div className="space-y-6">
              <h2 className={`text-xl font-extrabold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>Local Hospital RFID Card Stock</h2>
              <div className="grid grid-cols-4 gap-4 text-xs">
                {[
                  { label: 'Total Allocated', val: '2,500', lightColor: 'bg-white border-blue-200 text-blue-900', darkColor: 'bg-blue-500/10 border-blue-500/20' },
                  { label: 'Issued & Active', val: '1,840', lightColor: 'bg-white border-emerald-200 text-emerald-900', darkColor: 'bg-emerald-500/10 border-emerald-500/20' },
                  { label: 'Blank in Stock', val: '610', lightColor: 'bg-white border-cyan-200 text-cyan-900', darkColor: 'bg-cyan-500/10 border-cyan-500/20' },
                  { label: 'Damaged / Replaced', val: '50', lightColor: 'bg-white border-amber-200 text-amber-900', darkColor: 'bg-amber-500/10 border-amber-500/20' },
                ].map((item, idx) => (
                  <div key={idx} className={`p-4 border rounded-2xl ${isLight ? `${item.lightColor} shadow-xs` : `${item.darkColor}`}`}>
                    <span className={`block text-[10px] uppercase font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</span>
                    <span className="text-3xl font-extrabold mt-1 block">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: ABDM / HIS */}
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
                    <span className={`text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>FHIR R4 Gateway: Health Facility Registry Linked ({selectedHospital?.code || 'FACILITY'})</span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold bg-emerald-600 text-white px-3 py-1 rounded-xl">99.9% Uptime</span>
              </div>
            </div>
          )}

          {/* TAB 8: INCIDENTS */}
          {activeNav === 'incidents' && (
            <div className="space-y-6">
              <h2 className={`text-xl font-extrabold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>Local Technical Maintenance & Alerts</h2>
              <div className={`p-4 border rounded-2xl text-xs flex items-center justify-between ${
                isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}>
                <div>
                  <span className="font-bold block">All Hardware Modules Operational</span>
                  <span className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>RFID reader, biometric, and thermal printer diagnostic tests passing</span>
                </div>
                <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-xl">Passing</span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: ADD DEPARTMENT */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm font-heading">Create New OPD Department</h3>
              <button onClick={() => setShowAddDeptModal(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateDepartment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Department Name *</label>
                <input
                  required
                  placeholder="e.g. Orthopedics OPD"
                  value={deptForm.name}
                  onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                  className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Department Code (2-6 letters) *</label>
                <input
                  required
                  placeholder="e.g. ORTHO"
                  value={deptForm.code}
                  onChange={e => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  className={`w-full border rounded-xl px-3 py-2 font-mono ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Floor</label>
                  <input
                    value={deptForm.floor}
                    onChange={e => setDeptForm({ ...deptForm, floor: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">OPD Room</label>
                  <input
                    value={deptForm.roomNumber}
                    onChange={e => setDeptForm({ ...deptForm, roomNumber: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Head of Department (HOD)</label>
                <input
                  placeholder="Dr. S. K. Roy"
                  value={deptForm.headOfDepartment}
                  onChange={e => setDeptForm({ ...deptForm, headOfDepartment: e.target.value })}
                  className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Create in CockroachDB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD DOCTOR */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm font-heading">Add Doctor to Facility Roster</h3>
              <button onClick={() => setShowAddDoctorModal(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateDoctor} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Doctor Full Name *</label>
                <input
                  required
                  placeholder="Dr. Rajesh Gupta"
                  value={doctorForm.name}
                  onChange={e => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Email Address *</label>
                <input
                  required
                  type="email"
                  placeholder="rajesh.gupta@hospital.org"
                  value={doctorForm.email}
                  onChange={e => setDoctorForm({ ...doctorForm, email: e.target.value })}
                  className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Department</label>
                  {departments.length > 0 ? (
                    <select
                      value={doctorForm.department}
                      onChange={e => setDoctorForm({ ...doctorForm, department: e.target.value })}
                      className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-white/10 text-white'}`}
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={doctorForm.department}
                      onChange={e => setDoctorForm({ ...doctorForm, department: e.target.value })}
                      className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Assigned Room</label>
                  <input
                    value={doctorForm.roomNumber}
                    onChange={e => setDoctorForm({ ...doctorForm, roomNumber: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Qualification</label>
                <input
                  value={doctorForm.qualification}
                  onChange={e => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                  className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Register Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ENROLL KIOSK */}
      {showAddKioskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm font-heading">Enroll Hardware Kiosk Terminal</h3>
              <button onClick={() => setShowAddKioskModal(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateKiosk} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Device Terminal Code *</label>
                <input
                  required
                  placeholder="KSK-DEL-020"
                  value={kioskForm.deviceCode}
                  onChange={e => setKioskForm({ ...kioskForm, deviceCode: e.target.value.toUpperCase() })}
                  className={`w-full border rounded-xl px-3 py-2 font-mono ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">Physical Location</label>
                <input
                  placeholder="e.g. Pediatric Ward Entrance"
                  value={kioskForm.location}
                  onChange={e => setKioskForm({ ...kioskForm, location: e.target.value })}
                  className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddKioskModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Enroll Kiosk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD HOSPITAL */}
      {showAddHospitalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm font-heading">Onboard New Hospital / Health Facility</h3>
              <button onClick={() => setShowAddHospitalModal(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateHospital} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Facility Name *</label>
                <input
                  required
                  placeholder="e.g. District Civil Hospital Gurugram"
                  value={hospitalForm.name}
                  onChange={e => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                  className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Facility Code *</label>
                  <input
                    required
                    placeholder="e.g. DH-GUR-01"
                    value={hospitalForm.code}
                    onChange={e => setHospitalForm({ ...hospitalForm, code: e.target.value.toUpperCase() })}
                    className={`w-full border rounded-xl px-3 py-2 font-mono ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Facility Type</label>
                  <select
                    value={hospitalForm.type}
                    onChange={e => setHospitalForm({ ...hospitalForm, type: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-white/10 text-white'}`}
                  >
                    <option value="DISTRICT_HOSPITAL">District Hospital</option>
                    <option value="AIIMS">AIIMS</option>
                    <option value="TERTIARY_HOSPITAL">Tertiary Hospital</option>
                    <option value="COMMUNITY_HEALTH_CENTRE">Community Health Centre</option>
                    <option value="PRIMARY_HEALTH_CENTRE">Primary Health Centre</option>
                    <option value="PRIVATE_HOSPITAL">Private Hospital</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">State *</label>
                  <input
                    required
                    value={hospitalForm.state}
                    onChange={e => setHospitalForm({ ...hospitalForm, state: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">District *</label>
                  <input
                    required
                    value={hospitalForm.district}
                    onChange={e => setHospitalForm({ ...hospitalForm, district: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">City *</label>
                  <input
                    required
                    value={hospitalForm.city}
                    onChange={e => setHospitalForm({ ...hospitalForm, city: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Total Beds</label>
                  <input
                    type="number"
                    value={hospitalForm.totalBeds}
                    onChange={e => setHospitalForm({ ...hospitalForm, totalBeds: Number(e.target.value) })}
                    className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Kiosks Planned</label>
                  <input
                    type="number"
                    value={hospitalForm.totalKiosks}
                    onChange={e => setHospitalForm({ ...hospitalForm, totalKiosks: Number(e.target.value) })}
                    className={`w-full border rounded-xl px-3 py-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddHospitalModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Create Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
