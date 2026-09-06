import type { TextToSpeech } from '../interfaces/TextToSpeech.js';

/** Real, client-side speech synthesis via the browser's speechSynthesis API. */
export class BrowserTextToSpeech implements TextToSpeech {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  speak(text: string, options?: { lang?: 'en-IN' | 'hi-IN' }): void {
    if (!this.isSupported()) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options?.lang ?? 'en-IN';
    window.speechSynthesis.speak(utterance);
  }

  cancel(): void {
    if (this.isSupported()) window.speechSynthesis.cancel();
  }
}
