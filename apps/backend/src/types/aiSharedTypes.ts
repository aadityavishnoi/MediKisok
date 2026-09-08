/**
 * AI Consultation Shared Type Definitions
 *
 * Canonical types for the MediKiosk AI consultation workflow.
 * This is a local copy of ai/shared/types/index.ts kept inside the backend's
 * rootDir so the TypeScript compiler can resolve it without cross-boundary errors.
 *
 * Source of truth: ai/shared/types/index.ts
 * Keep in sync with any changes to the canonical definition.
 *
 * SAFETY NOTE: All interfaces enforce that AI is assistive only.
 * - individualDiagnosis is never set to true in RegionalSignal
 * - autonomousPrescription is never set to true in ConsultationAiContext
 * - Doctor remains the sole legal and clinical authority
 */

export interface Demographics {
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  district?: string;
  state?: string;
  facilityId?: string;
}

export interface AnsweredQuestionEntry {
  questionId: string;
  questionText?: string;
  answerValue: string;
  isRedFlagTrigger?: boolean;
  answeredAt: string;
}

export interface VitalsState {
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  spo2?: number;
  temperatureF?: number;
}

export interface PatientState {
  sessionId: string;
  patientId: string;
  demographics: Demographics;
  chiefComplaint: string;
  reportedSymptoms?: string[];
  answeredQuestions: AnsweredQuestionEntry[];
  vitals?: VitalsState;
  currentMedications?: string[];
  knownAllergies?: string[];
}

export interface NormalizedSymptom {
  symptomCode: string;
  symptomName: string;
  durationDays?: number;
  severity?: 'MILD' | 'MODERATE' | 'SEVERE';
  confidence: number;
}

export interface SuspectedDifferential {
  diseaseName: string;
  icd10Code: string;
  likelihoodScore: number;
  evidenceCitations?: string[];
}

export interface ClinicalSignal {
  sessionId: string;
  patientId: string;
  normalizedSymptoms: NormalizedSymptom[];
  triageAcuity: 'GREEN_NON_URGENT' | 'YELLOW_URGENT' | 'ORANGE_EMERGENT' | 'RED_RESUSCITATION';
  redFlagStatus: 'NONE' | 'POTENTIAL' | 'CRITICAL_CONFIRMED';
  suspectedDifferentials?: SuspectedDifferential[];
  clinicalSafetyNotes?: string;
  generatedAt: string;
}

export interface RegionalSignal {
  regionId: string;
  district?: string;
  state?: string;
  disease: string;
  icd10?: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  positivityRate: number;
  sampleSize: number;
  positiveCount?: number;
  trend: 'FALLING' | 'STABLE' | 'RISING' | 'OUTBREAK_SURGE';
  confidence: 'INSUFFICIENT_SAMPLE' | 'ADEQUATE_SAMPLE' | 'HIGH_CONFIDENCE';
  wilsonInterval?: {
    lower: number;
    upper: number;
  };
  baselinePrevalence?: number;
  epidemiologicalAlertMessage?: string;
  generatedAt: string;
}

export interface QuestionOption {
  value: string;
  label: string;
  labelLocalized?: Record<string, string>;
  isRedFlag?: boolean;
}

export interface ClinicalQuestion {
  questionId: string;
  section:
    | 'chiefComplaint'
    | 'hpi'
    | 'pastMedicalHistory'
    | 'pastSurgicalHistory'
    | 'currentMedications'
    | 'drugAllergies'
    | 'familyHistory'
    | 'personalHistory'
    | 'reviewOfSystems'
    | 'previousInvestigations'
    | 'ayush'
    | 'outbreakSurveillance';
  questionText: string;
  questionTextLocalized?: {
    en?: string;
    hi?: string;
    [lang: string]: string | undefined;
  };
  questionType: 'SINGLE_SELECT' | 'MULTI_SELECT' | 'BOOLEAN' | 'SCALE' | 'TEXT';
  options?: QuestionOption[];
  priorityScore: number;
  clinicalRationale: string;
  redFlagTrigger: boolean;
  relatedOutbreakDisease?: string | null;
}

export interface DrugInteraction {
  interactingDrug: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'CONTRAINDICATED';
  effectDescription: string;
}

export interface Drug {
  medicineName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  route?: 'ORAL' | 'INJECTION' | 'TOPICAL' | 'INHALATION' | 'OTHER';
  isNLEMEssential?: boolean;
  isJanAushadhiAvailable?: boolean;
  janAushadhiGenericName?: string;
  cdscoSchedule?: 'SCHEDULE_H' | 'SCHEDULE_H1' | 'SCHEDULE_X' | 'OTC' | 'GENERAL';
  contraindications?: string[];
  drugInteractions?: DrugInteraction[];
}

export interface RxCheckRequest {
  proposedMedications: Drug[];
  currentMedications?: Drug[];
  allergies?: string[];
}

export interface RxCheckResponse {
  safe: boolean;
  warnings: Array<{
    severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'CONTRAINDICATED';
    message: string;
    interactingDrugs: string[];
  }>;
  janAushadhiAlternatives: Array<{
    brandName: string;
    genericEquivalent: string;
    approxSavingsPercent: number;
  }>;
  regulatoryMetadata: {
    nlemCount: number;
    scheduleHCount: number;
  };
}

export interface NextQuestionRequest {
  patientState: PatientState;
  regionalSignal?: RegionalSignal | null;
}

export interface NextQuestionResponse {
  nextQuestion: ClinicalQuestion | null;
  remainingQuestionsEstimated: number;
  suspectedDifferentials: SuspectedDifferential[];
  isComplete: boolean;
  clinicalSafetyNotes: string;
}

export interface RxAlertEvidence {
  source: string;
  sourceVersion?: string;
  retrievedAt?: string;
  evidenceType: string;
  confidence?: string;
}

export interface RxAlert {
  alertId?: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CONTRAINDICATED';
  type: 'DRUG_INTERACTION' | 'DUPLICATE_THERAPY' | 'ALLERGY_CROSS_REACTIVITY' | 'UNKNOWN_MEDICATION' | 'CONTRAINDICATION';
  medications: string[];
  reason: string;
  mechanism?: string;
  effect?: string;
  management?: string;
  evidence?: RxAlertEvidence[];
  requiresDoctorReview: boolean;
  doctorAction?: 'PENDING' | 'ACKNOWLEDGED' | 'MODIFIED' | 'OVERRIDDEN';
}

export interface ForecastSignal {
  horizonDays: 7 | 14 | 28;
  targetDate: string;
  predictedCases: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  modelName: string;
  modelVersion: string;
  unit?: string;
}

export type ConsultationAiStatus =
  | 'IN_PROGRESS'
  | 'AI_HISTORY_COMPLETE'
  | 'DOCTOR_REVIEW'
  | 'PRESCRIPTION_REVIEW'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ConsultationAiContext {
  consultationId: string;
  sessionId: string;
  regionId?: string;
  patient: {
    id: string;
    fullName: string;
    age?: number;
    gender?: string;
    district?: string;
    state?: string;
  };
  symptoms: string[];
  answers: AnsweredQuestionEntry[];
  clinicalSignals: ClinicalSignal[];
  regionalSignals: RegionalSignal[];
  medications: string[];
  rxAlerts: RxAlert[];
  forecasts: ForecastSignal[];
  requiresDoctorReview: boolean;
  status: ConsultationAiStatus;
  doctorDecision?: {
    doctorId?: string;
    diagnosis?: string;
    notes?: string;
    acknowledgedAlerts?: string[];
    completedAt?: string;
  };
  auditTrail?: Array<{
    requestId?: string;
    timestamp: string;
    module: string;
    action: string;
  }>;
}
