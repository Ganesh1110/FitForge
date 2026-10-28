import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Trophy, Plus, Minus } from 'lucide-react-native';
import { calculateOneRepMax } from '@/services/one-rep-max';

interface OneRepMaxModalProps {
  visible: boolean;
  onClose: () => void;
  initialWeightKg?: number;
  initialReps?: number;
}

export function OneRepMaxModal({
  visible,
  onClose,
  initialWeightKg = 80,
  initialReps = 5,
}: OneRepMaxModalProps) {
  const [weight, setWeight] = useState(initialWeightKg);
  const [reps, setReps] = useState(initialReps);

  const result = calculateOneRepMax(weight, reps);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.iconCircle}>
                <Trophy size={18} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.title}>1RM Strength Calculator</Text>
                <Text style={styles.subtitle}>Scientific One Rep Max & Zone Percentages</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* Inputs Grid */}
            <View style={styles.inputGrid}>
              {/* Weight Stepper */}
              <View style={styles.stepperCard}>
                <Text style={styles.inputLabel}>Weight Lifted</Text>
                <View style={styles.stepperControl}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setWeight((prev) => Math.max(5, prev - 2.5))}>
                    <Minus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.stepVal}>{weight} <Text style={styles.unitText}>kg</Text></Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setWeight((prev) => Math.min(400, prev + 2.5))}>
                    <Plus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reps Stepper */}
              <View style={styles.stepperCard}>
                <Text style={styles.inputLabel}>Reps Performed</Text>
                <View style={styles.stepperControl}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setReps((prev) => Math.max(1, prev - 1))}>
                    <Minus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.stepVal}>{reps} <Text style={styles.unitText}>reps</Text></Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setReps((prev) => Math.min(30, prev + 1))}>
                    <Plus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Estimated 1RM Hero Card */}
            <View style={styles.heroCard}>
              <Text style={styles.heroSub}>ESTIMATED 1 REP MAX</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginVertical: 4 }}>
                <Text style={styles.heroScore}>{result.average}</Text>
                <Text style={styles.heroUnit}>KG</Text>
              </View>
              <View style={styles.formulaRow}>
                <Text style={styles.formulaTag}>Epley: {result.epley}kg</Text>
                <Text style={styles.formulaTag}>Brzycki: {result.brzycki}kg</Text>
                <Text style={styles.formulaTag}>Lander: {result.lander}kg</Text>
              </View>
            </View>

            {/* Training Zones Breakdown Table */}
            <Text style={styles.tableTitle}>Training Zone Percentages</Text>
            <View style={styles.tableCard}>
              {result.percentages.map((p, index) => (
                <View
                  key={p.percentage}
                  style={[
                    styles.tableRow,
                    index === 0 && { backgroundColor: 'rgba(56, 189, 248, 0.12)' },
                  ]}>
                  <View style={styles.percentBadge}>
                    <Text style={styles.percentText}>{p.percentage}%</Text>
                  </View>
                  <Text style={styles.weightText}>{p.weight} KG</Text>
                  <View style={styles.repsBadge}>
                    <Text style={styles.repsText}>~{p.targetReps} reps</Text>
                  </View>
                </View>
              ))}
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
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
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
  inputGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  stepperCard: {
    flex: 1,
    backgroundColor: '#151A26',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#232A3B',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
  },
  stepperControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E2638',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  unitText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  heroCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#151C2C',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  heroSub: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  heroScore: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: '#38BDF8',
  },
  formulaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  formulaTag: {
    fontSize: 11,
    color: '#94A3B8',
    backgroundColor: '#1E2536',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tableTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableCard: {
    backgroundColor: '#151A26',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#232A3B',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A202E',
  },
  percentBadge: {
    width: 48,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38BDF8',
  },
  weightText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  repsBadge: {
    backgroundColor: '#1E2536',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  repsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
