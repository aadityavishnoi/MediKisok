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

export async function getRegionalSurveillanceRisk(
  regionId = 'IN-UP-VARANASI',
): Promise<RegionalRiskResponse | null> {
  try {
    const res = await fetch(`/api/surveillance/regions/${encodeURIComponent(regionId)}/risk`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function checkRxSafety(payload: {
  medications: string[];
  allergies?: string[];
  patientContext?: any;
}): Promise<RxCheckResponse | null> {
  try {
    const res = await fetch('/api/rx/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getConsultationAiContext(sessionId: string): Promise<any | null> {
  try {
    const res = await fetch(`/api/ai/consultation/${encodeURIComponent(sessionId)}/context`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.context;
  } catch {
    return null;
  }
}

