import * as Speech from 'expo-speech';

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  voice?: string;
  language?: string;
}

export function speak(text: string, options?: SpeechOptions) {
  try {
    Speech.stop();
    Speech.speak(text, {
      rate: options?.rate ?? 1.0,
      pitch: options?.pitch ?? 1.0,
      language: options?.language ?? 'en-US',
      ...options,
    });
  } catch (error) {
    console.warn('Speech synthesis failed:', error);
  }
}

export function stopSpeech() {
  try {
    Speech.stop();
  } catch (error) {
    console.warn('Speech stop failed:', error);
  }
}
