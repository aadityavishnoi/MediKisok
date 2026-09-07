import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Flame, CheckCircle2, Send, MapPin, Zap } from 'lucide-react';
export function DiseaseOutbreakModule() {
    const [dispatchedAlert, setDispatchedAlert] = useState(null);
    const OUTBREAKS = [
        {
            id: 'OUT-2026-08',
            region: 'Jaipur & Jodhpur Districts (Rajasthan)',
            disease: 'Dengue Hemorrhagic Fever Spike',
            severity: 'CRITICAL',
            cases: '1,420 Flagged (24h)',
            symptomPattern: 'High Fever + Severe Retro-orbital Headache + Low Platelet Trigger',
            aiConfidence: '98.6%',
            status: 'Active Alert',
        },
        {
            id: 'OUT-2026-09',
            region: 'Delhi NCR & Western UP',
            disease: 'Acute Respiratory Distress Cluster',
            severity: 'HIGH',
            cases: '2,890 Flagged (24h)',
            symptomPattern: 'Shortness of Breath + Persistent Cough + Low SpO2 Trigger',
            aiConfidence: '96.2%',
            status: 'Active Alert',
        },
        {
            id: 'OUT-2026-10',
            region: 'Pune & Thane Districts (Maharashtra)',
            disease: 'Viral Gastroenteritis Spike',
            severity: 'MODERATE',
            cases: '840 Flagged (24h)',
            symptomPattern: 'Acute Abdominal Pain + Dehydration Warning',
            aiConfidence: '94.1%',
            status: 'Monitoring',
        },
    ];
    const handleDispatchAlert = (outbreakId) => {
        setDispatchedAlert(outbreakId);
        setTimeout(() => {
            setDispatchedAlert(null);
        }, 4000);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in", children: [_jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-12 h-12 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0", children: _jsx(Flame, { size: 24, className: "animate-pulse" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h2", { className: "font-extrabold text-xl text-slate-900 font-display", children: "AI Disease Outbreak & Epidemic Radar" }), _jsx("span", { className: "px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-red-500 text-white uppercase animate-pulse", children: "NCDC Live Feed" })] }), _jsx("p", { className: "text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed", children: "Automated anomaly detection engine analyzing real-time symptom dictations across 12,450 kiosks for sudden epidemiological clusters." })] })] }), _jsxs("button", { type: "button", onClick: () => handleDispatchAlert('ALL'), className: "px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2 shrink-0", children: [_jsx(Zap, { size: 16 }), " Broadcast National ICMR Alert"] })] }), dispatchedAlert && (_jsxs("div", { role: "alert", className: "p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 font-bold text-sm flex items-center gap-3 animate-fade-in", children: [_jsx(CheckCircle2, { size: 20, className: "text-emerald-600 shrink-0" }), _jsx("span", { children: "Automated Emergency Epidemic Protocol Dispatched to ICMR, NCDC, and State Health Secretaries." })] })), _jsx("div", { className: "space-y-4", children: OUTBREAKS.map((ob, idx) => (_jsxs("div", { className: "bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:border-red-300 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-slide-up stagger-item", style: { animationDelay: `${idx * 60}ms` }, children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("span", { className: `px-3 py-1 rounded-full text-xs font-mono font-extrabold ${ob.severity === 'CRITICAL' ? 'bg-red-500 text-white shadow-sm' : 'bg-amber-50 text-amber-700 border border-amber-200'}`, children: [ob.severity, " RISK"] }), _jsxs("div", { children: [_jsx("h3", { className: "font-extrabold text-lg text-slate-900 font-display", children: ob.disease }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-500 mt-0.5", children: [_jsx(MapPin, { size: 13, className: "text-red-600" }), _jsx("span", { children: ob.region }), _jsxs("span", { className: "font-mono text-slate-500", children: ["\u2022 ID: ", ob.id] })] })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "text-right", children: [_jsx("div", { className: "text-lg font-mono font-extrabold text-red-600", children: ob.cases }), _jsxs("div", { className: "text-[11px] text-slate-500", children: ["AI Confidence: ", ob.aiConfidence] })] }), _jsxs("button", { type: "button", onClick: () => handleDispatchAlert(ob.id), className: "px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all duration-200", children: [_jsx(Send, { size: 14 }), " Dispatch State Taskforce"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100", children: [_jsxs("div", { children: [_jsx("span", { className: "text-slate-500 font-medium", children: "Symptom Cluster Pattern:" }), _jsx("p", { className: "font-semibold text-slate-700 mt-0.5", children: ob.symptomPattern })] }), _jsxs("div", { children: [_jsx("span", { className: "text-slate-500 font-medium", children: "Hospital Capacity Status:" }), _jsx("p", { className: "font-mono font-bold text-amber-600 mt-0.5", children: "86% Beds Reserved \u00B7 ICU Overflow Ready" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-slate-500 font-medium", children: "Automated Response Action:" }), _jsx("p", { className: "font-semibold text-emerald-600 mt-0.5", children: "Rapid Diagnostic Kits Mobilized to District Stores" })] })] })] }, ob.id))) })] }));
}
//# sourceMappingURL=DiseaseOutbreakModule.js.map