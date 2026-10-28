import { getDatabase } from '@/db/database';
import { Exercise, WorkoutPlan, WorkoutLog, LoggedSet, PersonalRecord } from '@/db/schema';

export interface FitForgeExportPackage {
  app: 'FitForge';
  version: '1.0.0';
  exportedAt: string;
  exercises: Exercise[];
  workoutPlans: WorkoutPlan[];
  workoutLogs: WorkoutLog[];
  loggedSets: LoggedSet[];
  personalRecords: PersonalRecord[];
}

/**
 * Generates an offline JSON backup of all user data.
 */
export async function exportDatabaseToJson(): Promise<string> {
  const db = await getDatabase();

  const exercises = await db.getAllAsync<Exercise>('SELECT * FROM exercises WHERE is_favorite = 1');
  const workoutPlans = await db.getAllAsync<WorkoutPlan>('SELECT * FROM workout_plans');
  const workoutLogs = await db.getAllAsync<WorkoutLog>('SELECT * FROM workout_logs');
  const loggedSets = await db.getAllAsync<LoggedSet>('SELECT * FROM logged_sets');
  const personalRecords = await db.getAllAsync<PersonalRecord>('SELECT * FROM personal_records');

  const pkg: FitForgeExportPackage = {
    app: 'FitForge',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    exercises,
    workoutPlans,
    workoutLogs,
    loggedSets,
    personalRecords,
  };

  return JSON.stringify(pkg, null, 2);
}

/**
 * Generates a standard CSV export compatible with Strong, Hevy, and openGym.
 */
export async function exportWorkoutsToCsv(): Promise<string> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(`
    SELECT 
      l.started_at as Date,
      p.title as WorkoutName,
      e.name as ExerciseName,
      s.set_number as SetOrder,
      s.weight_kg as WeightKg,
      s.reps_completed as Reps,
      s.rpe as RPE,
      s.set_type as SetType
    FROM logged_sets s
    JOIN workout_logs l ON s.workout_log_id = l.id
    LEFT JOIN workout_plans p ON l.workout_id = p.id
    JOIN exercises e ON s.exercise_id = e.id
    ORDER BY l.started_at DESC, s.set_number ASC
  `);

  if (rows.length === 0) {
    return 'Date,WorkoutName,ExerciseName,SetOrder,WeightKg,Reps,RPE,SetType\n';
  }

  const headers = ['Date', 'WorkoutName', 'ExerciseName', 'SetOrder', 'WeightKg', 'Reps', 'RPE', 'SetType'];
  const csvLines = [headers.join(',')];

  for (const row of rows) {
    const line = [
      `"${row.Date || ''}"`,
      `"${row.WorkoutName || 'Workout'}"`,
      `"${row.ExerciseName || ''}"`,
      row.SetOrder ?? 1,
      row.WeightKg ?? 0,
      row.Reps ?? 0,
      row.RPE ?? '',
      `"${row.SetType || 'normal'}"`,
    ];
    csvLines.push(line.join(','));
  }

  return csvLines.join('\n');
}

/**
 * Imports a FitForge JSON package or parsed workout logs.
 */
export async function importDatabaseFromJson(jsonString: string): Promise<{ success: boolean; importedLogs: number }> {
  try {
    const data: FitForgeExportPackage = JSON.parse(jsonString);
    if (!data.workoutLogs || !Array.isArray(data.workoutLogs)) {
      throw new Error('Invalid FitForge backup format.');
    }

    const db = await getDatabase();

    for (const log of data.workoutLogs) {
      await db.runAsync(
        `INSERT OR REPLACE INTO workout_logs (id, workout_id, started_at, completed_at, total_duration_seconds, calories_burned)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [log.id, log.workout_id, log.started_at, log.completed_at, log.total_duration_seconds, log.calories_burned ?? 0]
      );
    }

    if (data.loggedSets && Array.isArray(data.loggedSets)) {
      for (const s of data.loggedSets) {
        await db.runAsync(
          `INSERT OR REPLACE INTO logged_sets (id, workout_log_id, exercise_id, set_number, set_type, weight_kg, reps_completed, rpe, is_pr, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.id, s.workout_log_id, s.exercise_id, s.set_number, s.set_type, s.weight_kg ?? 0, s.reps_completed, s.rpe ?? 0, s.is_pr ? 1 : 0, s.created_at]
        );
      }
    }

    return { success: true, importedLogs: data.workoutLogs.length };
  } catch (e: any) {
    console.warn('Import failed:', e);
    return { success: false, importedLogs: 0 };
  }
}
