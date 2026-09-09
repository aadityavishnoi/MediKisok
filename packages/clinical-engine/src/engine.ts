import { Mode } from '@medikiosk/shared-types';
import type { ClinicalTree, TreeNode } from './types.js';
import { checkRedFlag, type RedFlagResult } from './redFlags.js';

import chestPain from './trees/chest-pain.json' with { type: 'json' };
import breathingDifficulty from './trees/breathing-difficulty.json' with { type: 'json' };
import abdominalPain from './trees/abdominal-pain.json' with { type: 'json' };
import fever from './trees/fever.json' with { type: 'json' };
import headache from './trees/headache.json' with { type: 'json' };
import generalFallback from './trees/general-fallback.json' with { type: 'json' };
import commonSections from './trees/common-sections.json' with { type: 'json' };
import ayushAssessment from './trees/ayush-assessment.json' with { type: 'json' };

const TREES: Record<string, ClinicalTree> = {
  'chest-pain': chestPain as ClinicalTree,
  'breathing-difficulty': breathingDifficulty as ClinicalTree,
  'abdominal-pain': abdominalPain as ClinicalTree,
  fever: fever as ClinicalTree,
  headache: headache as ClinicalTree,
  'general-fallback': generalFallback as ClinicalTree,
  'common-sections': commonSections as ClinicalTree,
  'ayush-assessment': ayushAssessment as ClinicalTree,
};

export const CHIEF_COMPLAINT_CATEGORIES = [
  'chest-pain',
  'breathing-difficulty',
  'abdominal-pain',
  'fever',
  'headache',
  'general-fallback',
] as const;
export type ChiefComplaintCategory = (typeof CHIEF_COMPLAINT_CATEGORIES)[number];

export const CHIEF_COMPLAINT_LABELS: Record<ChiefComplaintCategory, { en: string; hi: string }> = {
  'chest-pain': { en: 'Chest pain', hi: 'सीने में दर्द' },
  'breathing-difficulty': { en: 'Breathing difficulty', hi: 'सांस लेने में तकलीफ' },
  'abdominal-pain': { en: 'Abdominal pain', hi: 'पेट में दर्द' },
  fever: { en: 'Fever', hi: 'बुखार' },
  headache: { en: 'Headache', hi: 'सिरदर्द' },
  'general-fallback': { en: 'Something else', hi: 'कुछ और' },
};

function isChiefComplaintCategory(value: string): value is ChiefComplaintCategory {
  return (CHIEF_COMPLAINT_CATEGORIES as readonly string[]).includes(value);
}

function getTree(treeId: string): ClinicalTree {
  const tree = TREES[treeId];
  if (!tree) throw new Error(`Unknown clinical-engine tree id: ${treeId}`);
  return tree;
}

function findNode(tree: ClinicalTree, nodeId: string): TreeNode {
  const node = tree.nodes.find((n) => n.id === nodeId);
  if (!node) throw new Error(`Unknown node id "${nodeId}" in tree "${tree.id}"`);
  return node;
}

/** The ordered list of trees a session walks through, given its complaint and mode. */
export function getTreeSequence(chiefComplaintCategory: string, mode: Mode): string[] {
  const category = isChiefComplaintCategory(chiefComplaintCategory) ? chiefComplaintCategory : 'general-fallback';
  const sequence = [category, 'common-sections'];
  if (mode === Mode.AYUSH) sequence.push('ayush-assessment');
  return sequence;
}

export interface StartResult {
  treeId: string;
  node: TreeNode;
  /** Set immediately for known categories (e.g. "Chest pain"); null for general-fallback,
   * where the first question asks the patient to describe it in their own words instead. */
  chiefComplaintText: string | null;
}

export function startHistory(chiefComplaintCategory: string, mode: Mode): StartResult {
  const sequence = getTreeSequence(chiefComplaintCategory, mode);
  const treeId = sequence[0];
  const tree = getTree(treeId);
  const node = findNode(tree, tree.entryNodeId);
  const chiefComplaintText =
    isChiefComplaintCategory(chiefComplaintCategory) && chiefComplaintCategory !== 'general-fallback'
      ? CHIEF_COMPLAINT_LABELS[chiefComplaintCategory].en
      : null;
  return { treeId, node, chiefComplaintText };
}

export interface AppliedEntry {
  section: TreeNode['section'];
  ayushField?: string;
  /** For 'chiefComplaint' section: the raw text to set. Otherwise: a {label,value} entry to append. */
  label: string;
  value: string;
}

export interface AdvanceInput {
  chiefComplaintCategory: string;
  mode: Mode;
  currentTreeId: string;
  currentNodeId: string;
  answerValue: unknown;
}

export interface AdvanceResult {
  appliedEntry: AppliedEntry;
  redFlag: RedFlagResult | null;
  nextTreeId: string | null;
  nextNode: TreeNode | null;
  historyComplete: boolean;
}

export function advance(input: AdvanceInput): AdvanceResult {
  const tree = getTree(input.currentTreeId);
  const node = findNode(tree, input.currentNodeId);

  let nextNodeIdInTree: string | null;
  let redFlag: RedFlagResult | null = null;
  let entryLabel: string;
  let entryValue: string;

  if (node.type === 'SINGLE_SELECT' || node.type === 'BOOLEAN') {
    const chosen = String(input.answerValue ?? '');
    const option = node.options?.find((o) => o.value === chosen || o.value.toLowerCase() === chosen.toLowerCase())
      ?? node.options?.find((o) => chosen.toLowerCase().includes(o.value.toLowerCase()) || o.value.toLowerCase().includes(chosen.toLowerCase()))
      ?? node.options?.[0];
    if (!option) throw new Error(`No options available for node "${node.id}"`);
    nextNodeIdInTree = option.next;
    redFlag = checkRedFlag({ selectedOptionFlagged: option.redFlag === true });
    entryLabel = node.questionText.en;
    entryValue = option.label.en;
  } else if (node.type === 'MULTI_SELECT') {
    const chosenValues = Array.isArray(input.answerValue) ? input.answerValue.map(String) : [String(input.answerValue)];
    const chosenOptions = (node.options ?? []).filter((o) => chosenValues.includes(o.value));
    nextNodeIdInTree = node.next ?? null;
    redFlag = checkRedFlag({ selectedOptionFlagged: chosenOptions.some((o) => o.redFlag) });
    entryLabel = node.questionText.en;
    entryValue = chosenOptions.map((o) => o.label.en).join(', ') || chosenValues.join(', ');
  } else {
    // TEXT or SCALE
    const text = String(input.answerValue ?? '');
    nextNodeIdInTree = node.next ?? null;
    redFlag = checkRedFlag({ freeText: text });
    entryLabel = node.questionText.en;
    entryValue = text;
  }

  const appliedEntry: AppliedEntry =
    node.section === 'ayush'
      ? { section: node.section, ayushField: node.ayushField, label: entryLabel, value: entryValue }
      : { section: node.section, label: entryLabel, value: entryValue };

  // Resolve what comes next: either another node in this tree, the next tree in the
  // sequence, or the end of the whole history.
  const sequence = getTreeSequence(input.chiefComplaintCategory, input.mode);
  if (nextNodeIdInTree) {
    return {
      appliedEntry,
      redFlag,
      nextTreeId: input.currentTreeId,
      nextNode: findNode(tree, nextNodeIdInTree),
      historyComplete: false,
    };
  }

  const currentIndex = sequence.indexOf(input.currentTreeId);
  const nextTreeId = sequence[currentIndex + 1];
  if (!nextTreeId) {
    return { appliedEntry, redFlag, nextTreeId: null, nextNode: null, historyComplete: true };
  }

  const nextTree = getTree(nextTreeId);
  return {
    appliedEntry,
    redFlag,
    nextTreeId,
    nextNode: findNode(nextTree, nextTree.entryNodeId),
    historyComplete: false,
  };
}

export type { TreeNode, ClinicalTree } from './types.js';
