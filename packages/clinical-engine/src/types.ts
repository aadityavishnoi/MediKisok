import type { LocalizedText, QuestionType } from '@medikiosk/shared-types';

export type ClinicalHistorySection =
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
  | 'ayush';

export interface TreeOption {
  value: string;
  label: LocalizedText;
  /** Which node comes next if this option is chosen. null = end of this tree. */
  next: string | null;
  /** Marks this specific choice as clinically urgent - the single source of truth for
   * select-type red flags (more reliable than regex-matching translated option labels). */
  redFlag?: boolean;
}

export interface TreeNode {
  id: string;
  section: ClinicalHistorySection;
  /** Required when section is 'ayush' - the exact AYUSH field name (e.g. "Prakriti"). */
  ayushField?: string;
  type: QuestionType;
  questionText: LocalizedText;
  /** SINGLE_SELECT/BOOLEAN branch per chosen option. MULTI_SELECT/TEXT/SCALE always use `next`. */
  options?: TreeOption[];
  next?: string | null;
}

export interface ClinicalTree {
  id: string;
  entryNodeId: string;
  nodes: TreeNode[];
}
