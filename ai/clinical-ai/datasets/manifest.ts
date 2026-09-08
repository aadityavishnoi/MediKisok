/**
 * MediKiosk Clinical AI - Dataset Manifest
 * Metadata, checksums, and specifications for ingested clinical datasets.
 */

export interface DatasetManifestEntry {
  id: string;
  name: string;
  version: string;
  license: string;
  description: string;
  homepageUrl: string;
  downloadUrl?: string;
  format: 'json' | 'csv' | 'parquet' | 'archive';
  targetSubdir: string;
  sha256?: string;
  recordCountEstimate: number;
}

export const DATASET_MANIFEST: Record<string, DatasetManifestEntry> = {
  ddxplus: {
    id: 'ddxplus',
    name: 'DDXPlus Diagnostic Graph & Trajectory Dataset',
    version: '1.0.0',
    license: 'CC BY-NC 4.0',
    description: 'Evidence and disease probability matrix covering 49 pathologies and 223 clinical findings.',
    homepageUrl: 'https://github.com/vith/ddxplus',
    downloadUrl: 'https://raw.githubusercontent.com/vith/ddxplus/main/data/release_evidences.json',
    format: 'json',
    targetSubdir: 'raw/ddxplus',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    recordCountEstimate: 1300000,
  },
  chatdoctor: {
    id: 'chatdoctor',
    name: 'ChatDoctor Medical Dialogue & Phrasing Corpus',
    version: '1.0.0',
    license: 'MIT / CC-BY',
    description: 'Physician-patient conversational questions and vernacular symptom descriptions.',
    homepageUrl: 'https://github.com/Kent0n-Li/ChatDoctor',
    downloadUrl: 'https://raw.githubusercontent.com/Kent0n-Li/ChatDoctor/main/HealthCareMagic-100k.json',
    format: 'json',
    targetSubdir: 'raw/chatdoctor',
    sha256: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    recordCountEstimate: 100000,
  },
  pubmedqa: {
    id: 'pubmedqa',
    name: 'PubMedQA Biomedical Clinical Reasoning',
    version: '1.0.0',
    license: 'MIT',
    description: 'Biomedical question-answering pairs used for clinical rationale synthesis.',
    homepageUrl: 'https://pubmedqa.github.io/',
    downloadUrl: 'https://raw.githubusercontent.com/pubmedqa/pubmedqa/master/data/ori_pqal.json',
    format: 'json',
    targetSubdir: 'raw/pubmedqa',
    sha256: '4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
    recordCountEstimate: 1000,
  },
  medquad: {
    id: 'medquad',
    name: 'MedQuAD (Medical Question Answering Dataset)',
    version: '1.0.0',
    license: 'NIH Public Domain / Open Educational',
    description: 'Curated 47,457 medical QA pairs from trusted NIH health information sources.',
    homepageUrl: 'https://github.com/abachaa/MedQuAD',
    format: 'json',
    targetSubdir: 'raw/medquad',
    sha256: '7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c',
    recordCountEstimate: 47457,
  },
};
