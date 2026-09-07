import React, { useState, useRef } from 'react';
import { Camera, CheckCircle2, RefreshCw, ArrowRight, Upload, Cloud, ExternalLink, FileText, AlertCircle } from 'lucide-react';
import type { Language } from '@medikiosk/shared-types';
import { uploadDocument, type DocumentUploadResponse } from '@medikiosk/api-client';

export interface DocumentUploadScreenProps {
  sessionId?: string;
  patientId?: string;
  language: Language;
  onComplete: (docData?: { type: string; summary: string }) => void;
  onSkip: () => void;
}

export function DocumentUploadScreen({ sessionId, patientId, language, onComplete, onSkip }: DocumentUploadScreenProps) {
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState<'PRESCRIPTION' | 'LAB_REPORT' | 'ID_CARD'>('PRESCRIPTION');
  const [uploadedDoc, setUploadedDoc] = useState<DocumentUploadResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMessage(null);
    try {
      const res = await uploadDocument({
        sessionId,
        patientId,
        type: docType,
        filename: file.name,
        file,
      });
      setUploadedDoc(res);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to upload document to ImageKit');
    } finally {
      setUploading(false);
    }
  };

  const handleSimulateCapture = async () => {
    setUploading(true);
    setErrorMessage(null);
    try {
      const res = await uploadDocument({
        sessionId,
        patientId,
        type: docType,
        filename: `${docType.toLowerCase()}_sample_${Date.now()}.png`,
      });
      setUploadedDoc(res);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to process document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 text-center w-full max-w-xl mx-auto">
      <div>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-2">
          <Cloud size={13} className="text-blue-500" /> ImageKit Cloud Medical Ingestion
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 font-display tracking-tight">Scan Prescription or Reports</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          Upload or scan paper prescriptions, lab reports, or ABHA cards for doctor review
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Selector */}
      <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-full border border-slate-200/60">
        <button
          type="button"
          onClick={() => { setDocType('PRESCRIPTION'); setUploadedDoc(null); }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            docType === 'PRESCRIPTION' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          📄 Prescription
        </button>
        <button
          type="button"
          onClick={() => { setDocType('LAB_REPORT'); setUploadedDoc(null); }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            docType === 'LAB_REPORT' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          🧪 Lab Report
        </button>
        <button
          type="button"
          onClick={() => { setDocType('ID_CARD'); setUploadedDoc(null); }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            docType === 'ID_CARD' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          🆔 ABHA / ID Card
        </button>
      </div>

      {/* Viewfinder Frame / Document Preview */}
      <div className="relative w-full min-h-[230px] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-inner flex flex-col items-center justify-center p-5 text-white">
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500 rounded-tl" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500 rounded-tr" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500 rounded-bl" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500 rounded-br" />

        {uploading ? (
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <RefreshCw size={36} className="text-blue-400 animate-spin" />
            <div className="text-center">
              <span className="text-sm font-bold text-blue-200 block">Uploading to ImageKit Cloud CDN…</span>
              <span className="text-xs text-slate-400">Extracting OCR entities & saving to database</span>
            </div>
          </div>
        ) : uploadedDoc ? (
          <div className="flex flex-col items-center gap-3 text-center bg-slate-800/95 backdrop-blur p-4 rounded-2xl border border-slate-700 w-full max-w-md animate-scale-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
              <div className="text-left">
                <span className="text-xs font-bold text-emerald-300 block">
                  Cloud OCR Verified ({Math.round(uploadedDoc.document.ocrConfidence * 100)}%)
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[220px] block">
                  {uploadedDoc.imagekit.url}
                </span>
              </div>
            </div>

            {/* OCR Extracted Text Preview */}
            <p className="text-xs text-slate-200 font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-left w-full line-clamp-3">
              {uploadedDoc.document.ocrText}
            </p>

            {/* Extracted Clinical Tags */}
            {uploadedDoc.document.extractedData && uploadedDoc.document.extractedData.length > 0 && (
              <div className="flex flex-wrap gap-1.5 w-full justify-start">
                {uploadedDoc.document.extractedData.map((item, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-blue-900/60 border border-blue-700/60 text-blue-200 text-[10px] font-semibold">
                    💊 {item.fieldValue}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between w-full pt-2 border-t border-slate-700/60 text-[11px]">
              <span className="text-slate-400">Stored on ImageKit CDN</span>
              <a
                href={uploadedDoc.imagekit.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
              >
                View Cloud Asset <ExternalLink size={11} />
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Camera size={40} className="text-slate-500" />
            <span className="text-xs font-semibold">Position paper document or tap upload below</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 w-full text-left">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5 w-full">
        {!uploadedDoc ? (
          <>
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Upload size={16} /> Choose File / Camera
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={handleSimulateCapture}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Camera size={16} /> Simulate AI OCR Capture
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() =>
              onComplete({
                type: uploadedDoc.document.type,
                summary: uploadedDoc.document.ocrText,
              })
            }
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
          {uploadedDoc ? 'Skip Next' : 'Skip'}
        </button>
      </div>
    </div>
  );
}

