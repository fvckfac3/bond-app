// AnalyzersScreen - Refined AI Analyzers with Design System
// Built following: animation-patterns, polish, mobile-design, shadows, ui-ux-patterns
// Clean, purposeful card design

import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import FadeInView, { StaggerContainer, StaggerItem } from '../../../components/animated/FadeInView';
import ScaleButton from '../../../components/animated/ScaleButton';
import SkeletonLoader from '../../../components/animated/SkeletonLoader';
import { colors, spacing, borderRadius, shadows, motion, typography, touchTargets } from '../../../constants/theme';

const ANALYZERS = [
  {
    id: 'communication',
    title: 'Communication Analyzer',
    icon: '💬',
    description: 'Analyze conversation patterns, response times, and listening quality',
    color: '#4A90D9',
    gradient: ['#4A90D9', '#6BA3E0'],
    route: '/ai/communication',
  },
  {
    id: 'text',
    title: 'Text Analyzer',
    icon: '📱',
    description: 'Deep dive into text message tone, emotion, and engagement',
    color: '#9B59B6',
    gradient: ['#9B59B6', '#B07CC6'],
    route: '/ai/text',
  },
  {
    id: 'argument',
    title: 'Argument Analyzer',
    icon: '⚡',
    description: 'Understand conflict patterns and find repair opportunities',
    color: '#E67E22',
    gradient: ['#E67E22', '#F39C4D'],
    route: '/ai/argument',
  },
  {
    id: 'voice',
    title: 'Voice Tone Analyzer',
    icon: '🎙️',
    description: 'Analyze vocal patterns and speaking balance in conversations',
    color: '#1ABC9C',
    gradient: ['#1ABC9C', '#48D1B0'],
    route: '/ai/voice',
  },
  {
    id: 'emotional',
    title: 'Emotional Pattern Analyzer',
    icon: '💭',
    description: 'Track long-term emotional trends and relationship growth',
    color: '#E74C8C',
    gradient: ['#E74C8C', '#F0639E'],
    route: '/ai/emotional',
  },
];

export default function AnalyzersScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAnalyzerData();
  }, []);

  async function loadAnalyzerData() {
    try {
      const timestamps: Record<string, string> = {};
      ANALYZERS.forEach((analyzer) => {
        timestamps[analyzer.id] = 'Not yet analyzed';
      });
      setLastAnalysis(timestamps);
    } catch (error) {
      console.error('Error loading analyzer data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadAnalyzerData();
  }

  function handleAnalyzerPress(analyzer: typeof ANALYZERS[0]) {
    router.push(analyzer.route as any);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.headerGradient}>
          <View style={styles.header}>
            <SkeletonLoader height={32} width="60%" style={{ marginBottom: spacing.sm }} />
            <SkeletonLoader height={18} width="80%" />
          </View>
        </LinearGradient>
        <View style={{ padding: spacing.md }}>
          {ANALYZERS.map((_, index) => (
            <SkeletonLoader
              key={index}
              height={120}
              style={{ marginBottom: spacing.md, borderRadius: borderRadius.md }}
            />
          ))}
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
        {/* Header */}
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.headerGradient}>
          <FadeInView>
            <View style={styles.header}>
              <Text style={styles.greeting}>AI Analyzers</Text>
              <Text style={styles.subgreeting}>
                Deep insights into your relationship patterns
              </Text>
            </View>
          </FadeInView>
        </LinearGradient>

        {/* Analyzer Cards */}
        <View style={styles.content}>
          <StaggerContainer stagger={motion.stagger}>
            {ANALYZERS.map((analyzer, index) => (
              <StaggerItem key={analyzer.id} index={index}>
                <ScaleButton
                  onPress={() => handleAnalyzerPress(analyzer)}
                  style={styles.analyzerCard}
                >
                  <View style={[styles.cardBorder, { backgroundColor: analyzer.color }]} />
                  <LinearGradient
                    colors={analyzer.gradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cardGradient}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.iconContainer}>
                        <Text style={styles.icon}>{analyzer.icon}</Text>
                      </View>
                      <View style={styles.cardText}>
                        <Text style={styles.cardTitle}>{analyzer.title}</Text>
                        <Text style={styles.cardDescription}>{analyzer.description}</Text>
                      </View>
                      <Text style={styles.arrow}>→</Text>
                    </View>
                  </LinearGradient>
                </ScaleButton>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Info Section */}
          <FadeInView delay={500} style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>How It Works</Text>
              <View style={styles.infoItem}>
                <View style={styles.infoNumber}>
                  <Text style={styles.infoNumberText}>1</Text>
                </View>
                <Text style={styles.infoText}>Choose an analyzer that matches your needs</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoNumber}>
                  <Text style={styles.infoNumberText}>2</Text>
                </View>
                <Text style={styles.infoText}>Share your conversation or recent messages</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoNumber}>
                  <Text style={styles.infoNumberText}>3</Text>
                </View>
                <Text style={styles.infoText}>Receive AI-powered insights and recommendations</Text>
              </View>
            </View>
          </FadeInView>
        </View>
      </ScrollView>
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
  content: {
    padding: spacing.md,
  },
  analyzerCard: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardGradient: {
    borderRadius: borderRadius.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingLeft: spacing.lg + 4,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 26,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.xs / 2,
  },
  cardDescription: {
    fontSize: typography.bodySmall.fontSize,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: typography.bodySmall.lineHeight,
  },
  arrow: {
    fontSize: 22,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  infoSection: {
    marginTop: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.sm,
  },
  infoTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.blush,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoNumberText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.accent,
  },
  infoText: {
    fontSize: typography.body.fontSize,
    color: colors.gray,
    flex: 1,
    lineHeight: typography.body.lineHeight,
  },
});