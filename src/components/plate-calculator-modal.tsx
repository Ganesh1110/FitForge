import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Dumbbell, Plus, Minus } from 'lucide-react-native';
import {
  calculateBarbellPlates,
  BAR_OPTIONS,
  OLYMPIC_PLATES_METRIC,
  BarOption,
} from '@/services/plate-calculator';

interface PlateCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
  initialWeightKg?: number;
}

const PRESET_WEIGHTS = [40, 60, 80, 100, 120, 140];

export function PlateCalculatorModal({
  visible,
  onClose,
  initialWeightKg = 60,
}: PlateCalculatorModalProps) {
  const [targetWeight, setTargetWeight] = useState(initialWeightKg);
  const [selectedBar, setSelectedBar] = useState<BarOption>(BAR_OPTIONS[0]);

  const result = calculateBarbellPlates(targetWeight, selectedBar.weightKg, OLYMPIC_PLATES_METRIC);

  const handleAdjustWeight = (delta: number) => {
    setTargetWeight((prev) => Math.max(selectedBar.weightKg, Math.round((prev + delta) * 2) / 2));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.iconCircle}>
                <Dumbbell size={18} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.title}>Barbell Plate Calculator</Text>
                <Text style={styles.subtitle}>Olympic plate math per side</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* Weight Input Row */}
            <View style={styles.targetWeightCard}>
              <Text style={styles.sectionLabel}>Target Total Weight</Text>
              <View style={styles.weightAdjustRow}>
                <TouchableOpacity
                  style={styles.adjustBtn}
                  onPress={() => handleAdjustWeight(-5)}>
                  <Minus size={18} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.weightDisplay}>
                  <Text style={styles.weightNum}>{targetWeight}</Text>
                  <Text style={styles.weightUnit}>KG</Text>
                </View>

                <TouchableOpacity
                  style={styles.adjustBtn}
                  onPress={() => handleAdjustWeight(5)}>
                  <Plus size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Quick Presets */}
              <View style={styles.presetRow}>
                {PRESET_WEIGHTS.map((w) => (
                  <TouchableOpacity
                    key={w}
                    style={[styles.presetChip, targetWeight === w && styles.presetChipActive]}
                    onPress={() => setTargetWeight(w)}>
                    <Text
                      style={[
                        styles.presetChipText,
                        targetWeight === w && styles.presetChipTextActive,
                      ]}>
                      {w}k
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bar Selection */}
            <Text style={styles.sectionLabel}>Select Barbell</Text>
            <View style={styles.barOptionsRow}>
              {BAR_OPTIONS.slice(0, 3).map((bar) => {
                const active = selectedBar.id === bar.id;
                return (
                  <TouchableOpacity
                    key={bar.id}
                    style={[styles.barChip, active && styles.barChipActive]}
                    onPress={() => setSelectedBar(bar)}>
                    <Text style={[styles.barChipText, active && styles.barChipTextActive]}>
                      {bar.name.split(' ')[0]} ({bar.weightKg}kg)
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Visual Barbell Sleeve */}
            <View style={styles.visualSleeveContainer}>
              <Text style={styles.sleeveHeader}>
                Load on Each Side: <Text style={styles.sleeveWeightHighlight}>{result.weightPerSide} KG</Text>
              </Text>

              {result.platesPerSide.length === 0 ? (
                <View style={styles.emptySleeve}>
                  <Text style={styles.emptySleeveText}>Bar Only (No plates needed)</Text>
                </View>
              ) : (
                <View style={styles.sleeveDiagram}>
                  {/* Bar shaft */}
                  <View style={styles.barShaft} />
                  {/* Collar */}
                  <View style={styles.barCollar} />
                  {/* Loaded Plates */}
                  <View style={styles.platesRow}>
                    {result.platesPerSide.map((item, idx) =>
                      Array.from({ length: item.count }).map((_, subIdx) => (
                        <View
                          key={`${item.plate.weight}-${idx}-${subIdx}`}
                          style={[
                            styles.plateDisk,
                            {
                              backgroundColor: item.plate.color,
                              height: 70 * item.plate.diameterRatio,
                            },
                          ]}>
                          <Text style={[styles.plateLabel, { color: item.plate.textColor }]}>
                            {item.plate.weight}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Breakdown List */}
            <Text style={styles.sectionLabel}>Plate Breakdown (Per Side)</Text>
            <View style={styles.breakdownList}>
              {result.platesPerSide.map((item) => (
                <View key={item.plate.weight} style={styles.breakdownRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.plateColorDot, { backgroundColor: item.plate.color }]} />
                    <Text style={styles.breakdownWeight}>{item.plate.weight} KG Plate</Text>
                  </View>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{item.count}×</Text>
                  </View>
                </View>
              ))}

              {result.remainderKg > 0 && (
                <View style={styles.remainderNotice}>
                  <Text style={styles.remainderText}>
                    Remainder: {result.remainderKg} kg (Closest load is {result.actualTotalWeight} kg)
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0F131D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingBottom: 30,
    borderWidth: 1,
    borderColor: '#232938',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A202E',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#1E232E',
  },
  body: {
    padding: 20,
    gap: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetWeightCard: {
    backgroundColor: '#151A26',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#232A3B',
  },
  weightAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  adjustBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E2638',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  weightNum: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  weightUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38BDF8',
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 6,
  },
  presetChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#1B2232',
    borderWidth: 1,
    borderColor: '#283145',
  },
  presetChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  barOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  barChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#151A26',
    borderWidth: 1,
    borderColor: '#232A3B',
  },
  barChipActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#192438',
  },
  barChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  barChipTextActive: {
    color: '#FFFFFF',
  },
  visualSleeveContainer: {
    backgroundColor: '#131824',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21293B',
  },
  sleeveHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 14,
  },
  sleeveWeightHighlight: {
    color: '#38BDF8',
    fontWeight: '900',
  },
  emptySleeve: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptySleeveText: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
  },
  sleeveDiagram: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 80,
    backgroundColor: '#0A0D14',
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1D2536',
  },
  barShaft: {
    width: 28,
    height: 12,
    backgroundColor: '#64748B',
    borderRadius: 2,
  },
  barCollar: {
    width: 14,
    height: 48,
    backgroundColor: '#94A3B8',
    borderRadius: 3,
    marginRight: 6,
  },
  platesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  plateDisk: {
    width: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  plateLabel: {
    fontSize: 8,
    fontWeight: '900',
  },
  breakdownList: {
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#151A26',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#232A3B',
  },
  plateColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  breakdownWeight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  countBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
  },
  remainderNotice: {
    marginTop: 6,
    padding: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  remainderText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
});
