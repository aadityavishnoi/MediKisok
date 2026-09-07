import type { SpeechToText, SpeechToTextResult } from '../interfaces/SpeechToText.js';

// The Web Speech API isn't in TS's standard DOM lib yet - minimal shape for what we use.
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition as any) ?? (w.webkitSpeechRecognition as any) ?? null;
}

/**
 * Real, client-side speech recognition via the browser's Web Speech API. Not available in
 * every browser (notably Firefox) - callers MUST check isSupported() and fall back to
 * touch input rather than assume this works, per the kiosk's accessibility requirements.
 */
export class BrowserSpeechToText implements SpeechToText {
  private recognition: SpeechRecognitionLike | null = null;

  isSupported(): boolean {
    return getRecognitionCtor() !== null;
  }

  listen(options?: { lang?: string }): Promise<SpeechToTextResult> {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      return Promise.reject(new Error('Speech recognition is not supported in this browser'));
    }

    return new Promise((resolve, reject) => {
      const recognition = new Ctor();
      this.recognition = recognition;
      recognition.lang = options?.lang ?? 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript ?? '';
        resolve({ transcript, origin: 'REAL' });
      };
      recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error ?? 'unknown'}`));
      };
      recognition.onend = () => {
        this.recognition = null;
      };

      recognition.start();
    });
  }

  stop(): void {
    this.recognition?.stop();
    this.recognition = null;
  }
}
