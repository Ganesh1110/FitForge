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
  ArrowLeft,
  Check,
  Flame,
  Zap,
  Target,
  Clock,
  Wrench,
  User,
  Scale,
  Ruler,
  Plus,
  Minus,
  Activity,
} from 'lucide-react-native';

import {
  useUserStore,
  FitnessGoal,
  ExperienceLevel,
  UserGender,
  calculateBmi,
} from '@/store/user-store';
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
    gender,
    age,
    weightKg,
    heightCm,
    goal,
    experienceLevel,
    preferredDurationMinutes,
    setProfile,
    completeOnboarding,
  } = useUserStore();

  const { applyPreset } = useGarageStore();
  const [selectedPreset, setSelectedPreset] = useState<GaragePresetId>('apartment');

  const bmiData = calculateBmi(weightKg || 75, heightCm || 175);

  const handleNext = () => {
    playCountdownBeep();
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Apply chosen equipment preset & finish
      applyPreset(selectedPreset);
      completeOnboarding();
      playChime();
      speak('Welcome to FitForge! Your biometrics and home equipment garage are configured.');
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(step / 4) * 100}%` }]} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* STEP 1: GOALS */}
          {step === 1 && (
            <View>
              <View style={styles.headerTag}>
                <Sparkles size={14} color="#F59E0B" />
                <Text style={styles.headerTagText}>STEP 1 OF 4 • GOALS</Text>
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

          {/* STEP 2: BODY BIOMETRICS */}
          {step === 2 && (
            <View>
              <View style={styles.headerTag}>
                <Activity size={14} color="#38BDF8" />
                <Text style={styles.headerTagText}>STEP 2 OF 4 • BODY BIOMETRICS</Text>
              </View>
              <Text style={styles.title}>Tell us about your body</Text>
              <Text style={styles.subtitle}>
                Used to calibrate calorie burn, cardiovascular intensity, and anatomical mapping. 100% private and stored only on your device.
              </Text>

              {/* Gender Switch */}
              <Text style={styles.subHeading}>Biological Gender</Text>
              <View style={styles.genderRow}>
                {(['male', 'female'] as UserGender[]).map((g) => {
                  const active = gender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderCard, active && styles.genderCardActive]}
                      onPress={() => setProfile({ gender: g })}>
                      <User size={18} color={active ? '#38BDF8' : '#94A3B8'} />
                      <Text style={[styles.genderCardText, active && styles.genderCardTextActive]}>
                        {g === 'male' ? 'Male (Anatomy)' : 'Female (Anatomy)'}
                      </Text>
                      {active && <Check size={16} color="#38BDF8" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Age Stepper */}
              <View style={styles.metricRowContainer}>
                <View style={styles.metricHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Clock size={16} color="#60A5FA" />
                    <Text style={styles.metricLabel}>Age</Text>
                  </View>
                  <Text style={styles.metricVal}>{age || 28} yrs</Text>
                </View>
                <View style={styles.stepperWrap}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setProfile({ age: Math.max(14, (age || 28) - 1) })}>
                    <Minus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.stepDisplay}>{age || 28}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setProfile({ age: Math.min(90, (age || 28) + 1) })}>
                    <Plus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Weight Stepper */}
              <View style={styles.metricRowContainer}>
                <View style={styles.metricHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Scale size={16} color="#10B981" />
                    <Text style={styles.metricLabel}>Body Weight</Text>
                  </View>
                  <Text style={styles.metricVal}>{weightKg || 75} kg</Text>
                </View>
                <View style={styles.stepperWrap}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setProfile({ weightKg: Math.max(35, (weightKg || 75) - 1) })}>
                    <Minus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.stepDisplay}>{weightKg || 75} kg</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setProfile({ weightKg: Math.min(200, (weightKg || 75) + 1) })}>
                    <Plus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Height Stepper */}
              <View style={styles.metricRowContainer}>
                <View style={styles.metricHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ruler size={16} color="#F59E0B" />
                    <Text style={styles.metricLabel}>Height</Text>
                  </View>
                  <Text style={styles.metricVal}>{heightCm || 175} cm</Text>
                </View>
                <View style={styles.stepperWrap}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setProfile({ heightCm: Math.max(120, (heightCm || 175) - 1) })}>
                    <Minus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.stepDisplay}>{heightCm || 175} cm</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setProfile({ heightCm: Math.min(230, (heightCm || 175) + 1) })}>
                    <Plus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dynamic BMI Preview Card */}
              <View style={styles.bmiCard}>
                <View style={styles.bmiLeft}>
                  <Text style={styles.bmiTitle}>Calculated BMI</Text>
                  <Text style={styles.bmiSubtitle}>Body Mass Index estimate</Text>
                </View>
                <View style={[styles.bmiBadge, { borderColor: bmiData.color }]}>
                  <Text style={[styles.bmiScore, { color: bmiData.color }]}>
                    {bmiData.bmi}
                  </Text>
                  <Text style={[styles.bmiCategory, { color: bmiData.color }]}>
                    {bmiData.label}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: EXPERIENCE & DURATION */}
          {step === 3 && (
            <View>
              <View style={styles.headerTag}>
                <Sparkles size={14} color="#3B82F6" />
                <Text style={styles.headerTagText}>STEP 3 OF 4 • EXPERIENCE & PACE</Text>
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

          {/* STEP 4: EQUIPMENT GARAGE PRESET */}
          {step === 4 && (
            <View>
              <View style={styles.headerTag}>
                <Wrench size={14} color="#10B981" />
                <Text style={styles.headerTagText}>STEP 4 OF 4 • EQUIPMENT GARAGE</Text>
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
                        <View style={styles.gearPillRow}>
                          {preset.items.slice(0, 3).map((item) => (
                            <View key={item.name} style={styles.gearPill}>
                              <Text style={styles.gearPillText}>{item.name}</Text>
                            </View>
                          ))}
                          {preset.items.length > 3 && (
                            <View style={styles.gearPill}>
                              <Text style={styles.gearPillText}>+{preset.items.length - 3} more</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      {active && <Check size={20} color="#3B82F6" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <ArrowLeft size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {step === 4 ? 'Launch FitForge' : 'Continue'}
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
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  genderCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#161922',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#242A38',
  },
  genderCardActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#162335',
  },
  genderCardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  genderCardTextActive: {
    color: '#FFFFFF',
  },
  metricRowContainer: {
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#242A38',
  },
  metricHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38BDF8',
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#10131B',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1F2739',
  },
  stepBtn: {
    width: 44,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1E2638',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDisplay: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bmiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#131926',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#212D45',
  },
  bmiLeft: {
    flex: 1,
  },
  bmiTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bmiSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  bmiBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#182033',
    borderWidth: 1.5,
  },
  bmiScore: {
    fontSize: 18,
    fontWeight: '900',
  },
  bmiCategory: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
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
  },
  cardTitleActive: {
    color: '#FFFFFF',
  },
  cardDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 3,
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
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#242A38',
  },
  durationChipActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#1D283A',
  },
  durationChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  durationChipTextActive: {
    color: '#FFFFFF',
  },
  gearPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  gearPill: {
    backgroundColor: '#232938',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gearPillText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#0F1115',
    borderTopWidth: 1,
    borderTopColor: '#1E232E',
    gap: 12,
  },
  backBtn: {
    width: 48,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: '#242A38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
