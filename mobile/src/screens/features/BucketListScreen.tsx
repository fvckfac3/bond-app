/**
 * BucketListScreen - Goals, dreams, and aspirations for the couple
 */
import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

import FadeInView, { StaggerContainer, StaggerItem } from '../../../components/animated/FadeInView';
import ScaleButton from '../../../components/animated/ScaleButton';
import SkeletonLoader from '../../../components/animated/SkeletonLoader';
import { colors, spacing, shadows } from '../../../constants/theme';
import { supabase } from '../../../services/supabase';

// bucket_list.priority is 1-5 (1 = highest) in the database.
const PRIORITY_TO_DB = { high: 1, medium: 3, low: 5 };
const priorityFromDb = (value: number): BucketListItem['priority'] =>
  value <= 2 ? 'high' : value >= 4 ? 'low' : 'medium';

interface BucketListItem {
  id: string;
  title: string;
  description?: string;
  category: 'travel' | 'adventure' | 'learning' | 'family' | 'romance' | 'other';
  priority: 'high' | 'medium' | 'low';
  estimated_cost?: string;
  target_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'archived';
  completed_date?: string;
}

const CATEGORIES = {
  travel: { icon: '✈️', color: '#4A90D9', label: 'Travel' },
  adventure: { icon: '🏔️', color: '#27AE60', label: 'Adventure' },
  learning: { icon: '📚', color: '#9B59B6', label: 'Learning' },
  family: { icon: '👨‍👩‍👧', color: '#E67E22', label: 'Family' },
  romance: { icon: '💕', color: colors.accent, label: 'Romance' },
  other: { icon: '⭐', color: colors.gray, label: 'Other' },
};

const PRIORITY_COLORS = { high: colors.error, medium: colors.gold, low: colors.teal };
const STATUS_LABELS = { pending: 'To Do', in_progress: 'In Progress', completed: 'Done', archived: 'Archived' };

export default function BucketListScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<BucketListItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [coupleUnitId, setCoupleUnitId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [notPaired, setNotPaired] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', category: 'adventure' as BucketListItem['category'], priority: 'medium' as BucketListItem['priority'], estimated_cost: '', target_date: '' });

  useEffect(() => { loadItems(); }, []);

  // The list is shared by the couple and read straight from Supabase (RLS: couple members only).
  function toItem(row): BucketListItem {
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      category: row.category ?? 'other',
      priority: priorityFromDb(row.priority ?? 3),
      estimated_cost: row.estimated_cost ?? undefined,
      target_date: row.target_date ?? undefined,
      status: row.status ?? 'pending',
      completed_date: row.completed_date ?? undefined,
    };
  }

  async function loadItems() {
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
        .from('bucket_list')
        .select('*')
        .eq('couple_unit_id', couple.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setItems((data || []).map(toItem));
    } catch (error) {
      console.error('Error loading bucket list:', error);
      Alert.alert('Error', 'Could not load your bucket list. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() { setRefreshing(true); loadItems(); }

  async function updateStatus(itemId: string, newStatus: BucketListItem['status']) {
    const previous = items;
    const completedDate = newStatus === 'completed' ? new Date().toISOString().split('T')[0] : null;
    setItems(items.map(item => item.id === itemId ? { ...item, status: newStatus, completed_date: completedDate ?? undefined } : item));

    const { error } = await supabase
      .from('bucket_list')
      .update({ status: newStatus, completed_date: completedDate })
      .eq('id', itemId);
    if (error) {
      console.error('Error updating bucket list item:', error);
      setItems(previous);
      Alert.alert('Error', 'Could not update this goal. Please try again.');
    }
  }

  async function addItem() {
    if (!newItem.title.trim()) return;
    if (!coupleUnitId || !userId) {
      Alert.alert('Partner Required', 'Connect with your partner to start your shared bucket list.');
      return;
    }
    if (newItem.target_date && !/^\d{4}-\d{2}-\d{2}$/.test(newItem.target_date)) {
      Alert.alert('Check the date', 'Please use the format YYYY-MM-DD.');
      return;
    }

    const { data, error } = await supabase
      .from('bucket_list')
      .insert({
        couple_unit_id: coupleUnitId,
        user_id: userId,
        title: newItem.title.trim(),
        description: newItem.description.trim() || null,
        category: newItem.category,
        priority: PRIORITY_TO_DB[newItem.priority],
        estimated_cost: newItem.estimated_cost.trim() || null,
        target_date: newItem.target_date || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving bucket list item:', error);
      Alert.alert('Error', 'Could not save this goal. Please try again.');
      return;
    }

    setItems([...items, toItem(data)]);
    setShowAddModal(false);
    setNewItem({ title: '', description: '', category: 'adventure', priority: 'medium', estimated_cost: '', target_date: '' });
  }

  const filteredItems = items.filter(item => {
    if (filter === 'pending') return item.status === 'pending' || item.status === 'in_progress';
    if (filter === 'completed') return item.status === 'completed';
    return item.status !== 'archived';
  });

  const stats = {
    total: items.filter(i => i.status !== 'archived').length,
    completed: items.filter(i => i.status === 'completed').length,
    inProgress: items.filter(i => i.status === 'in_progress').length,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.headerGradient}>
          <View style={styles.header}><SkeletonLoader height={32} width="60%" /><SkeletonLoader height={18} width="80%" style={{ marginTop: spacing.sm }} /></View>
        </LinearGradient>
        <View style={{ padding: spacing.md }}>{[1,2,3].map(i => <SkeletonLoader key={i} height={100} style={{ marginBottom: spacing.md, borderRadius: 16 }} />)}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.headerGradient}>
          <FadeInView>
            <View style={styles.header}>
              <Text style={styles.greeting}>Bucket List 🌟</Text>
              <Text style={styles.subgreeting}>Goals, dreams, and adventures to shared</Text>
            </View>
          </FadeInView>
        </LinearGradient>

        <View style={styles.content}>
          {/* Stats */}
          <FadeInView delay={100}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>Total</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.teal }]}>{stats.inProgress}</Text><Text style={styles.statLabel}>In Progress</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.accent }]}>{stats.completed}</Text><Text style={styles.statLabel}>Completed</Text></View>
            </View>
          </FadeInView>

          {/* Filters */}
          <FadeInView delay={150}>
            <View style={styles.filterRow}>
              {(['all', 'pending', 'completed'] as const).map(f => (
                <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterButton, filter === f && styles.filterButtonActive]}>
                  <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </FadeInView>

          {/* Items */}
          <StaggerContainer stagger={60}>
            {filteredItems.map((item, index) => {
              const cat = CATEGORIES[item.category] || CATEGORIES.other;
              const isCompleted = item.status === 'completed';
              return (
                <StaggerItem key={item.id} index={index}>
                  <View style={[styles.itemCard, isCompleted && styles.itemCardCompleted]}>
                    <TouchableOpacity onPress={() => updateStatus(item.id, isCompleted ? 'pending' : 'completed')} style={styles.checkbox}>
                      <MotiView animate={{ scale: isCompleted ? 1 : 0.8 }} transition={{ type: 'spring' }}>
                        <View style={[styles.checkboxInner, isCompleted && { backgroundColor: colors.teal, borderColor: colors.teal }]}>
                          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                      </MotiView>
                    </TouchableOpacity>
                    <View style={styles.itemContent}>
                      <View style={styles.itemHeader}>
                        <Text style={[styles.itemTitle, isCompleted && styles.itemTitleCompleted]}>{item.title}</Text>
                        <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[item.priority]}]} />
                      </View>
                      {item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
                      <View style={styles.itemMeta}>
                        <View style={[styles.categoryBadge, { backgroundColor: cat.color + '20' }]}>
                          <Text style={styles.categoryIcon}>{cat.icon}</Text>
                          <Text style={[styles.categoryText, { color: cat.color }]}>{cat.label}</Text>
                        </View>
                        {item.estimated_cost && <Text style={styles.cost}>💰 {item.estimated_cost}</Text>}
                        <Text style={styles.status}>{STATUS_LABELS[item.status]}</Text>
                      </View>
                    </View>
                  </View>
                </StaggerItem>
              );
            })}
          </StaggerContainer>

          {filteredItems.length === 0 && (
            <FadeInView><View style={styles.emptyState}><Text style={styles.emptyIcon}>🎯</Text><Text style={styles.emptyTitle}>{notPaired ? 'Connect with your partner' : 'No items yet'}</Text><Text style={styles.emptySubtitle}>{notPaired ? 'Your bucket list is shared with your partner.' : 'Add your first shared goal!'}</Text></View></FadeInView>
          )}

          <FadeInView delay={200}>
            <ScaleButton onPress={() => setShowAddModal(true)} style={styles.addButton}>
              <LinearGradient colors={[colors.accent, '#D4778A']} style={styles.addButtonGradient}><Text style={styles.addButtonText}>+ Add Goal</Text></LinearGradient>
            </ScaleButton>
          </FadeInView>
        </View>
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add to Bucket List</Text>
            <TextInput style={styles.input} placeholder="What do you want to achieve together?" placeholderTextColor={colors.gray} value={newItem.title} onChangeText={t => setNewItem({ ...newItem, title: t })} />
            <TextInput style={styles.input} placeholder="Description (optional)..." placeholderTextColor={colors.gray} value={newItem.description} onChangeText={t => setNewItem({ ...newItem, description: t })} />
            <TextInput style={styles.input} placeholder="Estimated cost (optional)..." placeholderTextColor={colors.gray} value={newItem.estimated_cost} onChangeText={t => setNewItem({ ...newItem, estimated_cost: t })} />

            <View style={styles.typeSelector}>
              {Object.entries(CATEGORIES).map(([cat, info]) => (
                <TouchableOpacity key={cat} onPress={() => setNewItem({ ...newItem, category: cat as BucketListItem['category'] })} style={[styles.typeOption, newItem.category === cat && { backgroundColor: info.color + '20', borderColor: info.color }]}>
                  <Text style={styles.typeIcon}>{info.icon}</Text><Text style={styles.typeLabel}>{info.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <ScaleButton onPress={() => setShowAddModal(false)} variant="secondary" style={{ flex: 1, marginRight: spacing.sm }}><Text style={styles.cancelButtonText}>Cancel</Text></ScaleButton>
              <ScaleButton onPress={addItem} style={{ flex: 1 }}><Text style={styles.saveButtonText}>Add Goal</Text></ScaleButton>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerGradient: { paddingBottom: spacing.lg },
  header: { padding: spacing.lg },
  greeting: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xs },
  subgreeting: { fontSize: 14, color: colors.gray },
  content: { padding: spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: colors.white, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, ...shadows.soft },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.gray },
  statDivider: { width: 1, height: 40, backgroundColor: colors.lightGray },
  filterRow: { flexDirection: 'row', marginBottom: spacing.md, gap: spacing.sm },
  filterButton: { flex: 1, paddingVertical: spacing.sm, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', borderWidth: 1, borderColor: colors.lightGray },
  filterButtonActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterText: { fontSize: 13, color: colors.gray, fontWeight: '600' },
  filterTextActive: { color: colors.white },
  itemCard: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm, ...shadows.soft },
  itemCardCompleted: { opacity: 0.7 },
  checkbox: { marginRight: spacing.md, justifyContent: 'center' },
  checkboxInner: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.lightGray, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
  itemContent: { flex: 1 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, flex: 1 },
  itemTitleCompleted: { textDecorationLine: 'line-through', color: colors.gray },
  priorityDot: { width: 10, height: 10, borderRadius: 5, marginLeft: spacing.sm },
  itemDescription: { fontSize: 13, color: colors.gray, marginBottom: spacing.sm },
  itemMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 8 },
  categoryIcon: { fontSize: 12, marginRight: spacing.xs / 2 },
  categoryText: { fontSize: 11, fontWeight: '600' },
  cost: { fontSize: 11, color: colors.gray },
  status: { fontSize: 11, color: colors.gray, marginLeft: 'auto' },
  emptyState: { alignItems: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xs },
  emptySubtitle: { fontSize: 14, color: colors.gray },
  addButton: { borderRadius: 16, overflow: 'hidden', marginTop: spacing.md },
  addButtonGradient: { padding: spacing.md, alignItems: 'center' },
  addButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg, textAlign: 'center' },
  input: { backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, fontSize: 14, color: colors.primary, marginBottom: spacing.sm },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  typeOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 12, borderWidth: 1, borderColor: colors.lightGray },
  typeIcon: { fontSize: 14, marginRight: spacing.xs / 2 },
  typeLabel: { fontSize: 11, color: colors.gray },
  modalButtons: { flexDirection: 'row' },
  cancelButtonText: { color: colors.gray, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  saveButtonText: { color: colors.white, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});