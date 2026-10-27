import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Volume2,
  Sparkles,
  Activity,
  ArrowRight,
} from 'lucide-react-native';

import { Exercise } from '@/db/schema';
import { getExerciseById } from '@/db/exercise-service';
import { speak } from '@/services/speech-service';

interface VisualExerciseGuideProps {
  exerciseId: string;
  fallbackName: string;
}

export function VisualExerciseGuide({ exerciseId, fallbackName }: VisualExerciseGuideProps) {
  const [exercise, setExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getExerciseById(exerciseId);
        setExercise(data);
      } catch (e) {
        console.warn('Error loading exercise for visual guide:', e);
      }
    }
    load();
  }, [exerciseId]);

  const handleReadFormCues = () => {
    if (!exercise) return;
    const cues = `${exercise.name}. Form instructions: ${exercise.instructions.join('. ')}`;
    speak(cues);
  };

  const primaryMuscle = exercise?.primaryMuscles[0] || 'Target Muscle';
  const equipment = exercise?.equipment || 'Bodyweight';
  const instructions = exercise?.instructions || [
    'Maintain a strong, braced core and neutral spine.',
    'Initiate movement with controlled tempo through full range of motion.',
    'Squeeze target muscles at the peak contraction for one second.',
    'Control the eccentric lowering phase smoothly.',
  ];

  return (
    <View style={styles.card}>
      {/* Header with audio trigger */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{exercise?.name || fallbackName}</Text>
          <View style={styles.tagRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{primaryMuscle.toUpperCase()}</Text>
            </View>
            <View style={[styles.badge, styles.equipBadge]}>
              <Text style={styles.equipBadgeText}>{equipment.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.voiceBtn} onPress={handleReadFormCues}>
          <Volume2 size={16} color="#60A5FA" />
          <Text style={styles.voiceBtnText}>Form Audio</Text>
        </TouchableOpacity>
      </View>

      {/* Visual Start & Contracted Position Representation */}
      <View style={styles.positionsContainer}>
        <View style={styles.positionBox}>
          <View style={styles.phaseIndicator}>
            <Text style={styles.phaseIndicatorText}>PHASE 1</Text>
          </View>
          <View style={styles.poseGraphicBox}>
            <Activity size={24} color="#60A5FA" />
            <Text style={styles.poseText}>Starting Stance</Text>
          </View>
          <Text style={styles.positionCaption}>Stable base, core braced</Text>
        </View>

        <View style={styles.positionArrow}>
          <ArrowRight size={18} color="#4B5563" />
        </View>

        <View style={styles.positionBox}>
          <View style={[styles.phaseIndicator, { backgroundColor: '#064E3B' }]}>
            <Text style={[styles.phaseIndicatorText, { color: '#6EE7B7' }]}>PHASE 2</Text>
          </View>
          <View style={[styles.poseGraphicBox, { borderColor: '#10B981' }]}>
            <Sparkles size={24} color="#10B981" />
            <Text style={[styles.poseText, { color: '#10B981' }]}>Peak Contraction</Text>
          </View>
          <Text style={styles.positionCaption}>Full range, 1s pause</Text>
        </View>
      </View>

      {/* Step-by-Step Instructions */}
      <Text style={styles.instructionsHeading}>Execution & Posture Checklist</Text>
      <View style={styles.instructionList}>
        {instructions.map((step, idx) => (
          <View key={idx} style={styles.stepItem}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>{idx + 1}</Text>
            </View>
            <Text style={styles.stepItemText}>{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161922',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#242A38',
    marginTop: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F9FAFB',
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  equipBadge: {
    backgroundColor: '#202532',
  },
  equipBadgeText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
  },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  voiceBtnText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
  },
  positionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111318',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1F2430',
  },
  positionBox: {
    flex: 1,
    alignItems: 'center',
  },
  positionArrow: {
    paddingHorizontal: 6,
  },
  phaseIndicator: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  phaseIndicatorText: {
    color: '#93C5FD',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  poseGraphicBox: {
    width: '100%',
    height: 70,
    backgroundColor: '#181C25',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#293040',
    gap: 4,
  },
  poseText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60A5FA',
  },
  positionCaption: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'center',
  },
  instructionsHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 10,
  },
  instructionList: {
    gap: 10,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  stepNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  stepItemText: {
    flex: 1,
    fontSize: 13,
    color: '#D1D5DB',
    lineHeight: 18,
  },
});
