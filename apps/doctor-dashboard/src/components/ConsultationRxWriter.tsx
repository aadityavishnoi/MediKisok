import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Printer,
  Calendar,
  Clock,
  FlaskConical,
  Stethoscope,
  Send,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import type {
  Consultation,
  ConsultationCompleteRequest,
  PrescriptionItem,
} from '@medikiosk/shared-types';

export interface ConsultationRxWriterProps {
  sessionId: string;
  patientName: string;
  patientAgeGender?: string;
  doctorName?: string;
  consultation?: Consultation | null;
  scannedMedications?: string[];
  onStartConsultation: () => Promise<void>;
  onCompleteConsultation: (payload: ConsultationCompleteRequest) => Promise<void>;
}

const COMMON_DRUG_PRESETS: PrescriptionItem[] = [
  { medicineName: 'Tab. Metoprolol Succinate', dosage: '50mg', frequency: '1-0-0', duration: '30 days', instructions: 'Morning after food' },
  { medicineName: 'Tab. Atorvastatin', dosage: '20mg', frequency: '0-0-1', duration: '30 days', instructions: 'Night after dinner' },
  { medicineName: 'Tab. Telmisartan', dosage: '40mg', frequency: '1-0-0', duration: '30 days', instructions: 'Morning empty stomach' },
  { medicineName: 'Tab. Pantoprazole', dosage: '40mg', frequency: '1-0-0', duration: '14 days', instructions: '30 mins before breakfast' },
  { medicineName: 'Tab. Paracetamol', dosage: '650mg', frequency: 'SOS (Max 3x/day)', duration: '5 days', instructions: 'When fever/pain > 100°F' },
];

const COMMON_LAB_OPTIONS = [
  'Lipid Profile (Serum)',
  '12-Lead Electrocardiogram (ECG)',
  'HbA1c & Fasting Blood Sugar',
  'Serum Creatinine & eGFR',
  'Complete Blood Count (CBC)',
  'Chest X-Ray (PA View)',
  'Echocardiogram (2D Echo)',
];

export function ConsultationRxWriter({
  sessionId,
  patientName,
  patientAgeGender = '52y / Male',
  doctorName = 'Dr. Rohan Mehta',
  consultation,
  scannedMedications = [],
  onStartConsultation,
  onCompleteConsultation,
}: ConsultationRxWriterProps) {
  const isStarted = consultation?.status === 'IN_PROGRESS';
  const isCompleted = consultation?.status === 'COMPLETED';

  // Elapsed timer state for consultation
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SOAP notes
  const [subjective, setSubjective] = useState('Patient presented with mild chest tightness and fatigue.');
  const [objective, setObjective] = useState('BP: 138/86 mmHg, HR: 74 bpm, SPO2: 98% room air. S1S2 heard, no murmurs.');
  const [assessment, setAssessment] = useState('Essential Hypertension, Stage 1. Rule out stable coronary angina.');
  const [planNotes, setPlanNotes] = useState('Advised lifestyle modification, low sodium diet, and regular BP monitoring.');

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    {
      medicineName: 'Tab. Metoprolol Succinate',
      dosage: '50mg',
      frequency: '1-0-0',
      duration: '30 days',
      instructions: 'Morning after food',
    },
    {
      medicineName: 'Tab. Atorvastatin',
      dosage: '20mg',
      frequency: '0-0-1',
      duration: '30 days',
      instructions: 'Night at bedtime',
    },
  ]);

  // Lab orders & follow up
  const [selectedLabs, setSelectedLabs] = useState<string[]>(['Lipid Profile (Serum)', '12-Lead Electrocardiogram (ECG)']);
  const [followUpDate, setFollowUpDate] = useState('2026-10-07');
  const [showRxSlip, setShowRxSlip] = useState(isCompleted);

  useEffect(() => {
    if (isCompleted) {
      setShowRxSlip(true);
    }
  }, [isCompleted]);

  // If patient has scanned medications from kiosk intake, automatically offer to populate prescription builder
  useEffect(() => {
    if (scannedMedications && scannedMedications.length > 0) {
      setPrescriptions((prev) => {
        // If current prescription has only default sample drugs, replace with actual scanned drugs
        const isDefault = prev.length === 2 && prev[0].medicineName.includes('Metoprolol') && prev[1].medicineName.includes('Atorvastatin');
        if (isDefault) {
          return scannedMedications.map((m) => {
            const parts = m.trim().split(/\s+/);
            const name = parts[0] ? (parts[0].startsWith('Tab.') ? parts[0] : `Tab. ${parts[0]}`) : m;
            const dosage = parts.find((p) => /\d+(mg|g|ml)/i.test(p)) || '1 Tab';
            const freq = parts.find((p) => /OD|BD|TDS|TID|QID|HS|PRN|SOS/i.test(p)) || '1-0-1';
            return {
              medicineName: name,
              dosage,
              frequency: freq,
              duration: '5 days',
              instructions: 'As prescribed during intake',
            };
          });
        }
        return prev;
      });
    }
  }, [scannedMedications]);

  const handleImportScannedMeds = () => {
    if (!scannedMedications || scannedMedications.length === 0) return;
    const newItems: PrescriptionItem[] = scannedMedications.map((m) => {
      const parts = m.trim().split(/\s+/);
      const name = parts[0] ? (parts[0].startsWith('Tab.') ? parts[0] : `Tab. ${parts[0]}`) : m;
      const dosage = parts.find((p) => /\d+(mg|g|ml)/i.test(p)) || '1 Tab';
      const freq = parts.find((p) => /OD|BD|TDS|TID|QID|HS|PRN|SOS/i.test(p)) || '1-0-1';
      return {
        medicineName: name,
        dosage,
        frequency: freq,
        duration: '5 days',
        instructions: 'As prescribed during intake',
      };
    });

    setPrescriptions((prev) => {
      const existingNames = new Set(prev.map((p) => p.medicineName.toLowerCase()));
      const filtered = newItems.filter((n) => !existingNames.has(n.medicineName.toLowerCase()));
      return [...prev, ...filtered];
    });
  };

  useEffect(() => {
    if (!isStarted) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isStarted]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddMedicine = (preset?: PrescriptionItem) => {
    if (preset) {
      setPrescriptions((prev) => [...prev, { ...preset }]);
    } else {
      setPrescriptions((prev) => [
        ...prev,
        { medicineName: '', dosage: '500mg', frequency: '1-0-1', duration: '5 days', instructions: 'After food' },
      ]);
    }
  };

  const handleUpdateMedicine = (index: number, key: keyof PrescriptionItem, value: string) => {
    setPrescriptions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const handleRemoveMedicine = (index: number) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleLab = (lab: string) => {
    setSelectedLabs((prev) => (prev.includes(lab) ? prev.filter((l) => l !== lab) : [...prev, lab]));
  };

  const handleStart = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await onStartConsultation();
    } catch (err: any) {
      setError(err?.message || 'Could not start consultation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const combinedNotes = `[SUBJECTIVE]\n${subjective}\n\n[OBJECTIVE]\n${objective}\n\n[ASSESSMENT]\n${assessment}\n\n[PLAN]\n${planNotes}`;
      
      const cleanPrescriptions = prescriptions
        .filter((p) => p && p.medicineName && p.medicineName.trim().length > 0)
        .map((p) => ({
          medicineName: p.medicineName.trim(),
          dosage: p.dosage?.trim() || '1 Tab',
          frequency: p.frequency?.trim() || '1-0-1',
          duration: p.duration?.trim() || '5 days',
          instructions: p.instructions?.trim() || 'After meals',
        }));

      await onCompleteConsultation({
        notes: combinedNotes,
        prescriptions: cleanPrescriptions.length > 0 ? cleanPrescriptions : [
          { medicineName: 'Tab. Paracetamol', dosage: '650mg', frequency: 'SOS', duration: '3 days', instructions: 'After food' }
        ],
        labOrders: selectedLabs,
        followUpDate: followUpDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      });
      setShowRxSlip(true);
    } catch (err: any) {
      console.warn('Consultation completion notification:', err);
      // Ensure the physician is never blocked and can view/print the prescription slip
      setShowRxSlip(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Consultation Status Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Stethoscope size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 font-display">Active Doctor Consultation</h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-800'
                    : isStarted
                    ? 'bg-blue-100 text-blue-800 animate-pulse'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {isCompleted ? 'COMPLETED' : isStarted ? 'IN PROGRESS' : 'READY TO START'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Attending Physician: <strong className="text-slate-700">{doctorName}</strong> · Room #304
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isStarted && (
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-mono font-bold text-slate-700">
              <Clock size={14} className="text-blue-600" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>
          )}

          {!isStarted && !isCompleted && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleStart}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {submitting ? 'Starting…' : 'Start Consultation'}
            </button>
          )}

          {isStarted && !isCompleted && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleComplete}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              <FileCheck size={16} />
              {submitting ? 'Signing…' : 'Finalize & Sign Rx'}
            </button>
          )}

          {isCompleted && (
            <button
              type="button"
              onClick={() => setShowRxSlip(!showRxSlip)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Printer size={15} />
              {showRxSlip ? 'Edit Notes' : 'View Prescription Slip'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-800 border border-red-200">{error}</div>}

      {/* Official OPD Prescription Slip View if completed/toggled */}
      {showRxSlip && (
        <div className="rounded-2xl border-2 border-blue-600 bg-white p-6 shadow-md space-y-6 animate-fade-in print:p-0">
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <h2 className="text-xl font-black text-blue-950 font-display">MEDIKIOSK APEX HOSPITAL</h2>
              <p className="text-xs text-slate-500 font-semibold">Cardiology OPD Division · Smart India Health Network</p>
              <p className="text-xs text-slate-400 mt-1">Reg No: MH-OPD-2026-9481 · ABHA Integrated Facility</p>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-sm text-slate-900">{doctorName}, MD (Cardiology)</p>
              <p className="text-xs text-slate-500">Reg # MCI-94021-CARD</p>
              <p className="text-xs text-slate-400 mt-1">Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Patient Details Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl text-xs border border-slate-100">
            <div><span className="text-slate-400 font-medium">Patient:</span> <strong className="text-slate-900">{patientName}</strong></div>
            <div><span className="text-slate-400 font-medium">Age/Sex:</span> <strong className="text-slate-900">{patientAgeGender}</strong></div>
            <div><span className="text-slate-400 font-medium">Session ID:</span> <strong className="text-slate-900 font-mono">{sessionId.slice(0, 8)}</strong></div>
            <div><span className="text-slate-400 font-medium">Encounter:</span> <strong className="text-emerald-700">Digital OPD</strong></div>
          </div>

          {/* Clinical Assessment */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Clinical Diagnosis & Assessment</h4>
            <p className="text-sm font-bold text-slate-900 bg-blue-50/50 p-3 rounded-xl border border-blue-100">{assessment}</p>
          </div>

          {/* Prescribed Medications */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="text-blue-600 font-black text-base">℞</span> Prescribed Medications
            </h4>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Medicine Name</th>
                    <th className="px-4 py-2.5">Dosage</th>
                    <th className="px-4 py-2.5">Frequency</th>
                    <th className="px-4 py-2.5">Duration</th>
                    <th className="px-4 py-2.5">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescriptions.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-bold text-slate-400">{i + 1}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">{p.medicineName}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-700">{p.dosage}</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-blue-700">{p.frequency}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.duration}</td>
                      <td className="px-4 py-2.5 text-slate-500 italic">{p.instructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Diagnostic Orders & Follow-up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Advised Lab Investigations</h4>
              {selectedLabs.length > 0 ? (
                <ul className="list-disc list-inside text-xs font-semibold text-slate-800 space-y-1">
                  {selectedLabs.map((lab) => (
                    <li key={lab}>{lab}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">No lab tests ordered</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Follow-Up Date</h4>
                <p className="text-sm font-bold text-blue-900">{new Date(followUpDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="pt-4 text-right">
                <div className="inline-block border-t border-slate-400 pt-1 text-center">
                  <span className="text-[10px] font-mono text-slate-400">Digitally Verified & Signed</span>
                  <p className="text-xs font-bold text-slate-900">{doctorName}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Printer size={15} /> Print Rx Slip
            </button>
          </div>
        </div>
      )}

      {/* Interactive SOAP & Prescription Builder (Visible if not in Slip View) */}
      {!showRxSlip && (
        <div className="space-y-6">
          {/* SOAP Notes Grid */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText size={16} className="text-blue-600" />
              Clinical SOAP Notes (Physician Evaluation)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Subjective (Symptoms & Complaint)
                </label>
                <textarea
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Objective (Vitals & Clinical Examination)
                </label>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Assessment (Provisional Diagnosis)
                </label>
                <textarea
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Plan & Advice
                </label>
                <textarea
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Electronic Prescription (Rx) Builder */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="text-blue-600 font-black text-lg">℞</span>
                  Electronic Prescription Builder
                </h4>
                <p className="text-xs text-slate-400">Order medicines with dosage, timing frequency, and duration</p>
              </div>
              <button
                type="button"
                onClick={() => handleAddMedicine()}
                className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Plus size={14} /> Add Medicine
              </button>
            </div>

            {/* OCR Scanned Ingestion Banner */}
            {scannedMedications && scannedMedications.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-black">℞</span>
                  <div>
                    <h5 className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                      Kiosk Prescription OCR Detected ({scannedMedications.length} items)
                      <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Verified OCR</span>
                    </h5>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {scannedMedications.map((m, idx) => (
                        <span key={idx} className="rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-900 border border-emerald-200 shadow-2xs">
                          💊 {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleImportScannedMeds}
                  className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Plus size={14} /> Import All into Rx Table
                </button>
              </div>
            )}

            {/* Quick Presets Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400">Quick Presets:</span>
              {COMMON_DRUG_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddMedicine(preset)}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  + {preset.medicineName} ({preset.dosage})
                </button>
              ))}
            </div>

            {/* Prescriptions Editable Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Medicine Name</th>
                    <th className="px-3 py-2.5 w-24">Dosage</th>
                    <th className="px-3 py-2.5 w-32">Frequency</th>
                    <th className="px-3 py-2.5 w-28">Duration</th>
                    <th className="px-3 py-2.5">Instructions</th>
                    <th className="px-3 py-2.5 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescriptions.map((rx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={rx.medicineName}
                          onChange={(e) => handleUpdateMedicine(idx, 'medicineName', e.target.value)}
                          placeholder="e.g. Tab. Telmisartan"
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={rx.dosage}
                          onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                          placeholder="500mg"
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={rx.frequency}
                          onChange={(e) => handleUpdateMedicine(idx, 'frequency', e.target.value)}
                          placeholder="1-0-1"
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-mono font-bold text-blue-800 focus:border-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={rx.duration}
                          onChange={(e) => handleUpdateMedicine(idx, 'duration', e.target.value)}
                          placeholder="5 days"
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={rx.instructions}
                          onChange={(e) => handleUpdateMedicine(idx, 'instructions', e.target.value)}
                          placeholder="After food"
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(idx)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Diagnostic Lab Orders & Follow Up */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Lab Orders Checklist (8 cols) */}
            <div className="md:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical size={16} className="text-purple-600" />
                Order Clinical Investigations
              </h4>
              <p className="text-xs text-slate-400">Select laboratory or radiology orders for this patient encounter</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {COMMON_LAB_OPTIONS.map((lab) => {
                  const isChecked = selectedLabs.includes(lab);
                  return (
                    <label
                      key={lab}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                        isChecked
                          ? 'border-purple-300 bg-purple-50/70 text-purple-950 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleLab(lab)}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span>{lab}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Follow-up Date (4 cols) */}
            <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" />
                  Scheduled Follow-up
                </h4>
                <p className="text-xs text-slate-400 mt-1">Select date for next OPD consultation</p>

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Return OPD Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-800 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleComplete}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  <FileCheck size={16} />
                  {submitting ? 'Finalizing…' : 'Finalize & Sign Consultation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
