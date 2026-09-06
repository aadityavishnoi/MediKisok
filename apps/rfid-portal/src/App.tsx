import React, { useState } from 'react';

interface RFIDCardItem {
  id: string;
  uid: string;
  patientName: string;
  status: 'ACTIVE' | 'LOST' | 'STOLEN' | 'SUSPENDED' | 'DEACTIVATED';
  issuedAt: string;
  facility: string;
}

export default function App() {
  const [cards, setCards] = useState<RFIDCardItem[]>([
    { id: '1', uid: 'DEMO-RFID-001', patientName: 'Aarav Sharma', status: 'ACTIVE', issuedAt: '2026-08-10', facility: 'AIIMS New Delhi' },
    { id: '2', uid: 'DEMO-RFID-002', patientName: 'Priya Verma', status: 'ACTIVE', issuedAt: '2026-08-12', facility: 'AIIMS New Delhi' },
    { id: '3', uid: 'DEMO-RFID-003', patientName: 'Ramesh Patel', status: 'ACTIVE', issuedAt: '2026-08-15', facility: 'Safdarjung Hospital' },
    { id: '4', uid: 'DEMO-RFID-004', patientName: 'Sunita Devi', status: 'LOST', issuedAt: '2026-08-18', facility: 'AIIMS New Delhi' },
    { id: '5', uid: 'DEMO-RFID-005', patientName: 'Vikramaditya Joshi', status: 'ACTIVE', issuedAt: '2026-08-20', facility: 'Max Healthcare' },
  ]);

  const [newUid, setNewUid] = useState('');
  const [patientName, setPatientName] = useState('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUid || !patientName) return;
    const newCard: RFIDCardItem = {
      id: String(Date.now()),
      uid: newUid,
      patientName,
      status: 'ACTIVE',
      issuedAt: new Date().toISOString().split('T')[0],
      facility: 'AIIMS New Delhi',
    };
    setCards([newCard, ...cards]);
    setNewUid('');
    setPatientName('');
  };

  const toggleStatus = (id: string, newStatus: RFIDCardItem['status']) => {
    setCards(cards.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const handleSimulateScan = async (uid: string) => {
    try {
      const res = await fetch('http://localhost:3000/api/rfid/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      setScanMessage(`Scan event dispatched for UID ${uid}: ${data.session?.id ? 'Session Active' : 'Identified'}`);
      setTimeout(() => setScanMessage(null), 4000);
    } catch (err) {
      setScanMessage(`Scan Simulated for ${uid} (Local Mode)`);
      setTimeout(() => setScanMessage(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">MediKiosk Identity Layer</span>
            <h1 className="text-2xl font-bold text-slate-900">RFID Card Enrollment & Lifecycle Portal</h1>
            <p className="text-sm text-slate-500">Physical token manufacturing, patient mapping, inventory control, and audit</p>
          </div>
          <div className="flex space-x-3">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">System Online</span>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Port 5175</span>
          </div>
        </header>

        {scanMessage && (
          <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-sm font-medium animate-fade-in">
            ⚡ {scanMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Registration Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Enroll New RFID Token</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Hardware Card UID</label>
                <input
                  type="text"
                  placeholder="e.g. DEMO-RFID-009"
                  value={newUid}
                  onChange={(e) => setNewUid(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Patient Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Anjali Mehta"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                Register & Enroll Card
              </button>
            </form>
          </div>

          {/* Active Cards Table */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900">Registered Cards & Lifecycle State</h2>
              <span className="text-xs text-slate-500">{cards.length} Total Cards</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="p-3">Card UID</th>
                    <th className="p-3">Mapped Patient</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cards.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-semibold text-slate-900">{c.uid}</td>
                      <td className="p-3 font-medium text-slate-800">{c.patientName}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                          c.status === 'LOST' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 space-x-2">
                        <button
                          onClick={() => handleSimulateScan(c.uid)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium"
                        >
                          Simulate Tap
                        </button>
                        {c.status === 'ACTIVE' ? (
                          <button
                            onClick={() => toggleStatus(c.id, 'LOST')}
                            className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-medium"
                          >
                            Mark Lost
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleStatus(c.id, 'ACTIVE')}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-medium"
                          >
                            Reactivate
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
      </div>
    </div>
  );
}
