import { getDatabase } from './database';
import { Exercise } from './schema';
import { SEED_EXERCISES } from './seed-data';

const FREE_EXERCISE_DB_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

export async function seedDatabaseIfNeeded(): Promise<number> {
  const db = await getDatabase();
  const countRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercises'
  );

  if (countRow && countRow.count > 0) {
    return countRow.count;
  }

  console.log('Seeding initial exercise catalog into SQLite...');
  await insertExercises(SEED_EXERCISES);
  return SEED_EXERCISES.length;
}

export async function insertExercises(exercises: Exercise[]): Promise<void> {
  const db = await getDatabase();

  for (const ex of exercises) {
    await db.runAsync(
      `INSERT OR REPLACE INTO exercises (
        id, name, category, equipment, primaryMuscles, secondaryMuscles,
        instructions, level, force, mechanic, images, is_favorite
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ex.id,
        ex.name,
        ex.category,
        ex.equipment,
        JSON.stringify(ex.primaryMuscles || []),
        JSON.stringify(ex.secondaryMuscles || []),
        JSON.stringify(ex.instructions || []),
        ex.level,
        ex.force ?? null,
        ex.mechanic ?? null,
        JSON.stringify(ex.images || []),
        ex.is_favorite ? 1 : 0,
      ]
    );
  }
}

/**
 * Optionally syncs the full 800+ exercise public catalog from free-exercise-db
 */
export async function syncWithFreeExerciseDb(): Promise<{ added: number; error?: string }> {
  try {
    const response = await fetch(FREE_EXERCISE_DB_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to download exercise db`);
    }

    const rawData = await response.json();
    if (!Array.isArray(rawData)) {
      throw new Error('Downloaded exercise data is not an array');
    }

    const parsedExercises: Exercise[] = rawData.map((item: any) => ({
      id: item.id || item.name.toLowerCase().replace(/\s+/g, '-'),
      name: item.name,
      category: item.category || 'strength',
      equipment: item.equipment || 'body only',
      primaryMuscles: Array.isArray(item.primaryMuscles) ? item.primaryMuscles : [],
      secondaryMuscles: Array.isArray(item.secondaryMuscles) ? item.secondaryMuscles : [],
      instructions: Array.isArray(item.instructions) ? item.instructions : [],
      level: item.level || 'beginner',
      force: item.force || null,
      mechanic: item.mechanic || null,
      images: Array.isArray(item.images) ? item.images : [],
      is_favorite: false,
    }));

    await insertExercises(parsedExercises);
    return { added: parsedExercises.length };
  } catch (error: any) {
    console.warn('Sync with remote free-exercise-db failed:', error);
    return { added: 0, error: error?.message || 'Network error' };
  }
}
