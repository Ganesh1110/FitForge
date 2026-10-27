import React, { useState, useEffect } from 'react';
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
  Check,
  Shield,
  Layers,
  Wrench,
  CheckCircle2,
} from 'lucide-react-native';

import { UserEquipmentItem } from '@/db/schema';
import { getDatabase } from '@/db/database';
import { playCountdownBeep } from '@/services/sound-service';

export default function GarageScreen() {
  const [equipment, setEquipment] = useState<UserEquipmentItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<UserEquipmentItem['category']>('dumbbell');
  const [name, setName] = useState('');
  const [weightKg, setWeightKg] = useState('10');
  const [quantity, setQuantity] = useState('2');

  const loadEquipment = async () => {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<any>('SELECT * FROM user_equipment ORDER BY created_at DESC');
      setEquipment(
        rows.map((r) => ({
          ...r,
          weight_kg: r.weight_kg ?? undefined,
        }))
      );
    } catch (e) {
      console.warn('Error loading user equipment:', e);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, []);

  const handleAddEquipment = async () => {
    if (!name.trim()) return;
    try {
      const db = await getDatabase();
      const newItem: UserEquipmentItem = {
        id: `gear-${Date.now()}`,
        category: selectedCategory,
        name: name.trim(),
        weight_kg: weightKg ? parseFloat(weightKg) : undefined,
        quantity: quantity ? parseInt(quantity, 10) : 1,
        created_at: new Date().toISOString(),
      };

      await db.runAsync(
        `INSERT INTO user_equipment (id, category, name, weight_kg, resistance_level, quantity, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newItem.id,
          newItem.category,
          newItem.name,
          newItem.weight_kg ?? null,
          newItem.resistance_level ?? null,
          newItem.quantity,
          newItem.notes ?? null,
          newItem.created_at,
        ]
      );

      playCountdownBeep();
      setName('');
      setIsModalOpen(false);
      loadEquipment();
    } catch (e) {
      console.warn('Failed to add equipment:', e);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    try {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM user_equipment WHERE id = ?', [id]);
      loadEquipment();
    } catch (e) {
      console.warn('Failed to delete equipment:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Equipment Garage</Text>
          <Text style={styles.subtitle}>
            Routines strictly match your physical gear
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalOpen(true)}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Gear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Permanent Bodyweight Status */}
        <View style={styles.activePillCard}>
          <View style={styles.activePillLeft}>
            <View style={styles.activeCheckCircle}>
              <CheckCircle2 size={16} color="#10B981" />
            </View>
            <View>
              <Text style={styles.activePillTitle}>Bodyweight Exercises</Text>
              <Text style={styles.activePillSub}>Always enabled by default</Text>
            </View>
          </View>
          <View style={styles.activeTag}>
            <Text style={styles.activeTagText}>Active</Text>
          </View>
        </View>

        {/* User Inventory List */}
        <Text style={styles.inventoryHeader}>Logged Home Equipment ({equipment.length})</Text>

        {equipment.length === 0 ? (
          <View style={styles.emptyBox}>
            <Wrench size={40} color="#4B5563" />
            <Text style={styles.emptyTitle}>Your Garage is empty</Text>
            <Text style={styles.emptySub}>
              Add your dumbbells, pull-up bar, resistance bands, or walking pad. FitForge will filter out workouts you can't perform.
            </Text>
          </View>
        ) : (
          equipment.map((item) => (
            <View key={item.id} style={styles.gearCard}>
              <View style={styles.gearLeft}>
                <View style={styles.gearIconBox}>
                  <Dumbbell size={18} color="#60A5FA" />
                </View>
                <View>
                  <Text style={styles.gearName}>{item.name}</Text>
                  <Text style={styles.gearSpecs}>
                    {item.weight_kg ? `${item.weight_kg} kg • ` : ''}
                    Qty: {item.quantity} • {item.category}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteEquipment(item.id)}>
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={isModalOpen} animationType="slide" presentationStyle="formSheet">
        <SafeAreaView style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Home Equipment</Text>
          <Text style={styles.modalSub}>
            Enter details so local AI knows your exact load limits
          </Text>

          <Text style={styles.inputLabel}>Item Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Adjustable Dumbbells, 15kg Hex Pair"
            placeholderTextColor="#6B7280"
            value={name}
            onChangeText={setName}
          />

          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
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
                style={styles.input}
                placeholder="2"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>
          </View>

          <View style={styles.modalBtnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setIsModalOpen(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddEquipment}>
              <Text style={styles.saveBtnText}>Save to Garage</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  activePillCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161922',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#242A38',
    marginBottom: 20,
  },
  activePillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeCheckCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePillTitle: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '700',
  },
  activePillSub: {
    color: '#9CA3AF',
    fontSize: 12,
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
  inventoryHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 12,
  },
  emptyBox: {
    backgroundColor: '#161922',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#242A38',
    marginTop: 10,
  },
  emptyTitle: {
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
  gearCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161922',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#242A38',
    marginBottom: 10,
  },
  gearLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gearIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearName: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '700',
  },
  gearSpecs: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#111318',
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1A1D24',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2C313D',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#1E222A',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  cancelBtnText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
