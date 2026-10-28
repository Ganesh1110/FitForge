export interface OneRepMaxResult {
  weightKg: number;
  reps: number;
  epley: number;
  brzycki: number;
  lander: number;
  average: number;
  percentages: { percentage: number; weight: number; targetReps: number }[];
}

/**
 * Calculates estimated One Rep Max (1RM) using standard exercise physiology formulas:
 * - Epley: w * (1 + r / 30)
 * - Brzycki: w * (36 / (37 - r))
 * - Lander: (100 * w) / (101.3 - 2.67123 * r)
 */
export function calculateOneRepMax(weightKg: number, reps: number): OneRepMaxResult {
  if (reps <= 1) {
    const w = weightKg;
    return {
      weightKg,
      reps: 1,
      epley: w,
      brzycki: w,
      lander: w,
      average: w,
      percentages: generatePercentages(w),
    };
  }

  // Cap reps at 15 for reliable scientific extrapolation
  const effectiveReps = Math.min(15, reps);

  const epley = Math.round(weightKg * (1 + effectiveReps / 30));
  const brzycki = Math.round(weightKg * (36 / (37 - effectiveReps)));
  const lander = Math.round((100 * weightKg) / (101.3 - 2.67123 * effectiveReps));
  const average = Math.round((epley + brzycki + lander) / 3);

  return {
    weightKg,
    reps,
    epley,
    brzycki,
    lander,
    average,
    percentages: generatePercentages(average),
  };
}

function generatePercentages(oneRepMax: number): {
  percentage: number;
  weight: number;
  targetReps: number;
}[] {
  const table = [
    { percentage: 100, targetReps: 1 },
    { percentage: 95, targetReps: 2 },
    { percentage: 90, targetReps: 4 },
    { percentage: 85, targetReps: 6 },
    { percentage: 80, targetReps: 8 },
    { percentage: 75, targetReps: 10 },
    { percentage: 70, targetReps: 12 },
    { percentage: 65, targetReps: 15 },
    { percentage: 60, targetReps: 20 },
  ];

  return table.map((t) => ({
    percentage: t.percentage,
    weight: Math.round((oneRepMax * t.percentage) / 100),
    targetReps: t.targetReps,
  }));
}
