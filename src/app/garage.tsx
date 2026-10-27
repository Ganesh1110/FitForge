import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Dumbbell,
  Plus,
  Trash2,
  Wrench,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  ChevronRight,
} from 'lucide-react-native';

import {
  useGarageStore,
  EquipmentCategory,
  GARAGE_PRESETS,
  GaragePresetId,
} from '@/store/garage-store';
import { calculateEquipmentCoverage, EquipmentCoverage } from '@/services/filter-service';
import { playCountdownBeep, playChime } from '@/services/sound-service';

const CATEGORIES: { id: EquipmentCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Items' },
  { id: 'dumbbell', label: 'Dumbbells' },
  { id: 'resistance_band', label: 'Bands' },
  { id: 'pullup_bar', label: 'Pull-up Bar' },
  { id: 'bench', label: 'Benches' },
  { id: 'kettlebell', label: 'Kettlebells' },
  { id: 'cardio', label: 'Cardio' },
];

export default function GarageScreen() {
  const { items, addItem, removeItem, applyPreset } = useGarageStore();

  const [activeCategory, setActiveCategory] = useState<EquipmentCategory | 'all'>('all');
  const [coverage, setCoverage] = useState<EquipmentCoverage | null>(null);

  // Add Item Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);

  const [formCategory, setFormCategory] = useState<EquipmentCategory>('dumbbell');
  const [name, setName] = useState('');
  const [weightKg, setWeightKg] = useState('10');
  const [resistanceLevel, setResistanceLevel] = useState<'light' | 'medium' | 'heavy' | 'extra_heavy'>('medium');
  const [maxSpeedKmh, setMaxSpeedKmh] = useState('6.0');
  const [quantity, setQuantity] = useState('2');

  const refreshCoverage = useCallback(async () => {
    const data = await calculateEquipmentCoverage();
    setCoverage(data);
  }, []);

  useEffect(() => {
    refreshCoverage();
  }, [items, refreshCoverage]);

  const handleSaveItem = () => {
    if (!name.trim()) return;

    addItem({
      category: formCategory,
      name: name.trim(),
      weightKg: formCategory === 'dumbbell' || formCategory === 'kettlebell' || formCategory === 'barbell'
        ? parseFloat(weightKg) || undefined
        : undefined,
      resistanceLevel: formCategory === 'resistance_band' ? resistanceLevel : undefined,
      maxSpeedKmh: formCategory === 'cardio' ? parseFloat(maxSpeedKmh) || undefined : undefined,
      quantity: parseInt(quantity, 10) || 1,
    });

    playCountdownBeep();
    setName('');
    setIsModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    removeItem(id);
    playCountdownBeep();
  };

  const handleApplyPreset = (presetId: GaragePresetId) => {
    applyPreset(presetId);
    playChime();
    setIsPresetModalOpen(false);
  };

  const filteredItems = items.filter((it) =>
    activeCategory === 'all' ? true : it.category === activeCategory
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Equipment Garage</Text>
          <Text style={styles.subtitle}>Granular home inventory cross-referenced with SQLite</Text>
        </View>

        <View style={styles.headerBtnRow}>
          <TouchableOpacity
            style={styles.presetIconBtn}
            onPress={() => setIsPresetModalOpen(true)}>
            <RotateCcw size={16} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => setIsModalOpen(true)}>
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Gear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Coverage Card */}
        {coverage && (
          <View style={styles.coverageCard}>
            <View style={styles.coverageTop}>
              <View>
                <Text style={styles.coverageLabel}>EQUIPMENT COVERAGE</Text>
                <Text style={styles.coverageTitle}>
                  {coverage.accessibleExercises} of {coverage.totalExercises} Exercises Unlocked
                </Text>
              </View>
              <View style={styles.percentBadge}>
                <Text style={styles.percentBadgeText}>{coverage.coveragePercentage}%</Text>
              </View>
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, coverage.coveragePercentage)}%` },
                ]}
              />
            </View>

            {coverage.recommendedUpgrades.length > 0 && (
              <View style={styles.upgradeNotice}>
                <Sparkles size={14} color="#F59E0B" />
                <Text style={styles.upgradeNoticeText}>
                  Tip: Adding a{' '}
                  <Text style={{ fontWeight: '700', color: '#FDE68A' }}>
                    {coverage.recommendedUpgrades[0].equipment}
                  </Text>{' '}
                  unlocks +{coverage.recommendedUpgrades[0].unlocksCount} more exercises.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Permanent Bodyweight Status */}
        <View style={styles.permanentGearCard}>
          <View style={styles.gearIconBox}>
            <CheckCircle2 size={18} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.permanentGearTitle}>Bodyweight & Calisthenics</Text>
            <Text style={styles.permanentGearSub}>Always active across all routines</Text>
          </View>
          <View style={styles.activeTag}>
            <Text style={styles.activeTagText}>Active</Text>
          </View>
        </View>

        {/* Category Filters */}
        <View style={styles.categoryScrollWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => setActiveCategory(cat.id)}>
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Inventory Item List */}
        <View style={styles.inventoryHeaderRow}>
          <Text style={styles.inventoryHeading}>Logged Gear ({filteredItems.length})</Text>
        </View>

        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Wrench size={38} color="#4B5563" />
            <Text style={styles.emptyTitle}>No items in this category</Text>
            <Text style={styles.emptySubtitle}>
              Tap &ldquo;Add Gear&rdquo; or load a quick preset to populate your garage.
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemIconBox}>
                <Dumbbell size={18} color="#60A5FA" />
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.specRow}>
                  {item.weightKg !== undefined && (
                    <View style={styles.specBadge}>
                      <Text style={styles.specBadgeText}>{item.weightKg} kg</Text>
                    </View>
                  )}
                  {item.resistanceLevel && (
                    <View style={styles.specBadge}>
                      <Text style={styles.specBadgeText}>Level: {item.resistanceLevel}</Text>
                    </View>
                  )}
                  {item.maxSpeedKmh !== undefined && (
                    <View style={styles.specBadge}>
                      <Text style={styles.specBadgeText}>Max {item.maxSpeedKmh} km/h</Text>
                    </View>
                  )}
                  <View style={styles.specBadge}>
                    <Text style={styles.specBadgeText}>Qty: {item.quantity}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteItem(item.id)}>
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={isModalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Equipment</Text>
            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            <Text style={styles.inputLabel}>Equipment Category</Text>
            <View style={styles.categorySelectGrid}>
              {[
                { id: 'dumbbell', label: 'Dumbbell' },
                { id: 'resistance_band', label: 'Resistance Band' },
                { id: 'pullup_bar', label: 'Pull-up Bar' },
                { id: 'bench', label: 'Workout Bench' },
                { id: 'kettlebell', label: 'Kettlebell' },
                { id: 'cardio', label: 'Walking Pad / Cardio' },
              ].map((c) => {
                const active = formCategory === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.catPickChip, active && styles.catPickChipActive]}
                    onPress={() => {
                      setFormCategory(c.id as EquipmentCategory);
                      if (c.id === 'dumbbell' && !name) setName('Adjustable Dumbbells');
                      if (c.id === 'resistance_band' && !name) setName('Resistance Loop Band');
                      if (c.id === 'pullup_bar' && !name) setName('Doorframe Pull-up Bar');
                      if (c.id === 'bench' && !name) setName('Flat / Incline Bench');
                      if (c.id === 'cardio' && !name) setName('Walking Pad');
                    }}>
                    <Text style={[styles.catPickChipText, active && styles.catPickChipTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Item Name / Description</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 10kg Hex Dumbbell Pair, Blue Loop Band"
              placeholderTextColor="#6B7280"
              value={name}
              onChangeText={setName}
            />

            {(formCategory === 'dumbbell' || formCategory === 'kettlebell' || formCategory === 'barbell') && (
              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="10"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    value={weightKg}
                    onChangeText={setWeightKg}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="2"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                  />
                </View>
              </View>
            )}

            {formCategory === 'resistance_band' && (
              <View>
                <Text style={styles.inputLabel}>Tension Level</Text>
                <View style={styles.bandLevelRow}>
                  {(['light', 'medium', 'heavy', 'extra_heavy'] as const).map((lvl) => {
                    const active = resistanceLevel === lvl;
                    return (
                      <TouchableOpacity
                        key={lvl}
                        style={[styles.bandLevelBtn, active && styles.bandLevelBtnActive]}
                        onPress={() => setResistanceLevel(lvl)}>
                        <Text style={[styles.bandLevelBtnText, active && styles.bandLevelBtnTextActive]}>
                          {lvl.replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {formCategory === 'cardio' && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.inputLabel}>Max Speed (km/h)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="6.0"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                  value={maxSpeedKmh}
                  onChangeText={setMaxSpeedKmh}
                />
              </View>
            )}

            <TouchableOpacity style={styles.saveSubmitBtn} onPress={handleSaveItem}>
              <Text style={styles.saveSubmitBtnText}>Add Item to Garage</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Presets Modal */}
      <Modal visible={isPresetModalOpen} animationType="fade" transparent>
        <View style={styles.presetModalBackdrop}>
          <View style={styles.presetModalBox}>
            <Text style={styles.presetModalTitle}>Quick Equipment Presets</Text>
            <Text style={styles.presetModalSub}>
              Instantly set up common home configurations. This will replace your current inventory.
            </Text>

            <View style={{ gap: 10, marginVertical: 14 }}>
              {GARAGE_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.presetItem}
                  onPress={() => handleApplyPreset(p.id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.presetItemName}>{p.name}</Text>
                    <Text style={styles.presetItemDesc}>{p.description}</Text>
                  </View>
                  <ChevronRight size={18} color="#60A5FA" />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.presetCancelBtn}
              onPress={() => setIsPresetModalOpen(false)}>
              <Text style={styles.presetCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0C11',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    maxWidth: 240,
    fontWeight: '500',
  },
  headerBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  presetIconBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#141824',
    borderWidth: 1,
    borderColor: '#232B3E',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  coverageCard: {
    backgroundColor: '#111520',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E2536',
    marginBottom: 16,
  },
  coverageTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  coverageLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  coverageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F9FAFB',
    marginTop: 2,
  },
  percentBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  percentBadgeText: {
    color: '#38BDF8',
    fontWeight: '800',
    fontSize: 14,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#242A38',
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  upgradeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#221D12',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#453818',
  },
  upgradeNoticeText: {
    fontSize: 12,
    color: '#FCD34D',
    flex: 1,
  },
  permanentGearCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161922',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#242A38',
    marginBottom: 16,
    gap: 12,
  },
  gearIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permanentGearTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  permanentGearSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  activeTag: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeTagText: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryScrollWrap: {
    marginBottom: 16,
  },
  categoryScroll: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#161922',
    borderWidth: 1,
    borderColor: '#242A38',
  },
  categoryChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  inventoryHeaderRow: {
    marginBottom: 10,
  },
  inventoryHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  emptyState: {
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#242A38',
    marginTop: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E5E7EB',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161922',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#242A38',
    marginBottom: 10,
    gap: 12,
  },
  itemIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  specRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specBadge: {
    backgroundColor: '#202531',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  specBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 8,
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2430',
  },
  modalTitle: {
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
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
    marginTop: 12,
  },
  categorySelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  catPickChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#1A1E27',
    borderWidth: 1,
    borderColor: '#2B313F',
  },
  catPickChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  catPickChipText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  catPickChipTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: '#1A1E27',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2B313F',
  },
  inputRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  bandLevelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bandLevelBtn: {
    flex: 1,
    backgroundColor: '#1A1E27',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2B313F',
  },
  bandLevelBtnActive: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  bandLevelBtnText: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'capitalize',
  },
  bandLevelBtnTextActive: {
    color: '#6EE7B7',
    fontWeight: '700',
  },
  saveSubmitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 28,
  },
  saveSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  presetModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  presetModalBox: {
    backgroundColor: '#161922',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderColor: '#2A303F',
  },
  presetModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  presetModalSub: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C212D',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B3243',
  },
  presetItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 2,
  },
  presetItemDesc: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  presetCancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#242A38',
    borderRadius: 10,
    marginTop: 6,
  },
  presetCancelBtnText: {
    color: '#D1D5DB',
    fontWeight: '600',
    fontSize: 14,
  },
});
