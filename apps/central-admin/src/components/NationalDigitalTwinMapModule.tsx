import React, { useState } from 'react';
import { MapPin, Globe, Building2, Cpu, ChevronRight, Activity, Radio, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface StateRegion {
  name: string;
  facilitiesCount: number;
  kiosksCount: number;
  dailyIntake: number;
  healthIndex: number;
  districts: {
    name: string;
    facilities: {
      name: string;
      kiosks: { id: string; status: 'Online' | 'Degraded' | 'Offline'; heartbeat: string }[];
    }[];
  }[];
}

const REGIONAL_DATA: StateRegion[] = [
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
  const [selectedState, setSelectedState] = useState<StateRegion>(REGIONAL_DATA[0]);
  const [selectedDistrict, setSelectedDistrict] = useState(REGIONAL_DATA[0].districts[0]);
  const [selectedFacility, setSelectedFacility] = useState(REGIONAL_DATA[0].districts[0].facilities[0]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Globe className="text-blue-400" />
            National Digital Twin & Interactive Infrastructure Map
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            4-Tier Drilldown: `India` → `State` → `District` → `Facility` → `Kiosk Telemetry`
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          <Radio size={14} className="animate-pulse" />
          <span>Real-time GIS Sync: Active</span>
        </div>
      </div>

      {/* Breadcrumb Hierarchy Navigation Bar */}
      <div className="p-3 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center gap-2 text-xs backdrop-blur-md">
        <span className="font-bold text-blue-400 flex items-center gap-1.5">
          <MapPin size={14} /> Republic of India
        </span>
        <ChevronRight size={14} className="text-slate-500" />
        <span className="text-white font-bold">{selectedState.name}</span>
        <ChevronRight size={14} className="text-slate-500" />
        <span className="text-slate-300">{selectedDistrict.name}</span>
        <ChevronRight size={14} className="text-slate-500" />
        <span className="text-emerald-300 font-mono font-bold">{selectedFacility.name}</span>
      </div>

      {/* Interactive Map Drilldown Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Tier 1: State Selection */}
        <div className="col-span-4 bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-3">
          <h3 className="text-sm font-bold text-white">Tier 1: Select State / UT</h3>
          <div className="space-y-2">
            {REGIONAL_DATA.map((st) => (
              <div
                key={st.name}
                onClick={() => {
                  setSelectedState(st);
                  setSelectedDistrict(st.districts[0]);
                  setSelectedFacility(st.districts[0].facilities[0]);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedState.name === st.name
                    ? 'bg-blue-600/20 border-blue-500/50 shadow-md shadow-blue-500/10'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-sm text-white">{st.name}</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {st.healthIndex}% Health
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-slate-400 font-mono">
                  <div>Facilities: <span className="text-white font-bold">{st.facilitiesCount}</span></div>
                  <div>Kiosks: <span className="text-white font-bold">{st.kiosksCount}</span></div>
                  <div>OPD: <span className="text-blue-300 font-bold">{st.dailyIntake}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tier 2 & 3: District & Facility Hierarchy */}
        <div className="col-span-4 bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-bold text-white">Tier 2 & 3: Districts & Healthcare Facilities</h3>
          
          <div className="space-y-3">
            {selectedState.districts.map((dist) => (
              <div key={dist.name} className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={12} className="text-blue-400" />
                  {dist.name} District
                </div>
                {dist.facilities.map((fac) => (
                  <div
                    key={fac.name}
                    onClick={() => {
                      setSelectedDistrict(dist);
                      setSelectedFacility(fac);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedFacility.name === fac.name
                        ? 'bg-emerald-600/20 border-emerald-500/50 shadow-md'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">{fac.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      Active Terminals: {fac.kiosks.length} Kiosks
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Tier 4: Kiosk Device Hardware Telemetry Node */}
        <div className="col-span-4 bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu size={16} className="text-blue-400" />
            Tier 4: Live Kiosk Hardware Telemetry
          </h3>

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Selected Hospital Node</span>
            <div className="font-bold text-white text-sm">{selectedFacility.name}</div>
            <div className="text-[11px] text-blue-300 font-mono">{selectedDistrict.name}, {selectedState.name}</div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-300 block">Deployments at this Node:</span>
            {selectedFacility.kiosks.map((k) => (
              <div key={k.id} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-blue-300">{k.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    k.status === 'Online' ? 'bg-emerald-500/20 text-emerald-300' :
                    k.status === 'Degraded' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {k.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
                  <div>13.56MHz RFID: <span className="text-emerald-400 font-bold">✓ Connected</span></div>
                  <div>OCR Camera: <span className="text-emerald-400 font-bold">✓ Ready</span></div>
                  <div>Mic/Speaker: <span className="text-emerald-400 font-bold">✓ Active</span></div>
                  <div>Last Ping: <span className="text-slate-200">{k.heartbeat}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
