import { getDatabase } from '@/db/database';
import { PersonalRecord } from '@/db/schema';
import { calculateOneRepMax } from './one-rep-max';

export interface NewPRCheckResult {
  isMaxWeightPR: boolean;
  isOneRepMaxPR: boolean;
  newRecords: PersonalRecord[];
  previousMaxWeight?: number;
  previous1RM?: number;
}

/**
 * Checks a completed set against user's history and logs any newly achieved PRs.
 */
export async function checkAndSavePR(
  exerciseId: string,
  weightKg: number,
  reps: number
): Promise<NewPRCheckResult> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const estimated1RM = calculateOneRepMax(weightKg, reps).average;

  // 1. Fetch existing PRs for this exercise
  const existingRecords = await db.getAllAsync<PersonalRecord>(
    'SELECT * FROM personal_records WHERE exercise_id = ?',
    [exerciseId]
  );

  const existingWeightPR = existingRecords.find((r) => r.record_type === 'max_weight');
  const existing1RMPR = existingRecords.find((r) => r.record_type === 'estimated_1rm');

  const isMaxWeightPR = !existingWeightPR || weightKg > existingWeightPR.value;
  const isOneRepMaxPR = !existing1RMPR || estimated1RM > existing1RMPR.value;

  const newRecords: PersonalRecord[] = [];

  if (isMaxWeightPR && weightKg > 0) {
    const record: PersonalRecord = {
      id: `pr-weight-${exerciseId}-${Date.now()}`,
      exercise_id: exerciseId,
      record_type: 'max_weight',
      value: weightKg,
      weight_kg: weightKg,
      reps,
      achieved_at: now,
    };
    await db.runAsync(
      `INSERT OR REPLACE INTO personal_records (id, exercise_id, record_type, value, weight_kg, reps, achieved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [record.id, record.exercise_id, record.record_type, record.value, record.weight_kg, record.reps, record.achieved_at]
    );
    newRecords.push(record);
  }

  if (isOneRepMaxPR && estimated1RM > 0) {
    const record: PersonalRecord = {
      id: `pr-1rm-${exerciseId}-${Date.now()}`,
      exercise_id: exerciseId,
      record_type: 'estimated_1rm',
      value: estimated1RM,
      weight_kg: weightKg,
      reps,
      achieved_at: now,
    };
    await db.runAsync(
      `INSERT OR REPLACE INTO personal_records (id, exercise_id, record_type, value, weight_kg, reps, achieved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [record.id, record.exercise_id, record.record_type, record.value, record.weight_kg, record.reps, record.achieved_at]
    );
    newRecords.push(record);
  }

  return {
    isMaxWeightPR,
    isOneRepMaxPR,
    newRecords,
    previousMaxWeight: existingWeightPR?.value,
    previous1RM: existing1RMPR?.value,
  };
}

/**
 * Retrieves the best PRs for an exercise.
 */
export async function getExercisePRs(exerciseId: string): Promise<PersonalRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<PersonalRecord>(
    'SELECT * FROM personal_records WHERE exercise_id = ? ORDER BY achieved_at DESC',
    [exerciseId]
  );
}

/**
 * Retrieves the latest logged set for an exercise (Ghost / Previous data memory).
 */
export async function getPreviousExerciseSet(
  exerciseId: string,
  setNumber: number
): Promise<{ weight_kg?: number; reps_completed: number } | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    `SELECT weight_kg, reps_completed FROM logged_sets
     WHERE exercise_id = ? AND set_number = ?
     ORDER BY created_at DESC LIMIT 1`,
    [exerciseId, setNumber]
  );
  return row || null;
}
