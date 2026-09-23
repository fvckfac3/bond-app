import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, ProgressBar } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows, typography } from '../../../constants/theme';
import { supabase } from '../../../services/supabase';
import { getCoupleContext, CoupleContext } from '../../../services/couple';
import { requestIndividualInsight, IndividualInsight } from '../../../services/insights';
import { useInsight } from '../../../hooks/useInsight';
import { useSubscription } from '../../../hooks/useSubscription';
import { allAssessments } from '../../../utils/allAssessments';
import InsightCard from '../../../components/insights/InsightCard';
import PaywallModal from '../../../components/subscription/PaywallModal';

interface Dimension { key: string; label: string; score: number; direction?: string }

// Your own result for one assessment: the score the app computed on submit, plus a private
// AI insight written by the backend from this result and everything else you've done.
export default function IndividualResultScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<any>(null);
  const [ctx, setCtx] = useState<CoupleContext | null>(null);
  const [coupleResultId, setCoupleResultId] = useState<string | null>(null);
  const [partnerDone, setPartnerDone] = useState(false);
  const [storedInsight, setStoredInsight] = useState<IndividualInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const { packages, refresh } = useSubscription(ctx?.userId);

  const load = useCallback(async () => {
    try {
      const [context, { data: row, error }] = await Promise.all([
        getCoupleContext(),
        supabase.from('assessment_sessions').select('id, user_id, assessment_id, scores, completed, submitted_at').eq('id', sessionId).maybeSingle(),
      ]);
      if (error) throw error;
      setCtx(context);
      setSession(row);
      if (!row) return;

      const { data: insight } = await supabase
        .from('individual_insights')
        .select('status, content')
        .eq('session_id', sessionId)
        .maybeSingle();
      if (insight?.status === 'ready') setStoredInsight(insight.content);

      if (context?.coupleUnitId) {
        const [{ data: result }, { data: partnerSession }] = await Promise.all([
          supabase.from('couple_results').select('id').eq('couple_unit_id', context.coupleUnitId).eq('assessment_id', row.assessment_id).maybeSingle(),
          // Readable only once you've completed the same assessment (paired gate in RLS).
          supabase.from('assessment_sessions').select('id').eq('user_id', context.partnerId).eq('assessment_id', row.assessment_id).eq('completed', true).limit(1),
        ]);
        setCoupleResultId(result?.id ?? null);
        setPartnerDone(Boolean(partnerSession?.length));
      }
    } catch (e) {
      console.error('Error loading result:', e);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const request = useMemo(
    () => (session?.completed ? () => requestIndividualInsight(sessionId) : null),
    [session?.completed, sessionId]
  );
  const insight = useInsight<IndividualInsight>(request, storedInsight);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
      </SafeAreaView>
    );
  }

  if (!session?.completed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.body}>This result isn&apos;t available.</Text>
          <Button onPress={() => router.back()}>Go back</Button>
        </View>
      </SafeAreaView>
    );
  }

  const assessment = allAssessments.find((a) => a.id === session.assessment_id);
  const scores = session.scores || {};
  const dimensions: Dimension[] = scores.dimensionScores || [];
  const strengths = (scores.strengths || []).slice(0, 2);
  const strengthKeys = new Set(strengths.map((s) => s.key));
  const growth = (scores.growthAreas || []).filter((g) => !strengthKeys.has(g.key)).slice(0, 2);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: assessment?.name || 'Your result', headerBackTitle: 'Back' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.scoreCard}>
          <Card.Content>
            <Text style={styles.kicker}>{assessment?.icon} Your result</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.score}>{Math.round(scores.overallScore ?? 0)}</Text>
              <Text style={styles.scoreOutOf}>/ 100</Text>
            </View>
            {scores.band?.title ? <Text style={styles.band}>{scores.band.title}</Text> : null}
            {scores.profileType?.title ? (
              <Text style={styles.scoreBody}>{scores.profileType.title}: {scores.profileType.summary}</Text>
            ) : scores.band?.summary ? (
              <Text style={styles.scoreBody}>{scores.band.summary}</Text>
            ) : null}
            {assessment?.framework ? <Text style={styles.framework}>Based on {assessment.framework}</Text> : null}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Your dimensions</Text>
            <Text style={styles.hint}>0–100, higher is healthier.</Text>
            {dimensions.map((d) => (
              <View key={d.key} style={styles.dimension}>
                <View style={styles.dimensionHeader}>
                  <Text style={styles.dimensionLabel}>{d.label}</Text>
                  <Text style={styles.dimensionScore}>{Math.round(d.score)}</Text>
                </View>
                <ProgressBar progress={Math.max(0, Math.min(1, d.score / 100))} color={colors.accent} style={styles.bar} />
              </View>
            ))}
          </Card.Content>
        </Card>

        {strengths.length || growth.length ? (
          <Card style={styles.card}>
            <Card.Content>
              {strengths.length ? (
                <>
                  <Text style={styles.cardTitle}>Strongest areas</Text>
                  {strengths.map((s) => <Text key={s.key} style={styles.bullet}>• {s.label}</Text>)}
                </>
              ) : null}
              {growth.length ? (
                <>
                  <Text style={[styles.cardTitle, styles.spaced]}>Room to grow</Text>
                  {growth.map((g) => <Text key={g.key} style={styles.bullet}>• {g.label}</Text>)}
                </>
              ) : null}
              {scores.recommendations?.length ? (
                <>
                  <Text style={[styles.cardTitle, styles.spaced]}>Suggestions</Text>
                  {scores.recommendations.map((r) => <Text key={r} style={styles.bullet}>• {r}</Text>)}
                </>
              ) : null}
            </Card.Content>
          </Card>
        ) : null}

        <InsightCard
          kind="individual"
          title="Your personal insight"
          state={insight}
          onRetry={insight.start}
          onUpgrade={() => setShowPaywall(true)}
        />

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Together</Text>
            {coupleResultId ? (
              <>
                <Text style={styles.body}>You&apos;ve both finished. Your couple results and shared insight are ready.</Text>
                <Button
                  mode="contained"
                  buttonColor={colors.accent}
                  style={styles.spaced}
                  onPress={() => router.push({ pathname: '/results/[assessmentId]', params: { assessmentId: session.assessment_id, coupleResultId } })}
                >
                  See couple results
                </Button>
              </>
            ) : ctx?.coupleUnitId ? (
              <Text style={styles.body}>
                {partnerDone
                  ? 'Your partner has finished too — your couple results are being prepared. Check back in a moment.'
                  : 'Once your partner completes this assessment, you’ll both get your couple results and a shared insight.'}
              </Text>
            ) : (
              <Text style={styles.body}>Pair with your partner to compare results and get a shared couple insight.</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        packages={packages}
        onSuccess={() => {
          setShowPaywall(false);
          refresh();
          insight.start();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  scoreCard: { marginBottom: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.primary, ...shadows.md },
  kicker: { fontSize: typography.caption.fontSize, color: colors.blush, textTransform: 'uppercase', letterSpacing: 1.2 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.sm },
  score: { fontSize: 56, fontWeight: '800', color: colors.white, lineHeight: 60 },
  scoreOutOf: { fontSize: typography.h4.fontSize, color: colors.blush, marginLeft: spacing.xs, marginBottom: spacing.sm },
  band: { fontSize: typography.h4.fontSize, fontWeight: '700', color: colors.gold, marginTop: spacing.xs },
  scoreBody: { fontSize: typography.body.fontSize, color: colors.white, marginTop: spacing.sm, lineHeight: typography.body.lineHeight },
  framework: { fontSize: typography.caption.fontSize, color: colors.blush, marginTop: spacing.md },
  card: { marginBottom: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.white, ...shadows.sm },
  cardTitle: { fontSize: typography.h4.fontSize, fontWeight: '700', color: colors.primary },
  hint: { fontSize: typography.caption.fontSize, color: colors.gray, marginBottom: spacing.sm },
  dimension: { marginTop: spacing.sm },
  dimensionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  dimensionLabel: { fontSize: typography.body.fontSize, color: colors.black },
  dimensionScore: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.primary },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.lightGray },
  bullet: { fontSize: typography.body.fontSize, color: colors.black, marginTop: spacing.xs, lineHeight: typography.body.lineHeight },
  body: { fontSize: typography.body.fontSize, color: colors.black, lineHeight: typography.body.lineHeight, marginTop: spacing.xs },
  spaced: { marginTop: spacing.md },
});
