import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Card } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows, typography } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { getCoupleContext } from '../../services/couple';
import { ANALYZERS, AnalyzerKind } from '../../components/analyzers/AnalyzerResult';

interface Recent { id: string; kind: AnalyzerKind; created_at: string; score: number | null; summary: string }

// The analyzer hub: the four analyzers plus the couple's recent analyses (read directly under
// couple-scoped RLS; both partners see them).
export default function AnalyzersHub() {
  const router = useRouter();
  const [recent, setRecent] = useState<Recent[]>([]);
  const [paired, setPaired] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const ctx = await getCoupleContext();
      setPaired(Boolean(ctx?.coupleUnitId));
      if (!ctx?.coupleUnitId) return;
      const lists = await Promise.all(
        (Object.keys(ANALYZERS) as AnalyzerKind[]).map(async (kind) => {
          const { data } = await supabase
            .from(ANALYZERS[kind].table)
            .select('id, created_at, result')
            .eq('couple_id', ctx.coupleUnitId)
            .not('result', 'is', null)
            .order('created_at', { ascending: false })
            .limit(5);
          return (data || []).map((row: any) => ({
            id: row.id,
            kind,
            created_at: row.created_at,
            score: row.result?.overall_score ?? null,
            summary: row.result?.summary ?? '',
          }));
        })
      );
      setRecent(lists.flat().sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10));
    } catch (e) {
      console.error('Error loading analyses:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: 'AI Analyzers', headerBackTitle: 'Back' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Look at how you talk to each other. Results describe patterns between you, never who is right, and both of you
          can see them. Your messages themselves are never stored.
        </Text>
        {!paired ? <Text style={styles.notice}>Pair with your partner to use the analyzers.</Text> : null}

        {(Object.keys(ANALYZERS) as AnalyzerKind[]).map((kind) => (
          <TouchableOpacity key={kind} activeOpacity={0.9} disabled={!paired} onPress={() => router.push({ pathname: '/ai/[kind]', params: { kind } })}>
            <Card style={[styles.card, !paired && styles.disabled]}>
              <Card.Content style={styles.row}>
                <Text style={styles.icon}>{ANALYZERS[kind].icon}</Text>
                <View style={styles.flex}>
                  <Text style={styles.title}>{ANALYZERS[kind].title}</Text>
                  <Text style={styles.description}>{ANALYZERS[kind].description}</Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Recent analyses</Text>
        {loading ? <ActivityIndicator color={colors.accent} /> : null}
        {!loading && recent.length === 0 ? <Text style={styles.description}>No analyses yet.</Text> : null}
        {recent.map((r) => (
          <TouchableOpacity key={`${r.kind}-${r.id}`} onPress={() => router.push({ pathname: '/ai/[kind]', params: { kind: r.kind, analysisId: r.id } })}>
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.row}>
                  <Text style={styles.recentTitle}>{ANALYZERS[r.kind].icon} {ANALYZERS[r.kind].title}</Text>
                  {r.score !== null ? <Text style={styles.score}>{r.score}</Text> : null}
                </View>
                <Text style={styles.date}>{new Date(r.created_at).toLocaleDateString()}</Text>
                <Text style={styles.description} numberOfLines={2}>{r.summary}</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  intro: { fontSize: typography.body.fontSize, color: colors.gray, lineHeight: typography.body.lineHeight, marginBottom: spacing.md },
  notice: { color: colors.accent, marginBottom: spacing.md },
  card: { marginBottom: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.white, ...shadows.sm },
  disabled: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  flex: { flex: 1 },
  icon: { fontSize: 28 },
  title: { fontSize: typography.h4.fontSize, fontWeight: '700', color: colors.primary },
  description: { fontSize: typography.bodySmall.fontSize, color: colors.gray, marginTop: 2 },
  sectionTitle: { fontSize: typography.h4.fontSize, fontWeight: '700', color: colors.primary, marginTop: spacing.lg, marginBottom: spacing.sm },
  recentTitle: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.primary },
  score: { fontSize: typography.h4.fontSize, fontWeight: '800', color: colors.accent },
  date: { fontSize: typography.caption.fontSize, color: colors.gray },
});
