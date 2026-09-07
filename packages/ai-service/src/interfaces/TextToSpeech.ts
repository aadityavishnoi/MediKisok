export interface TextToSpeech {
  isSupported(): boolean;
  speak(text: string, options?: { lang?: string; onEnd?: () => void }): void;
  cancel(): void;
}

