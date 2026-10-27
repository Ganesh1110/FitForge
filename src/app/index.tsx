import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { calculateEquipmentCoverage, EquipmentCoverage } from '@/services/filter-service';
import { OnboardingModal } from '@/components/onboarding-modal';
import { playChime, playCountdownBeep } from '@/services/sound-service';
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
            onPress={() => {
              playCountdownBeep();
              speak('Starting workout. Get ready for Push-Ups.');
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
    backgroundColor: '#0F1115',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 110,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#F9FAFB',
    letterSpacing: -0.5,
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
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  localBadgeText: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: '700',
  },
  audioTestIcon: {
    padding: 10,
    borderRadius: 22,
    backgroundColor: '#1E232F',
    borderWidth: 1,
    borderColor: '#2D3545',
  },
  heroBanner: {
    backgroundColor: '#161922',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#252B3B',
    marginBottom: 20,
  },
  heroContent: {},
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  heroTagText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 16,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#161922',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#242A38',
  },
  metricNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F9FAFB',
    marginTop: 6,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  routineCard: {
    backgroundColor: '#161922',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#252B3B',
    marginBottom: 24,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  routineName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  routineDetail: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  timeBadge: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeBadgeText: {
    color: '#F97316',
    fontWeight: '700',
    fontSize: 11,
  },
  exercisePreviewList: {
    gap: 8,
    marginBottom: 16,
    paddingVertical: 4,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewItemText: {
    color: '#D1D5DB',
    fontSize: 13,
  },
  startRoutineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
  },
  startRoutineText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  navGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  navTile: {
    flex: 1,
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#242A38',
  },
  tileIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  tileDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
});
