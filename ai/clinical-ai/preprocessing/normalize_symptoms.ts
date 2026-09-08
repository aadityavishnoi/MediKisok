/**
 * MediKiosk Clinical AI - Symptom Normalization Engine
 * Normalizes multi-lingual, colloquial, and free-text symptom phrases into standardized clinical concept records.
 */

import { CANONICAL_CONCEPTS, CanonicalConcept, ClinicalCategory } from '../schemas/clinical_concepts';

export interface NormalizedSymptomRecord {
  symptomCode: string;
  symptomName: string;
  icd10: string;
  category: ClinicalCategory;
  isRedFlag: boolean;
  confidence: number;
  matchedTerm: string;
}

export class SymptomNormalizer {
  private static synonymIndex: Map<string, CanonicalConcept> | null = null;

  private static buildIndex(): Map<string, CanonicalConcept> {
    if (this.synonymIndex) return this.synonymIndex;

    const idx = new Map<string, CanonicalConcept>();
    for (const concept of Object.values(CANONICAL_CONCEPTS)) {
      // Map primary name and code
      idx.set(concept.canonicalName.toLowerCase(), concept);
      idx.set(concept.code.toLowerCase(), concept);

      // Map all configured synonyms
      for (const syn of concept.synonyms) {
        idx.set(syn.toLowerCase().trim(), concept);
      }
    }
    this.synonymIndex = idx;
    return idx;
  }

  /**
   * Normalizes a single raw phrase or token into a canonical clinical concept
   */
  static normalize(rawPhrase: string): NormalizedSymptomRecord | null {
    if (!rawPhrase || typeof rawPhrase !== 'string') return null;
    const clean = rawPhrase.trim().toLowerCase().replace(/[^\w\s\u0900-\u097F-]/g, ' ');
    const normalizedClean = clean.replace(/\s+/g, ' ').trim();
    if (!normalizedClean) return null;

    const index = this.buildIndex();

    // 1. Direct exact synonym lookup
    if (index.has(normalizedClean)) {
      const match = index.get(normalizedClean)!;
      return {
        symptomCode: match.code,
        symptomName: match.canonicalName,
        icd10: match.icd10,
        category: match.category,
        isRedFlag: match.isRedFlag,
        confidence: 0.98,
        matchedTerm: normalizedClean,
      };
    }

    // 2. Substring & multi-word phrase matching (longer patterns prioritized)
    const sortedPatterns = Array.from(index.entries()).sort((a, b) => b[0].length - a[0].length);

    for (const [pattern, concept] of sortedPatterns) {
      if (normalizedClean.includes(pattern) || pattern.includes(normalizedClean)) {
        return {
          symptomCode: concept.code,
          symptomName: concept.canonicalName,
          icd10: concept.icd10,
          category: concept.category,
          isRedFlag: concept.isRedFlag,
          confidence: 0.92,
          matchedTerm: pattern,
        };
      }
    }

    // 3. Graceful fallback for unindexed symptoms
    const safeCode = `SYMPT_${normalizedClean.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
    return {
      symptomCode: safeCode,
      symptomName: rawPhrase.trim(),
      icd10: 'R68.89', // Other general symptoms and signs
      category: 'CONSTITUTIONAL',
      isRedFlag: false,
      confidence: 0.65,
      matchedTerm: normalizedClean,
    };
  }

  /**
   * Normalizes an array of symptom strings or phrases, removing duplicates by symptomCode
   */
  static normalizeList(phrases: string[]): NormalizedSymptomRecord[] {
    if (!Array.isArray(phrases)) return [];
    const seen = new Map<string, NormalizedSymptomRecord>();

    for (const phrase of phrases) {
      const record = this.normalize(phrase);
      if (record && !seen.has(record.symptomCode)) {
        seen.set(record.symptomCode, record);
      }
    }

    return Array.from(seen.values());
  }
}
