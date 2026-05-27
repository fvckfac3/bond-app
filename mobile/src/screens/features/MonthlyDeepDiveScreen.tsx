/**
 * MonthlyDeepDiveScreen - Premium monthly deep dive feature
 */
import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

import FadeInView from '../../../components/animated/FadeInView';
import ScaleButton from '../../../components/animated/ScaleButton';
import SkeletonLoader from '../../../components/animated/SkeletonLoader';
import { colors, spacing, shadows } from '../../../constants/theme';
import { useSubscription } from '../../../hooks/useSubscription';
import PaywallModal from '../../../components/subscription/PaywallModal';

interface DeepDive {
  id: string;
  month: string;
  theme: string;
  focus_questions: string[];
  activities: string[];
  insights_gathered: string[];
  overall_reflection?: string;
  growth_identified?: string;
  status: string;
}

const THEMES = {
  communication: { icon: '💬', color: '#4A90D9', label: 'Communication', description: 'Explore how you communicate and listen to each other' },
  intimacy: { icon: '💕', color: colors.accent, label: 'Intimacy', description: 'Deepen emotional and physical connection' },
  conflict: { icon: '⚡', color: '#E67E22', label: 'Conflict Resolution', description: 'Understand and resolve recurring conflicts' },
  trust: { icon: '🔐', color: '#27AE60', label: 'Trust & Vulnerability', description: 'Build deeper trust through vulnerability' },
  growth: { icon: '📈', color: '#9B59B6', label: 'Personal Growth', description: 'Support each other\'s individual journeys' },
  connection: { icon: '✨', color: colors.teal, label: 'Connection', description: 'Strengthen your overall bond and shared meaning' },
};

export default function MonthlyDeepDiveScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPremium] = useState(true); // For demo, assume premium
  const [showPaywall, setShowPaywall] = useState(false);
  const [activeDeepDive, setActiveDeepDive] = useState<DeepDive | null>(null);
  const [history, setHistory] = useState<DeepDive[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const { isPremium: subscriptionPremium } = useSubscription();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [activeRes, historyRes] = await Promise.all([
        fetch('/api/features/monthly-deep-dive/demo-couple'),
        fetch('/api/features/monthly-deep-dive/demo-couple/history'),
      ]);
      const activeData = await activeRes.json();
      const historyData = await historyRes.json();
      if (activeData.success && activeData.deep_dive) setActiveDeepDive(activeData.deep_dive);
      if (historyData.success) setHistory(historyData.history || []);
    } catch {
      // No active deep dive
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() { setRefreshing(true); loadData(); }

  async function startDeepDive(theme: string) {
    if (!isPremium && !subscriptionPremium) {
      setShowPaywall(true);
      return;
    }

    const month = new Date().toISOString().slice(0, 7);
    const themeInfo = THEMES[theme as keyof typeof THEMES];

    try {
      const response = await fetch('/api/features/monthly-deep-dive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couple_id: 'demo-couple',
          month,
          theme,
          focus_questions: getDefaultQuestions(theme),
          activities: getDefaultActivities(theme),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setActiveDeepDive(data.deep_dive);
      }
    } catch {
      // Create demo deep dive
      setActiveDeepDive({
        id: Date.now().toString(),
        month,
        theme,
        focus_questions: getDefaultQuestions(theme),
        activities: getDefaultActivities(theme),
        insights_gathered: [],
        status: 'in_progress',
      });
    }
    setShowStartModal(false);
    setSelectedTheme(null);
  }

  function getDefaultQuestions(theme: string): string[] {
    const baseQuestions: Record<string, string[]> = {
      communication: ['How do we typically start difficult conversations?', 'What communication patterns are working well?', 'Where do we miscommunicate most often?'],
      intimacy: ['What makes you feel most emotionally connected?', 'How has our intimacy evolved over time?', 'What would deepen our emotional bond?'],
      conflict: ['What recurring conflicts do we face?', 'How do we typically resolve conflicts?', 'What patterns should we change?'],
      trust: ['Where do we show trust in our relationship?', 'What makes vulnerability difficult?', 'How can we build deeper trust?'],
      growth: ['What personal goals are we each working toward?', 'How do we support each other\'s growth?', 'Are we growing together or apart?'],
      connection: ['What shared meaning do we have as a couple?', 'What rituals strengthen our bond?', 'What\'s missing from our connection?'],
    };
    return baseQuestions[theme] || baseQuestions.connection;
  }

  function getDefaultActivities(theme: string): string[] {
    const baseActivities: Record<string, string[]> = {
      communication: ['Practice active listening for 10 minutes', 'Share one thing you appreciate about each other'],
      intimacy: ['Share a vulnerable memory with each other', 'Plan an uninterrupted date night'],
      conflict: ['Identify a recurring conflict and discuss it calmly', 'Create a"peace treaty" for one ongoing issue'],
      trust: ['Share a fear or insecurity with your partner', 'Do something that requires trust'],
      growth: ['Share your goals for the next year', 'Discuss how you can support each other\'s goals'],
      connection: ['Create a shared vision board', 'Plan a future trip or adventure together'],
    };
    return baseActivities[theme] || baseActivities.connection;
  }

  async function updateReflection(text: string) {
    if (!activeDeepDive) return;
    const updated = { ...activeDeepDive, overall_reflection: text };
    setActiveDeepDive(updated);
    try {
      await fetch(`/api/features/monthly-deep-dive/${activeDeepDive.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overall_reflection: text, status: 'completed' }),
      });
    } catch { /* Continue */ }
  }

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.headerGradient}>
          <View style={styles.header}><SkeletonLoader height={32} width="60%" /><SkeletonLoader height={18} width="80%" style={{ marginTop: spacing.sm }} /></View>
        </LinearGradient>
        <View style={{ padding: spacing.md }}><SkeletonLoader height={300} borderRadius={20} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.headerGradient}>
          <FadeInView>
            <View style={styles.header}>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>⭐ Premium</Text>
              </View>
              <Text style={styles.greeting}>Monthly Deep Dive 🌊</Text>
              <Text style={styles.subgreeting}>Dedicate a month to deepening one area of your relationship</Text>
            </View>
          </FadeInView>
        </LinearGradient>

        <View style={styles.content}>
          {/* Active Deep Dive */}
          {activeDeepDive ? (
            <FadeInView>
              <View style={styles.activeCard}>
                <View style={styles.activeHeader}>
                  <Text style={styles.activeLabel}>Currently Exploring</Text>
                  <Text style={styles.activeMonth}>{activeDeepDive.month}</Text>
                </View>
                <View style={styles.themeDisplay}>
                  <Text style={styles.themeIcon}>{THEMES[activeDeepDive.theme as keyof typeof THEMES]?.icon || '✨'}</Text>
                  <Text style={styles.themeTitle}>{THEMES[activeDeepDive.theme as keyof typeof THEMES]?.label || 'Connection'}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Focus Questions</Text>
                  {activeDeepDive.focus_questions?.map((q, i) => (
                    <View key={i} style={styles.questionItem}>
                      <Text style={styles.questionNumber}>{i + 1}</Text>
                      <Text style={styles.questionText}>{q}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Activities</Text>
                  {activeDeepDive.activities?.map((a, i) => (
                    <View key={i} style={styles.activityItem}>
                      <Text style={styles.activityIcon}>✓</Text>
                      <Text style={styles.activityText}>{a}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Insights Gathered</Text>
                  {activeDeepDive.insights_gathered?.length > 0 ? (
                    activeDeepDive.insights_gathered.map((insight, i) => (
                      <View key={i} style={styles.insightItem}>
                        <Text style={styles.insightBullet}>•</Text>
                        <Text style={styles.insightText}>{insight}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noInsights}>Start your journey to gather insights...</Text>
                  )}
                </View>

                <View style={styles.reflectionSection}>
                  <Text style={styles.sectionTitle}>Monthly Reflection</Text>
                  <TouchableOpacity onPress={() => {
                    const text = activeDeepDive.overall_reflection || '';
                    const newText = prompt('Write your reflection:', text);
                    if (newText !== null) updateReflection(newText);
                  }} style={styles.reflectionButton}>
                    <Text style={styles.reflectionText}>
                      {activeDeepDive.overall_reflection || 'Tap to add your monthly reflection...'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </FadeInView>
          ) : (
            <>
              <FadeInView delay={100}>
                <View style={styles.startCard}>
                  <Text style={styles.startTitle}>Ready to Dive Deep?</Text>
                  <Text style={styles.startSubtitle}>
                    Choose a theme to focus on for {currentMonth}. You'll explore questions, activities, and insights together.
                  </Text>
                  <ScaleButton onPress={() => setShowStartModal(true)} style={styles.startButton}>
                    <LinearGradient colors={[colors.gold, '#D4A84B']} style={styles.startGradient}>
                      <Text style={styles.startButtonText}>Start This Month's Dive →</Text>
                    </LinearGradient>
                  </ScaleButton>
                </View>
              </FadeInView>

              {/* Theme Selection */}
              {showStartModal && (
                <FadeInView>
                  <View style={styles.themeSelector}>
                    <Text style={styles.themeSelectorTitle}>Choose Your Theme</Text>
                    <View style={styles.themeGrid}>
                      {Object.entries(THEMES).map(([key, theme]) => (
                        <TouchableOpacity
                          key={key}
                          onPress={() => startDeepDive(key)}
                          style={[styles.themeOption, selectedTheme === key && { borderColor: theme.color, borderWidth: 2 }]}
                        >
                          <Text style={styles.themeOptionIcon}>{theme.icon}</Text>
                          <Text style={styles.themeOptionLabel}>{theme.label}</Text>
                          <Text style={styles.themeOptionDesc}>{theme.description}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </FadeInView>
              )}
            </>
          )}

          {/* History */}
          {history.length > 0 && (
            <FadeInView delay={200}>
              <View style={styles.historySection}>
                <Text style={styles.historyTitle}>Past Deep Dives</Text>
                {history.map((dive, index) => (
                  <View key={dive.id || index} style={styles.historyItem}>
                    <Text style={styles.historyIcon}>{THEMES[dive.theme as keyof typeof THEMES]?.icon || '✨'}</Text>
                    <View style={styles.historyContent}>
                      <Text style={styles.historyTheme}>{THEMES[dive.theme as keyof typeof THEMES]?.label || 'Theme'}</Text>
                      <Text style={styles.historyMonth}>{dive.month}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </FadeInView>
          )}
        </View>
      </ScrollView>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={() => { setShowPaywall(false); setIsPremium(true); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerGradient: { paddingBottom: spacing.lg },
  header: { padding: spacing.lg },
  premiumBadge: { backgroundColor: colors.gold + '30', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8, alignSelf: 'flex-start', marginBottom: spacing.sm },
  premiumBadgeText: { fontSize: 12, fontWeight: 'bold', color: colors.gold },
  greeting: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xs },
  subgreeting: { fontSize: 14, color: colors.gray },
  content: { padding: spacing.md },
  activeCard: { backgroundColor: colors.white, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, ...shadows.card },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  activeLabel: { fontSize: 12, color: colors.gray },
  activeMonth: { fontSize: 14, fontWeight: '600', color: colors.primary },
  themeDisplay: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  themeIcon: { fontSize: 32, marginRight: spacing.md },
  themeTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.sm },
  questionItem: { flexDirection: 'row', marginBottom: spacing.sm },
  questionNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.blush, textAlign: 'center', lineHeight: 24, fontSize: 12, fontWeight: 'bold', color: colors.accent, marginRight: spacing.sm },
  questionText: { flex: 1, fontSize: 14, color: colors.gray, lineHeight: 20 },
  activityItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  activityIcon: { fontSize: 16, color: colors.teal, marginRight: spacing.sm },
  activityText: { flex: 1, fontSize: 14, color: colors.gray },
  insightItem: { flexDirection: 'row', marginBottom: spacing.sm },
  insightBullet: { fontSize: 14, color: colors.teal, marginRight: spacing.sm },
  insightText: { flex: 1, fontSize: 14, color: colors.gray, lineHeight: 20 },
  noInsights: { fontSize: 14, color: colors.gray, fontStyle: 'italic' },
  reflectionSection: { borderTopWidth: 1, borderTopColor: colors.lightGray, paddingTop: spacing.md },
  reflectionButton: { backgroundColor: colors.background, borderRadius: 12, padding: spacing.md },
  reflectionText: { fontSize: 14, color: colors.gray },
  startCard: { backgroundColor: colors.white, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, alignItems: 'center', ...shadows.card },
  startTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.sm },
  startSubtitle: { fontSize: 14, color: colors.gray, textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg },
  startButton: { borderRadius: 16, overflow: 'hidden' },
  startGradient: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, alignItems: 'center' },
  startButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  themeSelector: { backgroundColor: colors.white, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, ...shadows.soft },
  themeSelectorTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.md, textAlign: 'center' },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  themeOption: { width: '48%', backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.lightGray },
  themeOptionIcon: { fontSize: 24, marginBottom: spacing.xs },
  themeOptionLabel: { fontSize: 14, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xs / 2 },
  themeOptionDesc: { fontSize: 11, color: colors.gray, lineHeight: 14 },
  historySection: { marginTop: spacing.md },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.md },
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, ...shadows.soft },
  historyIcon: { fontSize: 24, marginRight: spacing.md },
  historyContent: { flex: 1 },
  historyTheme: { fontSize: 14, fontWeight: '600', color: colors.primary },
  historyMonth: { fontSize: 12, color: colors.gray },
});