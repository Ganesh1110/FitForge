import { Exercise } from '@/db/schema';
import {
  WorkoutGenerationRequest,
  GeneratedWorkoutPlan,
  GeneratedExerciseItem,
  WorkoutTargetSplit,
} from './types';

export function generateHeuristicWorkoutPlan(
  request: WorkoutGenerationRequest,
  candidateExercises: Exercise[]
): GeneratedWorkoutPlan {
  const { split, durationMinutes, goal, intensity } = request;

  // Determine number of exercises based on session duration
  let targetExerciseCount = 4;
  if (durationMinutes <= 15) {
    targetExerciseCount = 3;
  } else if (durationMinutes <= 30) {
    targetExerciseCount = 5;
  } else if (durationMinutes <= 45) {
    targetExerciseCount = 6;
  } else {
    targetExerciseCount = 8;
  }

  // Filter candidates relevant to the split
  const relevantCandidates = filterCandidatesBySplit(candidateExercises, split);
  const pool = relevantCandidates.length >= targetExerciseCount ? relevantCandidates : candidateExercises;

  // Shuffle candidate pool deterministically or randomly
  const shuffled = [...pool].sort(() => 0.5 - Math.random());

  // Pick unique exercises aiming for balanced movement patterns (compounds first, then accessories)
  const selectedList: Exercise[] = [];
  const chosenMuscles = new Set<string>();

  // Pass 1: Try to pick diverse muscle groups
  for (const ex of shuffled) {
    if (selectedList.length >= targetExerciseCount) break;
    const primary = ex.primaryMuscles[0] || 'body';
    if (!chosenMuscles.has(primary)) {
      selectedList.push(ex);
      chosenMuscles.add(primary);
    }
  }

  // Pass 2: If we still need more, fill from remaining
  for (const ex of shuffled) {
    if (selectedList.length >= targetExerciseCount) break;
    if (!selectedList.some((s) => s.id === ex.id)) {
      selectedList.push(ex);
    }
  }

  // Configure sets, reps, and rest based on goal & intensity
  let sets = 3;
  let reps = 10;
  let restSeconds = 60;

  switch (goal) {
    case 'strength':
      sets = intensity === 'advanced' ? 4 : 3;
      reps = 6;
      restSeconds = 90;
      break;
    case 'hypertrophy':
      sets = 3;
      reps = 10;
      restSeconds = 60;
      break;
    case 'fat_loss':
      sets = 3;
      reps = 15;
      restSeconds = 35;
      break;
    case 'endurance':
    case 'mobility':
      sets = 3;
      reps = 16;
      restSeconds = 30;
      break;
  }

  const equipmentUsedSet = new Set<string>();

  const exercises: GeneratedExerciseItem[] = selectedList.map((ex, index) => {
    equipmentUsedSet.add(ex.equipment);

    // Adjust reps for isometric holds (like planks)
    const isHold = ex.force === 'static' || ex.name.toLowerCase().includes('plank');
    const effectiveReps = isHold ? 40 : reps;
    const repUnit = isHold ? 'sec' : 'reps';

    const coachingCues: Record<string, string> = {
      'push-up': 'Keep elbows at a 45-degree angle. Lock your core tight.',
      'air-squat': 'Drive through whole feet, keep chest elevated.',
      'plank': 'Squeeze glutes and press floor away with forearms.',
      'dumbbell-floor-press': 'Pause briefly on floor to eliminate momentum.',
      'dumbbell-row': 'Drive your elbow toward the ceiling, squeeze lat.',
      'dumbbell-goblet-squat': 'Hold weight close to chest, descend between knees.',
      'pull-up': 'Initiate by depressing scapulae, lead with chest.',
    };

    const notes = coachingCues[ex.id] || `Focus on controlled tempo and form (${effectiveReps} ${repUnit}).`;

    return {
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: index === 0 && goal === 'strength' ? sets + 1 : sets, // optional extra set on first compound
      reps: effectiveReps,
      restSeconds,
      notes,
      targetMuscle: ex.primaryMuscles[0] || 'Full Body',
      equipmentRequired: ex.equipment,
    };
  });

  const titles: Record<WorkoutTargetSplit, string> = {
    full_body: 'Full-Body Home Circuit',
    upper_body: 'Upper-Body Hypertrophy',
    lower_body: 'Lower-Body Power & Legs',
    push: 'Push & Core Routine',
    pull: 'Pull & Back Power',
    core_cardio: 'Metabolic Core & Conditioning',
  };

  const descriptions: Record<WorkoutTargetSplit, string> = {
    full_body: 'Total-body balance targeting compound push, pull, leg, and core movements.',
    upper_body: 'High-density chest, back, shoulders, and arms sequence.',
    lower_body: 'Quad, hamstring, and glute volume with controlled tempos.',
    push: 'Chest, front delts, and tricep focus with core stabilization.',
    pull: 'Lat width, middle back contraction, and bicep volume.',
    core_cardio: 'High work capacity session driving aerobic endurance and midsection stamina.',
  };

  return {
    id: `plan-${Date.now()}`,
    title: titles[split] || 'Custom Home Workout',
    description: descriptions[split] || 'Tailored to your equipment inventory.',
    targetSplit: split,
    estimatedMinutes: durationMinutes,
    difficulty: intensity,
    exercises,
    equipmentUsed: Array.from(equipmentUsedSet),
    generatedAt: new Date().toISOString(),
    engineUsed: 'heuristic_rules',
  };
}

function filterCandidatesBySplit(candidates: Exercise[], split: WorkoutTargetSplit): Exercise[] {
  switch (split) {
    case 'push':
      return candidates.filter(
        (c) =>
          c.force === 'push' ||
          c.primaryMuscles.some((m) => ['chest', 'shoulders', 'triceps'].includes(m))
      );
    case 'pull':
      return candidates.filter(
        (c) =>
          c.force === 'pull' ||
          c.primaryMuscles.some((m) => ['back', 'lats', 'biceps', 'middle back'].includes(m))
      );
    case 'lower_body':
      return candidates.filter((c) =>
        c.primaryMuscles.some((m) =>
          ['quadriceps', 'hamstrings', 'glutes', 'calves'].includes(m)
        )
      );
    case 'upper_body':
      return candidates.filter((c) =>
        c.primaryMuscles.some((m) =>
          ['chest', 'back', 'lats', 'shoulders', 'biceps', 'triceps'].includes(m)
        )
      );
    case 'core_cardio':
      return candidates.filter(
        (c) =>
          c.category === 'cardio' ||
          c.category === 'plyometrics' ||
          c.primaryMuscles.some((m) => ['abdominals', 'cardiovascular system'].includes(m))
      );
    case 'full_body':
    default:
      return candidates;
  }
}
