import { getDatabase } from './database';
import { Exercise } from './schema';

export interface ExerciseFilterOptions {
  search?: string;
  muscle?: string;
  equipment?: string;
  category?: string;
  level?: string;
  favoritesOnly?: boolean;
}

function parseExerciseRow(row: any): Exercise {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    equipment: row.equipment,
    primaryMuscles: typeof row.primaryMuscles === 'string' ? JSON.parse(row.primaryMuscles) : row.primaryMuscles,
    secondaryMuscles: typeof row.secondaryMuscles === 'string' ? JSON.parse(row.secondaryMuscles) : row.secondaryMuscles,
    instructions: typeof row.instructions === 'string' ? JSON.parse(row.instructions) : row.instructions,
    level: row.level,
    force: row.force,
    mechanic: row.mechanic,
    images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images,
    is_favorite: Boolean(row.is_favorite),
  };
}

export async function getExercises(filters: ExerciseFilterOptions = {}): Promise<Exercise[]> {
  const db = await getDatabase();
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filters.search && filters.search.trim()) {
    whereClauses.push('(name LIKE ? OR primaryMuscles LIKE ?)');
    const searchTerm = `%${filters.search.trim()}%`;
    params.push(searchTerm, searchTerm);
  }

  if (filters.muscle && filters.muscle !== 'all') {
    whereClauses.push('(primaryMuscles LIKE ? OR secondaryMuscles LIKE ?)');
    params.push(`%"${filters.muscle}"%`, `%"${filters.muscle}"%`);
  }

  if (filters.equipment && filters.equipment !== 'all') {
    whereClauses.push('equipment = ?');
    params.push(filters.equipment);
  }

  if (filters.category && filters.category !== 'all') {
    whereClauses.push('category = ?');
    params.push(filters.category);
  }

  if (filters.level && filters.level !== 'all') {
    whereClauses.push('level = ?');
    params.push(filters.level);
  }

  if (filters.favoritesOnly) {
    whereClauses.push('is_favorite = 1');
  }

  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const query = `SELECT * FROM exercises ${whereString} ORDER BY name ASC`;

  const rows = await db.getAllAsync(query, params);
  return rows.map(parseExerciseRow);
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM exercises WHERE id = ?', [id]);
  return row ? parseExerciseRow(row) : null;
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const db = await getDatabase();
  const current = await db.getFirstAsync<{ is_favorite: number }>(
    'SELECT is_favorite FROM exercises WHERE id = ?',
    [id]
  );
  if (!current) return false;

  const nextVal = current.is_favorite === 1 ? 0 : 1;
  await db.runAsync('UPDATE exercises SET is_favorite = ? WHERE id = ?', [nextVal, id]);
  return nextVal === 1;
}

export async function getAvailableEquipmentInDb(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ equipment: string }>(
    'SELECT DISTINCT equipment FROM exercises WHERE equipment IS NOT NULL ORDER BY equipment ASC'
  );
  return rows.map((r) => r.equipment);
}

/**
 * Filter exercises strictly by the user's available equipment list.
 * 'body only' is always included unless explicitly disbarred.
 */
export async function getExercisesMatchingEquipment(
  availableEquipment: string[],
  muscle?: string
): Promise<Exercise[]> {
  const db = await getDatabase();
  const normalizedEquipment = Array.from(new Set([...availableEquipment, 'body only']));

  const placeholders = normalizedEquipment.map(() => '?').join(', ');
  let query = `SELECT * FROM exercises WHERE equipment IN (${placeholders})`;
  const params: any[] = [...normalizedEquipment];

  if (muscle && muscle !== 'all') {
    query += ' AND (primaryMuscles LIKE ? OR secondaryMuscles LIKE ?)';
    params.push(`%"${muscle}"%`, `%"${muscle}"%`);
  }

  query += ' ORDER BY name ASC';

  const rows = await db.getAllAsync(query, params);
  return rows.map(parseExerciseRow);
}
