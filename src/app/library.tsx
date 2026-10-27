import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Dumbbell,
  Heart,
  Volume2,
  X,
  Sparkles,
  Layers,
  Flame,
  CheckCircle2,
} from 'lucide-react-native';

import { Exercise } from '@/db/schema';
import { getExercises, toggleFavorite } from '@/db/exercise-service';
import { speak, stopSpeech } from '@/services/speech-service';
import { playCountdownBeep, playChime } from '@/services/sound-service';
import { Colors } from '@/constants/theme';

const MUSCLE_GROUPS = [
  'all',
  'chest',
  'back',
  'lats',
  'shoulders',
  'biceps',
  'triceps',
  'quadriceps',
  'hamstrings',
  'glutes',
  'abdominals',
  'cardiovascular system',
];

const EQUIPMENT_OPTIONS = [
  'all',
  'body only',
  'dumbbell',
  'bands',
  'kettlebells',
  'pull-up bar',
  'walking pad',
];

export default function LibraryScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getExercises({
        search,
        muscle: selectedMuscle,
        equipment: selectedEquipment,
      });
      setExercises(data);
    } catch (err) {
      console.warn('Error querying exercises:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedMuscle, selectedEquipment]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleFavorite = async (id: string, e?: any) => {
    e?.stopPropagation?.();
    const updated = await toggleFavorite(id);
    setExercises((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_favorite: updated } : item))
    );
    if (selectedExercise?.id === id) {
      setSelectedExercise((prev) => (prev ? { ...prev, is_favorite: updated } : null));
    }
  };

  const handleSpeakInstructions = (exercise: Exercise) => {
    const textToSpeak = `${exercise.name}. Target muscle: ${exercise.primaryMuscles.join(
      ', '
    )}. ${exercise.instructions.join(' ')}`;
    speak(textToSpeak);
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const isBodyweight = item.equipment.toLowerCase().includes('body');
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => setSelectedExercise(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.titleWrap}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.muscleBadge}>
                <Text style={styles.muscleBadgeText}>
                  {item.primaryMuscles[0]?.toUpperCase() || 'FULL BODY'}
                </Text>
              </View>
              <View style={[styles.equipBadge, isBodyweight && styles.equipBadgeBw]}>
                <Text style={styles.equipBadgeText}>{item.equipment}</Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{item.level}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => handleToggleFavorite(item.id, e)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Heart
              size={20}
              color={item.is_favorite ? '#EF4444' : '#6B7280'}
              fill={item.is_favorite ? '#EF4444' : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.instructionSnippet} numberOfLines={2}>
          {item.instructions[0] || 'No instructions available.'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exercise Library</Text>
        <Text style={styles.headerSubtitle}>
          {exercises.length} offline exercises ready
        </Text>

        <View style={styles.searchBar}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises or muscles..."
            placeholderTextColor="#6B7280"
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Muscle Filter Scroll */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}>
          {MUSCLE_GROUPS.map((m) => {
            const active = selectedMuscle === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSelectedMuscle(m)}>
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {m === 'all' ? 'All Muscles' : m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Equipment Filter Scroll */}
      <View style={styles.equipmentFilterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}>
          {EQUIPMENT_OPTIONS.map((eq) => {
            const active = selectedEquipment === eq;
            return (
              <TouchableOpacity
                key={eq}
                style={[styles.filterChipAlt, active && styles.filterChipAltActive]}
                onPress={() => setSelectedEquipment(eq)}>
                <Text
                  style={[
                    styles.filterChipAltText,
                    active && styles.filterChipAltTextActive,
                  ]}>
                  {eq === 'all' ? 'All Gear' : eq}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Exercise List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading library...</Text>
        </View>
      ) : exercises.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Dumbbell size={48} color="#4B5563" />
          <Text style={styles.emptyTitle}>No exercises found</Text>
          <Text style={styles.emptySubtitle}>
            Try clearing filters or searching for another term.
          </Text>
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExerciseItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={!!selectedExercise}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          stopSpeech();
          setSelectedExercise(null);
        }}>
        {selectedExercise && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  stopSpeech();
                  setSelectedExercise(null);
                }}>
                <X size={22} color="#F3F4F6" />
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.actionIconBtn}
                  onPress={() => handleSpeakInstructions(selectedExercise)}>
                  <Volume2 size={20} color="#60A5FA" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionIconBtn}
                  onPress={() => handleToggleFavorite(selectedExercise.id)}>
                  <Heart
                    size={20}
                    color={selectedExercise.is_favorite ? '#EF4444' : '#9CA3AF'}
                    fill={selectedExercise.is_favorite ? '#EF4444' : 'transparent'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.modalTitle}>{selectedExercise.name}</Text>

              {/* Tags */}
              <View style={styles.tagWrap}>
                <View style={styles.modalBadge}>
                  <Flame size={14} color="#F97316" />
                  <Text style={styles.modalBadgeText}>
                    {selectedExercise.category.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.modalBadge}>
                  <Dumbbell size={14} color="#3B82F6" />
                  <Text style={styles.modalBadgeText}>
                    {selectedExercise.equipment.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.modalBadge}>
                  <Layers size={14} color="#10B981" />
                  <Text style={styles.modalBadgeText}>
                    {selectedExercise.level.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Muscle Breakdown */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>Target Muscles</Text>
                <View style={styles.muscleTagRow}>
                  {selectedExercise.primaryMuscles.map((m) => (
                    <View key={m} style={styles.primaryMuscleChip}>
                      <Text style={styles.primaryMuscleChipText}>{m}</Text>
                    </View>
                  ))}
                  {selectedExercise.secondaryMuscles.map((m) => (
                    <View key={m} style={styles.secondaryMuscleChip}>
                      <Text style={styles.secondaryMuscleChipText}>{m}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Step-by-Step Instructions */}
              <View style={styles.sectionBlock}>
                <View style={styles.headingWithAudio}>
                  <Text style={styles.sectionHeading}>Step-by-Step Instructions</Text>
                  <TouchableOpacity
                    style={styles.voiceBtn}
                    onPress={() => handleSpeakInstructions(selectedExercise)}>
                    <Volume2 size={16} color="#3B82F6" />
                    <Text style={styles.voiceBtnText}>Audio Guide</Text>
                  </TouchableOpacity>
                </View>

                {selectedExercise.instructions.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>

              {/* Sound test button */}
              <View style={styles.audioTestBox}>
                <Text style={styles.audioTestTitle}>Audio Chimes Preview</Text>
                <View style={styles.audioTestRow}>
                  <TouchableOpacity
                    style={styles.testChimeBtn}
                    onPress={() => playCountdownBeep()}>
                    <Text style={styles.testChimeBtnText}>Beep 3-2-1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.testChimeBtn}
                    onPress={() => playChime()}>
                    <Text style={styles.testChimeBtnText}>Transition Chime</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F9FAFB',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1F26',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: '#2A2E39',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#F3F4F6',
  },
  filterSection: {
    marginTop: 8,
  },
  equipmentFilterSection: {
    marginTop: 6,
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1C1F26',
    borderWidth: 1,
    borderColor: '#2E3340',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipAlt: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#181A20',
    borderWidth: 1,
    borderColor: '#262A35',
  },
  filterChipAltActive: {
    backgroundColor: '#1E293B',
    borderColor: '#38BDF8',
  },
  filterChipAltText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  filterChipAltTextActive: {
    color: '#38BDF8',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 12,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#181A20',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262A35',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flex: 1,
    marginRight: 10,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  muscleBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  muscleBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  equipBadge: {
    backgroundColor: '#27272A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  equipBadgeBw: {
    backgroundColor: '#14532D',
  },
  equipBadgeText: {
    color: '#D4D4D8',
    fontSize: 11,
    fontWeight: '500',
  },
  levelBadge: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelBadgeText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  favoriteButton: {
    padding: 4,
  },
  instructionSnippet: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 10,
    lineHeight: 18,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E5E7EB',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#111318',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1F232D',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#1E222B',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#1E222B',
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 60,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1D24',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#292E3A',
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  sectionBlock: {
    marginBottom: 24,
  },
  headingWithAudio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E5E7EB',
    letterSpacing: -0.2,
  },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  voiceBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#60A5FA',
  },
  muscleTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  primaryMuscleChip: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  primaryMuscleChipText: {
    color: '#93C5FD',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  secondaryMuscleChip: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  secondaryMuscleChipText: {
    color: '#9CA3AF',
    fontSize: 13,
    textTransform: 'capitalize',
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  stepNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#D1D5DB',
  },
  audioTestBox: {
    backgroundColor: '#181B22',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#292E3B',
    marginTop: 10,
  },
  audioTestTitle: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  audioTestRow: {
    flexDirection: 'row',
    gap: 10,
  },
  testChimeBtn: {
    flex: 1,
    backgroundColor: '#222734',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  testChimeBtnText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '600',
  },
});
