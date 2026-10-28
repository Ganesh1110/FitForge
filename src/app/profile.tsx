import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Volume2,
  RefreshCw,
  HardDrive,
  Wrench,
  Sliders,
  Scale,
  Ruler,
  Clock,
  Plus,
  Minus,
  Activity,
  FileSpreadsheet,
  FileJson,
} from 'lucide-react-native';

import {
  useUserStore,
  FitnessGoal,
  ExperienceLevel,
  UserGender,
  calculateBmi,
} from '@/store/user-store';
import { useGarageStore } from '@/store/garage-store';
import { getExercises } from '@/db/exercise-service';
import { syncWithFreeExerciseDb } from '@/db/seeder';
import { speak } from '@/services/speech-service';
import { playChime } from '@/services/sound-service';
import { OnboardingModal } from '@/components/onboarding-modal';
import { exportDatabaseToJson, exportWorkoutsToCsv } from '@/services/portability-service';

const GOAL_OPTIONS: { id: FitnessGoal; label: string; desc: string }[] = [
  { id: 'hypertrophy', label: 'Muscle Build', desc: 'Hypertrophy rep ranges (8-12)' },
  { id: 'strength', label: 'Raw Strength', desc: 'Heavy progressive overload (4-6)' },
  { id: 'fat_loss', label: 'Fat Loss', desc: 'High intensity metabolic circuits' },
  { id: 'endurance', label: 'Endurance', desc: 'Sustained aerobic conditioning' },
];

const LEVEL_OPTIONS: { id: ExperienceLevel; label: string }[] = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

export default function ProfileScreen() {
  const {
    name,
    gender,
    age,
    weightKg,
    heightCm,
    goal,
    experienceLevel,
    preferredDurationMinutes,
    setProfile,
  } = useUserStore();

  const bmiInfo = calculateBmi(weightKg || 75, heightCm || 175);

  const { items: garageItems } = useGarageStore();

  const [exerciseCount, setExerciseCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const loadDbStats = async () => {
    try {
      const all = await getExercises();
      setExerciseCount(all.length);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    loadDbStats();
  }, []);

  const handleSyncRemote = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await syncWithFreeExerciseDb();
      if (res.error) {
        setSyncMessage(`Sync notice: ${res.error}. Offline catalog is preserved.`);
      } else {
        setSyncMessage(`Successfully synced ${res.added} exercises!`);
      }
      await loadDbStats();
    } catch (e: any) {
      setSyncMessage(e.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleTestAudio = () => {
    playChime();
    speak('FitForge voice guidance is active.');
  };

  const handleExportCsv = async () => {
    try {
      const csv = await exportWorkoutsToCsv();
      await Share.share({
        title: 'FitForge_Workouts.csv',
        message: csv,
      });
    } catch (e: any) {
      Alert.alert('Export Failed', e.message || 'Unable to generate CSV.');
    }
  };

  const handleExportJson = async () => {
    try {
      const json = await exportDatabaseToJson();
      await Share.share({
        title: 'FitForge_Backup.json',
        message: json,
      });
    } catch (e: any) {
      Alert.alert('Export Failed', e.message || 'Unable to generate JSON backup.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile & Settings</Text>
          <Text style={styles.subtitle}>Personal goals and local database management</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <User size={28} color="#60A5FA" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userSub}>
              {experienceLevel.toUpperCase()} • {preferredDurationMinutes} MIN SESSIONS
            </Text>
          </View>
          <TouchableOpacity
            style={styles.reopenOnboardingBtn}
            onPress={() => setShowOnboarding(true)}>
            <Sliders size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Biometrics & Health Metrics Card */}
        <Text style={styles.sectionTitle}>Body Biometrics</Text>
        <View style={styles.biometricsCard}>
          {/* Top row: Gender & BMI pill */}
          <View style={styles.bioTopRow}>
            {/* Gender Toggle */}
            <View style={styles.bioGenderGroup}>
              {(['male', 'female'] as UserGender[]).map((g) => {
                const active = (gender || 'male') === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[styles.bioGenderBtn, active && styles.bioGenderBtnActive]}
                    onPress={() => setProfile({ gender: g })}>
                    <Text style={[styles.bioGenderBtnText, active && styles.bioGenderBtnTextActive]}>
                      {g === 'male' ? 'Male' : 'Female'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* BMI Pill */}
            <View style={[styles.bioBmiPill, { borderColor: bmiInfo.color }]}>
              <Activity size={13} color={bmiInfo.color} />
              <Text style={[styles.bioBmiText, { color: bmiInfo.color }]}>
                BMI {bmiInfo.bmi} • {bmiInfo.label}
              </Text>
            </View>
          </View>

          {/* Steppers Grid: Age, Weight, Height */}
          <View style={styles.bioGrid}>
            {/* Age */}
            <View style={styles.bioTile}>
              <View style={styles.bioTileHeader}>
                <Clock size={13} color="#60A5FA" />
                <Text style={styles.bioTileTitle}>Age</Text>
              </View>
              <Text style={styles.bioTileVal}>{age || 28} <Text style={styles.bioUnit}>yrs</Text></Text>
              <View style={styles.miniStepper}>
                <TouchableOpacity
                  style={styles.miniStepBtn}
                  onPress={() => setProfile({ age: Math.max(14, (age || 28) - 1) })}>
                  <Minus size={12} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.miniStepBtn}
                  onPress={() => setProfile({ age: Math.min(95, (age || 28) + 1) })}>
                  <Plus size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Weight */}
            <View style={styles.bioTile}>
              <View style={styles.bioTileHeader}>
                <Scale size={13} color="#10B981" />
                <Text style={styles.bioTileTitle}>Weight</Text>
              </View>
              <Text style={styles.bioTileVal}>{weightKg || 75} <Text style={styles.bioUnit}>kg</Text></Text>
              <View style={styles.miniStepper}>
                <TouchableOpacity
                  style={styles.miniStepBtn}
                  onPress={() => setProfile({ weightKg: Math.max(35, (weightKg || 75) - 1) })}>
                  <Minus size={12} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.miniStepBtn}
                  onPress={() => setProfile({ weightKg: Math.min(220, (weightKg || 75) + 1) })}>
                  <Plus size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Height */}
            <View style={styles.bioTile}>
              <View style={styles.bioTileHeader}>
                <Ruler size={13} color="#F59E0B" />
                <Text style={styles.bioTileTitle}>Height</Text>
              </View>
              <Text style={styles.bioTileVal}>{heightCm || 175} <Text style={styles.bioUnit}>cm</Text></Text>
              <View style={styles.miniStepper}>
                <TouchableOpacity
                  style={styles.miniStepBtn}
                  onPress={() => setProfile({ heightCm: Math.max(120, (heightCm || 175) - 1) })}>
                  <Minus size={12} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.miniStepBtn}
                  onPress={() => setProfile({ heightCm: Math.min(230, (heightCm || 175) + 1) })}>
                  <Plus size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Fitness Goals */}
        <Text style={styles.sectionTitle}>Fitness Focus</Text>
        <View style={styles.optionsGrid}>
          {GOAL_OPTIONS.map((g) => {
            const active = goal === g.id;
            return (
              <TouchableOpacity
                key={g.id}
                style={[styles.optionCard, active && styles.optionCardActive]}
                onPress={() => setProfile({ goal: g.id })}>
                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                  {g.label}
                </Text>
                <Text style={styles.optionDesc}>{g.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Experience Level */}
        <Text style={styles.sectionTitle}>Experience Level</Text>
        <View style={styles.levelRow}>
          {LEVEL_OPTIONS.map((lvl) => {
            const active = experienceLevel === lvl.id;
            return (
              <TouchableOpacity
                key={lvl.id}
                style={[styles.levelBtn, active && styles.levelBtnActive]}
                onPress={() => setProfile({ experienceLevel: lvl.id })}>
                <Text style={[styles.levelBtnText, active && styles.levelBtnTextActive]}>
                  {lvl.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Equipment Summary */}
        <Text style={styles.sectionTitle}>Equipment Garage Summary</Text>
        <View style={styles.gearSummaryBox}>
          <View style={styles.gearSummaryLeft}>
            <Wrench size={20} color="#10B981" />
            <View>
              <Text style={styles.gearSummaryTitle}>
                {garageItems.length} Home Items Logged
              </Text>
              <Text style={styles.gearSummarySub}>
                {garageItems.map((i) => i.name).slice(0, 3).join(', ')}
                {garageItems.length > 3 ? '...' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Database Management */}
        <Text style={styles.sectionTitle}>Local SQLite Database</Text>
        <View style={styles.dbCard}>
          <View style={styles.dbRow}>
            <View style={styles.dbIconBox}>
              <HardDrive size={20} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dbTitle}>Stored Exercise Catalog</Text>
              <Text style={styles.dbSub}>
                {exerciseCount} exercises currently installed on this device
              </Text>
            </View>
          </View>

          {syncMessage && (
            <View style={styles.syncNotice}>
              <Text style={styles.syncNoticeText}>{syncMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.syncBtn}
            disabled={syncing}
            onPress={handleSyncRemote}>
            {syncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <RefreshCw size={16} color="#FFFFFF" />
                <Text style={styles.syncBtnText}>Sync Remote free-exercise-db</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* openGym Grade: Data Portability & Backup */}
        <Text style={styles.sectionTitle}>Data Portability & Backup (openGym Grade)</Text>
        <View style={styles.portabilityCard}>
          <Text style={styles.portabilityDesc}>
            FitForge enforces 100% offline data sovereignty. Export your workout history anytime to standard CSV compatible with Strong, Hevy, and openGym, or create a full JSON snapshot.
          </Text>

          <View style={styles.exportBtnRow}>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={handleExportCsv}
              activeOpacity={0.8}>
              <View style={[styles.exportIconBox, { backgroundColor: '#0284C722' }]}>
                <FileSpreadsheet size={18} color="#38BDF8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.exportBtnTitle}>Export CSV</Text>
                <Text style={styles.exportBtnSub}>Strong & Hevy format</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportBtn}
              onPress={handleExportJson}
              activeOpacity={0.8}>
              <View style={[styles.exportIconBox, { backgroundColor: '#05966922' }]}>
                <FileJson size={18} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.exportBtnTitle}>JSON Snapshot</Text>
                <Text style={styles.exportBtnSub}>Full database backup</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Audio Engine Check */}
        <Text style={styles.sectionTitle}>Audio Engine & Voice Feedback</Text>
        <View style={styles.audioCard}>
          <Text style={styles.audioDesc}>
            FitForge uses on-device text-to-speech cues and synthesized chimes for interval timers.
          </Text>
          <View style={styles.audioActionRow}>
            <TouchableOpacity style={styles.testAudioBtn} onPress={handleTestAudio}>
              <Volume2 size={16} color="#38BDF8" />
              <Text style={styles.testAudioText}>Test Voice & Chime</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
    paddingBottom: 160,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#111520',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E2536',
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  userSub: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 2,
  },
  reopenOnboardingBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#1E232E',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  optionCard: {
    width: '48%',
    backgroundColor: '#161922',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#242A38',
  },
  optionCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E293B',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D1D5DB',
    marginBottom: 4,
  },
  optionLabelActive: {
    color: '#60A5FA',
  },
  optionDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 15,
  },
  levelRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  levelBtn: {
    flex: 1,
    backgroundColor: '#161922',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#242A38',
  },
  levelBtnActive: {
    borderColor: '#10B981',
    backgroundColor: '#064E3B',
  },
  levelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  levelBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  gearSummaryBox: {
    backgroundColor: '#161922',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#242A38',
    marginBottom: 24,
  },
  gearSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gearSummaryTitle: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '700',
  },
  gearSummarySub: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  dbCard: {
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#242A38',
    marginBottom: 24,
  },
  dbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  dbIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dbTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  dbSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  syncNotice: {
    backgroundColor: '#1E232E',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  syncNoticeText: {
    color: '#60A5FA',
    fontSize: 12,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  audioCard: {
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#242A38',
  },
  audioDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    marginBottom: 14,
  },
  audioActionRow: {
    flexDirection: 'row',
  },
  testAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  testAudioText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
  biometricsCard: {
    backgroundColor: '#161922',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#242A38',
    marginBottom: 24,
  },
  bioTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  bioGenderGroup: {
    flexDirection: 'row',
    backgroundColor: '#10131B',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#242A38',
  },
  bioGenderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 7,
  },
  bioGenderBtnActive: {
    backgroundColor: '#2563EB',
  },
  bioGenderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  bioGenderBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  bioBmiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#10131B',
    borderWidth: 1,
  },
  bioBmiText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bioGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  bioTile: {
    flex: 1,
    backgroundColor: '#10131B',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#202636',
  },
  bioTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  bioTileTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  bioTileVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bioUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  miniStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#171D2A',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#252F44',
  },
  miniStepBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  portabilityCard: {
    backgroundColor: '#111520',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E2536',
    marginBottom: 24,
  },
  portabilityDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  exportBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#161C2A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#242F46',
  },
  exportIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtnTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  exportBtnSub: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
});
