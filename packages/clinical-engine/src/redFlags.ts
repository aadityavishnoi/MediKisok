import type { LocalizedText } from '@medikiosk/shared-types';
import { AlertSeverity } from '@medikiosk/shared-types';

export interface RedFlagPattern {
  id: string;
  severity: AlertSeverity;
  keywords: RegExp[];
  message: LocalizedText;
}

const GENERIC_MESSAGE: LocalizedText = {
  en: 'Potential emergency symptoms detected. Please contact hospital staff immediately.',
  hi: 'संभावित आपातकालीन लक्षण मिले हैं। कृपया तुरंत अस्पताल के कर्मचारियों से संपर्क करें।',
};

/**
 * Single shared registry for free-text answers. This never diagnoses - it only flags
 * wording that warrants immediate staff attention. Checked against EVERY answer
 * regardless of which tree/node produced it (see engine.ts advance()).
 */
export const RED_FLAG_REGISTRY: RedFlagPattern[] = [
  {
    id: 'SEVERE_CHEST_PAIN',
    severity: AlertSeverity.CRITICAL,
    keywords: [/severe chest pain/i, /crushing chest pain/i, /chest pain.*(9\/10|10\/10)/i],
    message: GENERIC_MESSAGE,
  },
  {
    id: 'BREATHING_DIFFICULTY',
    severity: AlertSeverity.CRITICAL,
    keywords: [/can'?t breathe/i, /unable to breathe/i, /gasping for (air|breath)/i, /severe (shortness of breath|breathlessness)/i],
    message: GENERIC_MESSAGE,
  },
  {
    id: 'STROKE_SIGNS',
    severity: AlertSeverity.CRITICAL,
    keywords: [/face (is )?droop/i, /slurred speech/i, /weak(ness)? on one side/i, /sudden numbness/i, /can'?t speak/i],
    message: GENERIC_MESSAGE,
  },
  {
    id: 'LOSS_OF_CONSCIOUSNESS',
    severity: AlertSeverity.CRITICAL,
    keywords: [/fainted/i, /passed out/i, /unconscious/i, /loss of consciousness/i, /blacked out/i],
    message: GENERIC_MESSAGE,
  },
  {
    id: 'SEVERE_BLEEDING',
    severity: AlertSeverity.CRITICAL,
    keywords: [/heavy bleeding/i, /won'?t stop bleeding/i, /severe bleeding/i, /bleeding a lot/i],
    message: GENERIC_MESSAGE,
  },
];

export interface RedFlagResult {
  severity: AlertSeverity;
  message: LocalizedText;
  triggerType: string;
}

export interface RedFlagCheckInput {
  /** Free text to scan against the keyword registry (TEXT-type answers). */
  freeText?: string;
  /** True when the patient selected an option the tree author explicitly marked urgent. */
  selectedOptionFlagged?: boolean;
}

/**
 * Never diagnoses - only flags wording/choices that warrant immediate staff attention.
 * Select-type flags come from the tree author's explicit `redFlag: true` on an option
 * (deterministic); free-text flags come from this shared keyword registry.
 */
export function checkRedFlag(input: RedFlagCheckInput): RedFlagResult | null {
  if (input.selectedOptionFlagged) {
    return { severity: AlertSeverity.HIGH, message: GENERIC_MESSAGE, triggerType: 'OPTION_FLAGGED' };
  }

  if (input.freeText) {
    for (const pattern of RED_FLAG_REGISTRY) {
      if (pattern.keywords.some((rx) => rx.test(input.freeText!))) {
        return { severity: pattern.severity, message: pattern.message, triggerType: pattern.id };
      }
    }
  }

  return null;
}
