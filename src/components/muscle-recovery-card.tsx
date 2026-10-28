import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Activity } from 'lucide-react-native';
import { getMuscleRecoveryStates, MuscleRecoveryState } from '@/services/recovery-service';

interface MuscleRecoveryCardProps {
  onSelectMuscle?: (muscleId: string) => void;
}

export function MuscleRecoveryCard({ onSelectMuscle }: MuscleRecoveryCardProps) {
  const [states, setStates] = useState<Record<string, MuscleRecoveryState>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMuscleRecoveryStates();
        setStates(data);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const items = Object.values(states);
  const readyCount = items.filter((m) => m.status === 'ready').length;
  const recoveringCount = items.filter((m) => m.status === 'recovering').length;
  const fatiguedCount = items.filter((m) => m.status === 'fatigued').length;

  if (loading || items.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.iconCircle}>
            <Activity size={16} color="#38BDF8" />
          </View>
          <View>
            <Text style={styles.title}>Muscle Recovery & Readiness</Text>
            <Text style={styles.subtitle}>Supercompensation & recovery status</Text>
          </View>
        </View>
      </View>

      {/* Summary Pills */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryPill, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.summaryText, { color: '#10B981' }]}>{readyCount} Ready</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
          <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.summaryText, { color: '#F59E0B' }]}>{recoveringCount} Recovering</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.summaryText, { color: '#EF4444' }]}>{fatiguedCount} Fatigued</Text>
        </View>
      </View>

      {/* Horizontal Muscle Readiness Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}>
        {items.map((m) => (
          <TouchableOpacity
            key={m.muscleId}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => onSelectMuscle?.(m.muscleId)}>
            <View style={styles.cardTop}>
              <Text style={styles.muscleName} numberOfLines={1}>
                {m.muscleName.split(' ')[0]}
              </Text>
              <Text style={[styles.percentBadge, { color: m.color }]}>
                {m.recoveryPercentage}%
              </Text>
            </View>

            {/* Progress bar */}
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  { width: `${m.recoveryPercentage}%`, backgroundColor: m.color },
                ]}
              />
            </View>

            <Text style={[styles.statusText, { color: m.color }]}>{m.statusLabel}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111622',
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#20283A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  summaryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollList: {
    gap: 10,
  },
  card: {
    width: 130,
    backgroundColor: '#161D2B',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#242F44',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  muscleName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
    marginRight: 4,
  },
  percentBadge: {
    fontSize: 12,
    fontWeight: '800',
  },
  barBg: {
    height: 6,
    backgroundColor: '#0E131E',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
