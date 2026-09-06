export interface TextToSpeech {
  isSupported(): boolean;
  speak(text: string, options?: { lang?: 'en-IN' | 'hi-IN'; onEnd?: () => void }): void;
  cancel(): void;
}
