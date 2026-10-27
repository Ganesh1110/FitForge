import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Dumbbell,
  Sparkles,
  ArrowRight,
  Check,
  ShieldCheck,
  Flame,
  Zap,
  Target,
  Clock,
  Wrench,
} from 'lucide-react-native';

import { useUserStore, FitnessGoal, ExperienceLevel } from '@/store/user-store';
import { useGarageStore, GARAGE_PRESETS, GaragePresetId } from '@/store/garage-store';
import { playChime, playCountdownBeep } from '@/services/sound-service';
import { speak } from '@/services/speech-service';

interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
}

const GOALS: { id: FitnessGoal; title: string; desc: string; icon: any }[] = [
  { id: 'hypertrophy', title: 'Muscle Hypertrophy', desc: 'Build size with moderate rep ranges', icon: Flame },
  { id: 'strength', title: 'Raw Strength', desc: 'Focus on progressive overload & power', icon: Dumbbell },
  { id: 'fat_loss', title: 'Fat Loss & Conditioning', desc: 'High metabolic output circuits', icon: Zap },
  { id: 'endurance', title: 'Stamina & Longevity', desc: 'Sustained endurance & aerobic capacity', icon: Target },
];

const EXPERIENCE_LEVELS: { id: ExperienceLevel; title: string; desc: string }[] = [
  { id: 'beginner', title: 'Beginner', desc: 'Learning proper form and building consistency' },
  { id: 'intermediate', title: 'Intermediate', desc: 'Familiar with movements and training splits' },
  { id: 'advanced', title: 'Advanced', desc: 'High work capacity and intense routines' },
];

const DURATIONS = [15, 30, 45, 60];

export function OnboardingModal({ visible, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(1);

  const {
    goal,
    experienceLevel,
    preferredDurationMinutes,
    setProfile,
    completeOnboarding,
  } = useUserStore();

  const { applyPreset } = useGarageStore();
  const [selectedPreset, setSelectedPreset] = useState<GaragePresetId>('apartment');

  const handleNext = () => {
    playCountdownBeep();
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Apply chosen equipment preset
      applyPreset(selectedPreset);
      completeOnboarding();
      playChime();
      speak('Welcome to FitForge! Your home equipment garage is configured and your routines are personalized.');
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {step === 1 && (
            <View>
              <View style={styles.headerTag}>
                <Sparkles size={14} color="#F59E0B" />
                <Text style={styles.headerTagText}>STEP 1 OF 3 • GOALS</Text>
              </View>
              <Text style={styles.title}>What is your primary fitness focus?</Text>
              <Text style={styles.subtitle}>
                FitForge tailors exercise selection and set/rep schemes to your goal.
              </Text>

              <View style={styles.listWrap}>
                {GOALS.map((g) => {
                  const active = goal === g.id;
                  const Icon = g.icon;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.card, active && styles.cardActive]}
                      onPress={() => setProfile({ goal: g.id })}>
                      <View style={[styles.iconBox, active && styles.iconBoxActive]}>
                        <Icon size={20} color={active ? '#FFFFFF' : '#60A5FA'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, active && styles.cardTitleActive]}>
                          {g.title}
                        </Text>
                        <Text style={styles.cardDesc}>{g.desc}</Text>
                      </View>
                      {active && <Check size={20} color="#3B82F6" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {step === 2 && (
            <View>
              <View style={styles.headerTag}>
                <Sparkles size={14} color="#3B82F6" />
                <Text style={styles.headerTagText}>STEP 2 OF 3 • PREFERENCES</Text>
              </View>
              <Text style={styles.title}>Experience & Time Limits</Text>
              <Text style={styles.subtitle}>
                We will balance intensity and pacing for your schedule.
              </Text>

              <Text style={styles.subHeading}>Experience Level</Text>
              <View style={styles.listWrap}>
                {EXPERIENCE_LEVELS.map((lvl) => {
                  const active = experienceLevel === lvl.id;
                  return (
                    <TouchableOpacity
                      key={lvl.id}
                      style={[styles.card, active && styles.cardActive]}
                      onPress={() => setProfile({ experienceLevel: lvl.id })}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, active && styles.cardTitleActive]}>
                          {lvl.title}
                        </Text>
                        <Text style={styles.cardDesc}>{lvl.desc}</Text>
                      </View>
                      {active && <Check size={20} color="#3B82F6" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.subHeading, { marginTop: 20 }]}>
                Preferred Session Length
              </Text>
              <View style={styles.durationRow}>
                {DURATIONS.map((d) => {
                  const active = preferredDurationMinutes === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.durationChip, active && styles.durationChipActive]}
                      onPress={() => setProfile({ preferredDurationMinutes: d })}>
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
            </View>
          )}

          {step === 3 && (
            <View>
              <View style={styles.headerTag}>
                <Wrench size={14} color="#10B981" />
                <Text style={styles.headerTagText}>STEP 3 OF 3 • EQUIPMENT GARAGE</Text>
              </View>
              <Text style={styles.title}>What gear is in your home?</Text>
              <Text style={styles.subtitle}>
                Pick a starting preset. You can always fine-tune exact plate weights and additions later in the Garage.
              </Text>

              <View style={styles.listWrap}>
                {GARAGE_PRESETS.map((preset) => {
                  const active = selectedPreset === preset.id;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      style={[styles.card, active && styles.cardActive]}
                      onPress={() => setSelectedPreset(preset.id)}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, active && styles.cardTitleActive]}>
                          {preset.name}
                        </Text>
                        <Text style={styles.cardDesc}>{preset.description}</Text>
                        <Text style={styles.gearPillList}>
                          Includes: {preset.items.map((i) => i.name).join(', ')}
                        </Text>
                      </View>
                      {active && <Check size={20} color="#3B82F6" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.privacyNote}>
                <ShieldCheck size={18} color="#10B981" />
                <Text style={styles.privacyNoteText}>
                  FitForge runs 100% on-device. Your inventory never leaves this phone.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {step === 3 ? 'Launch FitForge' : 'Continue'}
            </Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#1E232E',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  headerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  headerTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F9FAFB',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 24,
  },
  subHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 10,
  },
  listWrap: {
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#242A38',
    gap: 14,
  },
  cardActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#182236',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: '#2563EB',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: 3,
  },
  cardTitleActive: {
    color: '#60A5FA',
  },
  cardDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  gearPillList: {
    fontSize: 11,
    color: '#60A5FA',
    marginTop: 6,
    fontWeight: '500',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
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
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#064E3B',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  privacyNoteText: {
    color: '#A7F3D0',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    padding: 20,
    backgroundColor: '#0F1115',
    borderTopWidth: 1,
    borderTopColor: '#1A1E27',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
