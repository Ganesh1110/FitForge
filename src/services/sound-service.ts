import { NativeModules, Platform } from 'react-native';

type SoundPlayer = {
  replayAsync: () => Promise<any>;
  playAsync: () => Promise<any>;
  unloadAsync: () => Promise<any>;
};

let audioModule: any = null;
let isAudioChecked = false;
let isNativeAudioSupported = false;

let beepSound: SoundPlayer | null = null;
let chimeSound: SoundPlayer | null = null;
let restSound: SoundPlayer | null = null;

// Web Audio API context for web / fallback synth
let webAudioCtx: any = null;

function getWebAudioContext() {
  if (Platform.OS !== 'web') return null;
  if (!webAudioCtx && typeof window !== 'undefined') {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      webAudioCtx = new AudioCtx();
    }
  }
  return webAudioCtx;
}

function playWebTone(frequency: number, duration: number, type: any = 'sine') {
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Non-critical fallback
  }
}

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

function getAudioModule() {
  if (isAudioChecked) {
    return isNativeAudioSupported ? audioModule : null;
  }
  isAudioChecked = true;

  // Crucial: check if ExponentAV native binary is present in the app binary before requiring
  // (Prevents requireNativeModule fatal exception in Expo Go)
  if (!isNativeModuleAvailable('ExponentAV')) {
    isNativeAudioSupported = false;
    audioModule = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const av = require('expo-av');
    if (av && av.Audio) {
      audioModule = av.Audio;
      isNativeAudioSupported = true;
    }
  } catch {
    isNativeAudioSupported = false;
    audioModule = null;
  }

  return isNativeAudioSupported ? audioModule : null;
}

export async function initAudio() {
  try {
    const Audio = getAudioModule();
    if (Audio?.setAudioModeAsync) {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    }
  } catch {
    // Silently continue in environments where native audio is omitted
  }
}

export async function playCountdownBeep() {
  if (Platform.OS === 'web') {
    playWebTone(880, 0.15, 'sine');
    return;
  }

  try {
    const Audio = getAudioModule();
    if (!Audio) return;

    if (!beepSound) {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/beep.wav')
      );
      beepSound = sound;
    } else {
      await beepSound.replayAsync();
      return;
    }
    await beepSound?.playAsync();
  } catch {
    // Audio playback error
  }
}

export async function playChime() {
  if (Platform.OS === 'web') {
    playWebTone(523.25, 0.5, 'triangle');
    setTimeout(() => playWebTone(659.25, 0.5, 'triangle'), 100);
    setTimeout(() => playWebTone(783.99, 0.7, 'triangle'), 200);
    return;
  }

  try {
    const Audio = getAudioModule();
    if (!Audio) return;

    if (!chimeSound) {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/chime.wav')
      );
      chimeSound = sound;
    } else {
      await chimeSound.replayAsync();
      return;
    }
    await chimeSound?.playAsync();
  } catch {
    // Audio playback error
  }
}

export async function playRestChime() {
  if (Platform.OS === 'web') {
    playWebTone(440, 0.4, 'sine');
    return;
  }

  try {
    const Audio = getAudioModule();
    if (!Audio) return;

    if (!restSound) {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/rest.wav')
      );
      restSound = sound;
    } else {
      await restSound.replayAsync();
      return;
    }
    await restSound?.playAsync();
  } catch {
    // Audio playback error
  }
}

export async function unloadAudio() {
  try {
    if (beepSound) await beepSound.unloadAsync();
    if (chimeSound) await chimeSound.unloadAsync();
    if (restSound) await restSound.unloadAsync();
    beepSound = null;
    chimeSound = null;
    restSound = null;
  } catch {
    // Ignore unload error
  }
}
