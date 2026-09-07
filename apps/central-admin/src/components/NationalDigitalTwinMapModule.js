import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { MapPin, Globe, Building2, Cpu, ChevronRight, Radio } from 'lucide-react';
const REGIONAL_DATA = [
    {
        name: 'Maharashtra',
        facilitiesCount: 18,
        kiosksCount: 410,
        dailyIntake: 6120,
        healthIndex: 98.4,
        districts: [
            {
                name: 'Mumbai City',
                facilities: [
                    {
                        name: 'KEM Hospital Parel',
                        kiosks: [
                            { id: 'MK-MH-00188', status: 'Online', heartbeat: '2s ago' },
                            { id: 'MK-MH-00189', status: 'Online', heartbeat: '4s ago' },
                            { id: 'MK-MH-00190', status: 'Degraded', heartbeat: '12s ago' },
                        ]
                    },
                    {
                        name: 'Sion Lokmanya Tilak Hospital',
                        kiosks: [
                            { id: 'MK-MH-00210', status: 'Online', heartbeat: '1s ago' },
                        ]
                    }
                ]
            },
            {
                name: 'Pune District',
                facilities: [
                    {
                        name: 'Sassoon General Hospital',
                        kiosks: [
                            { id: 'MK-MH-00301', status: 'Online', heartbeat: '3s ago' }
                        ]
                    }
                ]
            }
        ]
    },
    {
        name: 'Delhi NCR',
        facilitiesCount: 12,
        kiosksCount: 280,
        dailyIntake: 4850,
        healthIndex: 99.1,
        districts: [
            {
                name: 'New Delhi',
                facilities: [
                    {
                        name: 'AIIMS Main OPD',
                        kiosks: [
                            { id: 'MK-DEL-00421', status: 'Online', heartbeat: '1s ago' },
                            { id: 'MK-DEL-00422', status: 'Online', heartbeat: '2s ago' },
                        ]
                    },
                    {
                        name: 'Safdarjung Hospital',
                        kiosks: [
                            { id: 'MK-DEL-00511', status: 'Online', heartbeat: '5s ago' }
                        ]
                    }
                ]
            }
        ]
    },
    {
        name: 'Uttar Pradesh',
        facilitiesCount: 24,
        kiosksCount: 320,
        dailyIntake: 5100,
        healthIndex: 94.2,
        districts: [
            {
                name: 'Varanasi',
                facilities: [
                    {
                        name: 'District Civil Hospital',
                        kiosks: [
                            { id: 'MK-UP-00310', status: 'Offline', heartbeat: '14m ago' }
                        ]
                    }
                ]
            }
        ]
    }
];
export function NationalDigitalTwinMapModule() {
    const [selectedState, setSelectedState] = useState(REGIONAL_DATA[0]);
    const [selectedDistrict, setSelectedDistrict] = useState(REGIONAL_DATA[0].districts[0]);
    const [selectedFacility, setSelectedFacility] = useState(REGIONAL_DATA[0].districts[0].facilities[0]);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3", children: [_jsx(Globe, { className: "text-blue-600" }), "National Digital Twin & Interactive Infrastructure Map"] }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "4-Tier Drilldown: `India` \u2192 `State` \u2192 `District` \u2192 `Facility` \u2192 `Kiosk Telemetry`" })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200", children: [_jsx(Radio, { size: 14, className: "animate-pulse" }), _jsx("span", { children: "Real-time GIS Sync: Active" })] })] }), _jsxs("div", { className: "p-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-2 text-xs shadow-sm animate-fade-in", children: [_jsxs("span", { className: "font-bold text-blue-600 flex items-center gap-1.5", children: [_jsx(MapPin, { size: 14 }), " Republic of India"] }), _jsx(ChevronRight, { size: 14, className: "text-slate-400" }), _jsx("span", { className: "text-slate-900 font-bold", children: selectedState.name }), _jsx(ChevronRight, { size: 14, className: "text-slate-400" }), _jsx("span", { className: "text-slate-600", children: selectedDistrict.name }), _jsx(ChevronRight, { size: 14, className: "text-slate-400" }), _jsx("span", { className: "text-emerald-600 font-mono font-bold", children: selectedFacility.name })] }), _jsxs("div", { className: "grid grid-cols-12 gap-6", children: [_jsxs("div", { className: "col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 animate-slide-up stagger-item", style: { animationDelay: '0ms' }, children: [_jsx("h3", { className: "text-sm font-bold text-slate-900", children: "Tier 1: Select State / UT" }), _jsx("div", { className: "space-y-2", children: REGIONAL_DATA.map((st, i) => (_jsxs("div", { onClick: () => {
                                        setSelectedState(st);
                                        setSelectedDistrict(st.districts[0]);
                                        setSelectedFacility(st.districts[0].facilities[0]);
                                    }, className: `p-3.5 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 animate-slide-up stagger-item ${selectedState.name === st.name
                                        ? 'bg-blue-50 border-blue-300 shadow-sm'
                                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:shadow-md'}`, style: { animationDelay: `${i * 40}ms` }, children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx("span", { className: "font-bold text-sm text-slate-900", children: st.name }), _jsxs("span", { className: "text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200", children: [st.healthIndex, "% Health"] })] }), _jsxs("div", { className: "mt-2 grid grid-cols-3 gap-2 text-[10px] text-slate-500 font-mono", children: [_jsxs("div", { children: ["Facilities: ", _jsx("span", { className: "text-slate-900 font-bold", children: st.facilitiesCount })] }), _jsxs("div", { children: ["Kiosks: ", _jsx("span", { className: "text-slate-900 font-bold", children: st.kiosksCount })] }), _jsxs("div", { children: ["OPD: ", _jsx("span", { className: "text-blue-600 font-bold", children: st.dailyIntake })] })] })] }, st.name))) })] }), _jsxs("div", { className: "col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-slide-up stagger-item", style: { animationDelay: '40ms' }, children: [_jsx("h3", { className: "text-sm font-bold text-slate-900", children: "Tier 2 & 3: Districts & Healthcare Facilities" }), _jsx("div", { className: "space-y-3", children: selectedState.districts.map((dist) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5", children: [_jsx(Building2, { size: 12, className: "text-blue-600" }), dist.name, " District"] }), dist.facilities.map((fac, i) => (_jsxs("div", { onClick: () => {
                                                setSelectedDistrict(dist);
                                                setSelectedFacility(fac);
                                            }, className: `p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 animate-slide-up stagger-item ${selectedFacility.name === fac.name
                                                ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:shadow-md'}`, style: { animationDelay: `${i * 40}ms` }, children: [_jsx("div", { className: "font-bold text-xs text-slate-900", children: fac.name }), _jsxs("div", { className: "text-[10px] text-slate-500 mt-1 font-mono", children: ["Active Terminals: ", fac.kiosks.length, " Kiosks"] })] }, fac.name)))] }, dist.name))) })] }), _jsxs("div", { className: "col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-slide-up stagger-item", style: { animationDelay: '80ms' }, children: [_jsxs("h3", { className: "text-sm font-bold text-slate-900 flex items-center gap-2", children: [_jsx(Cpu, { size: 16, className: "text-blue-600" }), "Tier 4: Live Kiosk Hardware Telemetry"] }), _jsxs("div", { className: "p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1", children: [_jsx("span", { className: "text-[10px] text-slate-500 uppercase tracking-wider block font-bold", children: "Selected Hospital Node" }), _jsx("div", { className: "font-bold text-slate-900 text-sm", children: selectedFacility.name }), _jsxs("div", { className: "text-[11px] text-blue-700 font-mono", children: [selectedDistrict.name, ", ", selectedState.name] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("span", { className: "text-xs font-bold text-slate-600 block", children: "Deployments at this Node:" }), selectedFacility.kiosks.map((k, i) => (_jsxs("div", { className: "p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-slide-up stagger-item", style: { animationDelay: `${i * 40}ms` }, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "font-mono font-bold text-xs text-blue-600", children: k.id }), _jsx("span", { className: `px-2 py-0.5 rounded text-[10px] font-bold border ${k.status === 'Online' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                            k.status === 'Degraded' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`, children: k.status })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-mono", children: [_jsxs("div", { children: ["13.56MHz RFID: ", _jsx("span", { className: "text-emerald-600 font-bold", children: "\u2713 Connected" })] }), _jsxs("div", { children: ["OCR Camera: ", _jsx("span", { className: "text-emerald-600 font-bold", children: "\u2713 Ready" })] }), _jsxs("div", { children: ["Mic/Speaker: ", _jsx("span", { className: "text-emerald-600 font-bold", children: "\u2713 Active" })] }), _jsxs("div", { children: ["Last Ping: ", _jsx("span", { className: "text-slate-700", children: k.heartbeat })] })] })] }, k.id)))] })] })] })] }));
}
//# sourceMappingURL=NationalDigitalTwinMapModule.js.map