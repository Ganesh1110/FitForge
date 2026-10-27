import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Body, { ExtendedBodyPart, Slug } from 'react-native-body-highlighter';
import { X, Sparkles, User } from 'lucide-react-native';

export type BodyView = 'front' | 'back';
export type BodyGender = 'male' | 'female';

interface MuscleMapProps {
  selectedMuscle: string;
  onSelectMuscle: (muscle: string) => void;
}

export const SLUG_TO_APP_MUSCLE: Record<string, string> = {
  chest: 'chest',
  deltoids: 'shoulders',
  biceps: 'biceps',
  triceps: 'triceps',
  abs: 'abdominals',
  obliques: 'abdominals',
  quadriceps: 'quadriceps',
  hamstring: 'hamstrings',
  gluteal: 'glutes',
  'upper-back': 'lats',
  trapezius: 'middle back',
  'lower-back': 'lower back',
  calves: 'cardiovascular system',
  tibialis: 'cardiovascular system',
  forearm: 'biceps',
  adductors: 'quadriceps',
};

export const APP_MUSCLE_TO_SLUGS: Record<string, Slug[]> = {
  chest: ['chest'],
  shoulders: ['deltoids'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  abdominals: ['abs', 'obliques'],
  quadriceps: ['quadriceps', 'adductors'],
  hamstrings: ['hamstring'],
  glutes: ['gluteal'],
  lats: ['upper-back'],
  'middle back': ['trapezius', 'upper-back'],
  back: ['trapezius', 'upper-back', 'lower-back'],
  'lower back': ['lower-back'],
  'cardiovascular system': ['calves', 'tibialis'],
};

export const MUSCLE_DETAILS: Record<string, { name: string; anatomicalName: string }> = {
  chest: { name: 'Chest', anatomicalName: 'Pectoralis Major' },
  shoulders: { name: 'Shoulders', anatomicalName: 'Deltoids' },
  biceps: { name: 'Biceps', anatomicalName: 'Biceps Brachii' },
  triceps: { name: 'Triceps', anatomicalName: 'Triceps Brachii' },
  abdominals: { name: 'Abs & Core', anatomicalName: 'Rectus Abdominis & Obliques' },
  quadriceps: { name: 'Quads', anatomicalName: 'Quadriceps Femoris' },
  hamstrings: { name: 'Hamstrings', anatomicalName: 'Biceps Femoris' },
  glutes: { name: 'Glutes', anatomicalName: 'Gluteus Maximus' },
  lats: { name: 'Lats', anatomicalName: 'Latissimus Dorsi' },
  'middle back': { name: 'Upper Back', anatomicalName: 'Trapezius & Rhomboids' },
  'lower back': { name: 'Lower Back', anatomicalName: 'Erector Spinae' },
  'cardiovascular system': { name: 'Cardio / Calves', anatomicalName: 'Aerobic & Lower Body' },
};

export function MuscleMap({ selectedMuscle, onSelectMuscle }: MuscleMapProps) {
  const [view, setView] = useState<BodyView>('front');
  const [gender, setGender] = useState<BodyGender>('male');

  const activeDef = MUSCLE_DETAILS[selectedMuscle];

  // Map selected app muscle to highlighter slugs
  const activeSlugs = APP_MUSCLE_TO_SLUGS[selectedMuscle] || [];
  const bodyData: ExtendedBodyPart[] = activeSlugs.map((slug) => ({
    slug,
    intensity: 1,
    color: '#0284C7',
    styles: {
      fill: '#0284C7',
      stroke: '#38BDF8',
      strokeWidth: 2,
    },
  }));

  const handleBodyPartPress = (part: ExtendedBodyPart) => {
    if (!part?.slug) return;
    const appMuscle = SLUG_TO_APP_MUSCLE[part.slug] || part.slug;

    if (selectedMuscle === appMuscle) {
      onSelectMuscle('all');
    } else {
      onSelectMuscle(appMuscle);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar: Title & Controls (Front/Back + Male/Female) */}
      <View style={styles.topBar}>
        <View style={styles.titleArea}>
          <View style={styles.badgeRow}>
            <Sparkles size={13} color="#38BDF8" />
            <Text style={styles.brandTitle}>Anatomical Body Map</Text>
          </View>
          <Text style={styles.instructionText}>
            Tap a muscle to isolate exercises
          </Text>
        </View>

        <View style={styles.controlsGroup}>
          {/* Gender Switch */}
          <TouchableOpacity
            style={styles.genderBtn}
            activeOpacity={0.7}
            onPress={() => setGender(gender === 'male' ? 'female' : 'male')}>
            <User size={12} color="#94A3B8" />
            <Text style={styles.genderText}>
              {gender === 'male' ? 'M' : 'F'}
            </Text>
          </TouchableOpacity>

          {/* Front / Back Segmented Pill */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segmentBtn, view === 'front' && styles.segmentBtnActive]}
              activeOpacity={0.7}
              onPress={() => setView('front')}>
              <Text
                style={[
                  styles.segmentText,
                  view === 'front' && styles.segmentTextActive,
                ]}>
                Front
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, view === 'back' && styles.segmentBtnActive]}
              activeOpacity={0.7}
              onPress={() => setView('back')}>
              <Text
                style={[
                  styles.segmentText,
                  view === 'back' && styles.segmentTextActive,
                ]}>
                Back
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Anatomical Silhouette Canvas rendered via react-native-body-highlighter */}
      <View style={styles.silhouetteContainer}>
        <Body
          data={bodyData}
          onBodyPartPress={handleBodyPartPress}
          side={view}
          gender={gender}
          scale={0.65}
          border="#FFFFFF"
          defaultFill="#1A202C"
          defaultStroke="#FFFFFF"
          defaultStrokeWidth={1.4}
          colors={['#0284C7', '#38BDF8']}
        />
      </View>

      {/* Target Status Banner */}
      <View style={styles.statusBar}>
        {activeDef ? (
          <View style={styles.activePill}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>
              Target: <Text style={styles.activeBold}>{activeDef.name}</Text> ({activeDef.anatomicalName})
            </Text>
            <TouchableOpacity
              onPress={() => onSelectMuscle('all')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.clearBtn}>
              <X size={14} color="#38BDF8" />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.hintText}>
            Tap any muscle on the model to isolate exercises
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#10141E',
    borderRadius: 20,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1F2637',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleArea: {
    flex: 1,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  instructionText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  controlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  genderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#19202E',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#283348',
  },
  genderText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#19202E',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#283348',
  },
  segmentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  segmentBtnActive: {
    backgroundColor: '#0284C7',
  },
  segmentText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  silhouetteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  statusBar: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderWidth: 1,
    borderColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  activeText: {
    fontSize: 12,
    color: '#E0F2FE',
  },
  activeBold: {
    fontWeight: '800',
    color: '#38BDF8',
  },
  clearBtn: {
    marginLeft: 4,
    padding: 2,
  },
  hintText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
});
