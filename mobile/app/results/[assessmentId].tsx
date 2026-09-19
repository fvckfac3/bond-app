import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ScrollView, Dimensions, Alert } from 'react-native';
import { Card, Button, Divider, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import { colors, spacing } from '../../constants/theme';
import { allAssessments } from '../../utils/allAssessments';
import { getOnboardingRecommendations } from '../../utils/onboardingAssessment';
import { useSubscription } from '../../hooks/useSubscription';
import PaywallModal from '../../components/subscription/PaywallModal';
import UpgradeButton from '../../components/subscription/UpgradeButton';

const { width } = Dimensions.get('window');

export default function ResultsScreen() {
  const { assessmentId, coupleResultId } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState(null);
  const [coupleResult, setCoupleResult] = useState(null);
  const [user1Data, setUser1Data] = useState(null);
  const [user2Data, setUser2Data] = useState(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [userId, setUserId] = useState(undefined);
  const [showPaywall, setShowPaywall] = useState(false);
  const insightsRequested = useRef(false);
  const { canUseFeature, packages, loading: subscriptionLoading } = useSubscription(userId);
  const subscriptionReady = !!userId && !subscriptionLoading;
  const onboardingResult = assessmentId === 'onboarding-assessment' ? coupleResult : null;

  useEffect(() => {
    loadResults();
  }, [assessmentId, coupleResultId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id));
  }, []);

  // AI generation is a premium feature: only call the backend once we know the
  // user's plan allows it, and never more than once per screen visit.
  useEffect(() => {
    if (insightsRequested.current || !subscriptionReady || loading) return;
    if (!coupleResult || !user1Data || !user2Data || onboardingResult) return;
    if (coupleResult.couple_summary || coupleResult.ai_narrative) return;
    if (!canUseFeature('ai_insight')) return;
    insightsRequested.current = true;
    generateAIInsights(coupleResult.id, user1Data, user2Data);
  }, [subscriptionReady, loading, coupleResult, user1Data, user2Data, canUseFeature]);

  async function loadResults() {
    try {
      const foundAssessment = allAssessments.find(a => a.id === assessmentId);
      setAssessment(foundAssessment);

      if (assessmentId === 'onboarding-assessment') {
        const { data: onboardingData, error: onboardingError } = await supabase
          .from('onboarding_assessments')
          .select('*')
          .eq('assessment_id', assessmentId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (onboardingError) throw onboardingError;
        setCoupleResult({
          compatibility_score: onboardingData?.couple_profile?.score || onboardingData?.coupleScore || 0,
          couple_summary: onboardingData?.feedback?.summary || onboardingData?.recommendations?.feedback || '',
          relationship_pattern_title: onboardingData?.recommendations?.headline || onboardingData?.feedback?.headline || 'Onboarding result',
          relationship_pattern_summary: onboardingData?.feedback?.summary || onboardingData?.recommendations?.feedback || '',
          recommended_assessments: onboardingData?.recommended_assessments || [],
          recommended_series: onboardingData?.recommended_series || [],
          onboarding: onboardingData,
        });
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

  async function generateAIInsights(resultId, session1, session2) {
    setGeneratingInsights(true);
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
      
      if (!backendUrl) {
        console.error('Backend URL not configured');
        Alert.alert('Configuration Error', 'AI insights service is not configured. Please contact support.');
        return;
      }

      const response = await fetch(`${backendUrl}/api/generate-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_name: assessment.name,
          framework: assessment.framework,
          user1_scores: session1.scores || {},
          user2_scores: session2.scores || {},
          user1_name: session1.users?.name || 'Partner 1',
          user2_name: session2.users?.name || 'Partner 2',
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const insights = await response.json();

      await supabase
        .from('couple_results')
        .update({
          ai_narrative: insights.narrative,
          ai_growth_recommendations: insights.growth_recommendations,
          ai_strength_affirmation: insights.strength_affirmation,
          ai_communication_scripts: insights.communication_scripts,
          framework_tags: insights.framework_tags,
        })
        .eq('id', resultId);

      await loadResults();
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setGeneratingInsights(false);
    }
  }

  function renderScoreComparison() {
    if (!user1Data?.scores || !user2Data?.scores) return null;

    const scores1 = user1Data.scores;
    const scores2 = user2Data.scores;

    if (assessmentId === 'love-languages') {
      const categories = ['words', 'time', 'gifts', 'acts', 'touch'];
      return (
        <View style={styles.comparisonContainer}>
          {categories.map(cat => (
            <View key={cat} style={styles.categoryRow}>
              <Text style={styles.categoryLabel}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
              <View style={styles.barsContainer}>
                <View style={styles.barRow}>
                  <Text style={styles.barLabel}>{user1Data.users?.name}</Text>
                  <View style={[styles.bar, styles.bar1, { width: `${Math.max((scores1[cat] || 0) * 10, 12)}%` }]}>
                    <Text style={styles.barText}>{scores1[cat] || 0}</Text>
                  </View>
                </View>
                <View style={styles.barRow}>
                  <Text style={styles.barLabel}>{user2Data.users?.name}</Text>
                  <View style={[styles.bar, styles.bar2, { width: `${Math.max((scores2[cat] || 0) * 10, 12)}%` }]}>
                    <Text style={styles.barText}>{scores2[cat] || 0}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      );
    }

    if (scores1.averageScore !== undefined) {
      return (
        <View style={styles.comparisonContainer}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreName}>{user1Data.users?.name}</Text>
            <Text style={styles.scoreValue}>{scores1.averageScore?.toFixed(1)}/5</Text>
          </View>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreName}>{user2Data.users?.name}</Text>
            <Text style={styles.scoreValue}>{scores2.averageScore?.toFixed(1)}/5</Text>
          </View>
        </View>
      );
    }

    return null;
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
                  <Text style={styles.profileLabel}>Partner 1</Text>
                  <Text style={styles.profileText}>{partner1.summary || partner1.profileType?.title || 'Profile captured'}</Text>
                  <Text style={styles.profileMeta}>Overall: {partner1.overallScore?.toFixed?.(1) || partner1.overallScore || 0}%</Text>
                </View>
              )}
              {partner2 && (
                <View style={styles.profileBlock}>
                  <Text style={styles.profileLabel}>Partner 2</Text>
                  <Text style={styles.profileText}>{partner2.summary || partner2.profileType?.title || 'Profile captured'}</Text>
                  <Text style={styles.profileMeta}>Overall: {partner2.overallScore?.toFixed?.(1) || partner2.overallScore || 0}%</Text>
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

        {generatingInsights ? (
          <Card style={styles.card}>
            <Card.Content>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.generatingText}>Generating AI insights...</Text>
            </Card.Content>
          </Card>
        ) : subscriptionReady && !onboardingResult && !canUseFeature('ai_insight') ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>🔒 AI Insights</Text>
              <Text style={styles.generatingText}>
                Personalized insights, growth recommendations and conversation starters for your
                results are included with Premium.
              </Text>
              <UpgradeButton onPress={() => setShowPaywall(true)} text="Unlock AI Insights" />
            </Card.Content>
          </Card>
        ) : coupleResult?.ai_narrative ? (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>✨ Insights</Text>
                <Text style={styles.narrative}>{coupleResult.ai_narrative}</Text>
              </Card.Content>
            </Card>

            {coupleResult.ai_strength_affirmation && (
              <Card style={[styles.card, styles.strengthCard]}>
                <Card.Content>
                  <Text style={styles.strengthIcon}>💪</Text>
                  <Text style={styles.strengthText}>{coupleResult.ai_strength_affirmation}</Text>
                </Card.Content>
              </Card>
            )}

            {coupleResult.ai_growth_recommendations?.length > 0 && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.cardTitle}>🌱 Growth Recommendations</Text>
                  {coupleResult.ai_growth_recommendations.map((rec, index) => (
                    <View key={index} style={styles.recommendation}>
                      <Text style={styles.recommendationNumber}>{index + 1}</Text>
                      <Text style={styles.recommendationText}>{rec}</Text>
                    </View>
                  ))}
                </Card.Content>
              </Card>
            )}

            {coupleResult.ai_communication_scripts && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.cardTitle}>💬 Conversation Starters</Text>
                  {coupleResult.ai_communication_scripts.divergence_conversation && (
                    <View style={styles.script}>
                      <Text style={styles.scriptLabel}>For differences:</Text>
                      <Text style={styles.scriptText}>
                        "{coupleResult.ai_communication_scripts.divergence_conversation}"
                      </Text>
                    </View>
                  )}
                  {coupleResult.ai_communication_scripts.appreciation_expression && (
                    <View style={styles.script}>
                      <Text style={styles.scriptLabel}>For appreciation:</Text>
                      <Text style={styles.scriptText}>
                        "{coupleResult.ai_communication_scripts.appreciation_expression}"
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            )}
          </>
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
                <Text key={item} style={styles.bullet}>• {item}</Text>
              ))}
              <Divider style={{ marginVertical: spacing.md }} />
              <Text style={styles.cardTitle}>Recommended Learning Series</Text>
              {(onboardingResult.recommended_series || []).map((item) => (
                <Text key={item} style={styles.bullet}>• {item}</Text>
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
  scoreCard: {
    backgroundColor: colors.blush,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  scoreName: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
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
