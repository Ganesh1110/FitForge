export interface Exercise {
  id: string;
  name: string;
  category: 'strength' | 'stretching' | 'cardio' | 'plyometrics' | 'powerlifting';
  equipment: string; // 'body only', 'dumbbell', 'bands', 'kettlebells', 'barbell', 'pull-up bar', etc.
  primaryMuscles: string[]; // e.g. ['chest', 'triceps']
  secondaryMuscles: string[];
  instructions: string[];
  level: 'beginner' | 'intermediate' | 'expert';
  force?: 'push' | 'pull' | 'static' | null;
  mechanic?: 'compound' | 'isolation' | null;
  images?: string[];
  is_favorite?: boolean;
}

export interface UserEquipmentItem {
  id: string;
  category: 'bodyweight' | 'dumbbell' | 'kettlebell' | 'resistance_band' | 'pullup_bar' | 'bench' | 'cardio' | 'barbell';
  name: string;
  weight_kg?: number;
  resistance_level?: 'light' | 'medium' | 'heavy' | 'extra_heavy';
  quantity: number;
  notes?: string;
  created_at: string;
}

export interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  target_muscle: string;
  duration_minutes: number;
  created_at: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise?: Exercise;
  sets: number;
  reps: number;
  rest_seconds: number;
  order_index: number;
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  workout_id: string;
  started_at: string;
  completed_at: string;
  total_duration_seconds: number;
  calories_burned?: number;
}
