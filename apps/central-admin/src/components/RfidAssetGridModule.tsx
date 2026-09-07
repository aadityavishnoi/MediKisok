import React, { useState } from 'react';
import { CreditCard, Cpu, Wifi, RefreshCw, CheckCircle2, ShieldCheck, Download, Layers } from 'lucide-react';

export function RfidAssetGridModule() {
  const [updatingOta, setUpdatingOta] = useState(false);
  const [otaComplete, setOtaComplete] = useState(false);

  const handleOtaUpdate = () => {
    setUpdatingOta(true);
    setTimeout(() => {
      setUpdatingOta(false);
      setOtaComplete(true);
      setTimeout(() => setOtaComplete(false), 5000);
    }, 2500);
  };

  const ASSET_NETWORKS = [
    { zone: 'Northern Zone (Delhi, UP, RJ, PB, HR)', kiosks: 4210, activeReaders: 4202, cardsIssued: '1,840,000', otaVer: 'v4.2.0-stable' },
    { zone: 'Western Zone (MH, GJ, GA)', kiosks: 3450, activeReaders: 3446, cardsIssued: '1,520,000', otaVer: 'v4.2.0-stable' },
    { zone: 'Southern Zone (TN, KA, KL, TS, AP)', kiosks: 2980, activeReaders: 2978, cardsIssued: '1,110,000', otaVer: 'v4.2.0-stable' },
    { zone: 'Eastern & NE Zone (WB, OR, BR, AS)', kiosks: 1810, activeReaders: 1805, cardsIssued: '780,000', otaVer: 'v4.1.8-patch' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Assets KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-slide-up stagger-item transition-all duration-200 hover:shadow-md" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center justify-between mb-2">
            <Cpu size={20} className="text-blue-600" />
            <span className="text-xs font-mono font-bold text-emerald-600">13.56 MHz NFC</span>
          </div>
          <div className="text-slate-500 text-xs font-semibold uppercase">Total Deployed Antennas</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1 font-display">12,450</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-slide-up stagger-item transition-all duration-200 hover:shadow-md" style={{ animationDelay: '40ms' }}>
          <div className="flex items-center justify-between mb-2">
            <CreditCard size={20} className="text-blue-600" />
            <span className="text-xs font-mono text-slate-500">DESFire EV3 Standard</span>
          </div>
          <div className="text-slate-500 text-xs font-semibold uppercase">Smart Health Cards Issued</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1 font-display">5,250,000</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-slide-up stagger-item transition-all duration-200 hover:shadow-md" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center justify-between mb-2">
            <Layers size={20} className="text-emerald-600" />
            <span className="text-xs font-mono text-emerald-600">Central Reserve</span>
          </div>
          <div className="text-slate-500 text-xs font-semibold uppercase">Blank Card Stock Balance</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1 font-display">480,000</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-slide-up stagger-item transition-all duration-200 hover:shadow-md" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center justify-between mb-2">
            <Wifi size={20} className="text-blue-600" />
            <span className="text-xs font-mono text-emerald-600">Active Mesh</span>
          </div>
          <div className="text-slate-500 text-xs font-semibold uppercase">Hardware Latency Avg</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1 font-display font-mono">18ms</div>
        </div>
      </div>

      {/* Firmware OTA Update Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-lg text-slate-900 font-display">Over-The-Air (OTA) Reader Firmware Fleet Control</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-600 text-white font-bold">Firmware v4.2.0</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Deploy security patches and reader latency optimizations across all 12,450 physical RFID reader terminals simultaneously.
          </p>
        </div>

        <button
          type="button"
          disabled={updatingOta}
          onClick={handleOtaUpdate}
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all duration-200 flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          <RefreshCw size={14} className={updatingOta ? 'animate-spin' : ''} />
          {updatingOta ? 'Broadcasting OTA Payload…' : 'Push Firmware v4.2.0 to Fleet'}
        </button>
      </div>

      {otaComplete && (
        <div role="alert" className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 font-bold text-sm flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span>OTA Firmware v4.2.0 successfully installed across 12,450 reader terminals. 0 rollbacks.</span>
        </div>
      )}

      {/* Regional Hardware Network Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="font-bold text-lg text-slate-900 font-display">Zonal Hardware Network Telemetry</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs border-b border-slate-200 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Zone / Region</th>
                <th className="pb-3 font-semibold">Deployed Kiosks</th>
                <th className="pb-3 font-semibold">Active Readers</th>
                <th className="pb-3 font-semibold">Cards Issued</th>
                <th className="pb-3 font-semibold">Firmware State</th>
                <th className="pb-3 font-semibold">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ASSET_NETWORKS.map((z, idx) => (
                <tr key={z.zone} className="hover:bg-slate-50 transition-all duration-200 animate-slide-up stagger-item" style={{ animationDelay: `${idx * 40}ms` }}>
                  <td className="py-3.5 font-bold text-slate-900">{z.zone}</td>
                  <td className="py-3.5 text-slate-500 font-mono">{z.kiosks}</td>
                  <td className="py-3.5 text-blue-600 font-mono font-bold">{z.activeReaders}</td>
                  <td className="py-3.5 text-slate-600 font-mono">{z.cardsIssued}</td>
                  <td className="py-3.5 font-mono text-xs text-slate-600">{z.otaVer}</td>
                  <td className="py-3.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      100% Operational
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
