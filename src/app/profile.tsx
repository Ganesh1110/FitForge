import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Volume2,
  RefreshCw,
  HardDrive,
} from 'lucide-react-native';

import { getExercises } from '@/db/exercise-service';
import { syncWithFreeExerciseDb } from '@/db/seeder';
import { speak } from '@/services/speech-service';
import { playChime } from '@/services/sound-service';

export default function ProfileScreen() {
  const [exerciseCount, setExerciseCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [fitnessGoal, setFitnessGoal] = useState<'hypertrophy' | 'strength' | 'fat_loss' | 'endurance'>('hypertrophy');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate');

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile & Settings</Text>
          <Text style={styles.subtitle}>Preferences & Local Engine Settings</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <User size={28} color="#60A5FA" />
          </View>
          <View>
            <Text style={styles.userName}>FitForge Athlete</Text>
            <Text style={styles.userSub}>Local-First Private Account</Text>
          </View>
        </View>

        {/* Fitness Goals */}
        <Text style={styles.sectionTitle}>Fitness Focus</Text>
        <View style={styles.optionsGrid}>
          {[
            { id: 'hypertrophy', label: 'Muscle Build', desc: 'Hypertrophy rep ranges' },
            { id: 'strength', label: 'Raw Strength', desc: 'Heavy compounds & power' },
            { id: 'fat_loss', label: 'Fat Loss', desc: 'High intensity circuits' },
            { id: 'endurance', label: 'Endurance', desc: 'Sustained stamina work' },
          ].map((g) => {
            const active = fitnessGoal === g.id;
            return (
              <TouchableOpacity
                key={g.id}
                style={[styles.optionCard, active && styles.optionCardActive]}
                onPress={() => setFitnessGoal(g.id as any)}>
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
          {[
            { id: 'beginner', label: 'Beginner' },
            { id: 'intermediate', label: 'Intermediate' },
            { id: 'expert', label: 'Advanced' },
          ].map((lvl) => {
            const active = experienceLevel === lvl.id;
            return (
              <TouchableOpacity
                key={lvl.id}
                style={[styles.levelBtn, active && styles.levelBtnActive]}
                onPress={() => setExperienceLevel(lvl.id as any)}>
                <Text style={[styles.levelBtnText, active && styles.levelBtnTextActive]}>
                  {lvl.label}
                </Text>
              </TouchableOpacity>
            );
          })}
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
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F9FAFB',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#242A38',
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
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
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
});
