import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Building2, CheckCircle2, Plus, Search, Server } from 'lucide-react';
const INITIAL_FACILITIES = [
    {
        id: 'FAC-DEL-001',
        code: 'HOSP-DEL-AIIMS',
        name: 'AIIMS New Delhi — Main OPD Block',
        type: 'AIIMS',
        state: 'Delhi NCR',
        district: 'New Delhi',
        status: 'Operational',
        kiosksCount: 42,
        abdmStatus: 'Connected',
        fhirEndpoint: 'https://fhir.aiims.edu/r4/v1',
        doctorCapacity: 350,
        operatingHours: '24/7 OPD & Emergency',
        languages: ['Hindi', 'English', 'Punjabi'],
        submittedDate: '2026-08-01',
    },
    {
        id: 'FAC-MH-014',
        code: 'HOSP-MH-KEM',
        name: 'KEM Hospital & Seth GS Medical College',
        type: 'Medical College',
        state: 'Maharashtra',
        district: 'Mumbai City',
        status: 'Operational',
        kiosksCount: 28,
        abdmStatus: 'Connected',
        fhirEndpoint: 'https://fhir.kem.edu.in/api/v2',
        doctorCapacity: 220,
        operatingHours: '08:00 AM - 08:00 PM',
        languages: ['Marathi', 'Hindi', 'English', 'Gujarati'],
        submittedDate: '2026-08-10',
    },
    {
        id: 'FAC-KA-008',
        code: 'HOSP-KA-BOWRING',
        name: 'Bowring & Lady Curzon Hospital',
        type: 'District Hospital',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        status: 'Provisioned',
        kiosksCount: 15,
        abdmStatus: 'Connected',
        fhirEndpoint: 'https://fhir.karnataka.gov.in/bowring',
        doctorCapacity: 110,
        operatingHours: '08:00 AM - 06:00 PM',
        languages: ['Kannada', 'English', 'Tamil', 'Telugu'],
        submittedDate: '2026-08-20',
    },
    {
        id: 'FAC-UP-042',
        code: 'HOSP-UP-VARANASI',
        name: 'Varanasi District Civil Hospital',
        type: 'District Hospital',
        state: 'Uttar Pradesh',
        district: 'Varanasi',
        status: 'Under Verification',
        kiosksCount: 12,
        abdmStatus: 'Pending Verification',
        fhirEndpoint: 'https://fhir-preview.up.gov.in/varanasi',
        doctorCapacity: 85,
        operatingHours: '08:00 AM - 05:00 PM',
        languages: ['Hindi', 'Bhojpuri', 'English'],
        submittedDate: '2026-09-02',
    },
    {
        id: 'FAC-TN-019',
        code: 'HOSP-TN-MADURAI',
        name: 'Government Rajaji Hospital Madurai',
        type: 'Government General',
        state: 'Tamil Nadu',
        district: 'Madurai',
        status: 'Pending',
        kiosksCount: 20,
        abdmStatus: 'Not Configured',
        fhirEndpoint: 'Pending Assignment',
        doctorCapacity: 160,
        operatingHours: '07:00 AM - 09:00 PM',
        languages: ['Tamil', 'English'],
        submittedDate: '2026-09-05',
    },
];
export function HospitalOnboardingModule() {
    const [facilities, setFacilities] = useState(INITIAL_FACILITIES);
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedFacility, setSelectedFacility] = useState(facilities[0]);
    const [showNewModal, setShowNewModal] = useState(false);
    const filteredFacilities = facilities.filter(f => {
        if (statusFilter === 'All')
            return true;
        return f.status === statusFilter;
    });
    const updateStatus = (id, newStatus) => {
        setFacilities(facilities.map(f => f.id === id ? { ...f, status: newStatus } : f));
        if (selectedFacility && selectedFacility.id === id) {
            setSelectedFacility({ ...selectedFacility, status: newStatus });
        }
    };
    const statusBadgeColor = (status) => {
        switch (status) {
            case 'Operational': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Provisioned': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Approved': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
            case 'Under Verification': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Pending': return 'bg-purple-50 text-purple-700 border-purple-200';
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 font-display", children: [_jsx(Building2, { className: "text-blue-600" }), "Hospital & Facility Registry (National Onboarding)"] }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Central Authority Governance \u2022 5-Stage Approval Pipeline (`Pending` \u2192 `Under Verification` \u2192 `Approved` \u2192 `Provisioned` \u2192 `Operational`)" })] }), _jsxs("button", { type: "button", onClick: () => setShowNewModal(true), className: "flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all duration-200", children: [_jsx(Plus, { size: 16 }), "Register New Facility"] })] }), _jsx("div", { className: "grid grid-cols-5 gap-4", children: [
                    { label: 'Pending Request', count: facilities.filter(f => f.status === 'Pending').length, color: 'border-purple-200 bg-purple-50 text-purple-700' },
                    { label: 'Under Verification', count: facilities.filter(f => f.status === 'Under Verification').length, color: 'border-amber-200 bg-amber-50 text-amber-700' },
                    { label: 'Approved', count: facilities.filter(f => f.status === 'Approved').length, color: 'border-cyan-200 bg-cyan-50 text-cyan-700' },
                    { label: 'Provisioned', count: facilities.filter(f => f.status === 'Provisioned').length, color: 'border-blue-200 bg-blue-50 text-blue-700' },
                    { label: 'Operational', count: facilities.filter(f => f.status === 'Operational').length, color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
                ].map((item, idx) => (_jsxs("div", { className: `p-4 rounded-2xl border ${item.color} flex flex-col justify-between animate-slide-up stagger-item transition-all duration-200 hover:shadow-md`, style: { animationDelay: `${idx * 40}ms` }, children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: item.label }), _jsx("div", { className: "text-3xl font-extrabold font-mono mt-2", children: item.count })] }, idx))) }), _jsxs("div", { className: "grid grid-cols-12 gap-6", children: [_jsxs("div", { className: "col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { size: 14, className: "absolute left-3 top-3 text-slate-400" }), _jsx("input", { type: "text", placeholder: "Filter by hospital name, facility code, or state...", className: "w-full bg-slate-100 border border-transparent rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:bg-white focus:border-blue-400" })] }), _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "bg-slate-100 border border-transparent rounded-xl px-3 py-2 text-xs text-slate-700 transition-all duration-200 focus:outline-none focus:bg-white focus:border-blue-400", children: [_jsx("option", { value: "All", children: "All Pipeline Stages" }), _jsx("option", { value: "Pending", children: "Pending" }), _jsx("option", { value: "Under Verification", children: "Under Verification" }), _jsx("option", { value: "Approved", children: "Approved" }), _jsx("option", { value: "Provisioned", children: "Provisioned" }), _jsx("option", { value: "Operational", children: "Operational" })] })] }), _jsx("div", { className: "space-y-3 overflow-y-auto max-h-[520px] pr-1", children: filteredFacilities.map((fac, idx) => (_jsxs("div", { onClick: () => setSelectedFacility(fac), className: `p-4 rounded-xl border cursor-pointer animate-slide-up stagger-item transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${selectedFacility?.id === fac.id
                                        ? 'bg-blue-50 border-blue-300 shadow-sm'
                                        : 'bg-slate-50 border-slate-200 hover:bg-white'}`, style: { animationDelay: `${idx * 40}ms` }, children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-extrabold text-sm text-slate-900", children: fac.name }), _jsx("span", { className: "text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded", children: fac.code })] }), _jsxs("div", { className: "text-xs text-slate-500 mt-1", children: [fac.district, ", ", fac.state, " \u2022 ", _jsx("span", { className: "text-blue-600 font-medium", children: fac.type })] })] }), _jsx("span", { className: `px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${statusBadgeColor(fac.status)}`, children: fac.status })] }), _jsxs("div", { className: "mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500", children: [_jsxs("span", { children: ["Kiosks Allocated: ", _jsx("strong", { className: "text-slate-900 font-mono", children: fac.kiosksCount })] }), _jsxs("span", { children: ["ABDM: ", _jsx("strong", { className: fac.abdmStatus === 'Connected' ? 'text-emerald-600' : 'text-amber-600', children: fac.abdmStatus })] })] })] }, fac.id))) })] }), _jsx("div", { className: "col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 animate-fade-in", children: selectedFacility ? (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200", children: selectedFacility.id }), _jsx("span", { className: `px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadgeColor(selectedFacility.status)}`, children: selectedFacility.status })] }), _jsx("h3", { className: "text-lg font-bold text-slate-900 mt-2 leading-tight", children: selectedFacility.name }), _jsxs("p", { className: "text-xs text-slate-500 mt-1", children: [selectedFacility.type, " \u2022 ", selectedFacility.state] })] }), _jsxs("div", { className: "p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2", children: [_jsx("span", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider block", children: "Central Authority Pipeline Control" }), _jsxs("div", { className: "flex flex-wrap gap-1.5", children: [_jsx("button", { type: "button", onClick: () => updateStatus(selectedFacility.id, 'Under Verification'), className: "px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-lg hover:bg-amber-100 transition-all duration-200", children: "Verify Documents" }), _jsx("button", { type: "button", onClick: () => updateStatus(selectedFacility.id, 'Approved'), className: "px-2.5 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200 text-[10px] font-bold rounded-lg hover:bg-cyan-100 transition-all duration-200", children: "Approve Facility" }), _jsx("button", { type: "button", onClick: () => updateStatus(selectedFacility.id, 'Provisioned'), className: "px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-lg hover:bg-blue-100 transition-all duration-200", children: "Provision Endpoints" }), _jsx("button", { type: "button", onClick: () => updateStatus(selectedFacility.id, 'Operational'), className: "px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-lg hover:bg-emerald-100 transition-all duration-200", children: "Set Operational" })] })] }), _jsxs("div", { className: "space-y-3 text-xs", children: [_jsxs("div", { className: "p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200", children: [_jsxs("div", { className: "text-[11px] font-bold text-slate-700 flex items-center gap-2", children: [_jsx(Server, { size: 14, className: "text-blue-600" }), "FHIR R4 Gateway Endpoint"] }), _jsx("div", { className: "font-mono text-[11px] text-blue-700 bg-slate-100 p-2 rounded-lg break-all", children: selectedFacility.fhirEndpoint })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "p-3 bg-slate-50 rounded-xl border border-slate-200", children: [_jsx("span", { className: "text-[10px] text-slate-500 block", children: "Doctor Capacity" }), _jsxs("span", { className: "text-sm font-bold text-slate-900 font-mono", children: [selectedFacility.doctorCapacity, " On Duty"] })] }), _jsxs("div", { className: "p-3 bg-slate-50 rounded-xl border border-slate-200", children: [_jsx("span", { className: "text-[10px] text-slate-500 block", children: "Kiosk Fleet" }), _jsxs("span", { className: "text-sm font-bold text-slate-900 font-mono", children: [selectedFacility.kiosksCount, " Terminals"] })] })] }), _jsxs("div", { className: "p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1", children: [_jsx("span", { className: "text-[10px] text-slate-500 block", children: "Supported Native Languages" }), _jsx("div", { className: "flex flex-wrap gap-1 mt-1", children: selectedFacility.languages.map((lang) => (_jsx("span", { className: "px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold rounded-md", children: lang }, lang))) })] })] }), _jsxs("div", { className: "p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-700 flex items-center gap-2", children: [_jsx(CheckCircle2, { size: 16 }), _jsx("span", { children: "ABDM Health Facility Registry (HFR) Id Linked" })] })] })) : (_jsx("div", { className: "text-center py-12 text-slate-500 text-xs", children: "Select a facility to inspect registration details" })) })] })] }));
}
//# sourceMappingURL=HospitalOnboardingModule.js.map