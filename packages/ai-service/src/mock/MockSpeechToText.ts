import type { SpeechToText, SpeechToTextResult } from '../interfaces/SpeechToText.js';

/** For automated tests only - never silently substituted for real voice input in the UI. */
export class MockSpeechToText implements SpeechToText {
  constructor(private readonly cannedTranscript: string = 'This is a test transcript') {}

  isSupported(): boolean {
    return true;
  }

  async listen(): Promise<SpeechToTextResult> {
    return { transcript: this.cannedTranscript, origin: 'MOCK' };
  }

  stop(): void {
    // no-op
  }
}
