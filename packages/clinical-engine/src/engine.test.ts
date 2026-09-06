import { describe, expect, it } from 'vitest';
import { Mode } from '@medikiosk/shared-types';
import { advance, getTreeSequence, startHistory } from './engine.js';
import { checkRedFlag } from './redFlags.js';

describe('startHistory', () => {
  it('sets the chief complaint text for a known category', () => {
    const result = startHistory('chest-pain', Mode.GENERAL);
    expect(result.treeId).toBe('chest-pain');
    expect(result.node.id).toBe('cp-1');
    expect(result.chiefComplaintText).toBe('Chest pain');
  });

  it('leaves chief complaint unset for general-fallback (asked as free text instead)', () => {
    const result = startHistory('general-fallback', Mode.GENERAL);
    expect(result.node.id).toBe('gf-1');
    expect(result.node.section).toBe('chiefComplaint');
    expect(result.chiefComplaintText).toBeNull();
  });

  it('falls back to general-fallback for an unrecognized category', () => {
    const result = startHistory('not-a-real-category', Mode.GENERAL);
    expect(result.treeId).toBe('general-fallback');
  });
});

describe('getTreeSequence', () => {
  it('appends common-sections for GENERAL mode', () => {
    expect(getTreeSequence('fever', Mode.GENERAL)).toEqual(['fever', 'common-sections']);
  });

  it('appends ayush-assessment after common-sections for AYUSH mode', () => {
    expect(getTreeSequence('fever', Mode.AYUSH)).toEqual(['fever', 'common-sections', 'ayush-assessment']);
  });
});

describe('advance - branching within a tree', () => {
  it('walks the chest-pain tree node by node to its end', () => {
    let result = advance({
      chiefComplaintCategory: 'chest-pain',
      mode: Mode.GENERAL,
      currentTreeId: 'chest-pain',
      currentNodeId: 'cp-1',
      answerValue: 'few_hours',
    });
    expect(result.nextNode?.id).toBe('cp-2');
    expect(result.historyComplete).toBe(false);

    result = advance({
      chiefComplaintCategory: 'chest-pain',
      mode: Mode.GENERAL,
      currentTreeId: 'chest-pain',
      currentNodeId: 'cp-2',
      answerValue: 'center',
    });
    expect(result.nextNode?.id).toBe('cp-3');
  });

  it('flags a red flag when a marked severe option is chosen, but still advances', () => {
    const result = advance({
      chiefComplaintCategory: 'chest-pain',
      mode: Mode.GENERAL,
      currentTreeId: 'chest-pain',
      currentNodeId: 'cp-4',
      answerValue: 'severe_7_10',
    });
    expect(result.redFlag).not.toBeNull();
    expect(result.redFlag?.triggerType).toBe('OPTION_FLAGGED');
    expect(result.nextNode?.id).toBe('cp-5');
    expect(result.historyComplete).toBe(false);
  });

  it('does not flag a red flag for a mild option', () => {
    const result = advance({
      chiefComplaintCategory: 'chest-pain',
      mode: Mode.GENERAL,
      currentTreeId: 'chest-pain',
      currentNodeId: 'cp-4',
      answerValue: 'mild_1_3',
    });
    expect(result.redFlag).toBeNull();
  });

  it('flags red flag from a multi-select option and records all chosen labels', () => {
    const result = advance({
      chiefComplaintCategory: 'chest-pain',
      mode: Mode.GENERAL,
      currentTreeId: 'chest-pain',
      currentNodeId: 'cp-6',
      answerValue: ['shortness_of_breath', 'sweating'],
    });
    expect(result.redFlag).not.toBeNull();
    expect(result.appliedEntry.value).toContain('Shortness of breath');
    expect(result.appliedEntry.value).toContain('Sweating');
  });
});

describe('advance - crossing into the next tree', () => {
  it('moves from chest-pain into common-sections once the tree ends', () => {
    const result = advance({
      chiefComplaintCategory: 'chest-pain',
      mode: Mode.GENERAL,
      currentTreeId: 'chest-pain',
      currentNodeId: 'cp-6',
      answerValue: ['none'],
    });
    expect(result.nextTreeId).toBe('common-sections');
    expect(result.nextNode?.id).toBe('cs-1');
    expect(result.historyComplete).toBe(false);
  });

  it('moves from common-sections into ayush-assessment when mode is AYUSH', () => {
    const result = advance({
      chiefComplaintCategory: 'fever',
      mode: Mode.AYUSH,
      currentTreeId: 'common-sections',
      currentNodeId: 'cs-8',
      answerValue: 'None',
    });
    expect(result.nextTreeId).toBe('ayush-assessment');
    expect(result.nextNode?.id).toBe('ay-1');
  });

  it('completes the history after common-sections when mode is GENERAL', () => {
    const result = advance({
      chiefComplaintCategory: 'fever',
      mode: Mode.GENERAL,
      currentTreeId: 'common-sections',
      currentNodeId: 'cs-8',
      answerValue: 'None',
    });
    expect(result.nextTreeId).toBeNull();
    expect(result.historyComplete).toBe(true);
  });

  it('completes the history after the ayush tree finishes', () => {
    const result = advance({
      chiefComplaintCategory: 'fever',
      mode: Mode.AYUSH,
      currentTreeId: 'ayush-assessment',
      currentNodeId: 'ay-11',
      answerValue: 'Vegetarian, walks daily',
    });
    expect(result.historyComplete).toBe(true);
  });

  it('writes AYUSH answers into the correct ayushField', () => {
    const result = advance({
      chiefComplaintCategory: 'fever',
      mode: Mode.AYUSH,
      currentTreeId: 'ayush-assessment',
      currentNodeId: 'ay-1',
      answerValue: 'pitta',
    });
    expect(result.appliedEntry.section).toBe('ayush');
    expect(result.appliedEntry.ayushField).toBe('Prakriti');
    expect(result.appliedEntry.value).toBe('Pitta');
  });
});

describe('advance - general-fallback free text', () => {
  it('sets chiefComplaint from the first free-text answer', () => {
    const result = advance({
      chiefComplaintCategory: 'general-fallback',
      mode: Mode.GENERAL,
      currentTreeId: 'general-fallback',
      currentNodeId: 'gf-1',
      answerValue: 'My knee has been hurting for a week',
    });
    expect(result.appliedEntry.section).toBe('chiefComplaint');
    expect(result.appliedEntry.value).toBe('My knee has been hurting for a week');
    expect(result.nextNode?.id).toBe('gf-2');
  });

  it('detects a red flag from free text via the shared keyword registry', () => {
    const result = advance({
      chiefComplaintCategory: 'general-fallback',
      mode: Mode.GENERAL,
      currentTreeId: 'general-fallback',
      currentNodeId: 'gf-4',
      answerValue: 'I briefly fainted after the pain started',
    });
    expect(result.redFlag).not.toBeNull();
    expect(result.redFlag?.triggerType).toBe('LOSS_OF_CONSCIOUSNESS');
  });
});

describe('checkRedFlag registry', () => {
  it('matches severe chest pain phrasing', () => {
    expect(checkRedFlag({ freeText: 'I have severe chest pain right now' })?.triggerType).toBe('SEVERE_CHEST_PAIN');
  });

  it('matches breathing difficulty phrasing', () => {
    expect(checkRedFlag({ freeText: "I can't breathe properly" })?.triggerType).toBe('BREATHING_DIFFICULTY');
  });

  it('matches stroke sign phrasing', () => {
    expect(checkRedFlag({ freeText: 'My face is drooping on one side' })?.triggerType).toBe('STROKE_SIGNS');
  });

  it('matches severe bleeding phrasing', () => {
    expect(checkRedFlag({ freeText: 'There is heavy bleeding from the wound' })?.triggerType).toBe('SEVERE_BLEEDING');
  });

  it('returns null for ordinary text', () => {
    expect(checkRedFlag({ freeText: 'I have a mild headache since this morning' })).toBeNull();
  });
});
