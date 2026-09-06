import React, { useState } from 'react';
import { CreditCard, Search, Download, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert, Scan, Plus, User, Building } from 'lucide-react';
import { Sidebar, Topbar, StatCard } from '@medikiosk/ui';

interface RFIDCardItem {
  id: string;
  uid: string;
  patientName: string;
  status: 'ACTIVE' | 'LOST' | 'STOLEN' | 'SUSPENDED';
  issuedAt: string;
  facility: string;
}

export default function App() {
  const [nav, setNav] = useState('inventory');
  const [cards, setCards] = useState<RFIDCardItem[]>([
    { id: '1', uid: 'RFID-9042-881A', patientName: 'Aarav Sharma', status: 'ACTIVE', issuedAt: '2026-08-10', facility: 'AIIMS New Delhi' },
    { id: '2', uid: 'RFID-1102-443B', patientName: 'Priya Verma', status: 'ACTIVE', issuedAt: '2026-08-12', facility: 'Safdarjung OPD' },
    { id: '3', uid: 'RFID-7721-009C', patientName: 'Ramesh Patel', status: 'LOST', issuedAt: '2026-08-15', facility: 'AIIMS New Delhi' },
    { id: '4', uid: 'RFID-3341-998D', patientName: 'Sunita Devi', status: 'STOLEN', issuedAt: '2026-08-18', facility: 'Max Healthcare' },
    { id: '5', uid: 'RFID-8812-332E', patientName: 'Vikramaditya Joshi', status: 'SUSPENDED', issuedAt: '2026-08-20', facility: 'Safdarjung OPD' },
  ]);

  const [newUid, setNewUid] = useState('');
  const [patientName, setPatientName] = useState('');
  const [facility, setFacility] = useState('AIIMS New Delhi');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUid || !patientName) return;
    const uidFormatted = newUid.startsWith('RFID-') ? newUid : `RFID-${newUid.toUpperCase()}`;
    const newCard: RFIDCardItem = {
      id: String(Date.now()),
      uid: uidFormatted,
      patientName,
      status: 'ACTIVE',
      issuedAt: new Date().toISOString().split('T')[0],
      facility,
    };
    setCards([newCard, ...cards]);
    setNewUid('');
    setPatientName('');
    setToastMessage(`Card ${uidFormatted} successfully enrolled for ${patientName}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const setCardState = (id: string, newStatus: RFIDCardItem['status']) => {
    setCards(cards.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const handleSimulateTap = (uid: string) => {
    setToastMessage(`⚡ Hardware Tap Event Emitted for UID ${uid} → Kiosk Intake Initialized`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const filteredCards = cards.filter(c => {
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesSearch = c.uid.toLowerCase().includes(search.toLowerCase()) || c.patientName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalIssued = cards.length + 1250;
  const activeCount = cards.filter(c => c.status === 'ACTIVE').length + 1210;
  const lostOrStolenCount = cards.filter(c => c.status === 'LOST' || c.status === 'STOLEN').length + 22;
  const pendingSuspensionCount = cards.filter(c => c.status === 'SUSPENDED').length + 18;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Shared Sidebar */}
      <Sidebar
        activeKey={nav}
        onNavigate={setNav}
        items={[
          { key: 'inventory', label: 'Card Inventory', icon: <CreditCard size={18} /> },
          { key: 'enrollment', label: 'New Card Scan', icon: <Scan size={18} /> },
          { key: 'facilities', label: 'Facility Terminals', icon: <Building size={18} /> },
        ]}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar
          title="MediKiosk"
          subtitle="RFID Inventory & Patient Token Admin"
          search={search}
          onSearchChange={setSearch}
          user={{ name: 'Admin Staff', avatar: '' }}
        />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="p-4 bg-blue-600 text-white font-bold rounded-2xl shadow-md flex items-center justify-between animate-fade-in">
              <span className="text-sm">⚡ {toastMessage}</span>
              <button onClick={() => setToastMessage(null)} className="text-xs bg-white/20 px-2.5 py-1 rounded-lg hover:bg-white/30">Dismiss</button>
            </div>
          )}

          {/* Top Stat Strip */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total Cards Issued"
              value={totalIssued}
              delta="↑ 45 this week"
              deltaType="positive"
              icon={<CreditCard size={20} />}
              iconBg="bg-blue-100 text-blue-700"
            />
            <StatCard
              label="Active Cards"
              value={activeCount}
              delta="96.8% Operational"
              deltaType="positive"
              icon={<CheckCircle2 size={20} />}
              iconBg="bg-emerald-100 text-emerald-700"
            />
            <StatCard
              label="Lost or Stolen"
              value={lostOrStolenCount}
              delta="Blocked & Secured"
              deltaType="negative"
              icon={<ShieldAlert size={20} />}
              iconBg="bg-red-100 text-red-700"
            />
            <StatCard
              label="Pending Suspension"
              value={pendingSuspensionCount}
              delta="Audit Flagged"
              deltaType="neutral"
              icon={<AlertTriangle size={20} />}
              iconBg="bg-amber-100 text-amber-700"
            />
          </div>

          {/* Main 12-Col Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left 4-Cols: Enroll Form */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 h-fit">
              <div className="flex items-center gap-2 text-blue-600">
                <Scan size={20} />
                <h2 className="text-base font-bold text-slate-900">Enroll New Smart Card</h2>
              </div>
              <p className="text-xs text-slate-500">Scan or manually enter physical RFID UID to pair with a registered patient record.</p>

              <form onSubmit={handleEnroll} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Patient Search</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Enter patient full name..."
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Card UID Scan Field</label>
                  <div className="relative">
                    <Scan size={18} className="absolute left-3 top-3 text-blue-600" />
                    <input
                      type="text"
                      placeholder="e.g. 9042-881A"
                      value={newUid}
                      onChange={(e) => setNewUid(e.target.value)}
                      required
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/40 text-sm font-mono font-bold text-blue-900 focus:outline-none focus:border-blue-600 uppercase"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">USB NFC Reader connected & listening...</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Issuing Facility</label>
                  <select
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="AIIMS New Delhi">AIIMS New Delhi (Main OPD)</option>
                    <option value="Safdarjung OPD">Safdarjung Hospital</option>
                    <option value="Max Healthcare">Max Super Speciality</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Enroll & Activate Card
                </button>
              </form>
            </div>

            {/* Right 8-Cols: Data Table Card */}
            <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
              {/* Table Toolbar */}
              <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Card Inventory Registry</h2>
                  <p className="text-xs text-slate-500">Live hardware status of all issued RFID patient credentials</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Filter Chips */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    {['ALL', 'ACTIVE', 'LOST', 'STOLEN', 'SUSPENDED'].map(st => (
                      <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          filterStatus === st ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50">
                    <Download size={14} /> Export CSV
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">Card UID</th>
                      <th className="px-5 py-3.5">Mapped Patient</th>
                      <th className="px-5 py-3.5">Issued Date</th>
                      <th className="px-5 py-3.5">Facility</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCards.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-blue-900">{row.uid}</td>
                        <td className="px-5 py-4 font-bold text-slate-900">{row.patientName}</td>
                        <td className="px-5 py-4 text-xs text-slate-500 font-medium">{row.issuedAt}</td>
                        <td className="px-5 py-4 text-xs font-semibold text-slate-700">{row.facility}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            row.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                            row.status === 'LOST' ? 'bg-amber-50 text-amber-700' :
                            row.status === 'STOLEN' ? 'bg-red-50 text-red-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleSimulateTap(row.uid)}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                          >
                            Simulate Tap
                          </button>
                          {row.status === 'ACTIVE' ? (
                            <button
                              onClick={() => setCardState(row.id, 'SUSPENDED')}
                              className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => setCardState(row.id, 'ACTIVE')}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                            >
                              Reissue
                            </button>
                          )}
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
