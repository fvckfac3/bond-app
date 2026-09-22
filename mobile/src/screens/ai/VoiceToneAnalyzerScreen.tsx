/**
 * VoiceToneAnalyzerScreen - Analyze vocal patterns and speaking balance
 */
import { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

import FadeInView from '../../../components/animated/FadeInView';
import ScaleButton from '../../../components/animated/ScaleButton';
import { colors, spacing, shadows } from '../../../constants/theme';

/**
 * VoiceToneAnalyzerScreen - Analyze vocal patterns and speaking balance in conversations
 */
export default function VoiceToneAnalyzerScreen() {
  const [transcript, setTranscript] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const demoTranscript = `You: Hey, so I was thinking about our weekend plans. Are you still up for going to the farmers market?
Partner: Yeah, that sounds great! I've been wanting to check out that new coffee place nearby too.
You: Oh nice! I heard they have amazing pastries. Should we make a day of it?
Partner: Absolutely. Maybe we could also try that hiking trail after?
You: I'd love that. Honestly, this is why I love spending time with you - you're always so thoughtful.
Partner: Aww, that's sweet. Same here. I really appreciate how you always make time for us.
You: Of course! You deserve it.` + '\n\n[Demo includes both partners speaking equally with warm, engaged tones]';

  function useDemo() {
    setTranscript(demoTranscript);
  }

  async function runAnalysis() {
    if (transcript.trim().length < 100) {
      Alert.alert('Need More Content', 'Please provide a longer transcript (at least 100 characters).');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/analyzers/voice/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couple_id: 'demo-couple',
          transcript: transcript,
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
      overall_tone_score: 85,
      speaker_breakdown: {
        you: { tone_score: 88, warmth_score: 90, tension_score: 12 },
        partner: { tone_score: 82, warmth_score: 86, tension_score: 15 },
      },
      tension_indicators: ['Minor tension around work topic', 'Quickly resolved with supportive response'],
      warmth_indicators: ['Frequent appreciation expressions', 'Physical affection mentioned', 'Playful tone maintained'],
      speaking_balance: { you: 55, partner: 45 },
      recommendations: [
        'Continue the supportive approach when discussing stressful topics',
        'Both partners show good balance in conversation contribution',
        'Consider setting aside dedicated time for deeper emotional conversations',
      ],
    };
  }

  function resetAnalysis() {
    setTranscript('');
    setResults(null);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.headerGradient}>
          <FadeInView>
            <View style={styles.header}>
              <Text style={styles.headerIcon}>🎙️</Text>
              <Text style={styles.headerTitle}>Voice Tone Analyzer</Text>
              <Text style={styles.headerSubtitle}>
                Analyze vocal patterns and speaking balance in conversations
              </Text>
            </View>
          </FadeInView>
        </LinearGradient>

        <View style={styles.content}>
          {!results ? (
            <>
              <FadeInView delay={100}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Conversation Transcript</Text>
                  <Text style={styles.sectionSubtitle}>
                    Paste a transcribed conversation or use demo. Include speaker labels.
                  </Text>

                  <TextInput
                    style={styles.textArea}
                    placeholder="You: [what you said]&#10;Partner: [what they said]"
                    placeholderTextColor={colors.gray}
                    value={transcript}
                    onChangeText={setTranscript}
                    multiline
                    numberOfLines={10}
                    textAlignVertical="top"
                  />

                  <ScaleButton onPress={useDemo} variant="secondary" style={styles.demoButton}>
                    <Text style={styles.demoButtonText}>Use Demo Transcript</Text>
                  </ScaleButton>
                </View>
              </FadeInView>

              <FadeInView delay={200}>
                <ScaleButton onPress={runAnalysis} loading={analyzing}>
                  <LinearGradient colors={[colors.accent, '#D4778A']} style={styles.analyzeButtonInner}>
                    <Text style={styles.analyzeButtonText}>
                      {analyzing ? 'Analyzing...' : 'Analyze Voice Tone'}
                    </Text>
                  </LinearGradient>
                </ScaleButton>
              </FadeInView>
            </>
          ) : (
            <>
              <FadeInView>
                <View style={styles.scoreHeader}>
                  <Text style={styles.scoreLabel}>Overall Voice Health</Text>
                  <MotiView
                    from={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    style={styles.scoreCircle}
                  >
                    <Text style={styles.scoreValue}>{results.overall_tone_score}</Text>
                    <Text style={styles.scoreLabelSmall}>/100</Text>
                  </MotiView>
                </View>
              </FadeInView>

              <FadeInView delay={100}>
                <View style={styles.balanceSection}>
                  <Text style={styles.balanceTitle}>Speaking Balance</Text>
                  <View style={styles.balanceBar}>
                    <View style={[styles.balanceSegment, { flex: results.speaking_balance?.you || 55, backgroundColor: colors.accent }]}>
                      <Text style={styles.balanceText}>You {results.speaking_balance?.you || 55}%</Text>
                    </View>
                    <View style={[styles.balanceSegment, { flex: results.speaking_balance?.partner || 45, backgroundColor: colors.blush }]}>
                      <Text style={styles.balanceText}>Partner {results.speaking_balance?.partner || 45}%</Text>
                    </View>
                  </View>
                </View>
              </FadeInView>

              <FadeInView delay={150}>
                <View style={styles.speakerCards}>
                  <View style={styles.speakerCard}>
                    <Text style={styles.speakerName}>You</Text>
                    <View style={styles.speakerScore}>
                      <Text style={styles.speakerScoreValue}>{results.speaker_breakdown?.you?.tone_score || 82}</Text>
                      <Text style={styles.speakerScoreLabel}>Tone</Text>
                    </View>
                    <View style={styles.speakerStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Warmth</Text>
                        <Text style={styles.statValue}>{results.speaker_breakdown?.you?.warmth_score || 85}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Tension</Text>
                        <Text style={[styles.statValue, { color: colors.error }]}>{results.speaker_breakdown?.you?.tension_score || 10}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.speakerCard}>
                    <Text style={styles.speakerName}>Partner</Text>
                    <View style={styles.speakerScore}>
                      <Text style={styles.speakerScoreValue}>{results.speaker_breakdown?.partner?.tone_score || 80}</Text>
                      <Text style={styles.speakerScoreLabel}>Tone</Text>
                    </View>
                    <View style={styles.speakerStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Warmth</Text>
                        <Text style={styles.statValue}>{results.speaker_breakdown?.partner?.warmth_score || 82}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Tension</Text>
                        <Text style={[styles.statValue, { color: colors.error }]}>{results.speaker_breakdown?.partner?.tension_score || 15}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </FadeInView>

              <FadeInView delay={200}>
                <View style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightIcon}>❤️</Text>
                    <Text style={styles.insightTitle}>Warmth Indicators</Text>
                  </View>
                  {results.warmth_indicators?.map((indicator: string, index: number) => (
                    <View key={index} style={styles.indicatorItem}>
                      <Text style={styles.indicatorBullet}>✓</Text>
                      <Text style={styles.indicatorText}>{indicator}</Text>
                    </View>
                  ))}
                </View>
              </FadeInView>

              {results.tension_indicators && results.tension_indicators.length > 0 && (
                <FadeInView delay={250}>
                  <View style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                      <Text style={styles.insightIcon}>⚠️</Text>
                      <Text style={styles.insightTitle}>Tension Indicators</Text>
                    </View>
                    {results.tension_indicators?.map((indicator: string, index: number) => (
                      <View key={index} style={styles.indicatorItem}>
                        <Text style={styles.indicatorBullet}>!</Text>
                        <Text style={styles.indicatorText}>{indicator}</Text>
                      </View>
                    ))}
                  </View>
                </FadeInView>
              )}

              <FadeInView delay={300}>
                <View style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightIcon}>💡</Text>
                    <Text style={styles.insightTitle}>Recommendations</Text>
                  </View>
                  {results.recommendations?.map((rec: string, index: number) => (
                    <View key={index} style={styles.indicatorItem}>
                      <Text style={styles.indicatorNumber}>{index + 1}</Text>
                      <Text style={styles.indicatorText}>{rec}</Text>
                    </View>
                  ))}
                </View>
              </FadeInView>

              <FadeInView delay={400}>
                <ScaleButton onPress={resetAnalysis} variant="secondary" style={{ marginTop: spacing.md }}>
                  <Text style={styles.resetButtonText}>Analyze New Transcript</Text>
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
  scoreCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  scoreValue: { fontSize: 32, fontWeight: 'bold', color: colors.white },
  scoreLabelSmall: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  balanceSection: { backgroundColor: colors.white, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, ...shadows.soft },
  balanceTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.md, textAlign: 'center' },
  balanceBar: { flexDirection: 'row', height: 40, borderRadius: 20, overflow: 'hidden' },
  balanceSegment: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  balanceText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  speakerCards: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  speakerCard: { flex: 1, backgroundColor: colors.white, borderRadius: 16, padding: spacing.md, ...shadows.soft },
  speakerName: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.sm, textAlign: 'center' },
  speakerScore: { alignItems: 'center', marginBottom: spacing.sm },
  speakerScoreValue: { fontSize: 28, fontWeight: 'bold', color: colors.accent },
  speakerScoreLabel: { fontSize: 11, color: colors.gray },
  speakerStats: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 10, color: colors.gray },
  statValue: { fontSize: 14, fontWeight: 'bold', color: colors.teal },
  insightCard: { backgroundColor: colors.white, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, ...shadows.soft },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  insightIcon: { fontSize: 20, marginRight: spacing.sm },
  insightTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  indicatorItem: { flexDirection: 'row', marginBottom: spacing.sm },
  indicatorBullet: { fontSize: 14, color: colors.teal, marginRight: spacing.sm, marginTop: 2 },
  indicatorNumber: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.blush, textAlign: 'center', lineHeight: 20, fontSize: 11, fontWeight: 'bold', color: colors.accent, marginRight: spacing.sm },
  indicatorText: { flex: 1, fontSize: 14, color: colors.gray, lineHeight: 20 },
  resetButtonText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
});