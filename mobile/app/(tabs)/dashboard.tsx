// Dashboard Screen - Refined
// Built following: animation-patterns, polish, mobile-design, shadows, ui-ux-patterns
// Purposeful animations with proper touch targets

import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, RefreshControl, Platform, AccessibilityInfo } from 'react-native';
import { Card, Button, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../services/supabase';
import { colors, spacing, borderRadius, shadows, motion, typography, touchTargets } from '../../constants/theme';
import { formatPairCode } from '../../utils/pairCode';
import DailyCheckInModal from '../../components/DailyCheckInModal';
import FadeInView from '../../components/animated/FadeInView';
import ScaleButton from '../../components/animated/ScaleButton';
import SkeletonLoader from '../../components/animated/SkeletonLoader';
import { useSubscription } from '../../hooks/useSubscription';
import PaywallModal from '../../components/subscription/PaywallModal';
import PremiumBadge from '../../components/subscription/PremiumBadge';
import UpgradeButton from '../../components/subscription/UpgradeButton';

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [coupleUnit, setCoupleUnit] = useState(null);
  const [partner, setPartner] = useState(null);
  const [completedAssessments, setCompletedAssessments] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Get subscription data
  const { isPremium, packages, usage, loading: subscriptionLoading } = useSubscription(user?.id);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Get user profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      setUser(userData);

      // Get couple unit
      const { data: coupleData } = await supabase
        .from('couple_units')
        .select('*')
        .or(`user1_id.eq.${authUser.id},user2_id.eq.${authUser.id}`)
        .eq('status', 'active')
        .single();

      if (coupleData) {
        setCoupleUnit(coupleData);

        // Get partner info
        const partnerId = coupleData.user1_id === authUser.id
          ? coupleData.user2_id
          : coupleData.user1_id;

        const { data: partnerData } = await supabase
          .from('users')
          .select('*')
          .eq('id', partnerId)
          .single();

        setPartner(partnerData);

        // Get completed assessments count
        const { count } = await supabase
          .from('couple_results')
          .select('*', { count: 'exact', head: true })
          .eq('couple_unit_id', coupleData.id);

        setCompletedAssessments(count || 0);

        // Get streak
        const { data: streakData } = await supabase
          .from('streaks')
          .select('*')
          .eq('couple_unit_id', coupleData.id)
          .single();

        if (streakData) {
          setStreak(streakData.current_streak);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    fetchDashboardData();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <LinearGradient
          colors={[colors.blush, colors.white]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <SkeletonLoader height={32} width="70%" style={{ marginBottom: spacing.sm }} />
            <SkeletonLoader height={18} width="90%" />
          </View>
        </LinearGradient>
        <View style={{ padding: spacing.md }}>
          <SkeletonLoader height={140} style={{ marginBottom: spacing.md, borderRadius: borderRadius.md }} />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <SkeletonLoader height={110} style={{ flex: 1, borderRadius: borderRadius.md }} />
            <SkeletonLoader height={110} style={{ flex: 1, borderRadius: borderRadius.md }} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Header */}
        <LinearGradient
          colors={[colors.blush, colors.white]}
          style={styles.headerGradient}
        >
          <FadeInView delay={0}>
            <View style={styles.header}>
              <Text style={styles.greeting}>Welcome back, {user?.name}!</Text>
              {partner ? (
                <Text style={styles.subgreeting}>
                  You and {partner.name} are growing together
                </Text>
              ) : (
                <Text style={styles.subgreeting}>
                  Connect with your partner to begin your journey
                </Text>
              )}
            </View>
          </FadeInView>
        </LinearGradient>

        {/* Upgrade CTA */}
        {!isPremium && user && (
          <FadeInView delay={80} style={{ marginHorizontal: spacing.md, marginTop: spacing.md }}>
            <Card style={styles.upgradeCard}>
              <Card.Content>
                <View style={styles.upgradeHeader}>
                  <PremiumBadge />
                  <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                </View>
                <Text style={styles.upgradeSubtitle}>
                  {usage?.assessments_used || 0} of {usage?.assessments_limit || 1} free assessments used this month
                </Text>
                <View style={styles.upgradeFeatures}>
                  <Text style={styles.upgradeFeatureText}>✓ Unlimited assessments</Text>
                  <Text style={styles.upgradeFeatureText}>✓ Full AI insights</Text>
                  <Text style={styles.upgradeFeatureText}>✓ All activities</Text>
                </View>
                <UpgradeButton onPress={() => setShowPaywall(true)} />
              </Card.Content>
            </Card>
          </FadeInView>
        )}

        {/* Partner Invite Card */}
        {!partner && user && (
          <FadeInView delay={100} style={{ marginHorizontal: spacing.md, marginTop: spacing.lg }}>
            <Card style={styles.inviteCard}>
              <Card.Content>
                <Text style={styles.cardTitle}>Invite Your Partner</Text>
                <Text style={styles.cardSubtitle}>
                  Share your Pair Code to connect and start your journey together
                </Text>
                <View style={styles.pairCodeContainer}>
                  <Text style={styles.pairCode}>{formatPairCode(user.pair_code)}</Text>
                </View>
                <ScaleButton
                  onPress={() => router.push('/(tabs)/partner')}
                  variant="secondary"
                  style={styles.connectButton}
                >
                  <Text style={styles.connectButtonText}>Go to Partner Section</Text>
                </ScaleButton>
              </Card.Content>
            </Card>
          </FadeInView>
        )}

        {/* Stats Cards */}
        {partner && (
          <View style={styles.statsContainer}>
            <FadeInView delay={100} style={{ flex: 1 }}>
              <Card style={styles.statCard}>
                <Card.Content style={styles.statContent}>
                  <Text style={styles.statValue}>{completedAssessments}</Text>
                  <Text style={styles.statLabel}>Assessments</Text>
                  <Text style={styles.statLabelSecondary}>Completed</Text>
                </Card.Content>
              </Card>
            </FadeInView>
            <FadeInView delay={180} style={{ flex: 1 }}>
              <Card style={styles.statCard}>
                <Card.Content style={styles.statContent}>
                  <Text style={styles.statValue}>{streak}</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                  <Text style={styles.statLabelSecondary}>Keep it going!</Text>
                </Card.Content>
              </Card>
            </FadeInView>
          </View>
        )}

        {/* Progress Card */}
        {partner && (
          <FadeInView delay={260} style={{ marginHorizontal: spacing.md, marginTop: spacing.md }}>
            <Card style={styles.progressCard}>
              <Card.Content>
                <Text style={styles.cardTitle}>Your Relationship Journey</Text>
                <Text style={styles.cardSubtitle}>
                  {completedAssessments} of 3 core assessments completed
                </Text>
                <ProgressBar
                  progress={completedAssessments / 3}
                  color={colors.teal}
                  style={styles.progressBar}
                />
                <ScaleButton
                  onPress={() => router.push('/(tabs)/assessments')}
                  style={styles.startButton}
                >
                  <Text style={styles.startButtonText}>
                    {completedAssessments === 0 ? 'Start First Assessment' : 'Continue Assessments'}
                  </Text>
                </ScaleButton>
              </Card.Content>
            </Card>
          </FadeInView>
        )}

        {/* Learning Series */}
        {partner && (
          <FadeInView delay={300} style={{ marginHorizontal: spacing.md, marginTop: spacing.md }}>
            <Card style={styles.seriesCard}>
              <Card.Content>
                <Text style={styles.cardTitle}>Relationship Learning</Text>
                <Text style={styles.cardSubtitle}>
                  Short modules to help you understand the patterns behind your results.
                </Text>
                <ScaleButton
                  onPress={() => router.push('/(tabs)/activities')}
                  style={styles.seriesButton}
                >
                  <Text style={styles.seriesButtonText}>Open Learning Series</Text>
                </ScaleButton>
              </Card.Content>
            </Card>
          </FadeInView>
        )}

        {/* Quick Actions */}
        <FadeInView delay={340} style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <ScaleButton
            onPress={() => setShowCheckIn(true)}
            style={styles.quickActionCard}
          >
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionIcon}>💝</Text>
              <View style={styles.quickActionText}>
                <Text style={styles.quickActionTitle}>Daily Check-In</Text>
                <Text style={styles.quickActionSubtitle}>Share how you're feeling today</Text>
              </View>
              <Text style={styles.quickActionArrow}>→</Text>
            </View>
          </ScaleButton>

          <ScaleButton
            onPress={() => router.push('/(tabs)/activities')}
            style={styles.quickActionCard}
          >
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionIcon}>🎯</Text>
              <View style={styles.quickActionText}>
                <Text style={styles.quickActionTitle}>Browse Activities</Text>
                <Text style={styles.quickActionSubtitle}>Strengthen your bond together</Text>
              </View>
              <Text style={styles.quickActionArrow}>→</Text>
            </View>
          </ScaleButton>
        </FadeInView>
      </ScrollView>

      {/* Modals */}
      {coupleUnit && (
        <DailyCheckInModal
          visible={showCheckIn}
          onDismiss={() => setShowCheckIn(false)}
          coupleUnitId={coupleUnit.id}
        />
      )}

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  headerGradient: {
    paddingBottom: spacing.lg,
  },
  header: {
    padding: spacing.lg,
  },
  greeting: {
    fontSize: typography.h1.fontSize,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
    letterSpacing: typography.h1.letterSpacing,
  },
  subgreeting: {
    fontSize: typography.body.fontSize,
    color: colors.gray,
    lineHeight: typography.body.lineHeight,
  },
  upgradeCard: {
    borderRadius: borderRadius.md,
    ...shadows.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gold + '40',
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  upgradeTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  upgradeSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.gray,
    marginBottom: spacing.md,
    lineHeight: typography.bodySmall.lineHeight,
  },
  upgradeFeatures: {
    marginBottom: spacing.md,
  },
  upgradeFeatureText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  inviteCard: {
    borderRadius: borderRadius.md,
    ...shadows.md,
    backgroundColor: colors.white,
  },
  connectButton: {
    marginTop: spacing.sm,
  },
  connectButtonText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: typography.body.fontSize,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    ...shadows.sm,
    backgroundColor: colors.white,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  statLabelSecondary: {
    fontSize: typography.caption.fontSize,
    color: colors.gray,
    textAlign: 'center',
  },
  progressCard: {
    borderRadius: borderRadius.md,
    ...shadows.md,
    backgroundColor: colors.white,
  },
  progressBar: {
    height: 10,
    borderRadius: borderRadius.xs,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  startButton: {
    backgroundColor: colors.accent,
  },
  startButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: typography.body.fontSize,
  },
  cardTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.gray,
    marginBottom: spacing.sm,
    lineHeight: typography.bodySmall.lineHeight,
  },
  pairCodeContainer: {
    backgroundColor: colors.blush,
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  pairCode: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 4,
  },
  seriesCard: {
    borderRadius: borderRadius.md,
    ...shadows.md,
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  seriesButton: {
    backgroundColor: colors.teal,
    marginTop: spacing.sm,
  },
  seriesButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: typography.body.fontSize,
  },
  quickActions: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  quickActionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  quickActionIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.gray,
  },
  quickActionArrow: {
    fontSize: 18,
    color: colors.accent,
    marginLeft: spacing.sm,
  },
});