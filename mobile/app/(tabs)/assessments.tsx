// Assessments Screen - Refined
// Built following: animation-patterns, polish, mobile-design, shadows, ui-ux-patterns
// Clean list with purposeful animations

import { useState, useCallback } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Alert, Platform, AccessibilityInfo } from 'react-native';
import { Card, Chip, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../services/supabase';
import { colors, spacing, borderRadius, shadows, motion, typography, touchTargets } from '../../constants/theme';
import { allAssessments } from '../../utils/allAssessments';
import FadeInView, { StaggerContainer, StaggerItem } from '../../components/animated/FadeInView';
import ScaleButton from '../../components/animated/ScaleButton';
import { useSubscription } from '../../hooks/useSubscription';
import PaywallModal from '../../components/subscription/PaywallModal';
import { onboardingQuestions } from '../../utils/onboardingAssessment';

const onboardingAssessment = {
  id: 'onboarding-assessment',
  name: 'Couple Onboarding',
  description: 'Start here to find the best assessments and learning series for where your relationship is right now.',
  estimatedTime: '3 min',
  questionsCount: onboardingQuestions.length,
  icon: '🧭',
  category: 'onboarding',
};

const assessmentList = [onboardingAssessment, ...allAssessments.filter((item) => item.id !== 'onboarding-assessment')];

export default function AssessmentsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [coupleUnit, setCoupleUnit] = useState(null);
  const [completedAssessments, setCompletedAssessments] = useState([]);
  // assessment_id -> your latest completed session (you've finished; your partner may not have)
  const [mySessions, setMySessions] = useState<Record<string, string>>({});
  const [assessmentResults, setAssessmentResults] = useState({});
  const [showPaywall, setShowPaywall] = useState(false);

  // Get subscription status
  const { canUseFeature, isPremium, packages } = useSubscription(user?.id);

  // Refresh on focus so a just-submitted assessment shows its new status.
  useFocusEffect(useCallback(() => { fetchAssessments(); }, []));

  async function fetchAssessments() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      setUser(authUser);

      const { data: sessions } = await supabase
        .from('assessment_sessions')
        .select('id, assessment_id')
        .eq('user_id', authUser.id)
        .eq('completed', true)
        .order('submitted_at', { ascending: false });
      const latest = {};
      (sessions || []).forEach((s) => { latest[s.assessment_id] ||= s.id; });
      setMySessions(latest);

      // Get couple unit
      const { data: coupleData } = await supabase
        .from('couple_units')
        .select('*')
        .or(`user1_id.eq.${authUser.id},user2_id.eq.${authUser.id}`)
        .eq('status', 'active')
        .single();

      setCoupleUnit(coupleData);

      if (coupleData) {
        // Get completed couple results
        const { data: results } = await supabase
          .from('couple_results')
          .select('assessment_id, id')
          .eq('couple_unit_id', coupleData.id);

        setCompletedAssessments(results?.map(r => r.assessment_id) || []);

        // Create a map of assessment_id to result_id
        const resultsMap = {};
        results?.forEach(r => {
          resultsMap[r.assessment_id] = r.id;
        });
        setAssessmentResults(resultsMap);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  }

  function getAssessmentStatus(assessmentId) {
    if (completedAssessments.includes(assessmentId)) return 'completed';
    return mySessions[assessmentId] ? 'submitted' : 'available';
  }

  function handleAssessmentPress(assessment) {
    // Onboarding is taken solo at signup and is always free.
    if (assessment.id === 'onboarding-assessment') {
      router.push(`/assessment/${assessment.id}`);
      return;
    }

    // Already finished: show your result (it links to the couple result once both are done).
    if (mySessions[assessment.id]) {
      router.push({ pathname: '/results/session/[sessionId]', params: { sessionId: mySessions[assessment.id] } });
      return;
    }

    if (!coupleUnit) {
      Alert.alert(
        'Partner Required',
        'Connect with your partner first to start assessments together.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if user can use assessment feature (free tier limit)
    if (!canUseFeature('assessment')) {
      setShowPaywall(true);
      return;
    }

    router.push(`/assessment/${assessment.id}`);
  }

  const renderAssessmentCard = ({ item: assessment, index }) => {
    const status = getAssessmentStatus(assessment.id);
    const isCompleted = status === 'completed';

    return (
      <StaggerItem index={index} stagger={motion.stagger}>
        <ScaleButton
          onPress={() => handleAssessmentPress(assessment)}
          style={styles.assessmentCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.icon}>{assessment.icon}</Text>
            <View style={styles.headerText}>
              <Text style={styles.assessmentTitle}>{assessment.name}</Text>
              {assessment.id === 'onboarding-assessment' ? (
                <Chip mode="flat" style={styles.onboardingChip} textStyle={styles.onboardingChipText}>Start here</Chip>
              ) : (
                <Chip
                  mode="outlined"
                  style={[
                    styles.statusChip,
                    isCompleted && styles.completedChip,
                  ]}
                  textStyle={[
                    styles.chipText,
                    isCompleted && styles.completedChipText,
                  ]}
                >
                  {isCompleted ? '✓ Completed' : status === 'submitted' ? 'Waiting for partner' : 'Available'}
                </Chip>
              )}
            </View>
          </View>

          <Text style={styles.framework}>{assessment.framework}</Text>
          <Text style={styles.description}>{assessment.description}</Text>

          <View style={styles.metaInfo}>
            <Text style={styles.metaText}>{assessment.estimatedTime}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{assessment.questionsCount} questions</Text>
          </View>

          {isCompleted && (
            <TouchableOpacity
              style={styles.viewResultsButton}
              onPress={() => router.push({
                pathname: '/results/[assessmentId]',
                params: {
                  assessmentId: assessment.id,
                  coupleResultId: assessmentResults[assessment.id]
                }
              })}
            >
              <Text style={styles.viewResultsText}>View Couple Results →</Text>
            </TouchableOpacity>
          )}
        </ScaleButton>
      </StaggerItem>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.headerGradient}>
          <View style={styles.header}>
            <SkeletonLoader height={32} width="60%" style={{ marginBottom: spacing.sm }} />
            <SkeletonLoader height={16} width="80%" />
          </View>
        </LinearGradient>
        <View style={{ padding: spacing.md }}>
          {[1, 2, 3, 4].map(i => (
            <SkeletonLoader
              key={i}
              height={130}
              style={{ marginBottom: spacing.md, borderRadius: borderRadius.md }}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <LinearGradient
        colors={[colors.blush, colors.white]}
        style={styles.headerGradient}
      >
        <FadeInView style={styles.header}>
          <Text style={styles.headerTitle}>Relationship Assessments</Text>
          <Text style={styles.headerSubtitle}>
            Science-backed insights to strengthen your relationship
          </Text>

          {!coupleUnit && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Connect with your partner to begin assessments
              </Text>
            </View>
          )}

          {coupleUnit && (
            <ProgressBar
              progress={completedAssessments.length / allAssessments.length}
              color={colors.teal}
              style={styles.progressBar}
            />
          )}
        </FadeInView>
      </LinearGradient>

      <FlatList
        data={assessmentList}
        renderItem={renderAssessmentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: spacing.xl }} />}
      />

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

// Skeleton loader for loading state
function SkeletonLoader({ height, style }) {
  return (
    <View
      style={[
        {
          height,
          borderRadius: borderRadius.md,
          backgroundColor: colors.lightGray,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingBottom: spacing.lg,
  },
  header: {
    padding: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.h1.fontSize,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
    letterSpacing: typography.h1.letterSpacing,
  },
  headerSubtitle: {
    fontSize: typography.body.fontSize,
    color: colors.gray,
    marginBottom: spacing.md,
    lineHeight: typography.body.lineHeight,
  },
  warningBox: {
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  warningText: {
    color: colors.warning,
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    borderRadius: borderRadius.xs,
    marginTop: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
  },
  assessmentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
    justifyContent: 'space-between',
  },
  assessmentTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statusChip: {
    alignSelf: 'flex-start',
    borderColor: colors.accent,
    backgroundColor: 'transparent',
  },
  completedChip: {
    backgroundColor: colors.successLight,
    borderColor: colors.teal,
  },
  chipText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.accent,
  },
  completedChipText: {
    color: colors.teal,
  },
  framework: {
    fontSize: typography.overline.fontSize,
    color: colors.teal,
    marginBottom: spacing.sm,
    fontWeight: '600',
    letterSpacing: typography.overline.letterSpacing,
    textTransform: typography.overline.textTransform,
  },
  description: {
    fontSize: typography.body.fontSize,
    color: colors.gray,
    marginBottom: spacing.md,
    lineHeight: typography.body.lineHeight,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: typography.caption.fontSize,
    color: colors.gray,
  },
  metaDot: {
    fontSize: typography.caption.fontSize,
    color: colors.gray,
    marginHorizontal: spacing.xs,
  },
  viewResultsButton: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  viewResultsText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: typography.body.fontSize,
  },
  onboardingChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
  },
  onboardingChipText: {
    color: colors.white,
    fontWeight: '700',
  },
});