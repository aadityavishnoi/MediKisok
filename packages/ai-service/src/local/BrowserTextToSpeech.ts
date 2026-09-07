import type { TextToSpeech } from '../interfaces/TextToSpeech.js';

// Declare the ResponsiveVoice global (loaded from CDN in index.html)
declare const responsiveVoice: {
  speak(text: string, voice: string, params?: { rate?: number; pitch?: number; volume?: number; onend?: () => void; onerror?: () => void }): void;
  cancel(): void;
  isPlaying(): boolean;
  voiceSupport(): boolean;
} | undefined;

/**
 * ResponsiveVoice name map for all 13 MediKiosk supported Indian languages.
 * ResponsiveVoice provides consistent, high-quality TTS via its cloud & browser hybrid engine.
 */
const RV_VOICE_MAP: Record<string, string> = {
  'en-IN': 'Hindi Female',        // Used as Indian English with ResponsiveVoice
  'hi-IN': 'Hindi Female',
  'bn-IN': 'Bengali Female',
  'mr-IN': 'Marathi Female',
  'te-IN': 'Telugu Female',
  'ta-IN': 'Tamil Female',
  'gu-IN': 'Gujarati Female',
  'kn-IN': 'Kannada Female',
  'ml-IN': 'Malayalam Female',
  'pa-IN': 'Punjabi Female',
  'or-IN': 'Odia Female',
  'as-IN': 'Bengali Female',      // Assamese closest approximation
  'ur-IN': 'Urdu Female',
};

/** Real, client-side speech synthesis.
 *  Strategy: ResponsiveVoice (primary) → Web Speech API (fallback) */
export class BrowserTextToSpeech implements TextToSpeech {
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      (typeof responsiveVoice !== 'undefined' || 'speechSynthesis' in window)
    );
  }

  speak(text: string, options?: { lang?: string; onEnd?: () => void }): void {
    if (typeof window === 'undefined') return;

    const targetLang = options?.lang ?? 'en-IN';
    const onEnd = options?.onEnd;

    // --- Primary: ResponsiveVoice ---
    if (typeof responsiveVoice !== 'undefined') {
      try {
        responsiveVoice.cancel();
        const voice = RV_VOICE_MAP[targetLang] ?? 'Hindi Female';
        responsiveVoice.speak(text, voice, {
          rate: 0.9,
          pitch: 1,
          volume: 1,
          onend: onEnd,
          onerror: onEnd,
        });
        return;
      } catch (err) {
        console.warn('ResponsiveVoice failed, falling back to Web Speech API:', err);
      }
    }

    // --- Fallback: Web Speech API ---
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    const doSpeak = (voices: SpeechSynthesisVoice[]) => {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = targetLang;

        if (voices.length > 0) {
          const langPrefix = targetLang.split('-')[0].toLowerCase();
          const matched =
            voices.find((v) => v.lang.toLowerCase() === targetLang.toLowerCase()) ??
            voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
          if (matched) utterance.voice = matched;
        }

        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        if (onEnd) {
          utterance.onend = onEnd;
          utterance.onerror = () => onEnd?.();
        }
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Web Speech API also failed:', err);
        onEnd?.();
      }
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      doSpeak(voices);
    } else {
      let fired = false;
      const onVoicesChanged = () => {
        if (fired) return;
        fired = true;
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        doSpeak(window.speechSynthesis.getVoices());
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      setTimeout(() => {
        if (!fired) {
          fired = true;
          window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
          doSpeak(window.speechSynthesis.getVoices());
        }
      }, 350);
    }
  }

  cancel(): void {
    try {
      if (typeof responsiveVoice !== 'undefined') responsiveVoice.cancel();
    } catch (_) {}
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (_) {}
  }
}

