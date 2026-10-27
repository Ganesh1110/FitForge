import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type EquipmentCategory =
  | 'dumbbell'
  | 'kettlebell'
  | 'resistance_band'
  | 'pullup_bar'
  | 'dip_station'
  | 'bench'
  | 'cardio'
  | 'barbell'
  | 'mat';

export interface GranularEquipmentItem {
  id: string;
  category: EquipmentCategory;
  name: string;
  weightKg?: number;
  resistanceLevel?: 'light' | 'medium' | 'heavy' | 'extra_heavy';
  bandType?: 'loop' | 'handles';
  maxSpeedKmh?: number;
  quantity: number;
  notes?: string;
  isCustom?: boolean;
}

export type GaragePresetId = 'minimalist' | 'apartment' | 'calisthenics' | 'power_home';

export interface GaragePreset {
  id: GaragePresetId;
  name: string;
  description: string;
  items: Omit<GranularEquipmentItem, 'id'>[];
}

export const GARAGE_PRESETS: GaragePreset[] = [
  {
    id: 'minimalist',
    name: 'Bodyweight Only',
    description: 'Zero equipment needed. High-intensity calisthenics & core.',
    items: [
      {
        category: 'mat',
        name: 'Yoga Exercise Mat',
        quantity: 1,
      },
    ],
  },
  {
    id: 'apartment',
    name: 'Apartment Essentials',
    description: 'Quiet, compact gear: 10kg dumbbells, loop resistance bands, yoga mat.',
    items: [
      {
        category: 'dumbbell',
        name: 'Hex Dumbbell Pair (10kg)',
        weightKg: 10,
        quantity: 2,
      },
      {
        category: 'resistance_band',
        name: 'Latex Loop Band (Medium)',
        resistanceLevel: 'medium',
        bandType: 'loop',
        quantity: 1,
      },
      {
        category: 'mat',
        name: 'Yoga Exercise Mat',
        quantity: 1,
      },
    ],
  },
  {
    id: 'calisthenics',
    name: 'Calisthenics Home Park',
    description: 'Pull-up bar, dip handles, resistance bands for bodyweight mastery.',
    items: [
      {
        category: 'pullup_bar',
        name: 'Doorframe Pull-Up Bar',
        quantity: 1,
      },
      {
        category: 'resistance_band',
        name: 'Assistance Resistance Band (Heavy)',
        resistanceLevel: 'heavy',
        bandType: 'loop',
        quantity: 1,
      },
      {
        category: 'mat',
        name: 'Padded Mat',
        quantity: 1,
      },
    ],
  },
  {
    id: 'power_home',
    name: 'Complete Home Gym',
    description: 'Adjustable dumbbells (up to 20kg), adjustable bench, pull-up bar, and walking pad.',
    items: [
      {
        category: 'dumbbell',
        name: 'Adjustable Dumbbells (20kg pair)',
        weightKg: 20,
        quantity: 2,
      },
      {
        category: 'bench',
        name: 'Incline / Flat Workout Bench',
        quantity: 1,
      },
      {
        category: 'pullup_bar',
        name: 'Wall-Mount Pull-Up Bar',
        quantity: 1,
      },
      {
        category: 'resistance_band',
        name: 'Multi-Resistance Band Set',
        resistanceLevel: 'medium',
        bandType: 'handles',
        quantity: 3,
      },
      {
        category: 'cardio',
        name: 'Under-Desk Walking Pad',
        maxSpeedKmh: 6.0,
        quantity: 1,
      },
    ],
  },
];

interface GarageState {
  items: GranularEquipmentItem[];
  addItem: (item: Omit<GranularEquipmentItem, 'id'>) => void;
  updateItem: (id: string, updates: Partial<GranularEquipmentItem>) => void;
  removeItem: (id: string) => void;
  applyPreset: (presetId: GaragePresetId) => void;
  clearGarage: () => void;
  getAllowedDbEquipmentKeys: () => string[];
}

export const useGarageStore = create<GarageState>()(
  persist(
    (set, get) => ({
      items: [
        {
          id: 'default-mat',
          category: 'mat',
          name: 'Workout Mat',
          quantity: 1,
        },
      ],

      addItem: (item) =>
        set((state) => ({
          items: [
            ...state.items,
            { ...item, id: `gear-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
          ],
        })),

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      applyPreset: (presetId) => {
        const preset = GARAGE_PRESETS.find((p) => p.id === presetId);
        if (!preset) return;
        const newItems: GranularEquipmentItem[] = preset.items.map((it, idx) => ({
          ...it,
          id: `preset-${presetId}-${idx}-${Date.now()}`,
        }));
        set({ items: newItems });
      },

      clearGarage: () => set({ items: [] }),

      getAllowedDbEquipmentKeys: () => {
        const currentItems = get().items;
        const keys = new Set<string>(['body only']); // Bodyweight always supported

        for (const item of currentItems) {
          switch (item.category) {
            case 'dumbbell':
              keys.add('dumbbell');
              break;
            case 'resistance_band':
              keys.add('bands');
              break;
            case 'pullup_bar':
              keys.add('pull-up bar');
              break;
            case 'kettlebell':
              keys.add('kettlebells');
              break;
            case 'barbell':
              keys.add('barbell');
              break;
            case 'cardio':
              keys.add('walking pad');
              break;
            default:
              break;
          }
        }

        return Array.from(keys);
      },
    }),
    {
      name: 'fitforge_garage_storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
