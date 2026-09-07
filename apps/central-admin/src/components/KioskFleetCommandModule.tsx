import React, { useState } from 'react';
import { Cpu, Wifi, WifiOff, AlertTriangle, RefreshCw, ShieldAlert, CheckCircle2, Server, Power, Wrench, Search, Download } from 'lucide-react';

interface KioskDevice {
  deviceId: string;
  facilityName: string;
  state: string;
  status: 'Online' | 'Degraded' | 'Offline';
  firmwareVersion: string;
  lastHeartbeat: string;
  cpuLoad: number;
  ramUsage: number;
  rfidReaderStatus: 'Healthy' | 'Degraded' | 'Faulty';
  ocrCameraStatus: 'Healthy' | 'Degraded' | 'Faulty';
  audioMicStatus: 'Healthy' | 'Degraded' | 'Faulty';
  printerStatus: 'Healthy' | 'Paper Out' | 'Faulty';
}

const INITIAL_KIOSKS: KioskDevice[] = [
  { deviceId: 'MK-DEL-00421', facilityName: 'AIIMS New Delhi — OPD Gate 2', state: 'Delhi NCR', status: 'Online', firmwareVersion: 'v4.2.0', lastHeartbeat: '2 sec ago', cpuLoad: 24, ramUsage: 48, rfidReaderStatus: 'Healthy', ocrCameraStatus: 'Healthy', audioMicStatus: 'Healthy', printerStatus: 'Healthy' },
  { deviceId: 'MK-MH-00188', facilityName: 'KEM Hospital Mumbai — Emergency', state: 'Maharashtra', status: 'Online', firmwareVersion: 'v4.2.0', lastHeartbeat: '5 sec ago', cpuLoad: 31, ramUsage: 55, rfidReaderStatus: 'Healthy', ocrCameraStatus: 'Healthy', audioMicStatus: 'Healthy', printerStatus: 'Healthy' },
  { deviceId: 'MK-KA-00912', facilityName: 'Bowring Hospital Bengaluru', state: 'Karnataka', status: 'Degraded', firmwareVersion: 'v4.1.9', lastHeartbeat: '18 sec ago', cpuLoad: 88, ramUsage: 92, rfidReaderStatus: 'Healthy', ocrCameraStatus: 'Degraded', audioMicStatus: 'Healthy', printerStatus: 'Paper Out' },
  { deviceId: 'MK-UP-00310', facilityName: 'Varanasi Civil Hospital', state: 'Uttar Pradesh', status: 'Offline', firmwareVersion: 'v4.1.8', lastHeartbeat: '14 min ago', cpuLoad: 0, ramUsage: 0, rfidReaderStatus: 'Faulty', ocrCameraStatus: 'Faulty', audioMicStatus: 'Faulty', printerStatus: 'Faulty' },
  { deviceId: 'MK-TN-00554', facilityName: 'Rajaji Hospital Madurai', state: 'Tamil Nadu', status: 'Online', firmwareVersion: 'v4.2.0', lastHeartbeat: '3 sec ago', cpuLoad: 19, ramUsage: 42, rfidReaderStatus: 'Healthy', ocrCameraStatus: 'Healthy', audioMicStatus: 'Healthy', printerStatus: 'Healthy' },
];

export function KioskFleetCommandModule() {
  const [kiosks, setKiosks] = useState<KioskDevice[]>(INITIAL_KIOSKS);
  const [selectedDevice, setSelectedDevice] = useState<KioskDevice | null>(kiosks[0]);
  const [firmwareRollingOut, setFirmwareRollingOut] = useState(false);

  const handleRemoteRestart = (deviceId: string) => {
    setKiosks(kiosks.map(k => k.deviceId === deviceId ? { ...k, lastHeartbeat: 'Restarting...' } : k));
  };

  const handleTriggerOtaUpdate = () => {
    setFirmwareRollingOut(true);
    setTimeout(() => {
      setKiosks(kiosks.map(k => ({ ...k, firmwareVersion: 'v4.2.0', status: 'Online' })));
      setFirmwareRollingOut(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Cpu className="text-blue-400" />
            National Kiosk Fleet Command & Telemetry
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-Time Diagnostic Control for 1,240 Hardware Terminals Across All 36 States & UTs
          </p>
        </div>
        <button
          type="button"
          onClick={handleTriggerOtaUpdate}
          disabled={firmwareRollingOut}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
        >
          <Download size={16} />
          {firmwareRollingOut ? 'Broadcasting OTA v4.2.0...' : 'Deploy Fleet Firmware OTA v4.2.0'}
        </button>
      </div>

      {/* Fleet Availability Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span>Online Terminals</span>
            <Wifi size={16} />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">1,184</div>
          <div className="text-[10px] text-emerald-300 mt-1">95.4% Fleet Online</div>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
            <span>Degraded Hardware</span>
            <AlertTriangle size={16} />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">32</div>
          <div className="text-[10px] text-amber-300 mt-1">Camera/Printer warning</div>
        </div>

        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-red-400 font-semibold">
            <span>Offline Terminals</span>
            <WifiOff size={16} />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">24</div>
          <div className="text-[10px] text-red-300 mt-1">Technicians Dispatched</div>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-blue-400 font-semibold">
            <span>Firmware v4.2.0 Fleet Adoption</span>
            <Server size={16} />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mt-2">98.2%</div>
          <div className="text-[10px] text-blue-300 mt-1">1,218 / 1,240 Updated</div>
        </div>
      </div>

      {/* Fleet Table + Device Inspector */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Device List */}
        <div className="col-span-8 bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Device Registry Telemetry Grid</h3>
            <span className="text-xs font-mono text-slate-400">WebSocket Ping: 12ms</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-semibold">
                <th className="pb-3">Device ID</th>
                <th className="pb-3">Facility Location</th>
                <th className="pb-3">State</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Firmware</th>
                <th className="pb-3">Heartbeat</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {kiosks.map((k) => (
                <tr
                  key={k.deviceId}
                  onClick={() => setSelectedDevice(k)}
                  className={`cursor-pointer transition-all ${
                    selectedDevice?.deviceId === k.deviceId ? 'bg-blue-600/20' : 'hover:bg-white/5'
                  }`}
                >
                  <td className="py-3 font-mono text-blue-300 font-bold">{k.deviceId}</td>
                  <td className="py-3 text-slate-200 font-medium">{k.facilityName}</td>
                  <td className="py-3 text-slate-400">{k.state}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      k.status === 'Online' ? 'bg-emerald-500/20 text-emerald-300' :
                      k.status === 'Degraded' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {k.status}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-slate-300">{k.firmwareVersion}</td>
                  <td className="py-3 text-slate-400">{k.lastHeartbeat}</td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoteRestart(k.deviceId); }}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-bold"
                    >
                      Restart
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Column: Device Hardware Component Inspector */}
        <div className="col-span-4 bg-white/[0.03] border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
          {selectedDevice ? (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {selectedDevice.deviceId}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedDevice.status === 'Online' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {selectedDevice.status}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mt-2">{selectedDevice.facilityName}</h4>
                <p className="text-xs text-slate-400">{selectedDevice.state} • Firmware {selectedDevice.firmwareVersion}</p>
              </div>

              {/* Hardware Sensors Diagnostics */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hardware Peripherals Diagnostic</span>
                {[
                  { sensor: '13.56MHz RFID Reader', status: selectedDevice.rfidReaderStatus },
                  { sensor: 'Prescription OCR Camera', status: selectedDevice.ocrCameraStatus },
                  { sensor: 'Multilingual Microphone', status: selectedDevice.audioMicStatus },
                  { sensor: 'Thermal Receipt Printer', status: selectedDevice.printerStatus },
                ].map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                    <span className="text-slate-300 font-medium">{item.sensor}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 'Healthy' ? 'bg-emerald-500/20 text-emerald-300' :
                      item.status === 'Degraded' || item.status === 'Paper Out' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* System Load */}
              <div className="space-y-2 text-xs pt-2 border-t border-white/10">
                <div className="flex justify-between text-slate-400">
                  <span>CPU Load ({selectedDevice.cpuLoad}%)</span>
                  <span>RAM Usage ({selectedDevice.ramUsage}%)</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden flex">
                  <div className="bg-blue-500 h-full" style={{ width: `${selectedDevice.cpuLoad}%` }} />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleRemoteRestart(selectedDevice.deviceId)}
                  className="flex-1 py-2 bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Power size={14} />
                  Remote Reboot
                </button>
                <button
                  type="button"
                  className="flex-1 py-2 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Wrench size={14} />
                  Quarantine
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">Select a terminal to inspect diagnostics</div>
          )}
        </div>
      </div>
    </div>
  );
}
