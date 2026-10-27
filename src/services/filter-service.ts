import { getDatabase } from '@/db/database';
import { Exercise } from '@/db/schema';
import { useGarageStore } from '@/store/garage-store';

export interface GarageFilterOptions {
  muscle?: string;
  search?: string;
  level?: string;
  strictGearOnly?: boolean;
}

export interface EquipmentCoverage {
  totalExercises: number;
  accessibleExercises: number;
  coveragePercentage: number;
  unlockedByEquipment: Record<string, number>;
  recommendedUpgrades: { equipment: string; unlocksCount: number }[];
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

/**
 * Returns only exercises that match the physical gear currently logged in the user's garage.
 */
export async function getExercisesForUserGarage(
  options: GarageFilterOptions = {}
): Promise<Exercise[]> {
  const db = await getDatabase();
  const allowedKeys = useGarageStore.getState().getAllowedDbEquipmentKeys();

  const whereClauses: string[] = [];
  const params: any[] = [];

  if (options.strictGearOnly !== false) {
    const placeholders = allowedKeys.map(() => '?').join(', ');
    whereClauses.push(`equipment IN (${placeholders})`);
    params.push(...allowedKeys);
  }

  if (options.search && options.search.trim()) {
    whereClauses.push('(name LIKE ? OR primaryMuscles LIKE ?)');
    const searchTerm = `%${options.search.trim()}%`;
    params.push(searchTerm, searchTerm);
  }

  if (options.muscle && options.muscle !== 'all') {
    whereClauses.push('(primaryMuscles LIKE ? OR secondaryMuscles LIKE ?)');
    params.push(`%"${options.muscle}"%`, `%"${options.muscle}"%`);
  }

  if (options.level && options.level !== 'all') {
    whereClauses.push('level = ?');
    params.push(options.level);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const query = `SELECT * FROM exercises ${whereStr} ORDER BY name ASC`;

  const rows = await db.getAllAsync(query, params);
  return rows.map(parseExerciseRow);
}

/**
 * Calculates how much of the catalog is unlocked by the user's garage gear,
 * and highlights which gear upgrade provides the highest impact.
 */
export async function calculateEquipmentCoverage(): Promise<EquipmentCoverage> {
  const db = await getDatabase();
  const allRows = await db.getAllAsync<any>('SELECT id, equipment FROM exercises');
  const allowedKeys = new Set(useGarageStore.getState().getAllowedDbEquipmentKeys());

  const totalExercises = allRows.length;
  let accessibleExercises = 0;
  const equipmentTally: Record<string, number> = {};

  for (const row of allRows) {
    const eq = row.equipment || 'body only';
    equipmentTally[eq] = (equipmentTally[eq] || 0) + 1;
    if (allowedKeys.has(eq)) {
      accessibleExercises++;
    }
  }

  const coveragePercentage =
    totalExercises > 0 ? Math.round((accessibleExercises / totalExercises) * 100) : 100;

  // Identify gear the user does NOT have yet and how many workouts it would unlock
  const recommendedUpgrades: { equipment: string; unlocksCount: number }[] = [];
  for (const [eq, count] of Object.entries(equipmentTally)) {
    if (!allowedKeys.has(eq)) {
      recommendedUpgrades.push({
        equipment: eq,
        unlocksCount: count,
      });
    }
  }

  recommendedUpgrades.sort((a, b) => b.unlocksCount - a.unlocksCount);

  return {
    totalExercises,
    accessibleExercises,
    coveragePercentage,
    unlockedByEquipment: equipmentTally,
    recommendedUpgrades,
  };
}
