import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Volume2,
  CheckCircle2,
  Trophy,
  Flame,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

import { useActiveWorkoutStore } from '@/store/active-workout-store';
import { useUserStore } from '@/store/user-store';
import { VisualExerciseGuide } from '@/components/visual-exercise-guide';
import { speak, stopSpeech } from '@/services/speech-service';

export default function WorkoutPlayerScreen() {
  const router = useRouter();

  const {
    isActive,
    plan,
    currentExerciseIndex,
    currentSetIndex,
    phase,
    timeRemainingSeconds,
    phaseDurationSeconds,
    isPaused,
    elapsedTotalSeconds,
    tick,
    pauseWorkout,
    resumeWorkout,
    markSetCompleted,
    skipPhaseOrExercise,
    previousExercise,
    exitWorkout,
  } = useActiveWorkoutStore();

  const [showExitModal, setShowExitModal] = useState(false);
  const [guideExpanded, setGuideExpanded] = useState(true);

  // Background-safe interval ticker
  useEffect(() => {
    if (!isActive || phase === 'complete') return;

    const intervalId = setInterval(() => {
      tick();
    }, 500);

    return () => clearInterval(intervalId);
  }, [isActive, phase, tick]);

  if (!isActive || !plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Active Workout</Text>
          <Text style={styles.emptySubtitle}>
            Generate or select a routine to launch the interactive player.
          </Text>
          <TouchableOpacity
            style={styles.returnBtn}
            onPress={() => router.replace('/workout/generate')}>
            <Text style={styles.returnBtnText}>Open AI Generator</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentExercise = plan.exercises[currentExerciseIndex] || plan.exercises[0];
  const progressPercent = phaseDurationSeconds > 0
    ? Math.max(0, Math.min(100, ((phaseDurationSeconds - timeRemainingSeconds) / phaseDurationSeconds) * 100))
    : 0;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSpeakCurrent = () => {
    if (phase === 'work') {
      speak(`${currentExercise.exerciseName}. Target: ${currentExercise.reps} reps. ${currentExercise.notes}`);
    } else if (phase === 'rest') {
      speak(`Rest for ${timeRemainingSeconds} seconds. Next up: ${currentExercise.exerciseName}.`);
    } else {
      speak(`Get ready for ${currentExercise.exerciseName}.`);
    }
  };

  // Completion Screen View
  if (phase === 'complete') {
    const totalMinutes = Math.max(1, Math.round(elapsedTotalSeconds / 60));
    const { weightKg } = useUserStore.getState();
    const userWeight = weightKg || 75;
    const estimatedCalories = Math.round(((6.0 * 3.5 * userWeight) / 200) * totalMinutes);

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.completeContent}>
          <View style={styles.trophyCircle}>
            <Trophy size={48} color="#F59E0B" />
          </View>

          <Text style={styles.completeTitle}>Workout Crushed!</Text>
          <Text style={styles.completeSubtitle}>
            {plan.title} is logged to your device history.
          </Text>

          {/* Stat highlights */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Clock size={22} color="#60A5FA" />
              <Text style={styles.summaryNumber}>{formatTimer(elapsedTotalSeconds)}</Text>
              <Text style={styles.summaryLabel}>Total Time</Text>
            </View>

            <View style={styles.summaryCard}>
              <Flame size={22} color="#F97316" />
              <Text style={styles.summaryNumber}>{estimatedCalories} kcal</Text>
              <Text style={styles.summaryLabel}>Est. Burned</Text>
            </View>

            <View style={styles.summaryCard}>
              <CheckCircle2 size={22} color="#10B981" />
              <Text style={styles.summaryNumber}>{plan.exercises.length}</Text>
              <Text style={styles.summaryLabel}>Movements</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => {
              exitWorkout();
              router.replace('/');
            }}>
            <Text style={styles.doneBtnText}>Return to Home Dashboard</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Controls Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowExitModal(true)}>
          <X size={20} color="#F9FAFB" />
        </TouchableOpacity>

        <View style={styles.topInfo}>
          <Text style={styles.workoutHeaderTitle} numberOfLines={1}>
            {plan.title}
          </Text>
          <Text style={styles.exerciseIndexSub}>
            Exercise {currentExerciseIndex + 1} of {plan.exercises.length}
          </Text>
        </View>

        <TouchableOpacity style={styles.iconBtn} onPress={handleSpeakCurrent}>
          <Volume2 size={20} color="#60A5FA" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Phase Pill */}
        <View style={styles.phasePillRow}>
          <View
            style={[
              styles.phaseBadge,
              phase === 'work' && styles.phaseBadgeWork,
              phase === 'rest' && styles.phaseBadgeRest,
              phase === 'prepare' && styles.phaseBadgePrep,
            ]}>
            <Text
              style={[
                styles.phaseBadgeText,
                phase === 'work' && styles.phaseBadgeTextWork,
                phase === 'rest' && styles.phaseBadgeTextRest,
                phase === 'prepare' && styles.phaseBadgeTextPrep,
              ]}>
              {phase === 'work' ? 'WORK INTERVAL' : phase === 'rest' ? 'REST & RECOVER' : 'GET READY'}
            </Text>
          </View>
        </View>

        {/* Big Circular Styled Timer Display */}
        <View style={styles.timerDisplayContainer}>
          <View style={styles.timerCircle}>
            <Text style={styles.timerDigits}>{formatTimer(timeRemainingSeconds)}</Text>
            <Text style={styles.timerSubLabel}>
              {phase === 'work' ? `Target: ${currentExercise.reps} reps` : 'Next round soon'}
            </Text>
          </View>

          {/* Progress bar line */}
          <View style={styles.progressLineTrack}>
            <View style={[styles.progressLineFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Current Exercise Headline */}
        <View style={styles.exerciseHeadlineCard}>
          <Text style={styles.exerciseHeadlineName}>{currentExercise.exerciseName}</Text>
          <Text style={styles.setCounterText}>
            Round {currentSetIndex} of {currentExercise.sets} {plan.circuitLevel ? `• ${plan.circuitLevel.replace('_', ' ').toUpperCase()}` : '• Circuit Flow'}
          </Text>
        </View>

        {/* Player Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.auxBtn}
            disabled={currentExerciseIndex === 0}
            onPress={previousExercise}>
            <SkipBack size={20} color={currentExerciseIndex === 0 ? '#4B5563' : '#FFFFFF'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playPauseBtn, isPaused && styles.playPauseBtnPaused]}
            onPress={isPaused ? resumeWorkout : pauseWorkout}>
            {isPaused ? (
              <Play size={28} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Pause size={28} color="#FFFFFF" fill="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.auxBtn} onPress={skipPhaseOrExercise}>
            <SkipForward size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Quick Done / Next Set Button */}
        <TouchableOpacity
          style={styles.completeSetBtn}
          activeOpacity={0.8}
          onPress={markSetCompleted}>
          <CheckCircle2 size={18} color="#FFFFFF" />
          <Text style={styles.completeSetBtnText}>
            {phase === 'work' ? 'Done Set • Start Rest' : phase === 'rest' ? 'Skip Rest • Start Next Set' : 'Start Set Now'}
          </Text>
        </TouchableOpacity>

        {/* Visual Exercise Guide Accordion */}
        <TouchableOpacity
          style={styles.accordionToggle}
          onPress={() => setGuideExpanded(!guideExpanded)}>
          <Text style={styles.accordionTitle}>Visual Posture Guide & Instructions</Text>
          {guideExpanded ? (
            <ChevronUp size={18} color="#9CA3AF" />
          ) : (
            <ChevronDown size={18} color="#9CA3AF" />
          )}
        </TouchableOpacity>

        {guideExpanded && (
          <VisualExerciseGuide
            exerciseId={currentExercise.exerciseId}
            fallbackName={currentExercise.exerciseName}
          />
        )}
      </ScrollView>

      {/* Exit Confirmation Modal */}
      <Modal visible={showExitModal} transparent animationType="fade">
        <View style={styles.exitModalBackdrop}>
          <View style={styles.exitModalBox}>
            <Text style={styles.exitModalTitle}>Quit Current Workout?</Text>
            <Text style={styles.exitModalSub}>
              Your current workout progress will be stopped.
            </Text>
            <View style={styles.exitModalBtnRow}>
              <TouchableOpacity
                style={styles.exitModalCancelBtn}
                onPress={() => setShowExitModal(false)}>
                <Text style={styles.exitModalCancelText}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exitModalConfirmBtn}
                onPress={() => {
                  stopSpeech();
                  exitWorkout();
                  setShowExitModal(false);
                  router.replace('/');
                }}>
                <Text style={styles.exitModalConfirmText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1E27',
  },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#1E232E',
  },
  topInfo: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  workoutHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F9FAFB',
  },
  exerciseIndexSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  phasePillRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  phaseBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1E232E',
  },
  phaseBadgePrep: {
    backgroundColor: '#271D0E',
    borderWidth: 1,
    borderColor: '#784E12',
  },
  phaseBadgeWork: {
    backgroundColor: '#064E3B',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  phaseBadgeRest: {
    backgroundColor: '#172554',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  phaseBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  phaseBadgeTextPrep: {
    color: '#FCD34D',
  },
  phaseBadgeTextWork: {
    color: '#6EE7B7',
  },
  phaseBadgeTextRest: {
    color: '#93C5FD',
  },
  timerDisplayContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#141720',
    borderWidth: 3,
    borderColor: '#242A38',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timerDigits: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  timerSubLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '600',
  },
  progressLineTrack: {
    width: '80%',
    height: 4,
    backgroundColor: '#1F2430',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressLineFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  exerciseHeadlineCard: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  exerciseHeadlineName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F9FAFB',
    textAlign: 'center',
    marginBottom: 4,
  },
  setCounterText: {
    fontSize: 14,
    color: '#60A5FA',
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 18,
  },
  auxBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E232E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseBtnPaused: {
    backgroundColor: '#10B981',
  },
  completeSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  completeSetBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  accordionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161922',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242A38',
  },
  accordionTitle: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  returnBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  returnBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  completeContent: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  trophyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#271D0E',
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 28,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
    width: '100%',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#161922',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#242A38',
  },
  summaryNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F9FAFB',
    marginTop: 8,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  doneBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  exitModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  exitModalBox: {
    backgroundColor: '#161922',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: '#252B3B',
  },
  exitModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  exitModalSub: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  exitModalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  exitModalCancelBtn: {
    flex: 1,
    backgroundColor: '#202532',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  exitModalCancelText: {
    color: '#D1D5DB',
    fontWeight: '700',
  },
  exitModalConfirmBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  exitModalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
