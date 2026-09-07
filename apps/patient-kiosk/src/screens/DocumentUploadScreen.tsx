import React, { useState } from 'react';
import { Camera, CheckCircle2, RefreshCw, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import type { Language } from '@medikiosk/shared-types';

export interface DocumentUploadScreenProps {
  language: Language;
  onComplete: (docData?: { type: string; summary: string }) => void;
  onSkip: () => void;
}

export function DocumentUploadScreen({ language, onComplete, onSkip }: DocumentUploadScreenProps) {
  const [scanning, setScanning] = useState(false);
  const [scannedDoc, setScannedDoc] = useState<{ type: string; summary: string; confidence: number } | null>(null);
  const [docType, setDocType] = useState<'prescription' | 'lab' | 'id'>('prescription');

  const handleScanSimulation = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      if (docType === 'prescription') {
        setScannedDoc({
          type: 'Prescription Document',
          summary: 'Rx Detected: Tab. Paracetamol 500mg BD, Tab. Pantoprazole 40mg OD.',
          confidence: 98.4,
        });
      } else if (docType === 'lab') {
        setScannedDoc({
          type: 'Diagnostic Report',
          summary: 'CBC Report: Hb 13.8 g/dL, Platelets 240,000 /mcL.',
          confidence: 96.8,
        });
      } else {
        setScannedDoc({
          type: 'ABHA / Govt ID Card',
          summary: 'ABHA Card Scanned: 91-8472-9102-4819.',
          confidence: 99.2,
        });
      }
    }, 1800);
  };

  return (
    <div className="flex flex-col items-center gap-5 text-center w-full max-w-xl mx-auto">
      <div>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-2">
          <Camera size={13} /> Optional Document Scanner
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 font-display tracking-tight">Scan Prescription or Reports</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          Hold paper prescription or lab report in front of the kiosk camera
        </p>
      </div>

      {/* Selector */}
      <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-full border border-slate-200/60">
        <button
          type="button"
          onClick={() => { setDocType('prescription'); setScannedDoc(null); }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            docType === 'prescription' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          📄 Prescription
        </button>
        <button
          type="button"
          onClick={() => { setDocType('lab'); setScannedDoc(null); }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            docType === 'lab' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          🧪 Lab Report
        </button>
        <button
          type="button"
          onClick={() => { setDocType('id'); setScannedDoc(null); }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            docType === 'id' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          🆔 ABHA / ID Card
        </button>
      </div>

      {/* Viewfinder Frame */}
      <div className="relative w-full h-56 bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-inner flex flex-col items-center justify-center p-6 text-white">
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500 rounded-tl" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500 rounded-tr" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500 rounded-bl" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500 rounded-br" />

        {scanning ? (
          <div className="flex flex-col items-center gap-2 animate-pulse">
            <RefreshCw size={36} className="text-blue-400 animate-spin" />
            <span className="text-sm font-bold text-blue-200">AI Document Scanner Active…</span>
          </div>
        ) : scannedDoc ? (
          <div className="flex flex-col items-center gap-2 text-center bg-slate-800/90 backdrop-blur p-4 rounded-2xl border border-slate-700 max-w-sm animate-scale-in">
            <CheckCircle2 size={32} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">{scannedDoc.type} Scanned ({scannedDoc.confidence}%)</span>
            <p className="text-xs text-slate-300 font-mono bg-slate-950 p-2 rounded-xl border border-slate-800 text-left">
              {scannedDoc.summary}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Camera size={40} className="text-slate-500" />
            <span className="text-xs font-semibold">Center document in viewfinder</span>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5 w-full">
        {!scannedDoc ? (
          <button
            type="button"
            disabled={scanning}
            onClick={handleScanSimulation}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Camera size={18} /> Simulate Document Capture
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onComplete(scannedDoc)}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
          >
            <CheckCircle2 size={18} /> Complete Intake <ArrowRight size={16} />
          </button>
        )}

        <button
          type="button"
          onClick={onSkip}
          className="py-3.5 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

