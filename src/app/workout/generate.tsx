import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  ArrowLeft,
  Dumbbell,
  Clock,
  Play,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Download,
  Trash2,
} from 'lucide-react-native';

import { useUserStore } from '@/store/user-store';
import { useGarageStore } from '@/store/garage-store';
import { useModelStore, simulateOrStartModelDownload, deleteLocalModel } from '@/ai/model-manager';
import { useActiveWorkoutStore } from '@/store/active-workout-store';
import { generateWorkout } from '@/ai/workout-service';
import { GeneratedWorkoutPlan, WorkoutTargetSplit } from '@/ai/types';
import { playChime, playCountdownBeep } from '@/services/sound-service';
import { speak } from '@/services/speech-service';

const SPLITS: { id: WorkoutTargetSplit; label: string; desc: string }[] = [
  { id: 'full_body', label: 'Full Body', desc: 'Balanced head-to-toe home circuit' },
  { id: 'upper_body', label: 'Upper Body', desc: 'Chest, Back, Shoulders & Arms' },
  { id: 'lower_body', label: 'Lower Body', desc: 'Quads, Hamstrings & Glutes' },
  { id: 'push', label: 'Push & Chest', desc: 'Push movements & Triceps' },
  { id: 'pull', label: 'Pull & Back', desc: 'Lats, Rows & Biceps' },
  { id: 'core_cardio', label: 'Core & Cardio', desc: 'Abs, Conditioning & Walking Pad' },
];

const DURATIONS = [15, 30, 45, 60];

export default function GenerateWorkoutScreen() {
  const router = useRouter();

  const { goal, experienceLevel } = useUserStore();
  const { items: garageItems, getAllowedDbEquipmentKeys } = useGarageStore();
  const { model, activeEngine, setActiveEngine } = useModelStore();

  const [selectedSplit, setSelectedSplit] = useState<WorkoutTargetSplit>('full_body');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedWorkoutPlan | null>(null);

  // Model settings modal
  const [showModelModal, setShowModelModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      playCountdownBeep();

      const availableEquipment = getAllowedDbEquipmentKeys();
      const plan = await generateWorkout({
        split: selectedSplit,
        durationMinutes,
        intensity: experienceLevel,
        goal,
        availableEquipment,
      });

      setGeneratedPlan(plan);
      playChime();
      speak(`Generated ${plan.title}. ${plan.exercises.length} exercises ready.`);
    } catch (e: any) {
      console.warn('Generation failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartDownload = async () => {
    setDownloading(true);
    await simulateOrStartModelDownload();
    setDownloading(false);
  };

  const handleDeleteModel = () => {
    deleteLocalModel();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#F9FAFB" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>AI Workout Generator</Text>
          <Text style={styles.headerSubtitle}>
            {activeEngine === 'on_device_llm' ? 'Local LLM (Gemma 2B)' : 'Heuristic Expert Engine'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.engineToggleBtn}
          onPress={() => setShowModelModal(true)}>
          <Cpu size={18} color="#60A5FA" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Split Selector */}
        <Text style={styles.sectionHeading}>Target Muscle Split</Text>
        <View style={styles.splitGrid}>
          {SPLITS.map((s) => {
            const active = selectedSplit === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.splitCard, active && styles.splitCardActive]}
                onPress={() => setSelectedSplit(s.id)}>
                <Text style={[styles.splitTitle, active && styles.splitTitleActive]}>
                  {s.label}
                </Text>
                <Text style={styles.splitDesc}>{s.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Duration Selector */}
        <Text style={styles.sectionHeading}>Session Duration</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((d) => {
            const active = durationMinutes === d;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.durationChip, active && styles.durationChipActive]}
                onPress={() => setDurationMinutes(d)}>
                <Clock size={16} color={active ? '#FFFFFF' : '#9CA3AF'} />
                <Text
                  style={[
                    styles.durationChipText,
                    active && styles.durationChipTextActive,
                  ]}>
                  {d} Min
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Equipment Constraint Preview */}
        <View style={styles.gearNoticeBox}>
          <View style={styles.gearNoticeHeader}>
            <ShieldCheck size={16} color="#10B981" />
            <Text style={styles.gearNoticeTitle}>Strict Home Gear Constraints</Text>
          </View>
          <Text style={styles.gearNoticeSub}>
            Zero hallucinations. Routines will strictly filter against your {garageItems.length} logged items.
          </Text>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={styles.generateButton}
          disabled={loading}
          activeOpacity={0.8}
          onPress={handleGenerate}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Sparkles size={18} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>
                {generatedPlan ? 'Regenerate Routine' : 'Generate On-Device Routine'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Generated Plan Result Card */}
        {generatedPlan && (
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>{generatedPlan.title}</Text>
                <Text style={styles.planDesc}>{generatedPlan.description}</Text>
              </View>
              <View style={styles.planDurationBadge}>
                <Text style={styles.planDurationText}>
                  {generatedPlan.estimatedMinutes} MIN
                </Text>
              </View>
            </View>

            {/* Meta Tags */}
            <View style={styles.planMetaRow}>
              <View style={styles.planMetaChip}>
                <Layers size={12} color="#60A5FA" />
                <Text style={styles.planMetaChipText}>
                  {generatedPlan.exercises.length} Exercises
                </Text>
              </View>
              <View style={styles.planMetaChip}>
                <Dumbbell size={12} color="#34D399" />
                <Text style={styles.planMetaChipText}>
                  {generatedPlan.equipmentUsed.join(', ') || 'Bodyweight'}
                </Text>
              </View>
            </View>

            {/* Exercise List */}
            <View style={styles.planExerciseList}>
              {generatedPlan.exercises.map((item, idx) => (
                <View key={idx} style={styles.exerciseItemRow}>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderBadgeText}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseNameText}>{item.exerciseName}</Text>
                    <View style={styles.exerciseBadgeRow}>
                      <View style={styles.specTag}>
                        <Text style={styles.specTagText}>
                          {item.sets} Sets × {item.reps} {item.exerciseId.includes('plank') ? 'sec' : 'reps'}
                        </Text>
                      </View>
                      <View style={styles.specTag}>
                        <Text style={styles.specTagText}>{item.restSeconds}s Rest</Text>
                      </View>
                      <View style={[styles.specTag, { backgroundColor: '#1A2E20' }]}>
                        <Text style={[styles.specTagText, { color: '#6EE7B7' }]}>
                          {item.equipmentRequired}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.exerciseNotesText}>{item.notes}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Start Workout Button (Phase 4 integration) */}
            <TouchableOpacity
              style={styles.startWorkoutButton}
              activeOpacity={0.8}
              onPress={() => {
                useActiveWorkoutStore.getState().startWorkout(generatedPlan);
                router.push('/workout/player' as any);
              }}>
              <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.startWorkoutButtonText}>Start Interactive Workout</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Model Download & Manager Modal */}
      <Modal visible={showModelModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeading}>On-Device AI Engine</Text>
            <TouchableOpacity onPress={() => setShowModelModal(false)}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {/* Active Engine Card */}
            <Text style={styles.modalSubheading}>Current Generator Engine</Text>
            <View style={styles.engineChoiceRow}>
              <TouchableOpacity
                style={[
                  styles.engineChoiceCard,
                  activeEngine === 'heuristic_rules' && styles.engineChoiceCardActive,
                ]}
                onPress={() => setActiveEngine('heuristic_rules')}>
                <Cpu size={22} color="#10B981" />
                <Text style={styles.engineChoiceTitle}>Heuristic Rule Engine</Text>
                <Text style={styles.engineChoiceDesc}>
                  Instant (&lt;20ms), 100% offline, 0 MB download. Zero hallucination guarantee.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.engineChoiceCard,
                  activeEngine === 'on_device_llm' && styles.engineChoiceCardActive,
                ]}
                onPress={() => {
                  if (model.isDownloaded) {
                    setActiveEngine('on_device_llm');
                  }
                }}>
                <Sparkles size={22} color="#60A5FA" />
                <Text style={styles.engineChoiceTitle}>Gemma 2 2B LLM</Text>
                <Text style={styles.engineChoiceDesc}>
                  {model.isDownloaded
                    ? 'Model is installed and ready for local inference.'
                    : 'Download model weights below (~1.5 GB).'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Model Card */}
            <Text style={[styles.modalSubheading, { marginTop: 20 }]}>
              Local Quantized Model File
            </Text>
            <View style={styles.modelDetailCard}>
              <View style={styles.modelHeaderRow}>
                <View style={styles.modelIconBox}>
                  <HardDrive size={22} color="#60A5FA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modelName}>{model.name}</Text>
                  <Text style={styles.modelTagline}>{model.tagline}</Text>
                </View>
              </View>

              <View style={styles.modelMetaTable}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Size on Disk:</Text>
                  <Text style={styles.metaValue}>{model.formattedSize}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Quantization:</Text>
                  <Text style={styles.metaValue}>{model.quantization}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Base App Size:</Text>
                  <Text style={styles.metaValue}>&lt; 50 MB (Model downloaded separately)</Text>
                </View>
              </View>

              {/* Download Progress / Action */}
              {model.isDownloaded ? (
                <View style={styles.installedBox}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <Text style={styles.installedText}>Model weights cached on device</Text>
                  <TouchableOpacity
                    style={styles.deleteModelBtn}
                    onPress={handleDeleteModel}>
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ marginTop: 14 }}>
                  {downloading ? (
                    <View>
                      <View style={styles.downloadProgressTrack}>
                        <View
                          style={[
                            styles.downloadProgressFill,
                            { width: `${model.downloadProgress}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.downloadProgressText}>
                        Downloading weights... {model.downloadProgress}%
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.downloadBtn}
                      onPress={handleStartDownload}>
                      <Download size={16} color="#FFFFFF" />
                      <Text style={styles.downloadBtnText}>
                        Download {model.formattedSize} Model
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1E27',
  },
  backBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#1E232E',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F9FAFB',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#60A5FA',
    marginTop: 2,
    fontWeight: '600',
  },
  engineToggleBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#1E232E',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 10,
  },
  splitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  splitCard: {
    width: '48%',
    backgroundColor: '#161922',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#242A38',
  },
  splitCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#1A2336',
  },
  splitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D1D5DB',
    marginBottom: 4,
  },
  splitTitleActive: {
    color: '#60A5FA',
  },
  splitDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 15,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  durationChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#161922',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242A38',
  },
  durationChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  durationChipText: {
    color: '#9CA3AF',
    fontWeight: '700',
    fontSize: 13,
  },
  durationChipTextActive: {
    color: '#FFFFFF',
  },
  gearNoticeBox: {
    backgroundColor: '#141822',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#222836',
    marginBottom: 20,
  },
  gearNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  gearNoticeTitle: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 13,
  },
  gearNoticeSub: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 16,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 24,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  planCard: {
    backgroundColor: '#161922',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#262D3D',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  planDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  planDurationBadge: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  planDurationText: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 11,
  },
  planMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    paddingTop: 6,
  },
  planMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1E27',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  planMetaChipText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  planExerciseList: {
    gap: 14,
    marginBottom: 20,
  },
  exerciseItemRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2430',
  },
  orderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  orderBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  exerciseNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  exerciseBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  specTag: {
    backgroundColor: '#202532',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  specTagText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  exerciseNotesText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
  },
  startWorkoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#111318',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2430',
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#60A5FA',
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  modalSubheading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 10,
  },
  engineChoiceRow: {
    gap: 12,
  },
  engineChoiceCard: {
    backgroundColor: '#161922',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#242A38',
  },
  engineChoiceCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#192235',
  },
  engineChoiceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F3F4F6',
    marginTop: 8,
    marginBottom: 4,
  },
  engineChoiceDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  modelDetailCard: {
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#242A38',
  },
  modelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  modelIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  modelTagline: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  modelMetaTable: {
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#212633',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  installedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
    gap: 8,
  },
  installedText: {
    color: '#A7F3D0',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  deleteModelBtn: {
    padding: 6,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  downloadProgressTrack: {
    height: 6,
    backgroundColor: '#242A38',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  downloadProgressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  downloadProgressText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
