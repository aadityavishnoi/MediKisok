import React, { useState } from 'react';
import {
  Globe,
  Building2,
  Bot,
  TrendingUp,
  Settings,
  Bell,
  Search,
  CheckCircle2,
  Server,
  Users,
  ShieldCheck,
  Flame,
  Cpu,
  Leaf,
  Siren,
  Database,
  Activity,
  Layers,
  MapPin,
  AlertCircle,
  FileText,
  Key,
  ShieldAlert,
  Sun,
  Moon
} from 'lucide-react';

import { NationalOverviewModule } from './components/NationalOverviewModule';
import { HospitalOnboardingModule } from './components/HospitalOnboardingModule';
import { RfidNationalRegistryModule } from './components/RfidNationalRegistryModule';
import { KioskFleetCommandModule } from './components/KioskFleetCommandModule';
import { NationalDigitalTwinMapModule } from './components/NationalDigitalTwinMapModule';
import { AbdmFhirCommandModule } from './components/AbdmFhirCommandModule';
import { ClinicalProtocolsModule } from './components/ClinicalProtocolsModule';
import { IncidentsOperationsModule } from './components/IncidentsOperationsModule';
import { CapacityIntelligenceModule } from './components/CapacityIntelligenceModule';
import { SecurityAuditModule } from './components/SecurityAuditModule';
import { RbacPoliciesModule } from './components/RbacPoliciesModule';

import { DiseaseOutbreakModule } from './components/DiseaseOutbreakModule';
import { AyushTelemetryModule } from './components/AyushTelemetryModule';
import { AiGovernanceModule } from './components/AiGovernanceModule';
import { EmergencyOverrideModule } from './components/EmergencyOverrideModule';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeNav, setActiveNav] = useState('overview');
  const [search, setSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const SIDEBAR_GROUPS = [
    {
      group: 'COMMAND CENTER',
      items: [
        { id: 'overview', label: 'National Overview', icon: Globe },
        { id: 'digital_twin', label: 'National Digital Twin Map', icon: MapPin },
        { id: 'incidents', label: 'Alerts & Incidents', icon: AlertCircle, badge: '3 Active' },
      ],
    },
    {
      group: 'GOVERNANCE',
      items: [
        { id: 'facility_registry', label: 'Facility Registry (Onboarding)', icon: Building2, badge: '5 Pipeline' },
        { id: 'kiosk_fleet', label: 'Kiosk Fleet Command', icon: Cpu, badge: '1,240 Devices' },
        { id: 'rfid_registry', label: 'RFID National Registry', icon: Key },
      ],
    },
    {
      group: 'CLINICAL GOVERNANCE',
      items: [
        { id: 'clinical_protocols', label: 'Clinical Protocols', icon: FileText },
        { id: 'ai_governance', label: 'AI Governance Center', icon: Bot },
        { id: 'ayush_telemetry', label: 'AYUSH Telemetry', icon: Leaf },
      ],
    },
    {
      group: 'INTEROPERABILITY',
      items: [
        { id: 'abdm_fhir', label: 'ABDM & FHIR Command', icon: Server, badge: 'Healthy' },
      ],
    },
    {
      group: 'INTELLIGENCE',
      items: [
        { id: 'outbreak_radar', label: 'Outbreak Radar', icon: Flame, badge: 'Live' },
        { id: 'capacity_intelligence', label: 'Capacity Intelligence', icon: TrendingUp },
      ],
    },
    {
      group: 'SECURITY & ADMIN',
      items: [
        { id: 'security_audit', label: 'Security & Audit Trail', icon: ShieldCheck },
        { id: 'rbac', label: 'Roles & Authority (RBAC)', icon: Users },
        { id: 'emergency', label: 'Emergency Override', icon: Siren, badge: 'Level 1' },
      ],
    },
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
        {/* Header */}
        <div className={`px-5 py-4 flex items-center gap-3 border-b shrink-0 ${isLight ? 'border-slate-100' : 'border-white/10'}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-[0_0_20px_rgba(59,130,246,0.4)]">
            🏛️
          </div>
          <div>
            <div className={`font-extrabold leading-none text-xs font-heading tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              MediKiosk National Platform
            </div>
            <div className="text-[10px] text-blue-500 font-semibold leading-none mt-1 font-mono">
              National Health Authority (NHA)
            </div>
          </div>
        </div>

        {/* Navigation Items grouped by Master Categories */}
        <nav className="flex-1 px-3 py-3 space-y-3 text-xs font-medium overflow-y-auto">
          {SIDEBAR_GROUPS.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <div className={`px-3 pb-1 text-[9px] font-bold uppercase tracking-wider font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                {group.group}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveNav(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 ${
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
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 whitespace-nowrap ${
                          item.id === 'emergency'
                            ? 'bg-red-500 text-white animate-pulse'
                            : item.id === 'incidents'
                            ? isLight ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : isLight ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* System Health Status Footer */}
        <div className={`p-3 border-t shrink-0 ${isLight ? 'border-slate-100' : 'border-white/10'}`}>
          <div className={`flex items-center justify-between text-xs font-semibold p-2.5 rounded-xl border ${
            isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px]">36 States & UTs Live</span>
            </div>
            <span className="font-mono text-[10px]">100% Online</span>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Command Bar */}
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
              placeholder="Search states, hospitals, RFID devices, AI models, protocols..."
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
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-bold text-blue-600 text-xs shadow-inner font-mono">
                NHA
              </div>
              <div className="text-xs">
                <div className={`font-bold leading-none font-heading ${isLight ? 'text-slate-900' : 'text-white'}`}>Ministry of Health</div>
                <div className={`text-[10px] leading-none mt-1 font-mono ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>ID: NHA-GOVT-001</div>
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
              <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Central System Alerts</span>
              <span className="text-[10px] font-mono text-blue-600 font-bold">3 New</span>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                <span className="font-bold block">Hospital Registration Request</span>
                <span className="text-[10px] text-slate-500">Government Rajaji Hospital Madurai submitted</span>
              </div>
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-800">
                <span className="font-bold block">OTA Firmware v4.2.0 Pushed</span>
                <span className="text-[10px] text-slate-500">1,218 RFID readers updated successfully</span>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Module Content Viewport */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1 overflow-y-auto animate-fade-in">
          {activeNav === 'overview' && <NationalOverviewModule searchQuery={search} />}
          {activeNav === 'digital_twin' && <NationalDigitalTwinMapModule />}
          {activeNav === 'incidents' && <IncidentsOperationsModule />}
          {activeNav === 'facility_registry' && <HospitalOnboardingModule />}
          {activeNav === 'kiosk_fleet' && <KioskFleetCommandModule />}
          {activeNav === 'rfid_registry' && <RfidNationalRegistryModule />}
          {activeNav === 'clinical_protocols' && <ClinicalProtocolsModule />}
          {activeNav === 'ai_governance' && <AiGovernanceModule />}
          {activeNav === 'ayush_telemetry' && <AyushTelemetryModule />}
          {activeNav === 'abdm_fhir' && <AbdmFhirCommandModule />}
          {activeNav === 'outbreak_radar' && <DiseaseOutbreakModule />}
          {activeNav === 'capacity_intelligence' && <CapacityIntelligenceModule />}
          {activeNav === 'security_audit' && <SecurityAuditModule />}
          {activeNav === 'rbac' && <RbacPoliciesModule />}
          {activeNav === 'emergency' && <EmergencyOverrideModule />}
        </main>
      </div>
    </div>
  );
}
