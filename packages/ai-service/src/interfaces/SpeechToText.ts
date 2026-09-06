export interface SpeechToTextResult {
  transcript: string;
  /** Which implementation actually produced this - always surfaced, never hidden from the UI. */
  origin: 'REAL' | 'MOCK';
}

export interface SpeechToText {
  /** Real, synchronous feature detection - never assume voice works everywhere. */
  isSupported(): boolean;
  listen(options?: { lang?: 'en-IN' | 'hi-IN' }): Promise<SpeechToTextResult>;
  stop(): void;
}
