import type { MedicalDocument, ExtractedMedicalData } from '@medikiosk/shared-types';
import { apiFetch } from '../client.js';

export interface DocumentUploadResponse {
  success: boolean;
  documentId: string;
  document: MedicalDocument & { extractedData?: ExtractedMedicalData[] };
  imagekit: {
    fileId: string;
    name: string;
    url: string;
    thumbnailUrl?: string;
    fileType?: string;
    size?: number;
  };
  message: string;
}

export interface UploadDocumentParams {
  sessionId?: string;
  patientId?: string;
  type?: 'PRESCRIPTION' | 'LAB_REPORT' | 'ID_CARD' | 'OTHER';
  filename?: string;
  file?: File;
  fileBase64?: string;
  ocrText?: string;
}

export async function uploadDocument(params: UploadDocumentParams): Promise<DocumentUploadResponse> {
  if (params.file) {
    const formData = new FormData();
    formData.append('file', params.file);
    if (params.sessionId) formData.append('sessionId', params.sessionId);
    if (params.patientId) formData.append('patientId', params.patientId);
    if (params.type) formData.append('type', params.type);
    if (params.filename) formData.append('filename', params.filename);
    if (params.ocrText) formData.append('ocrText', params.ocrText);

    return apiFetch<DocumentUploadResponse>('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  }

  return apiFetch<DocumentUploadResponse>('/documents/upload', {
    method: 'POST',
    body: {
      sessionId: params.sessionId,
      patientId: params.patientId,
      type: params.type,
      filename: params.filename,
      fileBase64: params.fileBase64,
      ocrText: params.ocrText,
    },
  });
}

export function getSessionDocuments(sessionId: string): Promise<{ documents: (MedicalDocument & { extractedData?: ExtractedMedicalData[] })[] }> {
  return apiFetch<{ documents: (MedicalDocument & { extractedData?: ExtractedMedicalData[] })[] }>(`/documents/session/${sessionId}`);
}

export function getPatientDocuments(patientId: string): Promise<{ documents: (MedicalDocument & { extractedData?: ExtractedMedicalData[] })[] }> {
  return apiFetch<{ documents: (MedicalDocument & { extractedData?: ExtractedMedicalData[] })[] }>(`/documents/patient/${patientId}`);
}
