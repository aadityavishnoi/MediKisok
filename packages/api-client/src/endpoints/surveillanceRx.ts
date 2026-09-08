import { apiFetch } from '../client.js';

export interface RegionalRiskResponse {
  regionId: string;
  normalizedGeography?: any;
  disease?: string;
  riskLevel?: string;
  observedPositivity?: number;
  sampleSize?: number;
  trend?: string;
  baselineDeviation?: number;
  facilityCount?: number;
  confidence?: string;
  evidence?: string[];
  forecast?: {
    '7d': any;
    '14d': any;
  };
  dataQuality?: any;
  model?: any;
  clinicalUse?: {
    individualDiagnosis: false;
    enhancedScreeningRecommended: boolean;
    doctorReviewRequired: boolean;
  };
  generatedAt: string;
  signals: any[];
  demoActive?: boolean;
}

export interface RxCheckRequestPayload {
  medications: string[];
  allergies?: string[];
  patientContext?: {
    age?: number;
    gender?: string;
    isPregnant?: boolean;
    renalImpairment?: boolean;
    hepaticImpairment?: boolean;
  };
}

export interface RxCheckResponse {
  status: 'VALIDATED' | 'REVIEW_REQUIRED';
  safe: boolean;
  requiresDoctorReview: boolean;
  doctorReviewRequired: boolean;
  normalizedDrugs: any[];
  normalizedMedications: any[];
  interactions: any[];
  contraindications: any[];
  allergyFlags: any[];
  duplicateTherapy: any[];
  unknowns: any[];
  evidence: any[];
  janAushadhiAlternatives: any[];
  regulatoryMetadata: any;
  rulesVersion: string;
  clinicalDisclaimer: string;
}

export function getRegionalSurveillanceRisk(
  regionId = 'IN-UP-VARANASI',
  demo?: string,
): Promise<RegionalRiskResponse> {
  const query = demo ? `?demo=${encodeURIComponent(demo)}` : '';
  return apiFetch<RegionalRiskResponse>(`/surveillance/regions/${encodeURIComponent(regionId)}/risk${query}`);
}

export function checkRxSafety(
  payload: RxCheckRequestPayload,
): Promise<RxCheckResponse> {
  return apiFetch<RxCheckResponse>('/rx/check', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
