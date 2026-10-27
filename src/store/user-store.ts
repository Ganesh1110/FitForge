import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FitnessGoal = 'hypertrophy' | 'strength' | 'fat_loss' | 'endurance' | 'mobility';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type UserGender = 'male' | 'female';

export interface UserProfile {
  name: string;
  gender: UserGender;
  age: number; // in years
  weightKg: number; // in kilograms
  heightCm: number; // in centimeters
  goal: FitnessGoal;
  experienceLevel: ExperienceLevel;
  preferredDurationMinutes: number; // 15, 30, 45, 60
  workoutDaysPerWeek: number; // 3, 4, 5, 6
  voiceCoachEnabled: boolean;
  soundEffectsEnabled: boolean;
  isOnboarded: boolean;
}

export interface BmiResult {
  bmi: number;
  label: 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
  color: string;
}

export function calculateBmi(weightKg: number, heightCm: number): BmiResult {
  if (!weightKg || !heightCm) {
    return { bmi: 22.5, label: 'Normal', color: '#10B981' };
  }
  const heightM = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));

  if (bmi < 18.5) {
    return { bmi, label: 'Underweight', color: '#38BDF8' };
  } else if (bmi < 25) {
    return { bmi, label: 'Normal', color: '#10B981' };
  } else if (bmi < 30) {
    return { bmi, label: 'Overweight', color: '#F59E0B' };
  } else {
    return { bmi, label: 'Obese', color: '#EF4444' };
  }
}

interface UserState extends UserProfile {
  setProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  resetProfile: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Athlete',
  gender: 'male',
  age: 28,
  weightKg: 75,
  heightCm: 175,
  goal: 'hypertrophy',
  experienceLevel: 'intermediate',
  preferredDurationMinutes: 30,
  workoutDaysPerWeek: 4,
  voiceCoachEnabled: true,
  soundEffectsEnabled: true,
  isOnboarded: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...DEFAULT_PROFILE,
      setProfile: (updates) => set((state) => ({ ...state, ...updates })),
      completeOnboarding: () => set({ isOnboarded: true }),
      resetProfile: () => set({ ...DEFAULT_PROFILE, isOnboarded: false }),
    }),
    {
      name: 'fitforge_user_storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
