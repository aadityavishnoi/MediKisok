import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function App() {
    const [cards, setCards] = useState([
        { id: '1', uid: 'DEMO-RFID-001', patientName: 'Aarav Sharma', status: 'ACTIVE', issuedAt: '2026-08-10', facility: 'AIIMS New Delhi' },
        { id: '2', uid: 'DEMO-RFID-002', patientName: 'Priya Verma', status: 'ACTIVE', issuedAt: '2026-08-12', facility: 'AIIMS New Delhi' },
        { id: '3', uid: 'DEMO-RFID-003', patientName: 'Ramesh Patel', status: 'ACTIVE', issuedAt: '2026-08-15', facility: 'Safdarjung Hospital' },
        { id: '4', uid: 'DEMO-RFID-004', patientName: 'Sunita Devi', status: 'LOST', issuedAt: '2026-08-18', facility: 'AIIMS New Delhi' },
        { id: '5', uid: 'DEMO-RFID-005', patientName: 'Vikramaditya Joshi', status: 'ACTIVE', issuedAt: '2026-08-20', facility: 'Max Healthcare' },
    ]);
    const [newUid, setNewUid] = useState('');
    const [patientName, setPatientName] = useState('');
    const [scanMessage, setScanMessage] = useState(null);
    const handleRegister = (e) => {
        e.preventDefault();
        if (!newUid || !patientName)
            return;
        const newCard = {
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
    const toggleStatus = (id, newStatus) => {
        setCards(cards.map(c => c.id === id ? { ...c, status: newStatus } : c));
    };
    const handleSimulateScan = async (uid) => {
        try {
            const res = await fetch('http://localhost:3000/api/rfid/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid }),
            });
            const data = await res.json();
            setScanMessage(`Scan event dispatched for UID ${uid}: ${data.session?.id ? 'Session Active' : 'Identified'}`);
            setTimeout(() => setScanMessage(null), 4000);
        }
        catch (err) {
            setScanMessage(`Scan Simulated for ${uid} (Local Mode)`);
            setTimeout(() => setScanMessage(null), 4000);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-slate-100 p-6", children: _jsxs("div", { className: "max-w-7xl mx-auto space-y-6", children: [_jsxs("header", { className: "flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200", children: [_jsxs("div", { children: [_jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-blue-600", children: "MediKiosk Identity Layer" }), _jsx("h1", { className: "text-2xl font-bold text-slate-900", children: "RFID Card Enrollment & Lifecycle Portal" }), _jsx("p", { className: "text-sm text-slate-500", children: "Physical token manufacturing, patient mapping, inventory control, and audit" })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx("span", { className: "px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800", children: "System Online" }), _jsx("span", { className: "px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800", children: "Port 5175" })] })] }), scanMessage && (_jsxs("div", { className: "p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-sm font-medium animate-fade-in", children: ["\u26A1 ", scanMessage] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900", children: "Enroll New RFID Token" }), _jsxs("form", { onSubmit: handleRegister, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-slate-700 mb-1", children: "Hardware Card UID" }), _jsx("input", { type: "text", placeholder: "e.g. DEMO-RFID-009", value: newUid, onChange: (e) => setNewUid(e.target.value), className: "w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-slate-700 mb-1", children: "Patient Full Name" }), _jsx("input", { type: "text", placeholder: "e.g. Anjali Mehta", value: patientName, onChange: (e) => setPatientName(e.target.value), className: "w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsx("button", { type: "submit", className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors", children: "Register & Enroll Card" })] })] }), _jsxs("div", { className: "lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900", children: "Registered Cards & Lifecycle State" }), _jsxs("span", { className: "text-xs text-slate-500", children: [cards.length, " Total Cards"] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm text-slate-600", children: [_jsx("thead", { className: "bg-slate-50 text-xs font-semibold uppercase text-slate-500", children: _jsxs("tr", { children: [_jsx("th", { className: "p-3", children: "Card UID" }), _jsx("th", { className: "p-3", children: "Mapped Patient" }), _jsx("th", { className: "p-3", children: "Status" }), _jsx("th", { className: "p-3", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100", children: cards.map((c) => (_jsxs("tr", { className: "hover:bg-slate-50", children: [_jsx("td", { className: "p-3 font-mono font-semibold text-slate-900", children: c.uid }), _jsx("td", { className: "p-3 font-medium text-slate-800", children: c.patientName }), _jsx("td", { className: "p-3", children: _jsx("span", { className: `px-2.5 py-1 text-xs font-semibold rounded-full ${c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                                                                    c.status === 'LOST' ? 'bg-amber-100 text-amber-800' :
                                                                        'bg-red-100 text-red-800'}`, children: c.status }) }), _jsxs("td", { className: "p-3 space-x-2", children: [_jsx("button", { onClick: () => handleSimulateScan(c.uid), className: "px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium", children: "Simulate Tap" }), c.status === 'ACTIVE' ? (_jsx("button", { onClick: () => toggleStatus(c.id, 'LOST'), className: "px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-medium", children: "Mark Lost" })) : (_jsx("button", { onClick: () => toggleStatus(c.id, 'ACTIVE'), className: "px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-medium", children: "Reactivate" }))] })] }, c.id))) })] }) })] })] })] }) }));
}
//# sourceMappingURL=App.js.map