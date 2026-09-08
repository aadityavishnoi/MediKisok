/**
 * Developer 1: Dataset Ingestion & Preprocessing Pipeline
 * Loaders and schemas for DDXPlus, ChatDoctor, PubMedQA, and MedQuad datasets.
 */

export interface DDXPlusCase {
  caseId: string;
  age: number;
  sex: 'M' | 'F';
  initialEvidence: string[];
  pathology: string;
  antecedents: string[];
  allEvidences: Array<{ name: string; value: string | boolean }>;
}

export interface ChatDoctorDialogue {
  conversationId: string;
  specialty: string;
  messages: Array<{
    sender: 'patient' | 'doctor';
    utterance: string;
  }>;
}

export class ClinicalDatasetIngestion {
  /**
   * Generates a sample normalized DDXPlus case for validation/testing
   */
  static getSampleDDXPlusCase(): DDXPlusCase {
    return {
      caseId: 'ddx_case_001',
      age: 42,
      sex: 'M',
      initialEvidence: ['fever', 'cough'],
      pathology: 'Viral pharyngitis',
      antecedents: ['smoking_history'],
      allEvidences: [
        { name: 'fever', value: true },
        { name: 'cough', value: true },
        { name: 'sore_throat', value: true },
        { name: 'dyspnea', value: false },
      ],
    };
  }

  /**
   * Generates a sample ChatDoctor dialogue for validation/testing
   */
  static getSampleChatDoctorDialogue(): ChatDoctorDialogue {
    return {
      conversationId: 'chat_doc_894',
      specialty: 'Internal Medicine',
      messages: [
        { sender: 'patient', utterance: 'Doctor, I have had a high fever and body ache since yesterday.' },
        { sender: 'doctor', utterance: 'Do you have any chills, cough, or difficulty breathing?' },
        { sender: 'patient', utterance: 'No breathing trouble, but yes severe shivering and retro-orbital eye pain.' },
        { sender: 'doctor', utterance: 'Understood. In your region Dengue is currently active. Please take Tab. Paracetamol 650mg and get a Complete Blood Count (CBC) test.' },
      ],
    };
  }
}
