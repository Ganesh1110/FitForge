import { Exercise } from '@/db/schema';
import { WorkoutGenerationRequest } from './types';

export interface PromptPayload {
  systemPrompt: string;
  userPrompt: string;
  allowedExerciseCatalog: { id: string; name: string; equipment: string; muscles: string[] }[];
}

export function buildWorkoutPrompt(
  request: WorkoutGenerationRequest,
  candidateExercises: Exercise[]
): PromptPayload {
  const catalogSummary = candidateExercises.map((e) => ({
    id: e.id,
    name: e.name,
    equipment: e.equipment,
    muscles: e.primaryMuscles,
  }));

  const systemPrompt = `You are FitForge AI, an expert home fitness coach and exercise physiologist.
Your task is to design a balanced, safe, progressive home workout plan based EXCLUSIVELY on the user's available equipment and goals.

CRITICAL CONSTRAINTS:
1. ZERO HALLUCINATIONS: You MUST ONLY select exercise IDs from the provided Candidate Catalog. Never invent or rename exercise IDs.
2. EQUIPMENT MATCHING: Every chosen exercise MUST be performable using only the user's logged equipment.
3. OUTPUT FORMAT: Respond ONLY with a valid, parseable JSON object matching the requested schema. Do not include markdown code block backticks, explanations, or any conversational filler.`;

  const schemaExample = {
    title: 'string (e.g., "Full Body Dumbbell & Core Burn")',
    description: 'string (brief 1-2 sentence overview of workout stimulus)',
    targetSplit: request.split,
    estimatedMinutes: request.durationMinutes,
    difficulty: request.intensity,
    exercises: [
      {
        exerciseId: 'exact ID matching candidate catalog (e.g., "dumbbell-floor-press")',
        sets: 3,
        reps: 10,
        restSeconds: 60,
        notes: 'Coaching cue for tempo and form',
      },
    ],
  };

  const userPrompt = `Generate a ${request.durationMinutes}-minute ${request.split.replace(
    '_',
    ' '
  )} workout plan.

USER CONSTRAINTS:
- Primary Fitness Goal: ${request.goal}
- Experience Level: ${request.intensity}
- Session Duration: ${request.durationMinutes} minutes
- Available Equipment: ${request.availableEquipment.join(', ')}

CANDIDATE EXERCISE CATALOG (CHOOSE ONLY FROM THIS LIST):
${JSON.stringify(catalogSummary, null, 2)}

REQUIRED JSON SCHEMA:
${JSON.stringify(schemaExample, null, 2)}`;

  return {
    systemPrompt,
    userPrompt,
    allowedExerciseCatalog: catalogSummary,
  };
}
