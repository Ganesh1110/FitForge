import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Dumbbell,
  Sparkles,
  Volume2,
  CheckCircle,
  Flame,
  ShieldCheck,
  Play,
  Wrench,
  Target,
} from 'lucide-react-native';

import { useUserStore } from '@/store/user-store';
import { useGarageStore } from '@/store/garage-store';
import { useActiveWorkoutStore } from '@/store/active-workout-store';
import { generateWorkout } from '@/ai/workout-service';
import { calculateEquipmentCoverage, EquipmentCoverage } from '@/services/filter-service';
import { OnboardingModal } from '@/components/onboarding-modal';
import { MuscleRecoveryCard } from '@/components/muscle-recovery-card';
import { playChime } from '@/services/sound-service';
import { speak } from '@/services/speech-service';

export default function HomeScreen() {
  const router = useRouter();

  const { isOnboarded, goal, experienceLevel, preferredDurationMinutes } = useUserStore();
  const { items: garageItems } = useGarageStore();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [coverage, setCoverage] = useState<EquipmentCoverage | null>(null);

  useEffect(() => {
    if (!isOnboarded) {
      setShowOnboarding(true);
    }
  }, [isOnboarded]);

  useEffect(() => {
    async function updateStats() {
      try {
        const cov = await calculateEquipmentCoverage();
        setCoverage(cov);
      } catch (e) {
        console.warn(e);
      }
    }
    updateStats();
  }, [garageItems]);

  const handleTestAudio = () => {
    playChime();
    speak(`FitForge local engine is active. Target focus: ${goal}. Equipment garage ready.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.appTitle}>FitForge</Text>
            <View style={styles.badgeRow}>
              <View style={styles.localBadge}>
                <ShieldCheck size={12} color="#10B981" />
                <Text style={styles.localBadgeText}>100% On-Device & Offline</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.audioTestIcon} onPress={handleTestAudio}>
            <Volume2 size={20} color="#60A5FA" />
          </TouchableOpacity>
        </View>

        {/* Hero Banner with User's Configured Setup */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <View style={styles.heroTag}>
              <Sparkles size={14} color="#F59E0B" />
              <Text style={styles.heroTagText}>
                {goal.toUpperCase()} • {experienceLevel.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.heroTitle}>Your Home Routine</Text>
            <Text style={styles.heroSubtitle}>
              Tailored to your {preferredDurationMinutes}-min sessions and {garageItems.length} logged items in your Equipment Garage.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                style={[styles.heroButton, { flex: 1, backgroundColor: '#2563EB' }]}
                activeOpacity={0.8}
                onPress={() => router.push('/workout/generate' as any)}>
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.heroButtonText}>AI Workout Generator</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.heroButton, { backgroundColor: '#1E232E', paddingHorizontal: 12 }]}
                activeOpacity={0.8}
                onPress={() => router.push('/library')}>
                <Text style={[styles.heroButtonText, { color: '#9CA3AF' }]}>Library</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Status Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Dumbbell size={20} color="#3B82F6" />
            <Text style={styles.metricNumber}>
              {coverage ? `${coverage.accessibleExercises}/${coverage.totalExercises}` : '...'}
            </Text>
            <Text style={styles.metricLabel}>Unlocked Exercises</Text>
          </View>

          <View style={styles.metricCard}>
            <Wrench size={20} color="#10B981" />
            <Text style={styles.metricNumber}>{garageItems.length}</Text>
            <Text style={styles.metricLabel}>Garage Items</Text>
          </View>

          <View style={styles.metricCard}>
            <Target size={20} color="#F59E0B" />
            <Text style={styles.metricNumber}>{coverage ? `${coverage.coveragePercentage}%` : '...'}</Text>
            <Text style={styles.metricLabel}>Gear Coverage</Text>
          </View>
        </View>

        {/* Real-time Muscle Recovery & Fatigue Tracker (openGym Grade) */}
        <MuscleRecoveryCard />

        {/* Today's Recommended Routine Card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today&apos;s Recommended Routine</Text>
        </View>

        <View style={styles.routineCard}>
          <View style={styles.routineHeader}>
            <View>
              <Text style={styles.routineName}>Full-Body Home Circuit</Text>
              <Text style={styles.routineDetail}>
                {preferredDurationMinutes} Min • {goal.replace('_', ' ')}
              </Text>
            </View>
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>{preferredDurationMinutes} MIN</Text>
            </View>
          </View>

          <View style={styles.exercisePreviewList}>
            <View style={styles.previewItem}>
              <CheckCircle size={14} color="#10B981" />
              <Text style={styles.previewItemText}>Standard Push-Ups (12 reps)</Text>
            </View>
            <View style={styles.previewItem}>
              <CheckCircle size={14} color="#10B981" />
              <Text style={styles.previewItemText}>Air Squats (15 reps)</Text>
            </View>
            <View style={styles.previewItem}>
              <CheckCircle size={14} color="#10B981" />
              <Text style={styles.previewItemText}>Forearm Plank (45 sec)</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.startRoutineBtn}
            onPress={async () => {
              const availableEquipment = useGarageStore.getState().getAllowedDbEquipmentKeys();
              const plan = await generateWorkout({
                split: 'full_body',
                durationMinutes: preferredDurationMinutes,
                intensity: experienceLevel,
                goal,
                availableEquipment,
              });
              useActiveWorkoutStore.getState().startWorkout(plan);
              router.push('/workout/player' as any);
            }}>
            <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.startRoutineText}>Start Audio Guided Routine</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Hub Navigation */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Equipment & Setup Hub</Text>
        </View>

        <View style={styles.navGrid}>
          <TouchableOpacity
            style={styles.navTile}
            activeOpacity={0.7}
            onPress={() => router.push('/garage')}>
            <View style={[styles.tileIcon, { backgroundColor: '#064E3B' }]}>
              <Wrench size={20} color="#34D399" />
            </View>
            <Text style={styles.tileTitle}>Equipment Garage</Text>
            <Text style={styles.tileDesc}>Edit weights, plates, and bands</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTile}
            activeOpacity={0.7}
            onPress={() => setShowOnboarding(true)}>
            <View style={[styles.tileIcon, { backgroundColor: '#1E3A8A' }]}>
              <Flame size={20} color="#60A5FA" />
            </View>
            <Text style={styles.tileTitle}>Goals & Preferences</Text>
            <Text style={styles.tileDesc}>Adjust training focus & split</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Onboarding Flow Modal */}
      <OnboardingModal
        visible={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0C11',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  localBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  localBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  audioTestIcon: {
    padding: 10,
    borderRadius: 22,
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: '#263045',
  },
  heroBanner: {
    backgroundColor: '#131826',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#222E47',
    marginBottom: 22,
    ...Platform.select({
      ios: {
        shadowColor: '#1E3A8A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 8px 24px rgba(30, 58, 138, 0.2)',
      },
    }),
  },
  heroContent: {},
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  heroTagText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 30,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 18,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#111520',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1D2434',
  },
  metricNumber: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  routineCard: {
    backgroundColor: '#111520',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1D2434',
    marginBottom: 26,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  routineName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  routineDetail: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 3,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  timeBadge: {
    backgroundColor: '#1A2234',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3752',
  },
  timeBadgeText: {
    color: '#FB923C',
    fontWeight: '800',
    fontSize: 11,
  },
  exercisePreviewList: {
    gap: 10,
    marginBottom: 18,
    paddingVertical: 4,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewItemText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '500',
  },
  startRoutineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  startRoutineText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  navGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  navTile: {
    flex: 1,
    backgroundColor: '#111520',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1D2434',
  },
  tileIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tileDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    fontWeight: '500',
  },
});
