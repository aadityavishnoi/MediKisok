import React, { useState } from 'react';
import { FileText, ShieldCheck, CheckCircle2, GitBranch, AlertTriangle, Layers, Plus, ExternalLink } from 'lucide-react';

interface Protocol {
  id: string;
  name: string;
  version: string;
  status: 'ACTIVE' | 'DRAFT' | 'DEPRECATED';
  jurisdiction: string;
  mandatoryQuestions: number;
  redFlagTriggers: string[];
  lastUpdated: string;
}

const PROTOCOLS: Protocol[] = [
  { id: 'PROT-01', name: 'Chest Pain Intake Protocol', version: 'v1.4', status: 'ACTIVE', jurisdiction: 'National Default', mandatoryQuestions: 6, redFlagTriggers: ['Radiation to Left Arm', 'Diaphoresis', 'SPO2 < 92%'], lastUpdated: '2026-08-01' },
  { id: 'PROT-02', name: 'Acute Respiratory & Dyspnea', version: 'v1.2', status: 'ACTIVE', jurisdiction: 'National Default', mandatoryQuestions: 5, redFlagTriggers: ['Stridor', 'SPO2 < 90%', 'Cyanosis'], lastUpdated: '2026-08-10' },
  { id: 'PROT-03', name: 'Febrile Illness & Outbreak Screening', version: 'v2.1', status: 'ACTIVE', jurisdiction: 'National Default', mandatoryQuestions: 7, redFlagTriggers: ['Fever > 103°F', 'Petechiae', 'Altered Sensorium'], lastUpdated: '2026-08-20' },
  { id: 'PROT-04', name: 'AYUSH Prakriti & Clinical Assessment', version: 'v1.0', status: 'ACTIVE', jurisdiction: 'National Default', mandatoryQuestions: 8, redFlagTriggers: ['Severe Agni Imbalance', 'Acute Dhatu Depletion'], lastUpdated: '2026-08-25' },
  { id: 'PROT-05', name: 'Pediatric General OPD Intake', version: 'v1.1', status: 'DRAFT', jurisdiction: 'Delhi NCR & Maharashtra Pilot', mandatoryQuestions: 6, redFlagTriggers: ['Grunting', 'Severe Chest Indrawing'], lastUpdated: '2026-09-01' },
];

export function ClinicalProtocolsModule() {
  const [protocols] = useState<Protocol[]>(PROTOCOLS);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol>(protocols[0]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FileText className="text-blue-400" />
            National Clinical Protocol Governance
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Central Standardization of Kiosk Intake Trees, Red-Flag Rules, and Mandatory Clinical Questions
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
        >
          <Plus size={16} />
          Create Protocol Version
        </button>
      </div>

      {/* Protocol List & Tree Inspector */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-6 bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-3">
          <h3 className="text-sm font-bold text-white">Active Protocol Registry</h3>
          <div className="space-y-2">
            {protocols.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProtocol(p)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedProtocol.id === p.id ? 'bg-blue-600/20 border-blue-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{p.name}</span>
                    <span className="font-mono text-xs text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {p.version}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-2 font-mono flex items-center justify-between">
                  <span>Scope: {p.jurisdiction}</span>
                  <span>Updated: {p.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tree & Red Flag Rule Inspector */}
        <div className="col-span-6 bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-blue-400 font-bold">{selectedProtocol.id}</span>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Central Approved
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">{selectedProtocol.name} ({selectedProtocol.version})</h3>
            <p className="text-xs text-slate-400">Jurisdiction Scope: {selectedProtocol.jurisdiction}</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
              <span className="font-bold text-red-300 flex items-center gap-2">
                <AlertTriangle size={14} />
                Mandatory Red-Flag Triage Triggers
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedProtocol.redFlagTriggers.map((rf, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-red-600/30 text-red-200 border border-red-500/40 text-[10px] font-bold rounded-md">
                    ⚡ {rf}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <span className="font-bold text-slate-300 flex items-center gap-2">
                <GitBranch size={14} className="text-blue-400" />
                Intake Question Sequence Matrix
              </span>
              <div className="space-y-1.5 text-[11px] text-slate-300 font-mono">
                <div className="p-2 bg-black/30 rounded">1. Chief Complaint & Duration Selection</div>
                <div className="p-2 bg-black/30 rounded">2. Severity Scale (1-10) & Onset Mode</div>
                <div className="p-2 bg-black/30 rounded">3. High-Risk Comorbidities (Diabetes, Hypertension, CKD)</div>
                <div className="p-2 bg-black/30 rounded">4. Multilingual OCR Prescription & Lab Scan</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
