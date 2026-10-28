import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync('fitforge.db');
  dbInstance = db;

  // Configure SQLite
  if (Platform.OS !== 'web') {
    await db.execAsync(`PRAGMA journal_mode = WAL;`);
  }

  await initializeTables(db);
  return db;
}

async function initializeTables(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      equipment TEXT NOT NULL,
      primaryMuscles TEXT NOT NULL,
      secondaryMuscles TEXT NOT NULL,
      instructions TEXT NOT NULL,
      level TEXT NOT NULL,
      force TEXT,
      mechanic TEXT,
      images TEXT,
      is_favorite INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_equipment (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      weight_kg REAL,
      resistance_level TEXT,
      quantity INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_plans (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      target_muscle TEXT,
      duration_minutes INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      sets INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      rest_seconds INTEGER NOT NULL,
      order_index INTEGER NOT NULL,
      notes TEXT,
      FOREIGN KEY (workout_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );

    CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY,
      workout_id TEXT,
      started_at TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      total_duration_seconds INTEGER NOT NULL,
      calories_burned INTEGER
    );

    CREATE TABLE IF NOT EXISTS logged_sets (
      id TEXT PRIMARY KEY,
      workout_log_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      set_type TEXT NOT NULL DEFAULT 'normal',
      weight_kg REAL,
      reps_completed INTEGER NOT NULL,
      rpe REAL,
      is_pr INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS personal_records (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      record_type TEXT NOT NULL,
      value REAL NOT NULL,
      weight_kg REAL NOT NULL,
      reps INTEGER NOT NULL,
      achieved_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS muscle_recovery_logs (
      muscle_id TEXT PRIMARY KEY,
      last_trained_at TEXT NOT NULL,
      sets_performed INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises(equipment);
    CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
    CREATE INDEX IF NOT EXISTS idx_logged_sets_exercise ON logged_sets(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_personal_records_exercise ON personal_records(exercise_id);
  `);
}
