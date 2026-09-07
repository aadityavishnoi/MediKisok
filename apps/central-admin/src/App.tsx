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
  ShieldAlert
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

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#090D16] text-slate-100 font-sans flex selection:bg-blue-600 selection:text-white antialiased">
      {/* Sidebar Navigation */}
      <aside className="w-80 h-full bg-white/[0.03] border-r border-white/10 backdrop-blur-md flex flex-col shrink-0 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-3 border-b border-white/10 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            🏛️
          </div>
          <div>
            <div className="font-extrabold text-white leading-none text-xs font-display tracking-tight">
              MediKiosk National Platform
            </div>
            <div className="text-[10px] text-blue-400 font-semibold leading-none mt-1 font-mono">
              National Health Authority (NHA)
            </div>
          </div>
        </div>

        {/* Navigation Items grouped by Master Categories */}
        <nav className="flex-1 px-3 py-3 space-y-3 text-xs font-medium overflow-y-auto">
          {SIDEBAR_GROUPS.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 pb-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                      active
                        ? 'bg-blue-600 text-white font-bold shadow-[0_0_16px_rgba(59,130,246,0.4)]'
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
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300'
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
        <div className="p-3 border-t border-white/10 shrink-0">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px]">36 States & UTs Live</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-300">100% Online</span>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Command Bar */}
        <header className="h-16 bg-white/[0.03] border-b border-white/10 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-30">
          <div className="w-96 max-w-full relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
              placeholder="Search states, hospitals, RFID devices, AI models, protocols..."
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 transition-colors"
            >
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            </button>

            <div className="flex items-center gap-3 border-l border-white/10 pl-4">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center font-bold text-blue-300 text-xs shadow-inner font-mono">
                NHA
              </div>
              <div className="text-xs">
                <div className="font-bold leading-none text-white font-display">Ministry of Health</div>
                <div className="text-[10px] text-slate-400 leading-none mt-1 font-mono">ID: NHA-GOVT-001</div>
              </div>
            </div>
          </div>
        </header>

        {/* Notifications Modal */}
        {notificationsOpen && (
          <div className="absolute top-16 right-8 z-40 w-80 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl p-4 text-xs space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-white">Central System Alerts</span>
              <span className="text-[10px] font-mono text-blue-400">3 New</span>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300">
                <span className="font-bold block">Hospital Registration Request</span>
                <span className="text-[10px] text-slate-400">Government Rajaji Hospital Madurai submitted</span>
              </div>
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300">
                <span className="font-bold block">OTA Firmware v4.2.0 Pushed</span>
                <span className="text-[10px] text-slate-400">1,218 RFID readers updated successfully</span>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Module Content Viewport */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1 overflow-y-auto">
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
