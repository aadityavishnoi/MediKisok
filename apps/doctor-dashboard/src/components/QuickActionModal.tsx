import { useState } from 'react';
import { X, Video, VideoOff, Mic, MicOff, PhoneOff, Search, User, Calendar, PlusCircle, Check, CheckCircle2 } from 'lucide-react';

export type QuickActionType = 'teleconsult' | 'find_patient' | 'schedule_intake' | 'new_rx' | null;

export interface QuickActionModalProps {
  type: QuickActionType;
  onClose: () => void;
  onOpenSession?: (sessionId: string) => void;
}

export function QuickActionModal({ type, onClose, onOpenSession }: QuickActionModalProps) {
  const [videoMuted, setVideoMuted] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduled, setScheduled] = useState(false);

  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">
            {type === 'teleconsult' && 'TeleConsultation Video Room'}
            {type === 'find_patient' && 'Patient Master Search'}
            {type === 'schedule_intake' && 'Schedule OPD Intake Encounter'}
            {type === 'new_rx' && 'Quick Electronic Prescription'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* TeleConsult Video Call Simulator */}
        {type === 'teleconsult' && (
          <div className="space-y-4">
            <div className="relative h-64 overflow-hidden rounded-2xl bg-slate-950 flex flex-col justify-between p-4 shadow-inner">
              <div className="flex items-center justify-between text-white text-xs">
                <span className="flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1 font-bold animate-pulse">
                  ● LIVE ENCRYPTED CALL
                </span>
                <span className="font-mono text-slate-300">Room #OPD-304</span>
              </div>

              <div className="text-center text-white space-y-1">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/30 text-blue-400 border border-blue-400/50">
                  <User size={32} />
                </div>
                <p className="font-extrabold text-sm">Rajesh Kumar (52y)</p>
                <p className="text-xs text-slate-400">Remote Patient Kiosk #01</p>
              </div>

              {/* Floating Self-view Camera preview */}
              <div className="absolute bottom-4 right-4 h-20 w-28 rounded-xl bg-slate-800 border-2 border-white/20 shadow-md flex items-center justify-center text-[10px] text-white/70">
                <span>Dr. Self Camera</span>
              </div>

              {/* Controls bar */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setAudioMuted(!audioMuted)}
                  className={`rounded-full p-2.5 text-white transition-colors ${audioMuted ? 'bg-red-600' : 'bg-slate-800 hover:bg-slate-700'}`}
                >
                  {audioMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => setVideoMuted(!videoMuted)}
                  className={`rounded-full p-2.5 text-white transition-colors ${videoMuted ? 'bg-red-600' : 'bg-slate-800 hover:bg-slate-700'}`}
                >
                  {videoMuted ? <VideoOff size={18} /> : <Video size={18} />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors flex items-center gap-1.5"
                >
                  <PhoneOff size={16} /> End Call
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center">
              Telemedicine session encrypted per ABDM tele-health guidelines.
            </p>
          </div>
        )}

        {/* Find Patient Modal */}
        {type === 'find_patient' && (
          <div className="space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Patient Name, Phone, or ABHA ID…"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {[
                { name: 'Rajesh Kumar', abha: '91-4920-4920-1123', age: '52y', phone: '+91 98765 43210', id: 's1' },
                { name: 'Ananya Sharma', abha: '91-3019-8821-4412', age: '34y', phone: '+91 98123 45678', id: 's2' },
                { name: 'Vikram Singh', abha: '91-8841-2291-7711', age: '61y', phone: '+91 99234 56789', id: 's3' },
              ]
                .filter((p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.phone.includes(searchQuery))
                .map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => {
                      onClose();
                      onOpenSession?.(patient.id);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-blue-50/50 hover:border-blue-200 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold text-xs">
                        {patient.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{patient.name}</p>
                        <p className="text-[10px] text-slate-400">ABHA: {patient.abha} · {patient.age}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700"
                    >
                      Open 360
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Schedule Intake Modal */}
        {type === 'schedule_intake' && (
          <div className="space-y-4 text-xs">
            {scheduled ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 size={36} className="mx-auto text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-sm">OPD Intake Slot Reserved</h4>
                <p className="text-slate-500">Patient will be prompted at the kiosk at scheduled time.</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 rounded-xl bg-blue-600 px-4 py-2 font-bold text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Patient Name</label>
                  <input
                    type="text"
                    defaultValue="Rajesh Kumar"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Department</label>
                  <select className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800">
                    <option>Cardiology OPD</option>
                    <option>General Medicine</option>
                    <option>AYUSH Clinic</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Preferred Time Slot</label>
                  <input
                    type="datetime-local"
                    defaultValue="2026-09-08T10:00"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setScheduled(true)}
                  className="w-full rounded-xl bg-blue-600 py-2.5 font-bold text-white hover:bg-blue-700 transition-colors mt-2"
                >
                  Confirm Intake Booking
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Prescription Shortcut Modal */}
        {type === 'new_rx' && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">
              Select a queued patient to start an active electronic prescription session:
            </p>
            <div className="space-y-2">
              {[
                { name: 'Rajesh Kumar', complaint: 'Chest pain (2 hrs)', id: 's1' },
                { name: 'Ananya Sharma', complaint: 'Hypertension follow-up', id: 's2' },
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onClose();
                    onOpenSession?.(p.id);
                  }}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-blue-50 cursor-pointer"
                >
                  <div>
                    <p className="font-bold text-slate-900">{p.name}</p>
                    <p className="text-[11px] text-slate-400">{p.complaint}</p>
                  </div>
                  <span className="rounded-lg bg-blue-600 px-3 py-1 font-bold text-white text-[11px]">
                    Prescribe
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
