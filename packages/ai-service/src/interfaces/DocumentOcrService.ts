export interface ExtractedField {
  fieldType: 'MEDICATION' | 'LAB_VALUE' | 'DIAGNOSIS' | 'ABHA_ID' | 'INSTRUCTION' | 'OTHER';
  fieldValue: string;
  confidence: number;
}

export interface DocumentOcrResult {
  documentType: 'PRESCRIPTION' | 'LAB_REPORT' | 'DISCHARGE_SUMMARY' | 'OTHER';
  summary: string;
  rawText: string;
  confidence: number;
  fields: ExtractedField[];
  engineUsed: 'GEMINI_VISION' | 'CLINICAL_FALLBACK' | 'TESSERACT' | 'SIMULATION_FIXTURE';
}

export interface DocumentOcrService {
  processDocumentImage(imageBase64: string, mimeType?: string, hintType?: string): Promise<DocumentOcrResult>;
}
