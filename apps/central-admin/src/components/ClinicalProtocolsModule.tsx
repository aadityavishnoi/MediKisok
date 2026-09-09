import React, { useState, useEffect } from 'react';
import { FileText, Plus, AlertTriangle, GitBranch, X, CheckCircle2, RefreshCw } from 'lucide-react';

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

export function ClinicalProtocolsModule() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal Form State
  const [formData, setFormData] = useState({
    id: 'PROT-01',
    name: '',
    version: 'v1.0',
    jurisdiction: 'National Default',
    mandatoryQuestions: 5,
    redFlagTriggers: '',
  });

  const fetchProtocols = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/clinical/protocols');
      const data = await res.json();
      if (data.protocols && Array.isArray(data.protocols) && data.protocols.length > 0) {
        setProtocols(data.protocols);
        setSelectedProtocol((prev) => (prev ? (data.protocols.find((p: any) => p.id === prev.id) || data.protocols[0]) : data.protocols[0]));
        setFormData((prev) => ({ ...prev, id: `PROT-0${data.protocols.length + 1}` }));
      }
    } catch {
      // Fall back gracefully to existing state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProtocols();
  }, []);

  const handleCreateProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const triggers = formData.redFlagTriggers
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/clinical/protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.id,
          name: formData.name,
          version: formData.version,
          jurisdiction: formData.jurisdiction,
          mandatoryQuestions: Number(formData.mandatoryQuestions),
          redFlagTriggers: triggers,
        }),
      });

      if (res.ok) {
        setFeedback('Protocol version registered & published to system config!');
        setShowModal(false);
        setFormData({
          id: `PROT-0${protocols.length + 2}`,
          name: '',
          version: 'v1.0',
          jurisdiction: 'National Default',
          mandatoryQuestions: 5,
          redFlagTriggers: '',
        });
        await fetchProtocols();
      } else {
        setFeedback('Failed to register protocol. Check inputs.');
      }
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <FileText className="text-blue-600" />
            National Clinical Protocol Governance
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Central Standardization of Kiosk Intake Trees, Red-Flag Rules, and Mandatory Clinical Questions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchProtocols}
            disabled={isLoading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Refresh Protocols"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-200 hover:-translate-y-0.5"
          >
            <Plus size={16} />
            Create Protocol Version
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-blue-600 hover:text-blue-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Protocol List & Tree Inspector */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 animate-slide-up" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Active Protocol Registry ({protocols.length})</h3>
            <span className="text-[11px] font-mono text-slate-400">Database-backed</span>
          </div>
          <div className="space-y-2">
            {protocols.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => setSelectedProtocol(p)}
                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer animate-slide-up stagger-item hover:-translate-y-0.5 hover:shadow-md ${
                  selectedProtocol?.id === p.id ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{p.name}</span>
                    <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {p.version}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-2 font-mono flex items-center justify-between">
                  <span>Scope: {p.jurisdiction}</span>
                  <span>Updated: {p.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tree & Red Flag Rule Inspector */}
        {selectedProtocol && (
          <div className="col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-slide-up" style={{ animationDelay: '60ms' }}>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-blue-600 font-bold">{selectedProtocol.id}</span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Central Approved
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedProtocol.name} ({selectedProtocol.version})</h3>
              <p className="text-xs text-slate-500">Jurisdiction Scope: {selectedProtocol.jurisdiction}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                <span className="font-bold text-red-700 flex items-center gap-2">
                  <AlertTriangle size={14} />
                  Mandatory Red-Flag Triage Triggers
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProtocol.redFlagTriggers?.map((rf, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold rounded-md">
                      ⚡ {rf}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-600 flex items-center gap-2">
                  <GitBranch size={14} className="text-blue-600" />
                  Intake Question Sequence Matrix ({selectedProtocol.mandatoryQuestions} Mandatory Checkpoints)
                </span>
                <div className="space-y-1.5 text-[11px] text-slate-600 font-mono">
                  <div className="p-2 bg-white border border-slate-200 rounded">1. Chief Complaint & Duration Selection</div>
                  <div className="p-2 bg-white border border-slate-200 rounded">2. Severity Scale (1-10) & Onset Mode</div>
                  <div className="p-2 bg-white border border-slate-200 rounded">3. High-Risk Comorbidities (Diabetes, Hypertension, CKD)</div>
                  <div className="p-2 bg-white border border-slate-200 rounded">4. Multilingual OCR Prescription & Lab Scan</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Protocol Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="text-blue-600" size={18} />
                Create Clinical Protocol Version
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProtocol} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Protocol Code</label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Version</label>
                  <input
                    type="text"
                    required
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Protocol Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stroke & Neurological Triage Protocol"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Jurisdiction / Scope</label>
                  <input
                    type="text"
                    required
                    value={formData.jurisdiction}
                    onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Mandatory Questions</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={formData.mandatoryQuestions}
                    onChange={(e) => setFormData({ ...formData, mandatoryQuestions: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Red Flag Triggers (comma-separated)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Sudden Facial Asymmetry, Slurred Speech, Limb Weakness"
                  value={formData.redFlagTriggers}
                  onChange={(e) => setFormData({ ...formData, redFlagTriggers: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Publish Protocol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
