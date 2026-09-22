/**
 * ArgumentAnalyzerScreen - Understand conflict patterns and find repair opportunities
 */
import { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

import FadeInView from '../../../components/animated/FadeInView';
import ScaleButton from '../../../components/animated/ScaleButton';
import { colors, spacing, shadows } from '../../../constants/theme';

export default function ArgumentAnalyzerScreen() {
  const [argumentContent, setArgumentContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const demoContent = `We got into an argument last night about the dishes. I had a long day at work and came home to find the sink full of dishes. I got frustrated and said "Why can't you ever just do the dishes when I ask?" My partner got defensive and said I was being unfair. The conversation escalated and we both said things we regretted. We ended up going to bed upset without resolving it.`;

  function useDemo() {
    setArgumentContent(demoContent);
  }

  async function runAnalysis() {
    if (argumentContent.trim().length < 50) {
      Alert.alert('Need More Detail', 'Please provide more context about the argument (at least 50 characters).');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/analyzers/argument/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couple_id: 'demo-couple',
          argument_content: argumentContent,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setResults(data.data);
      } else {
        setResults(getDemoResults());
      }
    } catch {
      setResults(getDemoResults());
    } finally {
      setAnalyzing(false);
    }
  }

  function getDemoResults() {
    return {
      conflict_score: 68,
      severity_level: 'moderate',
      escalation_patterns: [
        "Criticism present (starting with 'Why can't you ever...')",
        'Defensiveness triggered by initial frustration',
        'Escalation through defensive retorts',
        'Resolution avoided due to exhaustion',
      ],
      repair_opportunities: [
        'Acknowledging effort: "I know you\'ve been busy too"',
        'Softened startup: "I\'m feeling overwhelmed and could use your help"',
        'Repair attempt: Following Gottman\'s repair rituals',
      ],
      communication_breakdowns: [
        'Blaming language used ("you" statements vs "I" statements)',
        'Tone escalated before facts were shared',
        'Active listening not practiced',
      ],
      primary_concern: 'Feeling unappreciated after a long day, leading to disproportionate reaction',
      immediate_action: 'Take a 20-minute break before addressing the issue to prevent flooding',
      recommendations: [
        'Practice the "soft startup" technique - start with feelings rather than blame',
        'Use "I" statements: "I felt overwhelmed when..." instead of "You never..."',
        'Schedule a calm discussion tomorrow to address the underlying issue',
        'Establish a "dishes routine" that works for both partners',
      ],
    };
  }

  function resetAnalysis() {
    setArgumentContent('');
    setResults(null);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.headerGradient}>
          <FadeInView>
            <View style={styles.header}>
              <Text style={styles.headerIcon}>⚡</Text>
              <Text style={styles.headerTitle}>Argument Analyzer</Text>
              <Text style={styles.headerSubtitle}>
                Understand conflict patterns and find repair opportunities
              </Text>
            </View>
          </FadeInView>
        </LinearGradient>

        <View style={styles.content}>
          {!results ? (
            <>
              <FadeInView delay={100}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Describe the Argument</Text>
                  <Text style={styles.sectionSubtitle}>
                    Share what happened - include both perspectives and how it escalated
                  </Text>

                  <TextInput
                    style={styles.textArea}
                    placeholder="What was the argument about? What was said? How did it escalate?"
                    placeholderTextColor={colors.gray}
                    value={argumentContent}
                    onChangeText={setArgumentContent}
                    multiline
                    numberOfLines={8}
                    textAlignVertical="top"
                  />

                  <ScaleButton onPress={useDemo} variant="secondary" style={styles.demoButton}>
                    <Text style={styles.demoButtonText}>Use Demo Scenario</Text>
                  </ScaleButton>
                </View>
              </FadeInView>

              <FadeInView delay={200}>
                <ScaleButton onPress={runAnalysis} loading={analyzing}>
                  <LinearGradient colors={[colors.accent, '#D4778A']} style={styles.analyzeButtonInner}>
                    <Text style={styles.analyzeButtonText}>
                      {analyzing ? 'Analyzing...' : 'Analyze Argument'}
                    </Text>
                  </LinearGradient>
                </ScaleButton>
              </FadeInView>
            </>
          ) : (
            <>
              <FadeInView>
                <View style={styles.scoreHeader}>
                  <Text style={styles.scoreLabel}>Conflict Health Score</Text>
                  <MotiView
                    from={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    style={styles.scoreCircle}
                  >
                    <Text style={styles.scoreValue}>{results.conflict_score}</Text>
                    <Text style={styles.scoreLabelSmall}>/100</Text>
                  </MotiView>
                  <View style={styles.severityBadge}>
                    <Text style={styles.severityText}>
                      Severity: {results.severity_level?.charAt(0).toUpperCase() + results.severity_level?.slice(1)}
                    </Text>
                  </View>
                </View>
              </FadeInView>

              <FadeInView delay={100}>
                <View style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightIcon}>🔍</Text>
                    <Text style={styles.insightTitle}>Primary Concern</Text>
                  </View>
                  <Text style={styles.insightText}>{results.primary_concern}</Text>
                </View>
              </FadeInView>

              <FadeInView delay={150}>
                <View style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightIcon}>📈</Text>
                    <Text style={styles.insightTitle}>Escalation Patterns</Text>
                  </View>
                  {results.escalation_patterns?.map((pattern: string, index: number) => (
                    <View key={index} style={styles.patternItem}>
                      <Text style={styles.patternBullet}>→</Text>
                      <Text style={styles.patternText}>{pattern}</Text>
                    </View>
                  ))}
                </View>
              </FadeInView>

              <FadeInView delay={200}>
                <View style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightIcon}>🔧</Text>
                    <Text style={styles.insightTitle}>Communication Breakdowns</Text>
                  </View>
                  {results.communication_breakdowns?.map((breakdown: string, index: number) => (
                    <View key={index} style={styles.patternItem}>
                      <Text style={styles.patternBullet}>⚠️</Text>
                      <Text style={styles.patternText}>{breakdown}</Text>
                    </View>
                  ))}
                </View>
              </FadeInView>

              <FadeInView delay={250}>
                <View style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightIcon}>💚</Text>
                    <Text style={styles.insightTitle}>Repair Opportunities</Text>
                  </View>
                  {results.repair_opportunities?.map((repair: string, index: number) => (
                    <View key={index} style={styles.patternItem}>
                      <Text style={styles.patternBullet}>✨</Text>
                      <Text style={styles.patternText}>{repair}</Text>
                    </View>
                  ))}
                </View>
              </FadeInView>

              <FadeInView delay={300}>
                <View style={styles.actionCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightIcon}>🚦</Text>
                    <Text style={styles.insightTitle}>Immediate Action</Text>
                  </View>
                  <Text style={styles.actionText}>{results.immediate_action}</Text>
                </View>
              </FadeInView>

              <FadeInView delay={350}>
                <View style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightIcon}>💡</Text>
                    <Text style={styles.insightTitle}>Recommendations</Text>
                  </View>
                  {results.recommendations?.map((rec: string, index: number) => (
                    <View key={index} style={styles.patternItem}>
                      <Text style={styles.insightNumber}>{index + 1}</Text>
                      <Text style={styles.patternText}>{rec}</Text>
                    </View>
                  ))}
                </View>
              </FadeInView>

              <FadeInView delay={400}>
                <ScaleButton onPress={resetAnalysis} variant="secondary" style={{ marginTop: spacing.md }}>
                  <Text style={styles.resetButtonText}>Analyze New Argument</Text>
                </ScaleButton>
              </FadeInView>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  headerGradient: { paddingBottom: spacing.lg },
  header: { padding: spacing.lg, alignItems: 'center' },
  headerIcon: { fontSize: 48, marginBottom: spacing.sm },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xs, textAlign: 'center' },
  headerSubtitle: { fontSize: 14, color: colors.gray, textAlign: 'center' },
  content: { padding: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xs },
  sectionSubtitle: { fontSize: 13, color: colors.gray, marginBottom: spacing.md },
  textArea: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.md, fontSize: 14, color: colors.primary, minHeight: 200, marginBottom: spacing.md, ...shadows.soft },
  demoButton: { marginTop: spacing.sm },
  demoButtonText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  analyzeButtonInner: { padding: spacing.md, borderRadius: 16, alignItems: 'center' },
  analyzeButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  scoreHeader: { alignItems: 'center', marginBottom: spacing.lg },
  scoreLabel: { fontSize: 14, color: colors.gray, marginBottom: spacing.sm },
  scoreCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  scoreValue: { fontSize: 32, fontWeight: 'bold', color: colors.white },
  scoreLabelSmall: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  severityBadge: { backgroundColor: colors.blush, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 12, marginTop: spacing.sm },
  severityText: { fontSize: 13, color: colors.accent, fontWeight: '600' },
  insightCard: { backgroundColor: colors.white, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, ...shadows.soft },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  insightIcon: { fontSize: 20, marginRight: spacing.sm },
  insightTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  insightText: { fontSize: 14, color: colors.gray, lineHeight: 22 },
  patternItem: { flexDirection: 'row', marginBottom: spacing.sm },
  patternBullet: { fontSize: 14, marginRight: spacing.sm, marginTop: 2 },
  patternText: { flex: 1, fontSize: 14, color: colors.gray, lineHeight: 20 },
  insightNumber: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.blush, textAlign: 'center', lineHeight: 20, fontSize: 11, fontWeight: 'bold', color: colors.accent, marginRight: spacing.sm },
  actionCard: { backgroundColor: colors.teal + '20', borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.teal },
  actionText: { fontSize: 14, color: colors.primary, lineHeight: 22 },
  resetButtonText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
});