import { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, ScrollView, Dimensions, Alert } from 'react-native';
import { Card, Button, Divider, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import { colors, spacing } from '../../constants/theme';
import { allAssessments } from '../../utils/allAssessments';
import { fetchSeriesTitles } from '../../services/learning';
import { useSubscription } from '../../hooks/useSubscription';
import PaywallModal from '../../components/subscription/PaywallModal';
import InsightCard from '../../components/insights/InsightCard';
import { requestCoupleInsight, CoupleInsight } from '../../services/insights';
import { useInsight } from '../../hooks/useInsight';

const { width } = Dimensions.get('window');

export default function ResultsScreen() {
  const { assessmentId, coupleResultId } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState(null);
  const [coupleResult, setCoupleResult] = useState(null);
  const [user1Data, setUser1Data] = useState(null);
  const [user2Data, setUser2Data] = useState(null);
  const [seriesTitles, setSeriesTitles] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState(undefined);
  const [showPaywall, setShowPaywall] = useState(false);
  const { packages } = useSubscription(userId);
  const onboardingResult = assessmentId === 'onboarding-assessment' ? coupleResult : null;

  useEffect(() => {
    loadResults();
  }, [assessmentId, coupleResultId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id));
  }, []);

  // The couple insight is written once by the backend for both partners; this screen asks for
  // it (idempotent) and shows whatever is already stored straight away.
  const storedInsight = useMemo<CoupleInsight | null>(() => {
    if (!coupleResult || onboardingResult) return null;
    if (coupleResult.ai_status === 'ready' && coupleResult.ai_insight) return coupleResult.ai_insight;
    if (coupleResult.ai_narrative) {
      // Written by an older app version, before insights moved to the backend.
      return {
        headline: '',
        narrative: coupleResult.ai_narrative,
        shared_strengths: [],
        growth_opportunities: [],
        how_you_differ: null,
        conversation_starters: Object.values(coupleResult.ai_communication_scripts || {}).filter((v) => typeof v === 'string') as string[],
        try_together: coupleResult.ai_growth_recommendations || [],
        strength_affirmation: coupleResult.ai_strength_affirmation || '',
        safety_note: null,
      };
    }
    return null;
  }, [coupleResult, onboardingResult]);
  const insightRequest = useMemo(
    () => (coupleResult?.id && !onboardingResult ? () => requestCoupleInsight(coupleResult.id) : null),
    [coupleResult?.id, onboardingResult]
  );
  const insight = useInsight<CoupleInsight>(insightRequest, storedInsight);

  async function loadResults() {
    try {
      const foundAssessment = allAssessments.find(a => a.id === assessmentId);
      setAssessment(foundAssessment);

      if (assessmentId === 'onboarding-assessment') {
        setAssessment({ id: assessmentId, name: 'Couple Onboarding', icon: '🧭', framework: '' });
        const { data: { user } } = await supabase.auth.getUser();
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding_assessments')
          .select('*')
          .eq('user_id', user?.id)
          .eq('assessment_id', assessmentId)
          .single();

        if (onboardingError) throw onboardingError;
        setCoupleResult({
          couple_summary: onboardingData?.feedback?.summary || onboardingData?.recommendations?.feedback || '',
          relationship_pattern_title: onboardingData?.recommendations?.headline || onboardingData?.feedback?.headline || 'Onboarding result',
          relationship_pattern_summary: onboardingData?.feedback?.summary || onboardingData?.recommendations?.feedback || '',
          recommended_assessments: onboardingData?.recommended_assessments || [],
          recommended_series: onboardingData?.recommended_series || [],
          onboarding: onboardingData,
        });
        // Titles are a nicety: fall back to the series key if the lookup fails.
        fetchSeriesTitles(onboardingData?.recommended_series || []).then(setSeriesTitles).catch(() => {});
        setLoading(false);
        return;
      }

      const { data: resultData, error: resultError } = await supabase
        .from('couple_results')
        .select('*')
        .eq('id', coupleResultId)
        .single();

      if (resultError) throw resultError;
      setCoupleResult(resultData);

      const { data: session1 } = await supabase
        .from('assessment_sessions')
        .select('*, users!assessment_sessions_user_id_fkey(name)')
        .eq('id', resultData.user1_session_id)
        .single();

      const { data: session2 } = await supabase
        .from('assessment_sessions')
        .select('*, users!assessment_sessions_user_id_fkey(name)')
        .eq('id', resultData.user2_session_id)
        .single();

      setUser1Data(session1);
      setUser2Data(session2);

    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  }

  // Side-by-side 0-100 dimension scores for both partners, for every assessment.
  function renderScoreComparison() {
    const dims1 = user1Data?.scores?.dimensionScores;
    const dims2 = user2Data?.scores?.dimensionScores;
    if (!Array.isArray(dims1) || !Array.isArray(dims2)) return null;

    return (
      <View style={styles.comparisonContainer}>
        {dims1.map((dimension) => {
          const partnerScore = dims2.find((d) => d.key === dimension.key)?.score ?? 0;
          return (
            <View key={dimension.key} style={styles.categoryRow}>
              <Text style={styles.categoryLabel}>{dimension.label}</Text>
              <View style={styles.barsContainer}>
                <View style={styles.barRow}>
                  <Text style={styles.barLabel}>{user1Data.users?.name}</Text>
                  <View style={[styles.bar, styles.bar1, { width: `${Math.max(dimension.score, 12)}%` }]}>
                    <Text style={styles.barText}>{Math.round(dimension.score)}</Text>
                  </View>
                </View>
                <View style={styles.barRow}>
                  <Text style={styles.barLabel}>{user2Data.users?.name}</Text>
                  <View style={[styles.bar, styles.bar2, { width: `${Math.max(partnerScore, 12)}%` }]}>
                    <Text style={styles.barText}>{Math.round(partnerScore)}</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  function renderStructuredCoupleResult() {
    if (!coupleResult?.couple_summary && !coupleResult?.relationship_pattern_title && !coupleResult?.combined_scores) {
      return null;
    }

    const combined = coupleResult.combined_scores || {};
    const partner1 = coupleResult.partner1_profile || combined.partner1Profile;
    const partner2 = coupleResult.partner2_profile || combined.partner2Profile;
    const comparisons = coupleResult.dimension_comparisons || combined.dimensionComparisons || [];
    const strengths = coupleResult.shared_strengths || combined.sharedStrengths || [];
    const growth = coupleResult.shared_growth_areas || combined.sharedGrowthAreas || [];
    const asymmetry = coupleResult.asymmetry_flags || combined.asymmetryFlags || [];
    const actionPlan = coupleResult.action_plan || combined.actionPlan || [];
    const scripts = coupleResult.conversation_scripts || combined.conversationScripts || {};
    const warnings = combined.warnings || [];
    const topPreferences = combined.topPreferences;
    const name1 = user1Data?.users?.name || 'Partner 1';
    const name2 = user2Data?.users?.name || 'Partner 2';

    return (
      <>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Compatibility Score</Text>
            <Text style={styles.compatibilityScore}>{Math.round(coupleResult.compatibility_score)}%</Text>
            {coupleResult.relationship_pattern_title && (
              <Text style={styles.patternTitle}>{coupleResult.relationship_pattern_title}</Text>
            )}
            {coupleResult.relationship_pattern_summary && (
              <Text style={styles.patternSummary}>{coupleResult.relationship_pattern_summary}</Text>
            )}
          </Card.Content>
        </Card>

        {warnings.map((warning) => (
          <Card key={warning} style={[styles.card, styles.warningCard]}>
            <Card.Content>
              <Text style={styles.cardTitle}>Worth your attention</Text>
              <Text style={styles.narrative}>{warning}</Text>
            </Card.Content>
          </Card>
        ))}

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Couple Summary</Text>
            <Text style={styles.narrative}>{coupleResult.couple_summary}</Text>
          </Card.Content>
        </Card>

        {(partner1 || partner2) && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Individual Profiles</Text>
              {partner1 && (
                <View style={styles.profileBlock}>
                  <Text style={styles.profileLabel}>{name1}</Text>
                  <Text style={styles.profileText}>{partner1.summary || partner1.profileType?.title || 'Profile captured'}</Text>
                  <Text style={styles.profileMeta}>Overall: {partner1.overallScore?.toFixed?.(1) || partner1.overallScore || 0}%</Text>
                  {topPreferences?.partner1?.length ? (
                    <Text style={styles.profileMeta}>Feels most loved through: {topPreferences.partner1.join(', ')}</Text>
                  ) : null}
                </View>
              )}
              {partner2 && (
                <View style={styles.profileBlock}>
                  <Text style={styles.profileLabel}>{name2}</Text>
                  <Text style={styles.profileText}>{partner2.summary || partner2.profileType?.title || 'Profile captured'}</Text>
                  <Text style={styles.profileMeta}>Overall: {partner2.overallScore?.toFixed?.(1) || partner2.overallScore || 0}%</Text>
                  {topPreferences?.partner2?.length ? (
                    <Text style={styles.profileMeta}>Feels most loved through: {topPreferences.partner2.join(', ')}</Text>
                  ) : null}
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {comparisons.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Dimension Breakdown</Text>
              {comparisons.map((item) => (
                <View key={item.key} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{item.label}</Text>
                  <Text style={styles.breakdownValue}>{Math.round(item.leftScore)} / {Math.round(item.rightScore)} • {Math.round(item.gap)} gap</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {strengths.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Shared Strengths</Text>
              {strengths.map((item) => (
                <Text key={item.key} style={styles.bullet}>• {item.summary}</Text>
              ))}
            </Card.Content>
          </Card>
        )}

        {growth.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Shared Growth Areas</Text>
              {growth.map((item) => (
                <Text key={item.key} style={styles.bullet}>• {item.summary}</Text>
              ))}
            </Card.Content>
          </Card>
        )}

        {asymmetry.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Mismatch Flags</Text>
              {asymmetry.map((item) => (
                <Text key={item.key} style={styles.bullet}>• {item.summary}</Text>
              ))}
            </Card.Content>
          </Card>
        )}

        {actionPlan.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Action Plan</Text>
              {actionPlan.map((item, index) => (
                <View key={`${item}-${index}`} style={styles.recommendation}>
                  <Text style={styles.recommendationNumber}>{index + 1}</Text>
                  <Text style={styles.recommendationText}>{item}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {(scripts.opening || scripts.repair || scripts.appreciation) && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Conversation Scripts</Text>
              {scripts.opening && <Text style={styles.scriptText}>Open: “{scripts.opening}”</Text>}
              {scripts.repair && <Text style={styles.scriptText}>Repair: “{scripts.repair}”</Text>}
              {scripts.appreciation && <Text style={styles.scriptText}>Appreciation: “{scripts.appreciation}”</Text>}
            </Card.Content>
          </Card>
        )}
      </>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>{assessment?.icon}</Text>
          <Text style={styles.headerTitle}>{assessment?.name} Results</Text>
          <Text style={styles.headerSubtitle}>{assessment?.framework}</Text>
        </View>

        {coupleResult?.compatibility_score && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.compatibilityLabel}>Compatibility Score</Text>
              <Text style={styles.compatibilityScore}>{Math.round(coupleResult.compatibility_score)}%</Text>
              {coupleResult.relationship_pattern_title && (
                <Text style={styles.patternTitle}>{coupleResult.relationship_pattern_title}</Text>
              )}
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Your Responses</Text>
            {renderScoreComparison()}
          </Card.Content>
        </Card>

        {renderStructuredCoupleResult()}

        {coupleResult && !onboardingResult ? (
          <InsightCard
            kind="couple"
            title="Your couple insight"
            state={insight}
            onRetry={insight.start}
            onUpgrade={() => setShowPaywall(true)}
          />
        ) : null}

        {onboardingResult ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Onboarding Recommendation</Text>
              <Text style={styles.patternTitle}>{onboardingResult.relationship_pattern_title}</Text>
              <Text style={styles.patternSummary}>{onboardingResult.relationship_pattern_summary}</Text>
              <Text style={styles.narrative}>{onboardingResult.couple_summary}</Text>
              <Divider style={{ marginVertical: spacing.md }} />
              <Text style={styles.cardTitle}>Recommended Next Assessments</Text>
              {(onboardingResult.recommended_assessments || []).map((item) => (
                <Text
                  key={item}
                  style={styles.bullet}
                  onPress={() => router.push(`/assessment/${item}`)}
                >
                  • {allAssessments.find((a) => a.id === item)?.name || item} →
                </Text>
              ))}
              <Divider style={{ marginVertical: spacing.md }} />
              <Text style={styles.cardTitle}>Recommended Learning Series</Text>
              {(onboardingResult.recommended_series || []).map((item) => (
                <Text
                  key={item}
                  style={styles.bullet}
                  onPress={() => router.push({ pathname: '/learning/[seriesKey]', params: { seriesKey: item } })}
                >
                  • {seriesTitles[item] || item} →
                </Text>
              ))}
            </Card.Content>
          </Card>
        ) : null}

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.actionButton}
          >
            Back to Assessments
          </Button>
        </View>
      </ScrollView>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        packages={packages}
        onSuccess={() => {
          setShowPaywall(false);
          router.push('/subscription/success');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  warningCard: {
    backgroundColor: colors.warningLight,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.gray,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.blush,
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.teal,
    textAlign: 'center',
  },
  card: {
    margin: spacing.md,
    borderRadius: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  compatibilityLabel: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  compatibilityScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.teal,
    textAlign: 'center',
  },
  patternTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  patternSummary: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  comparisonContainer: {
    marginTop: spacing.sm,
  },
  categoryRow: {
    marginBottom: spacing.lg,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  barsContainer: {
    gap: spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barLabel: {
    width: 80,
    fontSize: 12,
    color: colors.gray,
  },
  bar: {
    height: 30,
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    minWidth: 40,
  },
  bar1: {
    backgroundColor: colors.accent,
  },
  bar2: {
    backgroundColor: colors.teal,
  },
  barText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  profileBlock: {
    marginBottom: spacing.md,
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.teal,
    marginBottom: spacing.xs,
  },
  profileText: {
    fontSize: 15,
    color: colors.black,
    lineHeight: 22,
  },
  profileMeta: {
    fontSize: 13,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  breakdownRow: {
    marginBottom: spacing.sm,
  },
  breakdownLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  breakdownValue: {
    fontSize: 13,
    color: colors.gray,
    marginTop: 2,
  },
  bullet: {
    fontSize: 15,
    color: colors.black,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  generatingText: {
    marginTop: spacing.sm,
    textAlign: 'center',
    color: colors.gray,
  },
  narrative: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.black,
  },
  strengthCard: {
    backgroundColor: colors.blush,
  },
  strengthIcon: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  strengthText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 24,
  },
  recommendation: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  recommendationNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.teal,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: 'bold',
    marginRight: spacing.md,
  },
  recommendationText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: colors.black,
  },
  script: {
    marginBottom: spacing.md,
  },
  scriptLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray,
    marginBottom: spacing.xs,
  },
  scriptText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: colors.primary,
    lineHeight: 22,
  },
  actions: {
    padding: spacing.lg,
  },
  actionButton: {
    borderColor: colors.primary,
    borderRadius: 8,
  },
});
