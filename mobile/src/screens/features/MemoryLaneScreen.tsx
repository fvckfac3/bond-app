/**
 * MemoryLaneScreen - Timeline of shared memories
 */
import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

import FadeInView, { StaggerContainer, StaggerItem } from '../../../components/animated/FadeInView';
import ScaleButton from '../../../components/animated/ScaleButton';
import SkeletonLoader from '../../../components/animated/SkeletonLoader';
import { colors, spacing, shadows } from '../../../constants/theme';
import { supabase } from '../../../services/supabase';

interface Memory {
  id: string;
  title: string;
  description?: string;
  memory_date: string;
  memory_type: 'milestone' | 'moment' | 'date' | 'achievement' | 'other';
  photos?: string[];
  location?: string;
  tags?: string[];
}

const MEMORY_TYPES = {
  milestone: { icon: '🌟', color: colors.gold, label: 'Milestone' },
  moment: { icon: '✨', color: colors.teal, label: 'Special Moment' },
  date: { icon: '💕', color: colors.accent, label: 'Date Night' },
  achievement: { icon: '🏆', color: colors.primary, label: 'Achievement' },
  other: { icon: '📝', color: colors.gray, label: 'Memory' },
};

export default function MemoryLaneScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [timeline, setTimeline] = useState<Record<string, Memory[]>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [coupleUnitId, setCoupleUnitId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [notPaired, setNotPaired] = useState(false);
  const [newMemory, setNewMemory] = useState({ title: '', description: '', memory_date: '', memory_type: 'moment' as Memory['memory_type'], location: '' });

  useEffect(() => {
    loadMemories();
  }, []);

  // Memories are shared by the couple and read straight from Supabase (RLS: couple members only).
  function toMemory(row): Memory {
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      memory_date: row.memory_date,
      memory_type: row.category ?? 'other',
      photos: row.photo_url ? [row.photo_url] : [],
      location: row.location ?? undefined,
      tags: row.tags ?? [],
    };
  }

  async function loadMemories() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: couple } = await supabase
        .from('couple_units')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'active')
        .maybeSingle();

      if (!couple) {
        setNotPaired(true);
        return;
      }
      setNotPaired(false);
      setCoupleUnitId(couple.id);

      const { data, error } = await supabase
        .from('memory_lane')
        .select('*')
        .eq('couple_unit_id', couple.id)
        .order('memory_date', { ascending: false });
      if (error) throw error;

      const list = (data || []).map(toMemory);
      setMemories(list);
      organizeTimeline(list);
    } catch (error) {
      console.error('Error loading memories:', error);
      Alert.alert('Error', 'Could not load your memories. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function organizeTimeline(memoryList: Memory[]) {
    const organized: Record<string, Memory[]> = {};
    memoryList
      .sort((a, b) => new Date(b.memory_date).getTime() - new Date(a.memory_date).getTime())
      .forEach((memory) => {
        const year = memory.memory_date.split('-')[0];
        if (!organized[year]) organized[year] = [];
        organized[year].push(memory);
      });
    setTimeline(organized);
  }

  function onRefresh() {
    setRefreshing(true);
    loadMemories();
  }

  async function addMemory() {
    if (!newMemory.title || !newMemory.memory_date) {
      Alert.alert('Missing Info', 'Please add a title and date.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newMemory.memory_date)) {
      Alert.alert('Check the date', 'Please use the format YYYY-MM-DD.');
      return;
    }
    if (!coupleUnitId || !userId) {
      Alert.alert('Partner Required', 'Connect with your partner to start your Memory Lane.');
      return;
    }

    const { data, error } = await supabase
      .from('memory_lane')
      .insert({
        couple_unit_id: coupleUnitId,
        user_id: userId,
        title: newMemory.title.trim(),
        description: newMemory.description.trim() || null,
        memory_date: newMemory.memory_date,
        category: newMemory.memory_type,
        location: newMemory.location.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving memory:', error);
      Alert.alert('Error', 'Could not save this memory. Please try again.');
      return;
    }

    const updated = [...memories, toMemory(data)];
    setMemories(updated);
    organizeTimeline(updated);

    setShowAddModal(false);
    setNewMemory({ title: '', description: '', memory_date: '', memory_type: 'moment', location: '' });
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.headerGradient}>
          <View style={styles.header}>
            <SkeletonLoader height={32} width="60%" style={{ marginBottom: spacing.sm }} />
            <SkeletonLoader height={18} width="80%" />
          </View>
        </LinearGradient>
        <View style={{ padding: spacing.md }}>
          {[1, 2, 3].map((i) => <SkeletonLoader key={i} height={120} style={{ marginBottom: spacing.md, borderRadius: 16 }} />)}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.headerGradient}>
          <FadeInView>
            <View style={styles.header}>
              <Text style={styles.greeting}>Memory Lane 💕</Text>
              <Text style={styles.subgreeting}>Cherish the moments that made you, you</Text>
            </View>
          </FadeInView>
        </LinearGradient>

        <View style={styles.content}>
          {/* Stats */}
          <FadeInView delay={100}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{memories.length}</Text>
                <Text style={styles.statLabel}>Memories</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Object.keys(timeline).length}</Text>
                <Text style={styles.statLabel}>Years Together</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{memories.filter(m => m.memory_type === 'milestone').length}</Text>
                <Text style={styles.statLabel}>Milestones</Text>
              </View>
            </View>
          </FadeInView>

          {notPaired && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Connect with your partner to start your shared Memory Lane.
              </Text>
            </View>
          )}
          {!notPaired && memories.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No memories yet. Add the first moment you want to remember together.
              </Text>
            </View>
          )}

          {/* Timeline */}
          {Object.entries(timeline).sort(([a], [b]) => Number(b) - Number(a)).map(([year, yearMemories]) => (
            <View key={year}>
              <FadeInView>
                <View style={styles.yearHeader}>
                  <Text style={styles.yearText}>{year}</Text>
                  <View style={styles.yearLine} />
                </View>
              </FadeInView>

              <StaggerContainer stagger={80}>
                {yearMemories.map((memory, index) => {
                  const typeInfo = MEMORY_TYPES[memory.memory_type] || MEMORY_TYPES.other;
                  return (
                    <StaggerItem key={memory.id} index={index}>
                      <View style={styles.memoryCard}>
                        <View style={[styles.memoryIcon, { backgroundColor: typeInfo.color + '20' }]}>
                          <Text style={styles.memoryIconText}>{typeInfo.icon}</Text>
                        </View>
                        <View style={styles.memoryContent}>
                          <Text style={styles.memoryDate}>{formatDate(memory.memory_date)}</Text>
                          <Text style={styles.memoryTitle}>{memory.title}</Text>
                          {memory.description && <Text style={styles.memoryDescription}>{memory.description}</Text>}
                          {memory.location && (
                            <View style={styles.memoryLocation}>
                              <Text style={styles.locationIcon}>📍</Text>
                              <Text style={styles.locationText}>{memory.location}</Text>
                            </View>
                          )}
                          <View style={styles.memoryTags}>
                            {memory.tags?.map(tag => (
                              <View key={tag} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                        {memory.memory_type === 'milestone' && (
                          <View style={styles.milestoneBadge}>
                            <Text style={styles.milestoneText}>🌟</Text>
                          </View>
                        )}
                      </View>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            </View>
          ))}

          {/* Add Memory Button */}
          <FadeInView delay={300}>
            <ScaleButton onPress={() => setShowAddModal(true)} style={styles.addButton}>
              <LinearGradient colors={[colors.accent, '#D4778A']} style={styles.addButtonGradient}>
                <Text style={styles.addButtonText}>+ Add New Memory</Text>
              </LinearGradient>
            </ScaleButton>
          </FadeInView>
        </View>
      </ScrollView>

      {/* Add Memory Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Memory</Text>

            <TextInput
              style={styles.input}
              placeholder="Memory title..."
              placeholderTextColor={colors.gray}
              value={newMemory.title}
              onChangeText={(t) => setNewMemory({ ...newMemory, title: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Description (optional)..."
              placeholderTextColor={colors.gray}
              value={newMemory.description}
              onChangeText={(t) => setNewMemory({ ...newMemory, description: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)..."
              placeholderTextColor={colors.gray}
              value={newMemory.memory_date}
              onChangeText={(t) => setNewMemory({ ...newMemory, memory_date: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Location (optional)..."
              placeholderTextColor={colors.gray}
              value={newMemory.location}
              onChangeText={(t) => setNewMemory({ ...newMemory, location: t })}
            />

            <View style={styles.typeSelector}>
              {Object.entries(MEMORY_TYPES).map(([type, info]) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setNewMemory({ ...newMemory, memory_type: type as Memory['memory_type'] })}
                  style={[styles.typeOption, newMemory.memory_type === type && { backgroundColor: info.color + '30' }]}
                >
                  <Text style={styles.typeIcon}>{info.icon}</Text>
                  <Text style={styles.typeLabel}>{info.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <ScaleButton onPress={() => setShowAddModal(false)} variant="secondary" style={{ flex: 1, marginRight: spacing.sm }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </ScaleButton>
              <ScaleButton onPress={addMemory} style={{ flex: 1 }}>
                <Text style={styles.saveButtonText}>Save Memory</Text>
              </ScaleButton>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyState: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { fontSize: 15, color: colors.gray, textAlign: 'center', lineHeight: 22 },
  container: { flex: 1, backgroundColor: colors.background },
  headerGradient: { paddingBottom: spacing.lg },
  header: { padding: spacing.lg },
  greeting: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xs },
  subgreeting: { fontSize: 14, color: colors.gray },
  content: { padding: spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.white, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.soft },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: colors.accent },
  statLabel: { fontSize: 12, color: colors.gray },
  yearHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, marginTop: spacing.sm },
  yearText: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  yearLine: { flex: 1, height: 2, backgroundColor: colors.lightGray, marginLeft: spacing.md },
  memoryCard: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm, ...shadows.soft },
  memoryIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  memoryIconText: { fontSize: 24 },
  memoryContent: { flex: 1 },
  memoryDate: { fontSize: 12, color: colors.gray, marginBottom: spacing.xs / 2 },
  memoryTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xs },
  memoryDescription: { fontSize: 13, color: colors.gray, lineHeight: 18, marginBottom: spacing.xs },
  memoryLocation: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  locationIcon: { fontSize: 12, marginRight: spacing.xs / 2 },
  locationText: { fontSize: 12, color: colors.gray },
  memoryTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: { backgroundColor: colors.blush, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 8 },
  tagText: { fontSize: 10, color: colors.accent },
  milestoneBadge: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  milestoneText: { fontSize: 16 },
  addButton: { borderRadius: 16, overflow: 'hidden', marginTop: spacing.md },
  addButtonGradient: { padding: spacing.md, alignItems: 'center' },
  addButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg, textAlign: 'center' },
  input: { backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, fontSize: 14, color: colors.primary, marginBottom: spacing.sm },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  typeOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 12, borderWidth: 1, borderColor: colors.lightGray },
  typeIcon: { fontSize: 16, marginRight: spacing.xs / 2 },
  typeLabel: { fontSize: 11, color: colors.gray },
  modalButtons: { flexDirection: 'row' },
  cancelButtonText: { color: colors.gray, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  saveButtonText: { color: colors.white, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});