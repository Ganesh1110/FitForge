import { NativeModules, Platform } from 'react-native';

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  voice?: string;
  language?: string;
}

let speechModule: any = null;
let isSpeechChecked = false;

function isNativeModuleAvailable(moduleName: string): boolean {
  if (Platform.OS === 'web') return false;
  try {
    const expoModules = (globalThis as any).expo?.modules;
    if (expoModules && expoModules[moduleName]) {
      return true;
    }
    if (NativeModules && NativeModules[moduleName]) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

function getSpeechModule() {
  if (isSpeechChecked) return speechModule;
  isSpeechChecked = true;

  if (Platform.OS !== 'web' && !isNativeModuleAvailable('ExpoSpeech')) {
    speechModule = null;
    return null;
  }

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
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate ?? 1.0;
      utterance.pitch = options?.pitch ?? 1.0;
      if (options?.language) utterance.lang = options.language;
      window.speechSynthesis.speak(utterance);
      return;
    }

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
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      return;
    }

    const Speech = getSpeechModule();
    Speech?.stop?.();
  } catch {
    // Non-critical
  }
}
