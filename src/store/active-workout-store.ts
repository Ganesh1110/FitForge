import { create } from 'zustand';
import { GeneratedWorkoutPlan } from '@/ai/types';
import { getDatabase } from '@/db/database';
import { playChime, playCountdownBeep, playRestChime } from '@/services/sound-service';
import { speak } from '@/services/speech-service';
import { useUserStore } from '@/store/user-store';
import { recordMuscleTraining } from '@/services/recovery-service';
import { checkAndSavePR } from '@/services/pr-service';
import { SetType } from '@/db/schema';

export type WorkoutPhase = 'prepare' | 'work' | 'rest' | 'complete';

export interface SetLogRecord {
  exerciseId: string;
  setIndex: number;
  setType: SetType;
  repsCompleted: number;
  weightKg?: number;
  rpe?: number;
  isPR?: boolean;
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
  lastAnnouncedSecond: number | null; // Prevents duplicate speech countdowns
  workoutStartTime: number;
  pausedTotalMs: number;
  pauseStartTime: number | null;
  isPaused: boolean;
  elapsedTotalSeconds: number;
  completedSets: SetLogRecord[];

  // Real-time custom adjustments per set (openGym Pro style)
  currentSetWeightKg: number;
  currentSetReps: number;
  currentSetType: SetType;
  lastAchievedPRMessage: string | null;

  // Actions
  startWorkout: (plan: GeneratedWorkoutPlan) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  tick: () => void;
  setWeightAndReps: (weightKg: number, reps: number, setType?: SetType) => void;
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
  lastAnnouncedSecond: null,
  workoutStartTime: Date.now(),
  pausedTotalMs: 0,
  pauseStartTime: null,
  isPaused: false,
  elapsedTotalSeconds: 0,
  completedSets: [],

  currentSetWeightKg: 0,
  currentSetReps: 10,
  currentSetType: 'normal',
  lastAchievedPRMessage: null,

  startWorkout: (plan) => {
    const now = Date.now();
    const targetEnd = now + PREPARE_DURATION_SECONDS * 1000;
    const firstEx = plan.exercises[0];

    set({
      isActive: true,
      plan,
      currentExerciseIndex: 0,
      currentSetIndex: 1,
      phase: 'prepare',
      timeRemainingSeconds: PREPARE_DURATION_SECONDS,
      phaseDurationSeconds: PREPARE_DURATION_SECONDS,
      targetEndTime: targetEnd,
      lastAnnouncedSecond: null,
      workoutStartTime: now,
      pausedTotalMs: 0,
      pauseStartTime: null,
      isPaused: false,
      elapsedTotalSeconds: 0,
      completedSets: [],
      currentSetWeightKg: 0,
      currentSetReps: firstEx?.reps || 10,
      currentSetType: 'normal',
      lastAchievedPRMessage: null,
    });

    playChime();
    speak(`Workout starting in 5 seconds. First up: ${firstEx?.exerciseName || 'First Exercise'}.`);
  },

  setWeightAndReps: (weightKg, reps, setType = 'normal') => {
    set({
      currentSetWeightKg: weightKg,
      currentSetReps: reps,
      currentSetType: setType,
    });
  },

  pauseWorkout: () => {
    set({
      isPaused: true,
      pauseStartTime: Date.now(),
    });
    speak('Workout paused.');
  },

  resumeWorkout: () => {
    const state = get();
    const now = Date.now();
    const pauseDuration = state.pauseStartTime ? now - state.pauseStartTime : 0;
    const newPausedTotal = state.pausedTotalMs + pauseDuration;
    const newTargetEnd = now + state.timeRemainingSeconds * 1000;
    set({
      isPaused: false,
      pauseStartTime: null,
      pausedTotalMs: newPausedTotal,
      targetEndTime: newTargetEnd,
      lastAnnouncedSecond: null,
    });
    speak('Resuming.');
  },

  tick: () => {
    const state = get();
    if (!state.isActive || state.isPaused || state.phase === 'complete') return;

    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((state.targetEndTime - now) / 1000));
    const elapsed = Math.max(
      0,
      Math.floor((now - state.workoutStartTime - state.pausedTotalMs) / 1000)
    );

    // Audio countdown cues at 3, 2, 1 - only once per second!
    if (state.lastAnnouncedSecond !== remaining) {
      if (remaining === 3 || remaining === 2 || remaining === 1) {
        playCountdownBeep();
        speak(String(remaining));
      }
    }

    if (remaining <= 0) {
      get().markSetCompleted();
    } else {
      set({
        timeRemainingSeconds: remaining,
        elapsedTotalSeconds: elapsed,
        lastAnnouncedSecond: remaining,
      });
    }
  },

  markSetCompleted: async () => {
    const state = get();
    if (!state.plan) return;

    const currentEx = state.plan.exercises[state.currentExerciseIndex];
    if (!currentEx) return;

    // Transition from PREPARE to WORK
    if (state.phase === 'prepare') {
      const workDuration = currentEx.exerciseId.includes('plank') ? currentEx.reps : 45;
      const targetEnd = Date.now() + workDuration * 1000;

      set({
        phase: 'work',
        timeRemainingSeconds: workDuration,
        phaseDurationSeconds: workDuration,
        targetEndTime: targetEnd,
        lastAnnouncedSecond: null,
        currentSetReps: currentEx.reps,
      });

      playChime();
      speak(`Go! ${currentEx.exerciseName}. Set ${state.currentSetIndex} of ${currentEx.sets}.`);
      return;
    }

    // Transition from WORK to REST or COMPLETE
    if (state.phase === 'work') {
      // Check for PR
      let isPR = false;
      let prMsg: string | null = null;
      if (state.currentSetWeightKg > 0) {
        try {
          const prResult = await checkAndSavePR(
            currentEx.exerciseId,
            state.currentSetWeightKg,
            state.currentSetReps
          );
          if (prResult.isMaxWeightPR || prResult.isOneRepMaxPR) {
            isPR = true;
            prMsg = `New PR: ${state.currentSetWeightKg} kg × ${state.currentSetReps} reps!`;
          }
        } catch (e) {
          console.warn('PR check non-fatal error:', e);
        }
      }

      const newRecord: SetLogRecord = {
        exerciseId: currentEx.exerciseId,
        setIndex: state.currentSetIndex,
        setType: state.currentSetType,
        repsCompleted: state.currentSetReps,
        weightKg: state.currentSetWeightKg,
        isPR,
      };

      const isLastSet = state.currentSetIndex >= currentEx.sets;
      const isLastExercise = state.currentExerciseIndex >= state.plan.exercises.length - 1;

      if (isLastSet && isLastExercise) {
        // Complete workout!
        set({
          phase: 'complete',
          completedSets: [...state.completedSets, newRecord],
          lastAnnouncedSecond: null,
          lastAchievedPRMessage: prMsg,
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
        lastAnnouncedSecond: null,
        lastAchievedPRMessage: prMsg,
      });

      playRestChime();
      const nextCue = isLastSet
        ? `Rest for ${restDuration} seconds. Next up: ${nextExercise?.exerciseName}.`
        : `Rest for ${restDuration} seconds. Next is set ${state.currentSetIndex + 1}.`;
      speak(nextCue);
      return;
    }

    // Transition from REST to WORK
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
        set({ phase: 'complete', lastAnnouncedSecond: null });
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
        lastAnnouncedSecond: null,
        currentSetReps: nextEx.reps,
        currentSetType: 'normal',
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
      lastAnnouncedSecond: null,
      currentSetReps: prevEx.reps,
      currentSetType: 'normal',
    });

    playCountdownBeep();
    speak(`Back to ${prevEx.exerciseName}.`);
  },

  exitWorkout: () => {
    set({
      isActive: false,
      plan: null,
      phase: 'complete',
      lastAnnouncedSecond: null,
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

      const { weightKg } = useUserStore.getState();
      const userWeight = weightKg || 75;
      const caloriesBurned = Math.round(((6.0 * 3.5 * userWeight) / 200) * totalMinutes);

      // 1. Insert Workout Log
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

      // 2. Insert Logged Sets
      for (let i = 0; i < state.completedSets.length; i++) {
        const s = state.completedSets[i];
        await db.runAsync(
          `INSERT INTO logged_sets (id, workout_log_id, exercise_id, set_number, set_type, weight_kg, reps_completed, is_pr, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `set-${logId}-${i}`,
            logId,
            s.exerciseId,
            s.setIndex,
            s.setType,
            s.weightKg ?? 0,
            s.repsCompleted,
            s.isPR ? 1 : 0,
            now,
          ]
        );
      }

      // 3. Update Muscle Recovery Logs
      const trainedMuscles = new Set<string>();
      if (state.plan.targetSplit) {
        trainedMuscles.add(state.plan.targetSplit);
      }
      for (const ex of state.plan.exercises) {
        if (ex.exerciseId.includes('squat') || ex.exerciseId.includes('lunge')) {
          trainedMuscles.add('quadriceps');
          trainedMuscles.add('glutes');
        } else if (ex.exerciseId.includes('push') || ex.exerciseId.includes('bench')) {
          trainedMuscles.add('chest');
          trainedMuscles.add('triceps');
        } else if (ex.exerciseId.includes('pull') || ex.exerciseId.includes('row')) {
          trainedMuscles.add('lats');
          trainedMuscles.add('biceps');
        } else if (ex.exerciseId.includes('shoulder') || ex.exerciseId.includes('press')) {
          trainedMuscles.add('shoulders');
        } else if (ex.exerciseId.includes('crunch') || ex.exerciseId.includes('plank')) {
          trainedMuscles.add('abdominals');
        }
      }

      await recordMuscleTraining(Array.from(trainedMuscles), state.completedSets.length);
    } catch (e) {
      console.warn('Failed to record workout log:', e);
    }
  },
}));
