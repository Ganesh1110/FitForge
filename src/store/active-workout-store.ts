import { create } from 'zustand';
import { GeneratedWorkoutPlan } from '@/ai/types';
import { getDatabase } from '@/db/database';
import { playChime, playCountdownBeep, playRestChime } from '@/services/sound-service';
import { speak } from '@/services/speech-service';

export type WorkoutPhase = 'prepare' | 'work' | 'rest' | 'complete';

export interface SetLogRecord {
  exerciseId: string;
  setIndex: number;
  repsCompleted: number;
  weightKg?: number;
}

interface ActiveWorkoutState {
  isActive: boolean;
  plan: GeneratedWorkoutPlan | null;
  currentExerciseIndex: number;
  currentSetIndex: number; // 1-based (e.g., Set 1 of 3)
  phase: WorkoutPhase;
  timeRemainingSeconds: number;
  phaseDurationSeconds: number;
  targetEndTime: number; // Date.now() + remainingMs (drift-safe)
  isPaused: boolean;
  elapsedTotalSeconds: number;
  completedSets: SetLogRecord[];

  // Actions
  startWorkout: (plan: GeneratedWorkoutPlan) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  tick: () => void;
  markSetCompleted: () => void;
  skipPhaseOrExercise: () => void;
  previousExercise: () => void;
  exitWorkout: () => void;
  finishAndSaveWorkout: () => Promise<void>;
}

const PREPARE_DURATION_SECONDS = 5;

export const useActiveWorkoutStore = create<ActiveWorkoutState>()((set, get) => ({
  isActive: false,
  plan: null,
  currentExerciseIndex: 0,
  currentSetIndex: 1,
  phase: 'prepare',
  timeRemainingSeconds: PREPARE_DURATION_SECONDS,
  phaseDurationSeconds: PREPARE_DURATION_SECONDS,
  targetEndTime: Date.now() + PREPARE_DURATION_SECONDS * 1000,
  isPaused: false,
  elapsedTotalSeconds: 0,
  completedSets: [],

  startWorkout: (plan) => {
    const targetEnd = Date.now() + PREPARE_DURATION_SECONDS * 1000;
    set({
      isActive: true,
      plan,
      currentExerciseIndex: 0,
      currentSetIndex: 1,
      phase: 'prepare',
      timeRemainingSeconds: PREPARE_DURATION_SECONDS,
      phaseDurationSeconds: PREPARE_DURATION_SECONDS,
      targetEndTime: targetEnd,
      isPaused: false,
      elapsedTotalSeconds: 0,
      completedSets: [],
    });

    const firstEx = plan.exercises[0];
    playChime();
    speak(`Workout starting in 5 seconds. First up: ${firstEx?.exerciseName || 'First Exercise'}.`);
  },

  pauseWorkout: () => {
    set({ isPaused: true });
    speak('Workout paused.');
  },

  resumeWorkout: () => {
    const state = get();
    const newTargetEnd = Date.now() + state.timeRemainingSeconds * 1000;
    set({
      isPaused: false,
      targetEndTime: newTargetEnd,
    });
    speak('Resuming.');
  },

  tick: () => {
    const state = get();
    if (!state.isActive || state.isPaused || state.phase === 'complete') return;

    // Total elapsed time
    const newTotal = state.elapsedTotalSeconds + 1;

    // Drift-safe remaining calculation
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((state.targetEndTime - now) / 1000));

    // Audio countdown cues at 3, 2, 1
    if (remaining === 3) {
      playCountdownBeep();
      speak('3');
    } else if (remaining === 2) {
      playCountdownBeep();
      speak('2');
    } else if (remaining === 1) {
      playCountdownBeep();
      speak('1');
    }

    if (remaining <= 0) {
      // Auto-transition when timer runs out
      get().markSetCompleted();
    } else {
      set({
        timeRemainingSeconds: remaining,
        elapsedTotalSeconds: newTotal,
      });
    }
  },

  markSetCompleted: () => {
    const state = get();
    if (!state.plan) return;

    const currentEx = state.plan.exercises[state.currentExerciseIndex];
    if (!currentEx) return;

    // If currently preparing, move to WORK phase
    if (state.phase === 'prepare') {
      const workDuration = currentEx.exerciseId.includes('plank') ? currentEx.reps : 45;
      const targetEnd = Date.now() + workDuration * 1000;

      set({
        phase: 'work',
        timeRemainingSeconds: workDuration,
        phaseDurationSeconds: workDuration,
        targetEndTime: targetEnd,
      });

      playChime();
      speak(`Go! ${currentEx.exerciseName}. Set ${state.currentSetIndex} of ${currentEx.sets}.`);
      return;
    }

    // If currently working, log set and move to REST or next set
    if (state.phase === 'work') {
      const newRecord: SetLogRecord = {
        exerciseId: currentEx.exerciseId,
        setIndex: state.currentSetIndex,
        repsCompleted: currentEx.reps,
      };

      const isLastSet = state.currentSetIndex >= currentEx.sets;
      const isLastExercise = state.currentExerciseIndex >= state.plan.exercises.length - 1;

      if (isLastSet && isLastExercise) {
        // Complete workout!
        set({
          phase: 'complete',
          completedSets: [...state.completedSets, newRecord],
        });
        playChime();
        speak('Workout complete! Outstanding effort!');
        get().finishAndSaveWorkout();
        return;
      }

      // Transition to REST
      const restDuration = currentEx.restSeconds || 45;
      const targetEnd = Date.now() + restDuration * 1000;

      const nextExercise = isLastSet
        ? state.plan.exercises[state.currentExerciseIndex + 1]
        : currentEx;

      set({
        phase: 'rest',
        timeRemainingSeconds: restDuration,
        phaseDurationSeconds: restDuration,
        targetEndTime: targetEnd,
        completedSets: [...state.completedSets, newRecord],
      });

      playRestChime();
      const nextCue = isLastSet
        ? `Rest for ${restDuration} seconds. Next up: ${nextExercise?.exerciseName}.`
        : `Rest for ${restDuration} seconds. Next is set ${state.currentSetIndex + 1}.`;
      speak(nextCue);
      return;
    }

    // If currently resting, move to WORK (either next set or next exercise)
    if (state.phase === 'rest') {
      const isLastSet = state.currentSetIndex >= currentEx.sets;

      let nextExIndex = state.currentExerciseIndex;
      let nextSetIndex = state.currentSetIndex + 1;

      if (isLastSet) {
        nextExIndex = state.currentExerciseIndex + 1;
        nextSetIndex = 1;
      }

      const nextEx = state.plan.exercises[nextExIndex];
      if (!nextEx) {
        set({ phase: 'complete' });
        return;
      }

      const workDuration = nextEx.exerciseId.includes('plank') ? nextEx.reps : 45;
      const targetEnd = Date.now() + workDuration * 1000;

      set({
        currentExerciseIndex: nextExIndex,
        currentSetIndex: nextSetIndex,
        phase: 'work',
        timeRemainingSeconds: workDuration,
        phaseDurationSeconds: workDuration,
        targetEndTime: targetEnd,
      });

      playChime();
      speak(`Set ${nextSetIndex}: ${nextEx.exerciseName}.`);
    }
  },

  skipPhaseOrExercise: () => {
    get().markSetCompleted();
  },

  previousExercise: () => {
    const state = get();
    if (!state.plan || state.currentExerciseIndex <= 0) return;

    const prevIndex = state.currentExerciseIndex - 1;
    const prevEx = state.plan.exercises[prevIndex];
    const workDuration = prevEx.exerciseId.includes('plank') ? prevEx.reps : 45;

    set({
      currentExerciseIndex: prevIndex,
      currentSetIndex: 1,
      phase: 'work',
      timeRemainingSeconds: workDuration,
      phaseDurationSeconds: workDuration,
      targetEndTime: Date.now() + workDuration * 1000,
    });

    playCountdownBeep();
    speak(`Back to ${prevEx.exerciseName}.`);
  },

  exitWorkout: () => {
    set({
      isActive: false,
      plan: null,
      phase: 'complete',
    });
  },

  finishAndSaveWorkout: async () => {
    const state = get();
    if (!state.plan) return;

    try {
      const db = await getDatabase();
      const logId = `log-${Date.now()}`;
      const now = new Date().toISOString();
      const totalMinutes = Math.max(1, Math.round(state.elapsedTotalSeconds / 60));
      const caloriesBurned = Math.round(totalMinutes * 7.5); // ~7.5 kcal/min home circuit

      await db.runAsync(
        `INSERT INTO workout_logs (id, workout_id, started_at, completed_at, total_duration_seconds, calories_burned)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          logId,
          state.plan.id,
          now,
          now,
          state.elapsedTotalSeconds,
          caloriesBurned,
        ]
      );
    } catch (e) {
      console.warn('Failed to log completed workout:', e);
    }
  },
}));
