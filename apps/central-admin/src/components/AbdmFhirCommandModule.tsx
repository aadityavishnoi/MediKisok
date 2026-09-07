import React, { useState } from 'react';
import { Server, ShieldCheck, CheckCircle2, RefreshCw, AlertCircle, FileCode2, Database, Layers, ArrowUpRight, Activity } from 'lucide-react';

interface GatewayStatus {
  service: string;
  endpoint: string;
  status: 'Healthy' | 'Degraded' | 'Error';
  latency: number;
  uptime: string;
  transactionsToday: number;
}

const GATEWAYS: GatewayStatus[] = [
  { service: 'ABDM Health Facility Registry (HFR)', endpoint: 'https://hfr.abdm.gov.in/api/v1', status: 'Healthy', latency: 45, uptime: '99.98%', transactionsToday: 18420 },
  { service: 'ABHA Address Resolution Gateway', endpoint: 'https://healthid.abdm.gov.in/api/v2', status: 'Healthy', latency: 62, uptime: '99.95%', transactionsToday: 14200 },
  { service: 'FHIR R4 Clinical Record Adapter', endpoint: 'https://fhir.nhcx.gov.in/r4', status: 'Healthy', latency: 88, uptime: '99.90%', transactionsToday: 24500 },
  { service: 'ABDM Consent Management Service', endpoint: 'https://consent.abdm.gov.in/api/v1', status: 'Healthy', latency: 54, uptime: '100.0%', transactionsToday: 12800 },
  { service: 'Ayush EHR Interoperability Hub', endpoint: 'https://ayush.abdm.gov.in/fhir', status: 'Healthy', latency: 95, uptime: '99.85%', transactionsToday: 4100 },
];

export function AbdmFhirCommandModule() {
  const [gateways] = useState<GatewayStatus[]>(GATEWAYS);
  const [retryQueueCount, setRetryQueueCount] = useState(0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Server className="text-blue-400" />
            ABDM & FHIR R4 Interoperability Command
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            National Health Data Exchange Gateway • Schema Validation, Consent Monitor & Transaction Retry Queues
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5">
            <ShieldCheck size={14} /> ABDM Milestone 3 Certified
          </span>
        </div>
      </div>

      {/* Gateway Telemetry Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl backdrop-blur-md">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">ABDM Connectivity</span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">HEALTHY</div>
          <span className="text-[10px] text-emerald-300">99.98% Gateway Uptime</span>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl backdrop-blur-md">
          <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">FHIR R4 Bundles Sent</span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">74,020</div>
          <span className="text-[10px] text-blue-300">0 Schema Validation Errors</span>
        </div>

        <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl backdrop-blur-md">
          <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block">Consent Transactions</span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">12,800</div>
          <span className="text-[10px] text-cyan-300">Patient Consent Granted</span>
        </div>

        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl backdrop-blur-md">
          <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider block">Facility Integrations</span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">94%</div>
          <span className="text-[10px] text-purple-300">45 / 48 Hospitals Linked</span>
        </div>
      </div>

      {/* ABDM Gateways Grid */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database size={16} className="text-blue-400" />
          Active ABDM & FHIR Service Endpoints Telemetry
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {gateways.map((gw) => (
            <div key={gw.service} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-white">{gw.service}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {gw.status}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-blue-300">{gw.endpoint}</div>
              </div>

              <div className="flex items-center gap-8 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">Latency</span>
                  <span className="text-white font-bold">{gw.latency} ms</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Uptime</span>
                  <span className="text-emerald-400 font-bold">{gw.uptime}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Transactions (24h)</span>
                  <span className="text-blue-300 font-bold">{gw.transactionsToday.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schema Validation Inspector & Retry Queue */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-6 bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCode2 size={16} className="text-blue-400" />
            FHIR R4 Resource Schema Inspector
          </h3>
          <pre className="p-3 bg-black/40 border border-white/10 rounded-xl text-[11px] font-mono text-emerald-300 overflow-x-auto leading-tight">
{`{
  "resourceType": "Bundle",
  "id": "medikiosk-opd-intake-bundle-2026",
  "type": "document",
  "entry": [
    { "resourceType": "Patient", "id": "ABHA-91-8821-0042" },
    { "resourceType": "Composition", "status": "final" },
    { "resourceType": "Condition", "code": "R07.9 (Chest Pain)" }
  ],
  "meta": { "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/OPDRecord"] }
}`}
          </pre>
        </div>

        <div className="col-span-6 bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw size={16} className="text-amber-400" />
              Failed Transaction Retry Queue
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              0 Pending Retries
            </span>
          </div>

          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-3">
            <CheckCircle2 size={20} />
            <div>
              <span className="font-bold block">All ABDM & FHIR transactions synchronized cleanly</span>
              <span className="text-[10px] text-slate-400">Automatic exponential backoff queue is clear.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
