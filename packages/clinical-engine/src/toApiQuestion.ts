import type { HistoryQuestion } from '@medikiosk/shared-types';
import type { TreeNode } from './types.js';

export function toApiQuestion(node: TreeNode): HistoryQuestion {
  return {
    nodeId: node.id,
    section: node.section,
    type: node.type,
    questionText: node.questionText,
    options: node.options ? node.options.map((o) => ({ value: o.value, label: o.label })) : null,
  };
}
