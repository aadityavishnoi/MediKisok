import { BrowserSpeechToText, BrowserTextToSpeech } from '@medikiosk/ai-service';
import type { Language } from '@medikiosk/shared-types';

export const speechToText = new BrowserSpeechToText();
export const textToSpeech = new BrowserTextToSpeech();

export function toSpeechLang(language: Language | string): string {
  const map: Record<string, string> = {
    EN: 'en-IN',
    HI: 'hi-IN',
    BN: 'bn-IN',
    MR: 'mr-IN',
    TE: 'te-IN',
    TA: 'ta-IN',
    GU: 'gu-IN',
    KN: 'kn-IN',
    ML: 'ml-IN',
    PA: 'pa-IN',
    OR: 'or-IN',
    AS: 'as-IN',
    UR: 'ur-IN',
  };
  return map[language] || 'en-IN';
}

