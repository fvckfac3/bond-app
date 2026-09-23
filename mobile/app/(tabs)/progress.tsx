// Progress Screen - Refined
// Built following: animation-patterns, polish, mobile-design, shadows, ui-ux-patterns

import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Card, ProgressBar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../services/supabase';
import { fetchCompletedModules, fetchSeriesList } from '../../services/learning';
import { colors, spacing, borderRadius, shadows, typography, touchTargets, motion } from '../../constants/theme';
import FadeInView from '../../components/animated/FadeInView';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const [loading, setLoading] = useState(true);
  const [coupleUnit, setCoupleUnit] = useState(null);
  const [stats, setStats] = useState({
    totalAssessments: 0,
    totalActivities: 0,
    checkInsCount: 0,
    messagesCount: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [learning, setLearning] = useState<{ key: string; title: string; icon: string | null; done: number; total: number }[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchProgressData();
  }, []);

  async function fetchProgressData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get couple unit
      const { data: coupleData } = await supabase
        .from('couple_units')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'active')
        .single();

      if (!coupleData) {
        setLoading(false);
        return;
      }

      setCoupleUnit(coupleData);

      // Get completed assessments count
      const { count: assessmentsCount } = await supabase
        .from('couple_results')
        .select('*', { count: 'exact', head: true })
        .eq('couple_unit_id', coupleData.id);

      // Get completed activities count
      const { count: activitiesCount } = await supabase
        .from('activity_completions')
        .select('*', { count: 'exact', head: true })
        .eq('couple_unit_id', coupleData.id);

      // Get check-ins count
      const { count: checkInsCount } = await supabase
        .from('daily_check_ins')
        .select('*', { count: 'exact', head: true })
        .eq('couple_unit_id', coupleData.id);

      // Get messages count
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('couple_unit_id', coupleData.id);

      // Get streak
      const { data: streakRow } = await supabase
        .rpc('get_couple_streak', { cu_id: coupleData.id })
        .single();
      const streakData = streakRow as { current_streak: number; longest_streak: number } | null;

      // Get recent check-ins
      const { data: checkInsData } = await supabase
        .from('daily_check_ins')
        .select('*, users!daily_check_ins_user_id_fkey(name)')
        .eq('couple_unit_id', coupleData.id)
        .order('date', { ascending: false })
        .limit(7);

      setStats({
        totalAssessments: assessmentsCount || 0,
        totalActivities: activitiesCount || 0,
        checkInsCount: checkInsCount || 0,
        messagesCount: messagesCount || 0,
        currentStreak: streakData?.current_streak || 0,
        longestStreak: streakData?.longest_streak || 0,
      });

      setRecentCheckIns(checkInsData || []);

      // Learning progress is per person; show the series you've started.
      try {
        const [series, completed] = await Promise.all([fetchSeriesList(), fetchCompletedModules(user.id)]);
        setLearning(
          series
            .map((sr) => ({
              key: sr.series_key,
              title: sr.title,
              icon: sr.icon,
              done: sr.modules.filter((m) => completed[sr.series_key]?.has(m.module_key)).length,
              total: sr.modules.length,
            }))
            .filter((sr) => sr.done > 0)
        );
      } catch (learningError) {
        console.error('Error fetching learning progress:', learningError);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading progress...</Text>
      </View>
    );
  }

  if (!coupleUnit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No Progress Data</Text>
          <Text style={styles.emptyText}>
            Connect with your partner to start tracking your journey
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <LinearGradient colors={[colors.blush, colors.white]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Progress</Text>
            <Text style={styles.headerSubtitle}>
              Tracking your relationship wellness journey
            </Text>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <FadeInView delay={0} style={styles.statCardWrapper}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Text style={styles.statIcon}>📋</Text>
                <Text style={styles.statValue}>{stats.totalAssessments}</Text>
                <Text style={styles.statLabel}>Assessments</Text>
                <Text style={styles.statLabelSecondary}>Completed</Text>
              </Card.Content>
            </Card>
          </FadeInView>

          <FadeInView delay={60} style={styles.statCardWrapper}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Text style={styles.statIcon}>🎯</Text>
                <Text style={styles.statValue}>{stats.totalActivities}</Text>
                <Text style={styles.statLabel}>Activities</Text>
                <Text style={styles.statLabelSecondary}>Done</Text>
              </Card.Content>
            </Card>
          </FadeInView>

          <FadeInView delay={120} style={styles.statCardWrapper}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Text style={styles.statIcon}>💬</Text>
                <Text style={styles.statValue}>{stats.messagesCount}</Text>
                <Text style={styles.statLabel}>Messages</Text>
                <Text style={styles.statLabelSecondary}>Exchanged</Text>
              </Card.Content>
            </Card>
          </FadeInView>

          <FadeInView delay={180} style={styles.statCardWrapper}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Text style={styles.statIcon}>✅</Text>
                <Text style={styles.statValue}>{stats.checkInsCount}</Text>
                <Text style={styles.statLabel}>Check-Ins</Text>
                <Text style={styles.statLabelSecondary}>Logged</Text>
              </Card.Content>
            </Card>
          </FadeInView>
        </View>

        {/* Streak Card */}
        <FadeInView delay={240}>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Streak</Text>
              <View style={styles.streakContainer}>
                <View style={styles.streakItem}>
                  <Text style={styles.streakValue}>{stats.currentStreak}</Text>
                  <Text style={styles.streakLabel}>Current Streak</Text>
                </View>
                <View style={styles.streakDivider} />
                <View style={styles.streakItem}>
                  <Text style={styles.streakValue}>{stats.longestStreak}</Text>
                  <Text style={styles.streakLabel}>Longest Streak</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </FadeInView>

        {/* Learning */}
        <FadeInView delay={270}>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Learning</Text>
              {learning.length === 0 ? (
                <TouchableOpacity onPress={() => router.push('/(tabs)/activities')}>
                  <Text style={styles.learningEmpty}>You haven&apos;t finished a lesson yet. Browse the learning series →</Text>
                </TouchableOpacity>
              ) : (
                learning.map((sr) => (
                  <TouchableOpacity
                    key={sr.key}
                    style={styles.learningRow}
                    onPress={() => router.push({ pathname: '/learning/[seriesKey]', params: { seriesKey: sr.key } })}
                  >
                    <View style={styles.learningHeader}>
                      <Text style={styles.learningTitle}>{sr.icon} {sr.title}</Text>
                      <Text style={styles.learningCount}>{sr.done} of {sr.total}</Text>
                    </View>
                    <ProgressBar progress={sr.total ? sr.done / sr.total : 0} color={colors.accent} style={styles.learningBar} />
                  </TouchableOpacity>
                ))
              )}
            </Card.Content>
          </Card>
        </FadeInView>

        {/* Recent Check-Ins */}
        {recentCheckIns.length > 0 && (
          <FadeInView delay={300}>
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>Recent Check-Ins</Text>
                {recentCheckIns.map((checkIn) => (
                  <View key={checkIn.id} style={styles.checkInItem}>
                    <View style={styles.checkInHeader}>
                      <Text style={styles.checkInName}>{checkIn.users?.name}</Text>
                      <Text style={styles.checkInDate}>
                        {new Date(checkIn.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.checkInDetails}>
                      <Text style={styles.checkInMood}>Mood: {checkIn.mood_note}</Text>
                      <Text style={styles.checkInScore}>
                        Connection: {checkIn.connection_score}/10
                      </Text>
                    </View>
                    {checkIn.appreciation && (
                      <Text style={styles.checkInAppreciation}>
                        {checkIn.appreciation}
                      </Text>
                    )}
                  </View>
                ))}
              </Card.Content>
            </Card>
          </FadeInView>
        )}

        {/* Milestones */}
        <FadeInView delay={360}>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Milestones</Text>
              <View style={styles.milestone}>
                <Text style={styles.milestoneIcon}>
                  {stats.totalAssessments >= 3 ? '✓' : '○'}
                </Text>
                <Text style={[
                  styles.milestoneText,
                  stats.totalAssessments >= 3 && styles.milestoneComplete
                ]}>
                  Complete 3 assessments
                </Text>
              </View>
              <View style={styles.milestone}>
                <Text style={styles.milestoneIcon}>
                  {stats.currentStreak >= 7 ? '✓' : '○'}
                </Text>
                <Text style={[
                  styles.milestoneText,
                  stats.currentStreak >= 7 && styles.milestoneComplete
                ]}>
                  7-day streak
                </Text>
              </View>
              <View style={styles.milestone}>
                <Text style={styles.milestoneIcon}>
                  {stats.totalActivities >= 5 ? '✓' : '○'}
                </Text>
                <Text style={[
                  styles.milestoneText,
                  stats.totalActivities >= 5 && styles.milestoneComplete
                ]}>
                  Complete 5 activities
                </Text>
              </View>
              <View style={styles.milestone}>
                <Text style={styles.milestoneIcon}>
                  {stats.messagesCount >= 50 ? '✓' : '○'}
                </Text>
                <Text style={[
                  styles.milestoneText,
                  stats.messagesCount >= 50 && styles.milestoneComplete
                ]}>
                  Exchange 50 messages
                </Text>
              </View>
            </Card.Content>
          </Card>
        </FadeInView>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  learningEmpty: {
    fontSize: typography.body.fontSize,
    color: colors.accent,
  },
  learningRow: {
    marginBottom: spacing.md,
  },
  learningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  learningTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.primary,
  },
  learningCount: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.gray,
  },
  learningBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.lightGray,
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
    fontSize: typography.body.fontSize,
    color: colors.gray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
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
    lineHeight: typography.body.lineHeight,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.md,
  },
  statCardWrapper: {
    width: (width - spacing.md * 3) / 2,
  },
  statCard: {
    borderRadius: borderRadius.md,
    ...shadows.sm,
    backgroundColor: colors.white,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  statLabelSecondary: {
    fontSize: typography.caption.fontSize,
    color: colors.gray,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
    backgroundColor: colors.white,
  },
  cardTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.gold,
  },
  streakLabel: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.gray,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  streakDivider: {
    width: 1,
    height: 56,
    backgroundColor: colors.lightGray,
  },
  checkInItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  checkInHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  checkInName: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.primary,
  },
  checkInDate: {
    fontSize: typography.caption.fontSize,
    color: colors.gray,
  },
  checkInDetails: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  checkInMood: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.black,
  },
  checkInScore: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.teal,
    fontWeight: '500',
  },
  checkInAppreciation: {
    fontSize: typography.bodySmall.fontSize,
    fontStyle: 'italic',
    color: colors.gray,
    marginTop: spacing.xs,
  },
  milestone: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  milestoneIcon: {
    fontSize: 18,
    marginRight: spacing.md,
    width: 24,
    textAlign: 'center',
    color: colors.gray,
  },
  milestoneText: {
    fontSize: typography.body.fontSize,
    color: colors.gray,
  },
  milestoneComplete: {
    color: colors.teal,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.body.fontSize,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight,
  },
});