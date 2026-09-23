import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Card } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows, typography } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { getCoupleContext } from '../../services/couple';

interface Topic { id: string; topic_key: string; topic_name: string; description: string | null; depth_level: number }

const DEPTH_LABELS = { 1: 'Easy', 2: 'Deeper', 3: 'Vulnerable' };

export default function CheckInTopicsScreen() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lastDone, setLastDone] = useState<Record<string, string>>({});
  const [paired, setPaired] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [ctx, { data, error: tError }] = await Promise.all([
        getCoupleContext(),
        supabase
          .from('check_in_topics')
          .select('id, topic_key, topic_name, description, depth_level')
          .order('sort_order', { ascending: true }),
      ]);
      if (tError) throw tError;
      setTopics(data || []);
      setPaired(Boolean(ctx?.coupleUnitId));

      if (ctx?.coupleUnitId) {
        const { data: done, error: dError } = await supabase
          .from('check_in_responses')
          .select('topic_id, created_at')
          .eq('couple_unit_id', ctx.coupleUnitId)
          .order('created_at', { ascending: false });
        if (dError) throw dError;
        const latest: Record<string, string> = {};
        for (const row of done || []) latest[row.topic_id] ||= row.created_at;
        setLastDone(latest);
      }
    } catch (e) {
      console.error('Error loading check-in topics:', e);
      setError('Could not load topics. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: 'Check-in Topics', headerBackTitle: 'Back' }} />
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        >
          <Text style={styles.intro}>
            Pick a topic, answer its prompts, then talk it through together. You&apos;ll both see each other&apos;s answers.
          </Text>
          {!paired ? <Text style={styles.notice}>Pair with your partner to start check-ins.</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {topics.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              activeOpacity={0.9}
              onPress={() => router.push({ pathname: '/topics/[topicKey]', params: { topicKey: topic.topic_key } })}
            >
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.row}>
                    <Text style={styles.title}>{topic.topic_name}</Text>
                    <Text style={styles.depth}>{DEPTH_LABELS[topic.depth_level] || ''}</Text>
                  </View>
                  {topic.description ? <Text style={styles.description}>{topic.description}</Text> : null}
                  {lastDone[topic.id] ? (
                    <Text style={styles.last}>Last check-in {new Date(lastDone[topic.id]).toLocaleDateString()}</Text>
                  ) : null}
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  intro: { fontSize: typography.body.fontSize, color: colors.gray, marginBottom: spacing.md, lineHeight: typography.body.lineHeight },
  notice: { fontSize: typography.body.fontSize, color: colors.accent, marginBottom: spacing.md },
  error: { color: colors.error, marginBottom: spacing.md },
  card: { marginBottom: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.white, ...shadows.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontSize: typography.h4.fontSize, fontWeight: '700', color: colors.primary },
  depth: { fontSize: typography.caption.fontSize, color: colors.accent, fontWeight: '700' },
  description: { fontSize: typography.bodySmall.fontSize, color: colors.gray, marginTop: spacing.xs },
  last: { fontSize: typography.caption.fontSize, color: colors.teal, marginTop: spacing.xs },
});
