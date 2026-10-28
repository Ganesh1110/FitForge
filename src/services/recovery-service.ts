import { getDatabase } from '@/db/database';
import { MuscleRecoveryLog } from '@/db/schema';

export type RecoveryStatus = 'fatigued' | 'recovering' | 'ready';

export interface MuscleRecoveryState {
  muscleId: string;
  muscleName: string;
  hoursElapsed: number;
  recoveryPercentage: number; // 0 to 100
  status: RecoveryStatus;
  statusLabel: string;
  color: string;
  lastTrainedAt?: string;
  setsThisWeek: number;
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Chest (Pectorals)',
  shoulders: 'Shoulders (Deltoids)',
  biceps: 'Biceps',
  triceps: 'Triceps',
  abdominals: 'Abs & Core',
  quadriceps: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  lats: 'Lats & Wings',
  'middle back': 'Upper & Mid Back',
  'lower back': 'Lower Back',
  'cardiovascular system': 'Cardio / Calves',
};

/**
 * Standard muscle protein synthesis & recovery window:
 * - 0 to 24 hrs: Fatigued (0% to 40% recovered)
 * - 24 to 48 hrs: Recovering (40% to 85% recovered)
 * - 48+ hrs: Fully recovered & ready for progressive overload (100%)
 */
export async function getMuscleRecoveryStates(): Promise<Record<string, MuscleRecoveryState>> {
  const db = await getDatabase();
  const logs = await db.getAllAsync<MuscleRecoveryLog>('SELECT * FROM muscle_recovery_logs');
  const now = Date.now();

  const result: Record<string, MuscleRecoveryState> = {};

  for (const muscleId of Object.keys(MUSCLE_LABELS)) {
    const log = logs.find((l) => l.muscle_id === muscleId);

    if (!log || !log.last_trained_at) {
      // Never trained or fully rested
      result[muscleId] = {
        muscleId,
        muscleName: MUSCLE_LABELS[muscleId] || muscleId,
        hoursElapsed: 999,
        recoveryPercentage: 100,
        status: 'ready',
        statusLabel: 'Fully Recovered (Ready)',
        color: '#10B981', // Emerald green
        setsThisWeek: 0,
      };
      continue;
    }

    const lastTime = new Date(log.last_trained_at).getTime();
    const hoursElapsed = Math.max(0, Math.round((now - lastTime) / (1000 * 60 * 60)));

    let recoveryPercentage = 100;
    let status: RecoveryStatus = 'ready';
    let statusLabel = 'Ready to Train';
    let color = '#10B981';

    if (hoursElapsed < 24) {
      recoveryPercentage = Math.min(40, Math.round((hoursElapsed / 24) * 40));
      status = 'fatigued';
      statusLabel = 'Fatigued (Resting)';
      color = '#EF4444'; // Red
    } else if (hoursElapsed < 48) {
      recoveryPercentage = 40 + Math.round(((hoursElapsed - 24) / 24) * 45);
      status = 'recovering';
      statusLabel = 'Recovering (Synthesis Active)';
      color = '#F59E0B'; // Amber
    } else {
      recoveryPercentage = 100;
      status = 'ready';
      statusLabel = 'Optimal Readiness';
      color = '#10B981'; // Green
    }

    result[muscleId] = {
      muscleId,
      muscleName: MUSCLE_LABELS[muscleId] || muscleId,
      hoursElapsed,
      recoveryPercentage,
      status,
      statusLabel,
      color,
      lastTrainedAt: log.last_trained_at,
      setsThisWeek: log.sets_performed,
    };
  }

  return result;
}

/**
 * Updates muscle recovery timestamps when a workout completes.
 */
export async function recordMuscleTraining(
  trainedMuscles: string[],
  setsPerMuscle: number = 4
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  for (const muscleId of trainedMuscles) {
    await db.runAsync(
      `INSERT INTO muscle_recovery_logs (muscle_id, last_trained_at, sets_performed)
       VALUES (?, ?, ?)
       ON CONFLICT(muscle_id) DO UPDATE SET
       last_trained_at = excluded.last_trained_at,
       sets_performed = sets_performed + excluded.sets_performed`,
      [muscleId, now, setsPerMuscle]
    );
  }
}
