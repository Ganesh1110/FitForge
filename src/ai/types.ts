import { FitnessGoal, ExperienceLevel } from '@/store/user-store';

export type WorkoutTargetSplit =
  | 'full_body'
  | 'upper_body'
  | 'lower_body'
  | 'push'
  | 'pull'
  | 'core_cardio';

export type DarebeeLevel = 'level_1' | 'level_2' | 'level_3';

export interface WorkoutGenerationRequest {
  split: WorkoutTargetSplit;
  durationMinutes: number; // 15, 30, 45, 60
  intensity: ExperienceLevel;
  goal: FitnessGoal;
  availableEquipment: string[]; // ['body only', 'dumbbell', 'bands', ...]
  circuitLevel?: DarebeeLevel; // DAREBEE circuit scaling: Level 1 (3 rounds), Level 2 (5 rounds), Level 3 (7 rounds)
  customNotes?: string;
}

export interface GeneratedExerciseItem {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  restSeconds: number;
  notes: string;
  targetMuscle: string;
  equipmentRequired: string;
}

export interface GeneratedWorkoutPlan {
  id: string;
  title: string;
  description: string;
  targetSplit: WorkoutTargetSplit;
  estimatedMinutes: number;
  difficulty: ExperienceLevel;
  circuitLevel?: DarebeeLevel;
  totalRounds: number;
  exercises: GeneratedExerciseItem[];
  equipmentUsed: string[];
  generatedAt: string;
  engineUsed: 'heuristic_rules' | 'on_device_llm';
}

export interface LocalLLMModelInfo {
  id: string;
  name: string;
  tagline: string;
  sizeBytes: number;
  formattedSize: string;
  quantization: string;
  architecture: string;
  downloadUrl: string;
  isDownloaded: boolean;
  downloadProgress: number; // 0 - 100
  downloadStatus: 'idle' | 'downloading' | 'paused' | 'ready' | 'error';
  errorMessage?: string;
}
