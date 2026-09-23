import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect } from 'expo-router';
import { Card, Chip } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows, typography } from '../constants/theme';
import { supabase } from '../services/supabase';
import { getCoupleContext, CoupleContext } from '../services/couple';

interface Completion {
  id: string;
  user_id: string;
  completed_at: string;
  shared_with_partner: boolean | null;
  response: { text?: string } | null;
  activities: { title: string; category: string | null } | null;
}

// Your own completions plus the ones your partner chose to share (RLS on activity_completions
// only returns a partner's row when shared_with_partner is true).
export default function ActivityHistoryScreen() {
  const [ctx, setCtx] = useState<CoupleContext | null>(null);
  const [rows, setRows] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const context = await getCoupleContext();
      setCtx(context);
      if (!context) return;
      let query = supabase
        .from('activity_completions')
        .select('id, user_id, completed_at, shared_with_partner, response, activities(title, category)')
        .order('completed_at', { ascending: false })
        .limit(50);
      query = context.coupleUnitId
        ? query.or(`user_id.eq.${context.userId},couple_unit_id.eq.${context.coupleUnitId}`)
        : query.eq('user_id', context.userId);
      const { data, error: qError } = await query;
      if (qError) throw qError;
      setRows((data as any) || []);
    } catch (e) {
      console.error('Error loading activity history:', e);
      setError('Could not load your activity history. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: 'Activity History', headerBackTitle: 'Back' }} />
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        >
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!error && rows.length === 0 ? (
            <Text style={styles.empty}>No completed activities yet. Finish one from the Activities tab and it will show up here.</Text>
          ) : null}
          {rows.map((row) => {
            const mine = row.user_id === ctx?.userId;
            return (
              <Card key={row.id} style={styles.card}>
                <Card.Content>
                  <View style={styles.header}>
                    <Text style={styles.title}>{row.activities?.title || 'Activity'}</Text>
                    <Chip compact style={mine ? styles.mineChip : styles.partnerChip} textStyle={styles.chipText}>
                      {mine ? (row.shared_with_partner ? 'You · shared' : 'You · private') : 'Your partner'}
                    </Chip>
                  </View>
                  <Text style={styles.date}>{new Date(row.completed_at).toLocaleDateString()}</Text>
                  {row.response?.text ? <Text style={styles.body}>{row.response.text}</Text> : null}
                </Card.Content>
              </Card>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  error: { color: colors.error, marginBottom: spacing.md },
  empty: { fontSize: typography.body.fontSize, color: colors.gray, textAlign: 'center', marginTop: spacing.xl, lineHeight: typography.body.lineHeight },
  card: { marginBottom: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.white, ...shadows.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontSize: typography.h4.fontSize, fontWeight: '700', color: colors.primary },
  mineChip: { backgroundColor: colors.blush },
  partnerChip: { backgroundColor: colors.successLight },
  chipText: { fontSize: 11 },
  date: { fontSize: typography.caption.fontSize, color: colors.gray, marginVertical: spacing.xs },
  body: { fontSize: typography.body.fontSize, color: colors.black, lineHeight: typography.body.lineHeight },
});
