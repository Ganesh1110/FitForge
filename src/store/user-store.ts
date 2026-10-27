import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FitnessGoal = 'hypertrophy' | 'strength' | 'fat_loss' | 'endurance' | 'mobility';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
  name: string;
  goal: FitnessGoal;
  experienceLevel: ExperienceLevel;
  preferredDurationMinutes: number; // 15, 30, 45, 60
  workoutDaysPerWeek: number; // 3, 4, 5, 6
  voiceCoachEnabled: boolean;
  soundEffectsEnabled: boolean;
  isOnboarded: boolean;
}

interface UserState extends UserProfile {
  setProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  resetProfile: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Athlete',
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
