import { Exercise } from '@/db/schema';
import { GeneratedWorkoutPlan, GeneratedExerciseItem, WorkoutTargetSplit } from './types';
import { FitnessGoal, ExperienceLevel } from '@/store/user-store';

export interface ValidationResult {
  isValid: boolean;
  plan: GeneratedWorkoutPlan | null;
  errors: string[];
  hallucinatedIdsFound: string[];
}

export function validateAndSanitizeAIOutput(
  rawJsonOrString: string | any,
  candidateExercises: Exercise[],
  fallbackSplit: WorkoutTargetSplit = 'full_body',
  fallbackDuration: number = 30,
  fallbackDifficulty: ExperienceLevel = 'intermediate',
  _goal: FitnessGoal = 'hypertrophy'
): ValidationResult {
  const errors: string[] = [];
  const hallucinatedIdsFound: string[] = [];

  let parsed: any = null;

  if (typeof rawJsonOrString === 'string') {
    try {
      // Strip markdown code fences if model wrapped it in ```json ... ```
      let cleanStr = rawJsonOrString.trim();
      if (cleanStr.startsWith('```')) {
        cleanStr = cleanStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }
      parsed = JSON.parse(cleanStr);
    } catch {
      return {
        isValid: false,
        plan: null,
        errors: ['Failed to parse AI output into valid JSON syntax.'],
        hallucinatedIdsFound: [],
      };
    }
  } else {
    parsed = rawJsonOrString;
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      isValid: false,
      plan: null,
      errors: ['AI response is not a JSON object.'],
      hallucinatedIdsFound: [],
    };
  }

  // Create fast lookup map for candidate exercises
  const candidateMap = new Map<string, Exercise>();
  for (const ex of candidateExercises) {
    candidateMap.set(ex.id.toLowerCase(), ex);
    candidateMap.set(ex.name.toLowerCase(), ex);
  }

  const rawExercises = Array.isArray(parsed.exercises) ? parsed.exercises : [];
  if (rawExercises.length === 0) {
    errors.push('AI generated an empty exercise list.');
  }

  const validatedExercises: GeneratedExerciseItem[] = [];
  const equipmentUsedSet = new Set<string>();

  for (const item of rawExercises) {
    const rawId = (item.exerciseId || item.id || '').toString().toLowerCase().trim();
    const rawName = (item.exerciseName || item.name || '').toString().toLowerCase().trim();

    // Look up ID first, then name
    const matchedExercise = candidateMap.get(rawId) || candidateMap.get(rawName);

    if (!matchedExercise) {
      hallucinatedIdsFound.push(rawId || rawName || 'unknown-id');
      continue;
    }

    // Bounds checking
    const sets = Math.max(1, Math.min(6, parseInt(item.sets, 10) || 3));
    const reps = Math.max(3, Math.min(50, parseInt(item.reps, 10) || 10));
    const restSeconds = Math.max(15, Math.min(180, parseInt(item.restSeconds, 10) || 60));

    equipmentUsedSet.add(matchedExercise.equipment);

    validatedExercises.push({
      exerciseId: matchedExercise.id,
      exerciseName: matchedExercise.name,
      sets,
      reps,
      restSeconds,
      notes: typeof item.notes === 'string' && item.notes.trim() ? item.notes.trim() : 'Focus on controlled tempo and form.',
      targetMuscle: matchedExercise.primaryMuscles[0] || 'Full Body',
      equipmentRequired: matchedExercise.equipment,
    });
  }

  // If some exercises were hallucinated but we have at least 2 valid ones, we can salvage
  if (validatedExercises.length < 2 && candidateExercises.length >= 2) {
    errors.push('Insufficient valid exercises after hallucination filter.');
    return {
      isValid: false,
      plan: null,
      errors,
      hallucinatedIdsFound,
    };
  }

  const sanitizedPlan: GeneratedWorkoutPlan = {
    id: `routine-${Date.now()}`,
    title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : 'Custom Home Circuit',
    description: typeof parsed.description === 'string' ? parsed.description.trim() : 'Personalized routine matching your exact equipment.',
    targetSplit: (parsed.targetSplit as WorkoutTargetSplit) || fallbackSplit,
    estimatedMinutes: parseInt(parsed.estimatedMinutes, 10) || fallbackDuration,
    difficulty: (parsed.difficulty as ExperienceLevel) || fallbackDifficulty,
    circuitLevel: parsed.circuitLevel || 'level_1',
    totalRounds: parseInt(parsed.totalRounds, 10) || 3,
    exercises: validatedExercises,
    equipmentUsed: Array.from(equipmentUsedSet),
    generatedAt: new Date().toISOString(),
    engineUsed: 'on_device_llm',
  };

  return {
    isValid: true,
    plan: sanitizedPlan,
    errors,
    hallucinatedIdsFound,
  };
}
