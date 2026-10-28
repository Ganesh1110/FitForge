export interface PlateInfo {
  weight: number;
  color: string;
  diameterRatio: number; // for visual representation (0.5 to 1.0)
  textColor: string;
}

export const OLYMPIC_PLATES_METRIC: PlateInfo[] = [
  { weight: 25, color: '#EF4444', diameterRatio: 1.0, textColor: '#FFFFFF' }, // Red
  { weight: 20, color: '#3B82F6', diameterRatio: 0.95, textColor: '#FFFFFF' }, // Blue
  { weight: 15, color: '#F59E0B', diameterRatio: 0.85, textColor: '#000000' }, // Yellow
  { weight: 10, color: '#10B981', diameterRatio: 0.75, textColor: '#FFFFFF' }, // Green
  { weight: 5, color: '#9CA3AF', diameterRatio: 0.65, textColor: '#000000' }, // White/Grey
  { weight: 2.5, color: '#1E293B', diameterRatio: 0.55, textColor: '#FFFFFF' }, // Black
  { weight: 1.25, color: '#64748B', diameterRatio: 0.45, textColor: '#FFFFFF' }, // Chrome/Silver
];

export interface BarOption {
  id: string;
  name: string;
  weightKg: number;
}

export const BAR_OPTIONS: BarOption[] = [
  { id: 'olympic_mens', name: "Men's Olympic Bar", weightKg: 20 },
  { id: 'olympic_womens', name: "Women's Olympic Bar", weightKg: 15 },
  { id: 'technique_bar', name: 'Technique Bar', weightKg: 10 },
  { id: 'ez_curl', name: 'EZ-Curl Bar', weightKg: 7.5 },
  { id: 'trap_bar', name: 'Trap / Hex Bar', weightKg: 25 },
  { id: 'smith_machine', name: 'Smith Machine Bar', weightKg: 9 },
];

export interface PlateCalculationResult {
  targetWeight: number;
  barWeight: number;
  weightPerSide: number;
  platesPerSide: { plate: PlateInfo; count: number }[];
  actualTotalWeight: number;
  remainderKg: number;
}

/**
 * Calculates the exact plates required per side of a barbell to reach a target weight.
 * Uses standard greedy plate-loading algorithm.
 */
export function calculateBarbellPlates(
  targetWeightKg: number,
  barWeightKg: number = 20,
  availablePlates: PlateInfo[] = OLYMPIC_PLATES_METRIC
): PlateCalculationResult {
  if (targetWeightKg <= barWeightKg) {
    return {
      targetWeight: targetWeightKg,
      barWeight: barWeightKg,
      weightPerSide: 0,
      platesPerSide: [],
      actualTotalWeight: barWeightKg,
      remainderKg: 0,
    };
  }

  const weightNeeded = targetWeightKg - barWeightKg;
  let remainingPerSide = weightNeeded / 2;

  // Sort plates descending by weight
  const sortedPlates = [...availablePlates].sort((a, b) => b.weight - a.weight);
  const platesPerSide: { plate: PlateInfo; count: number }[] = [];

  for (const plate of sortedPlates) {
    if (remainingPerSide >= plate.weight) {
      const count = Math.floor(remainingPerSide / plate.weight);
      if (count > 0) {
        platesPerSide.push({ plate, count });
        remainingPerSide = parseFloat((remainingPerSide - count * plate.weight).toFixed(2));
      }
    }
  }

  const loadedPerSide = platesPerSide.reduce(
    (sum, item) => sum + item.plate.weight * item.count,
    0
  );
  const actualTotalWeight = barWeightKg + loadedPerSide * 2;
  const remainderKg = parseFloat((targetWeightKg - actualTotalWeight).toFixed(2));

  return {
    targetWeight: targetWeightKg,
    barWeight: barWeightKg,
    weightPerSide: loadedPerSide,
    platesPerSide,
    actualTotalWeight,
    remainderKg,
  };
}
