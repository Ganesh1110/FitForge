export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  voice?: string;
  language?: string;
}

let speechModule: any = null;
let isSpeechChecked = false;

function getSpeechModule() {
  if (isSpeechChecked) return speechModule;
  isSpeechChecked = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    speechModule = require('expo-speech');
  } catch {
    speechModule = null;
  }
  return speechModule;
}

export function speak(text: string, options?: SpeechOptions) {
  try {
    const Speech = getSpeechModule();
    if (!Speech) return;

    Speech.stop?.();
    Speech.speak?.(text, {
      rate: options?.rate ?? 1.0,
      pitch: options?.pitch ?? 1.0,
      language: options?.language ?? 'en-US',
      ...options,
    });
  } catch (error) {
    console.warn('Speech synthesis non-critical error:', error);
  }
}

export function stopSpeech() {
  try {
    const Speech = getSpeechModule();
    Speech?.stop?.();
  } catch {
    // Non-critical
  }
}
