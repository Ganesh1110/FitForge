import { Audio } from 'expo-av';

let beepSound: Audio.Sound | null = null;
let chimeSound: Audio.Sound | null = null;
let restSound: Audio.Sound | null = null;

export async function initAudio() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  } catch (err) {
    console.warn('Audio mode setup failed:', err);
  }
}

export async function playCountdownBeep() {
  try {
    if (!beepSound) {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/beep.wav')
      );
      beepSound = sound;
    } else {
      await beepSound.replayAsync();
      return;
    }
    await beepSound.playAsync();
  } catch (err) {
    console.warn('Could not play beep:', err);
  }
}

export async function playChime() {
  try {
    if (!chimeSound) {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/chime.wav')
      );
      chimeSound = sound;
    } else {
      await chimeSound.replayAsync();
      return;
    }
    await chimeSound.playAsync();
  } catch (err) {
    console.warn('Could not play chime:', err);
  }
}

export async function playRestChime() {
  try {
    if (!restSound) {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/rest.wav')
      );
      restSound = sound;
    } else {
      await restSound.replayAsync();
      return;
    }
    await restSound.playAsync();
  } catch (err) {
    console.warn('Could not play rest sound:', err);
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
  } catch (err) {
    console.warn('Error unloading sounds:', err);
  }
}
