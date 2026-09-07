import React, { useState } from 'react';
import {
  CreditCard,
  PlusCircle,
  Building2,
  BarChart3,
  Settings,
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  Download,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Key,
  Layers,
  Radio,
  RefreshCw,
  UserCheck,
  Sun,
  Moon
} from 'lucide-react';

interface CardRow {
  uid: string;
  patientName: string;
  abhaId: string;
  manufacturedDate: string;
  facility: string;
  status: 'Available' | 'Assigned' | 'Active' | 'Suspended' | 'Lost' | 'Damaged' | 'Retired';
  securityToken: string;
}

const INITIAL_CARDS: CardRow[] = [
  { uid: '04:A7:89:BC:D1', patientName: 'Arjun Sharma', abhaId: 'ABHA-91-8821-0042', manufacturedDate: '2026-07-15', facility: 'AIIMS New Delhi', status: 'Active', securityToken: 'sha256:e3b0c44298fc1c14...' },
  { uid: '04:B2:11:09:E4', patientName: 'Neha Kapoor', abhaId: 'ABHA-91-4410-9921', manufacturedDate: '2026-07-15', facility: 'KEM Hospital Mumbai', status: 'Active', securityToken: 'sha256:8f434346648f6b96...' },
  { uid: '04:C5:33:77:F0', patientName: 'Unassigned Stock Card', abhaId: 'Unlinked', manufacturedDate: '2026-08-01', facility: 'Central Stock Depot', status: 'Available', securityToken: 'sha256:a591a6d40bf42040...' },
  { uid: '04:D8:44:99:A2', patientName: 'Vikram Singh', abhaId: 'ABHA-91-1023-5511', manufacturedDate: '2026-07-20', facility: 'Bowring Hospital Bengaluru', status: 'Suspended', securityToken: 'sha256:3b5d5c3712955042...' },
  { uid: '04:E9:55:00:B6', patientName: 'Pooja Verma', abhaId: 'ABHA-91-7700-1122', manufacturedDate: '2026-07-20', facility: 'Rajaji Hospital Madurai', status: 'Active', securityToken: 'sha256:d41d8cd98f00b204...' },
];

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeNav, setActiveNav] = useState('inventory');
  const [search, setSearch] = useState('');
  const [cards, setCards] = useState<CardRow[]>(INITIAL_CARDS);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Enrolment Desk State
  const [patientInput, setPatientInput] = useState('');
  const [abhaInput, setAbhaInput] = useState('');
  const [scannedUid, setScannedUid] = useState('04:F9:88:AA:12');
  const [consentChecked, setConsentChecked] = useState(false);
  const [enrolledSuccess, setEnrolledSuccess] = useState(false);

  const handleSimulateReaderTap = () => {
    const randomHex = Array.from({ length: 5 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(':');
    setScannedUid(`04:${randomHex}`);
    setEnrolledSuccess(false);
  };

  const handleActivateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientInput || !scannedUid || !consentChecked) return;

    const newCard: CardRow = {
      uid: scannedUid,
      patientName: patientInput,
      abhaId: abhaInput || `ABHA-91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      manufacturedDate: new Date().toISOString().split('T')[0],
      facility: 'AIIMS New Delhi — Main OPD',
      status: 'Active',
      securityToken: `sha256:${Math.random().toString(36).substring(2, 18)}...`,
    };

    setCards([newCard, ...cards]);
    setEnrolledSuccess(true);
    setPatientInput('');
    setAbhaInput('');
    setConsentChecked(false);
  };

  const filteredCards = cards.filter(c => {
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    const matchesSearch = c.uid.toLowerCase().includes(search.toLowerCase()) ||
                          c.patientName.toLowerCase().includes(search.toLowerCase()) ||
                          c.facility.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const SIDEBAR_ITEMS = [
    { id: 'inventory', label: 'Card Inventory & Batches', icon: CreditCard, badge: '100k Stock' },
    { id: 'enrollment', label: 'Card Encoding Desk', icon: PlusCircle, badge: 'Tap Reader' },
    { id: 'security_audit', label: 'Security & Clone Audit', icon: ShieldAlert, badge: '2 Alerts' },
    { id: 'facility_distribution', label: 'Hospital Allocation Grid', icon: Building2 },
    { id: 'hardware_readers', label: 'Reader Antenna Telemetry', icon: Radio, badge: '13.56MHz' },
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
            💳
          </div>
          <div>
            <div className={`font-extrabold leading-none text-xs font-heading tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              MediKiosk RFID Token Authority
            </div>
            <div className="text-[10px] text-blue-500 font-semibold leading-none mt-1 font-mono">
              Cryptographic Card Authority
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1.5 text-xs font-medium overflow-y-auto">
          <div className={`px-3 pb-1 text-[9px] font-bold uppercase tracking-wider font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            RFID Token Lifecycle Modules
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
              <span className="text-[11px]">13.56MHz Reader Active</span>
            </div>
            <span className="font-mono text-[10px]">ISO 14443A</span>
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
            <Search size={16} className={`absolute left-3.5 top-3.5 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full border rounded-xl pl-10 pr-4 py-2 text-xs transition-colors focus:outline-none ${
                isLight
                  ? 'bg-slate-100/70 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500'
                  : 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50'
              }`}
              placeholder="Search card UID, patient name, facility, security tokens..."
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

            <div className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-xl border ${
              isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <Lock size={14} />
              <span>Zero PHI On Chip</span>
            </div>

            <div className={`flex items-center gap-3 border-l pl-4 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-bold text-blue-600 text-xs shadow-inner font-mono">
                CARD
              </div>
              <div className="text-xs">
                <div className={`font-bold leading-none font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  RFID Encoding Desk
                </div>
                <div className={`text-[10px] leading-none mt-1 font-mono ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>
                  Operator: ENCODER-DEL-01
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1 overflow-y-auto animate-fade-in">
          {activeNav === 'inventory' && (
            <div className="space-y-6">
              {/* Token Stats Cards */}
              <div className="grid grid-cols-6 gap-3">
                {[
                  { label: 'Total Batch Stock', val: '100,000', lightColor: 'bg-white border-blue-200 text-blue-900', darkColor: 'border-blue-500/30 bg-blue-500/10 text-blue-300' },
                  { label: 'Available Stock', val: '45,000', lightColor: 'bg-white border-slate-200 text-slate-900', darkColor: 'border-slate-500/30 bg-slate-500/10 text-slate-300' },
                  { label: 'Assigned Cards', val: '35,000', lightColor: 'bg-white border-cyan-200 text-cyan-900', darkColor: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' },
                  { label: 'Active Sessions', val: '18,420', lightColor: 'bg-white border-emerald-200 text-emerald-900', darkColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
                  { label: 'Suspended Cards', val: '412', lightColor: 'bg-white border-amber-200 text-amber-900', darkColor: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
                  { label: 'Damaged / Retired', val: '1,388', lightColor: 'bg-white border-red-200 text-red-900', darkColor: 'border-red-500/30 bg-red-500/10 text-red-300' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border text-center transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
                      isLight ? `${item.lightColor} shadow-xs` : `${item.darkColor} backdrop-blur-md`
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-400' : 'opacity-70'}`}>
                      {item.label}
                    </span>
                    <span className="text-xl font-extrabold font-mono mt-1 block">{item.val}</span>
                  </div>
                ))}
              </div>

              {/* Master Inventory Table */}
              <div className={`border rounded-2xl p-5 space-y-4 transition-colors duration-300 ${
                isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10 backdrop-blur-md'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold font-heading flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <Key size={16} className="text-blue-500" />
                    RFID Card Token Master Inventory
                  </h3>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={`border rounded-xl px-3 py-1.5 text-xs focus:outline-none ${
                      isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white/5 border-white/10 text-slate-200'
                    }`}
                  >
                    <option value="All">All Card Statuses</option>
                    <option value="Available">Available</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={`border-b font-semibold ${isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'}`}>
                      <th className="pb-3">13.56MHz UID</th>
                      <th className="pb-3">Patient Identity</th>
                      <th className="pb-3">ABHA Address</th>
                      <th className="pb-3">Hospital Facility</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Cryptographic Token</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-mono text-[11px] ${isLight ? 'divide-slate-100' : 'divide-white/5'}`}>
                    {filteredCards.map((c) => (
                      <tr key={c.uid} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                        <td className="py-3 font-bold text-blue-600">{c.uid}</td>
                        <td className={`py-3 font-sans font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{c.patientName}</td>
                        <td className="py-3 text-cyan-600 font-bold">{c.abhaId}</td>
                        <td className={`py-3 font-sans ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{c.facility}</td>
                        <td className="py-3">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                            c.status === 'Active'
                              ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : c.status === 'Available'
                              ? isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                              : isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className={`py-3 text-right text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{c.securityToken}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeNav === 'enrollment' && (
            <div className="space-y-6">
              <div>
                <h2 className={`text-xl font-extrabold font-heading flex items-center gap-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <PlusCircle className="text-blue-500" />
                  RFID Card Encoding & Patient Issuance Desk
                </h2>
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  USB Reader Tap Simulation → Tokenize UID → Link ABHA → Revocable Patient Consent → 1-Click Activate
                </p>
              </div>

              <div className="grid grid-cols-12 gap-6">
                {/* Hardware Reader Tap Terminal */}
                <div className={`col-span-5 border rounded-2xl p-5 space-y-4 ${
                  isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10 backdrop-blur-md'
                }`}>
                  <h3 className={`text-sm font-bold font-heading flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <Radio size={16} className="text-emerald-500 animate-pulse" />
                    USB 13.56MHz Hardware Antenna Reader
                  </h3>

                  <div className={`p-6 border rounded-2xl text-center space-y-3 ${
                    isLight ? 'bg-gradient-to-tr from-blue-50 via-slate-50 to-indigo-50 border-blue-200' : 'bg-gradient-to-tr from-blue-950/40 via-slate-900 to-indigo-950/40 border-blue-500/30'
                  }`}>
                    <div className="w-20 h-20 mx-auto rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-pulse">
                      💳
                    </div>
                    <span className={`text-xs font-medium block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Tap blank card on USB Reader pad</span>
                    <div className={`p-2.5 border rounded-xl font-mono text-xs ${
                      isLight ? 'bg-white border-slate-200 text-emerald-700 font-bold' : 'bg-black/40 border-white/10 text-emerald-300'
                    }`}>
                      Scanned UID: <strong>{scannedUid}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleSimulateReaderTap}
                      className={`px-4 py-2 font-bold text-xs rounded-xl border transition-all flex items-center justify-center gap-2 mx-auto ${
                        isLight ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs' : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                      }`}
                    >
                      <RefreshCw size={14} />
                      Simulate Tap New Card
                    </button>
                  </div>
                </div>

                {/* Patient Enrollment Form */}
                <form onSubmit={handleActivateCard} className={`col-span-7 border rounded-2xl p-5 space-y-4 ${
                  isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10 backdrop-blur-md'
                }`}>
                  <h3 className={`text-sm font-bold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>Patient Identity & ABHA Token Mapping</h3>

                  {enrolledSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>RFID Card activated successfully! UID tokenized & mapped to patient.</span>
                    </div>
                  )}

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className={`font-medium block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Full Patient Name *</label>
                      <input
                        type="text"
                        required
                        value={patientInput}
                        onChange={(e) => setPatientInput(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none ${
                          isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-blue-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`font-medium block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>ABHA Health ID / Address (Optional)</label>
                      <input
                        type="text"
                        value={abhaInput}
                        onChange={(e) => setAbhaInput(e.target.value)}
                        placeholder="e.g. ramesh@abdm or ABHA-91-8821-0042"
                        className={`w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none ${
                          isLight ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-blue-500'
                        }`}
                      />
                    </div>

                    <div className={`p-3 border rounded-xl space-y-2 ${
                      isLight ? 'bg-blue-50/70 border-blue-200' : 'bg-blue-500/10 border-blue-500/20'
                    }`}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentChecked}
                          onChange={(e) => setConsentChecked(e.target.checked)}
                          className="rounded border-slate-300 bg-white text-blue-600 focus:ring-0"
                        />
                        <span className={`font-bold text-[11px] ${isLight ? 'text-blue-900' : 'text-white'}`}>DPDP 2023 Digital Consent Confirmation</span>
                      </label>
                      <p className={`text-[10px] leading-tight ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        Patient grants consent for session tokenization. Card contains no sensitive medical or personal health data on chip.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!consentChecked || !patientInput}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                  >
                    Activate & Issue RFID Token Card
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeNav === 'security_audit' && (
            <div className="space-y-6">
              <h2 className={`text-xl font-extrabold font-heading flex items-center gap-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <ShieldAlert className="text-amber-500" />
                Security, Clone Audit & Anomaly Sentinel
              </h2>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className={`p-4 border rounded-2xl space-y-2 ${
                  isLight ? 'bg-red-50/80 border-red-200' : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <span className={`font-bold block text-sm ${isLight ? 'text-red-900' : 'text-red-300'}`}>Cloned Card Detection Alert</span>
                  <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Duplicate UID `04:A7:99:FF` attempted simultaneous scan at AIIMS Delhi & KEM Mumbai within 5 minutes.
                  </p>
                  <button type="button" className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-xl text-[10px] shadow-sm">
                    Revoke Token Immediately
                  </button>
                </div>

                <div className={`p-4 border rounded-2xl space-y-2 ${
                  isLight ? 'bg-amber-50/80 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'
                }`}>
                  <span className={`font-bold block text-sm ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>Rapid Re-Tap Anomaly</span>
                  <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    UID `04:B2:11:09` registered 14 tap events in 20 seconds at Kiosk KSK-DEL-014.
                  </p>
                  <button type="button" className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-xl text-[10px] shadow-sm">
                    Quarantine Card Session
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeNav === 'facility_distribution' && (
            <div className="space-y-6">
              <h2 className={`text-xl font-extrabold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>Hospital Reception Desk Allocation Grid</h2>
              <div className="grid grid-cols-3 gap-4 text-xs">
                {[
                  { facility: 'AIIMS New Delhi Main OPD', allocated: '12,500 Cards', status: 'Active' },
                  { facility: 'KEM Hospital Mumbai', allocated: '8,000 Cards', status: 'Active' },
                  { facility: 'Bowring Hospital Bengaluru', allocated: '4,500 Cards', status: 'Active' },
                ].map((f, idx) => (
                  <div key={idx} className={`p-4 border rounded-2xl space-y-2 ${
                    isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10'
                  }`}>
                    <span className={`font-bold text-sm block font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>{f.facility}</span>
                    <span className="text-blue-600 font-mono font-bold block">Allocated: {f.allocated}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'hardware_readers' && (
            <div className="space-y-6">
              <h2 className={`text-xl font-extrabold font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>Hardware Reader Antenna Telemetry</h2>
              <div className={`p-4 border rounded-2xl space-y-2 text-xs font-mono ${
                isLight ? 'bg-white border-slate-200/80 shadow-xs' : 'bg-white/[0.03] border-white/10'
              }`}>
                <div className="flex justify-between"><span>Protocol: ISO/IEC 14443 Type A</span><span className="text-emerald-600 font-bold">✓ Verified</span></div>
                <div className="flex justify-between"><span>Frequency: 13.56 MHz High Frequency</span><span className="text-emerald-600 font-bold">✓ Active</span></div>
                <div className="flex justify-between"><span>Baud Rate: 115200 bps</span><span className="text-emerald-600 font-bold">✓ Synchronized</span></div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
