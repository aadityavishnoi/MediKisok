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
  Download
} from 'lucide-react';

interface CardRow {
  uid: string;
  patient: string;
  date: string;
  facility: string;
  status: 'Active' | 'Lost' | 'Stolen' | 'Suspended';
}

export default function App() {
  const [activeNav, setActiveNav] = useState('inventory');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const [patientInput, setPatientInput] = useState('');
  const [cardUidInput, setCardUidInput] = useState('');
  const [facilityInput, setFacilityInput] = useState('CityCare Multi-Speciality Hospital');

  const [rows, setRows] = useState<CardRow[]>([
    { uid: 'A1F3-88C2', patient: 'Arjun Sharma', date: '12 May 2026', facility: 'CityCare Main', status: 'Active' },
    { uid: 'B7D1-441A', patient: 'Neha Kapoor', date: '10 May 2026', facility: 'CityCare North', status: 'Active' },
    { uid: 'C29E-1023', patient: 'Vikram Singh', date: '02 May 2026', facility: 'CityCare Main', status: 'Lost' },
    { uid: 'D883-77F0', patient: 'Pooja Verma', date: '28 Apr 2026', facility: 'CityCare Main', status: 'Active' },
    { uid: 'E11A-902B', patient: 'Rakesh Patel', date: '20 Apr 2026', facility: 'CityCare North', status: 'Stolen' },
    { uid: 'F004-3C6D', patient: 'Ananya Joshi', date: '18 Apr 2026', facility: 'CityCare Main', status: 'Suspended' },
  ]);

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientInput || !cardUidInput) return;
    const newCard: CardRow = {
      uid: cardUidInput.toUpperCase(),
      patient: patientInput,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      facility: facilityInput,
      status: 'Active',
    };
    setRows([newCard, ...rows]);
    setPatientInput('');
    setCardUidInput('');
  };

  const statusBadge = (status: CardRow['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 font-semibold';
      case 'Lost':
        return 'bg-amber-50 text-amber-700 font-semibold';
      case 'Stolen':
        return 'bg-red-50 text-red-700 font-semibold';
      case 'Suspended':
        return 'bg-slate-100 text-slate-500 font-semibold';
    }
  };

  const filteredRows = rows.filter((r) => {
    const matchesFilter = filterStatus === 'All' || r.status === filterStatus;
    const matchesSearch = r.uid.toLowerCase().includes(search.toLowerCase()) || r.patient.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
            <div className="text-xs text-slate-400 leading-none mt-1">RFID Portal</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm font-medium">
          {[
            { id: 'inventory', label: 'Card Inventory', icon: CreditCard },
            { id: 'enrollment', label: 'Enrollment', icon: PlusCircle },
            { id: 'facilities', label: 'Facilities', icon: Building2 },
            { id: 'reports', label: 'Reports', icon: BarChart3 },
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
              placeholder="Search card UID, patient..."
            />
          </div>

          <div className="flex items-center gap-4">
            <button type="button" className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-900 text-xs">
                A
              </div>
              <div className="text-sm">
                <div className="font-semibold leading-none text-slate-900">Admin User</div>
                <div className="text-xs text-slate-400 leading-none mt-1">Ops Team</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="p-6 space-y-5 max-w-7xl mx-auto w-full">
          {/* Stat Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                <CreditCard size={20} />
              </div>
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Cards Issued</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1 font-display">1,284</div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
                <CheckCircle2 size={20} />
              </div>
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Active</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1 font-display">1,146</div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mb-3">
                <AlertTriangle size={20} />
              </div>
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Lost / Stolen</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1 font-display">27</div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-3">
                <Clock size={20} />
              </div>
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Pending Suspension</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1 font-display">8</div>
            </div>
          </div>

          {/* 2-Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Enrollment Form (Left 4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit">
              <h2 className="font-bold text-base mb-4 text-slate-900 font-display">Enroll New Card</h2>

              <form onSubmit={handleEnroll} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Patient</label>
                  <input
                    value={patientInput}
                    onChange={(e) => setPatientInput(e.target.value)}
                    required
                    placeholder="Search patient by name or ID"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Card UID</label>
                  <input
                    value={cardUidInput}
                    onChange={(e) => setCardUidInput(e.target.value)}
                    required
                    placeholder="Tap card on scanner..."
                    className="w-full bg-slate-50 border border-dashed border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 uppercase placeholder:text-slate-400 placeholder:normal-case focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Facility</label>
                  <select
                    value={facilityInput}
                    onChange={(e) => setFacilityInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="CityCare Multi-Speciality Hospital">CityCare Multi-Speciality Hospital</option>
                    <option value="CityCare North Wing">CityCare North Wing</option>
                    <option value="AIIMS OPD Center">AIIMS OPD Center</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm shadow-sm transition-all mt-2"
                >
                  Enroll Card
                </button>
              </form>
            </div>

            {/* Inventory Table (Right 8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h2 className="font-bold text-base text-slate-900 font-display">Card Inventory</h2>

                <div className="flex items-center gap-3">
                  <div className="flex gap-1 text-xs font-semibold bg-slate-100 p-1 rounded-xl">
                    {['All', 'Active', 'Lost', 'Stolen'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          filterStatus === st
                            ? 'bg-white text-blue-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg">
                    <Download size={14} /> Export CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 text-xs border-b border-slate-100 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Card UID</th>
                      <th className="pb-3 font-semibold">Mapped Patient</th>
                      <th className="pb-3 font-semibold">Issued Date</th>
                      <th className="pb-3 font-semibold">Facility</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredRows.map((r) => (
                      <tr key={r.uid} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 font-mono text-slate-700 font-bold">{r.uid}</td>
                        <td className="py-3.5 font-semibold text-slate-900">{r.patient}</td>
                        <td className="py-3.5 text-slate-500 text-xs">{r.date}</td>
                        <td className="py-3.5 text-slate-500 text-xs font-medium">{r.facility}</td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs ${statusBadge(r.status)}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right text-slate-400">
                          <button type="button" className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                            <MoreHorizontal size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
