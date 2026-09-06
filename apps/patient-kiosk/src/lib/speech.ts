import { BrowserSpeechToText, BrowserTextToSpeech } from '@medikiosk/ai-service';
import type { Language } from '@medikiosk/shared-types';

export const speechToText = new BrowserSpeechToText();
export const textToSpeech = new BrowserTextToSpeech();

export function toSpeechLang(language: Language): 'en-IN' | 'hi-IN' {
  return language === 'HI' ? 'hi-IN' : 'en-IN';
}
