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
  Zap,
  Volume2,
  CheckCircle,
  Flame,
  ArrowRight,
  ShieldCheck,
  Play,
} from 'lucide-react-native';

import { getExercises } from '@/db/exercise-service';
import { seedDatabaseIfNeeded } from '@/db/seeder';
import { playChime, playCountdownBeep } from '@/services/sound-service';
import { speak } from '@/services/speech-service';

export default function HomeScreen() {
  const router = useRouter();
  const [exerciseCount, setExerciseCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        await seedDatabaseIfNeeded();
        const exercises = await getExercises();
        setExerciseCount(exercises.length);
      } catch (e) {
        console.warn('Home screen stat load failed:', e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleTestAudio = () => {
    playChime();
    speak('Welcome to FitForge. Your local AI fitness engine is ready.');
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

        {/* Quick Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <View style={styles.heroTag}>
              <Sparkles size={14} color="#F59E0B" />
              <Text style={styles.heroTagText}>Smart Home Fitness</Text>
            </View>
            <Text style={styles.heroTitle}>Work out with what you actually have.</Text>
            <Text style={styles.heroSubtitle}>
              Granular gear tracking, offline SQLite database, zero hallucination routines.
            </Text>

            <TouchableOpacity
              style={styles.heroButton}
              activeOpacity={0.8}
              onPress={() => router.push('/library')}>
              <Text style={styles.heroButtonText}>Explore {exerciseCount} Exercises</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Dumbbell size={22} color="#3B82F6" />
            <Text style={styles.metricNumber}>{loading ? '...' : exerciseCount}</Text>
            <Text style={styles.metricLabel}>Offline Catalog</Text>
          </View>

          <View style={styles.metricCard}>
            <Zap size={22} color="#10B981" />
            <Text style={styles.metricNumber}>Instant</Text>
            <Text style={styles.metricLabel}>Local SQLite Engine</Text>
          </View>

          <View style={styles.metricCard}>
            <Flame size={22} color="#F97316" />
            <Text style={styles.metricNumber}>Phase 1</Text>
            <Text style={styles.metricLabel}>Engine Active</Text>
          </View>
        </View>

        {/* Today's Recommended Routine Card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Daily Routine</Text>
        </View>

        <View style={styles.routineCard}>
          <View style={styles.routineHeader}>
            <View>
              <Text style={styles.routineName}>15-Min Calisthenics & Core</Text>
              <Text style={styles.routineDetail}>3 Rounds • Bodyweight Only</Text>
            </View>
            <View style={styles.timeBadge}>
              <Text style={styles.timeBadgeText}>15 MIN</Text>
            </View>
          </View>

          <View style={styles.exercisePreviewList}>
            <View style={styles.previewItem}>
              <CheckCircle size={14} color="#10B981" />
              <Text style={styles.previewItemText}>Standard Push-Ups (12 reps)</Text>
            </View>
            <View style={styles.previewItem}>
              <CheckCircle size={14} color="#10B981" />
              <Text style={styles.previewItemText}>Bodyweight Air Squats (15 reps)</Text>
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
              speak('Starting 15 minute calisthenics routine. First exercise: Standard push-ups.');
            }}>
            <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.startRoutineText}>Start Audio Guided Routine</Text>
          </TouchableOpacity>
        </View>

        {/* Phase Roadmap Quick Links */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Navigation</Text>
        </View>

        <View style={styles.navGrid}>
          <TouchableOpacity
            style={styles.navTile}
            activeOpacity={0.7}
            onPress={() => router.push('/library')}>
            <View style={[styles.tileIcon, { backgroundColor: '#1E3A8A' }]}>
              <Dumbbell size={20} color="#60A5FA" />
            </View>
            <Text style={styles.tileTitle}>Exercise Library</Text>
            <Text style={styles.tileDesc}>Full offline catalog with audio cues</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTile}
            activeOpacity={0.7}
            onPress={() => router.push('/garage')}>
            <View style={[styles.tileIcon, { backgroundColor: '#064E3B' }]}>
              <Zap size={20} color="#34D399" />
            </View>
            <Text style={styles.tileTitle}>Equipment Garage</Text>
            <Text style={styles.tileDesc}>Manage home weights & gear</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
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
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#242A38',
  },
  metricNumber: {
    fontSize: 18,
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
    fontSize: 18,
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
