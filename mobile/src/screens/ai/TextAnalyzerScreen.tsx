/**
 * TextAnalyzerScreen - Deep dive into text message tone, emotion, and engagement
 */
import { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

import FadeInView from '../../../components/animated/FadeInView';
import ScaleButton from '../../../components/animated/ScaleButton';
import { colors, spacing, shadows } from '../../../constants/theme';

interface Message {
  sender: string;
  content: string;
  timestamp?: string;
}

export default function TextAnalyzerScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const demoMessages: Message[] = [
    { sender: 'You', content: 'Good morning! ☀️' },
    { sender: 'Partner', content: 'Morning! Did you sleep well?' },
    { sender: 'You', content: 'Yeah pretty good. Excited for our date tonight!' },
    { sender: 'Partner', content: 'Me too! I\'ve been thinking about it all week tbh' },
    { sender: 'You', content: 'Aww that\'s sweet. Where should we go?' },
    { sender: 'Partner', content: 'Anywhere with you is perfect honestly 😊' },
  ];

  function addDemoMessages() {
    setMessages(demoMessages);
  }

  function addMessage() {
    if (!newMessage.trim()) return;
    setMessages([...messages, { sender: 'You', content: newMessage }]);
    setNewMessage('');
  }

  async function runAnalysis() {
    if (messages.length < 3) {
      Alert.alert('Need More Messages', 'Add at least 3 messages to analyze.');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/analyzers/text/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couple_id: 'demo-couple',
          messages: messages,
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
      overall_score: 82,
      tone_variety_score: 75,
      emotional_expression_score: 80,
      clarity_score: 85,
      engagement_score: 78,
      patterns: {
        greeting_style: 'warm and casual',
        response_length: 'balanced',
        emoji_usage: 'moderate',
      },
      tone_breakdown: {
        positive: 65,
        neutral: 25,
        negative: 10,
      },
      growth_suggestions: [
        'Vary emotional expression to enhance connection',
        'Practice clear and direct communication about needs',
        'Consider sharing more vulnerable feelings',
      ],
    };
  }

  function resetAnalysis() {
    setMessages([]);
    setResults(null);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.headerGradient}>
          <FadeInView>
            <View style={styles.header}>
              <Text style={styles.headerIcon}>📱</Text>
              <Text style={styles.headerTitle}>Text Analyzer</Text>
              <Text style={styles.headerSubtitle}>
                Deep dive into text message tone, emotion, and engagement
              </Text>
            </View>
          </FadeInView>
        </LinearGradient>

        <View style={styles.content}>
          {!results ? (
            <>
              <FadeInView delay={100}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Text Messages</Text>
                  <Text style={styles.sectionSubtitle}>Add messages to analyze</Text>

                  <View style={styles.messagesList}>
                    {messages.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No messages added</Text>
                      </View>
                    ) : (
                      messages.map((msg, index) => (
                        <MotiView
                          key={index}
                          from={{ opacity: 0, translateY: 10 }}
                          animate={{ opacity: 1, translateY: 0 }}
                          transition={{ duration: 200, delay: index * 30 }}
                          style={[styles.messageBubble, msg.sender === 'You' ? styles.messageSent : styles.messageReceived]}
                        >
                          <Text style={styles.messageSender}>{msg.sender}</Text>
                          <Text style={styles.messageContent}>{msg.content}</Text>
                        </MotiView>
                      ))
                    )}
                  </View>

                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Type a message..."
                      placeholderTextColor={colors.gray}
                      value={newMessage}
                      onChangeText={setNewMessage}
                    />
                    <ScaleButton onPress={addMessage} style={styles.addButton}>
                      <Text style={styles.addButtonText}>+</Text>
                    </ScaleButton>
                  </View>

                  <View style={styles.actionButtons}>
                    <ScaleButton onPress={addDemoMessages} variant="secondary" style={{ flex: 1 }}>
                      <Text style={styles.demoButtonText}>Use Demo</Text>
                    </ScaleButton>
                  </View>
                </View>
              </FadeInView>

              <FadeInView delay={200}>
                <ScaleButton
                  onPress={runAnalysis}
                  loading={analyzing}
                  disabled={messages.length < 3}
                >
                  <LinearGradient colors={[colors.accent, '#D4778A']} style={styles.analyzeButtonInner}>
                    <Text style={styles.analyzeButtonText}>
                      {analyzing ? 'Analyzing...' : 'Analyze Texts'}
                    </Text>
                  </LinearGradient>
                </ScaleButton>
              </FadeInView>
            </>
          ) : (
            <>
              <FadeInView>
                <View style={styles.overallScore}>
                  <Text style={styles.overallLabel}>Overall Text Health</Text>
                  <MotiView
                    from={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    style={styles.scoreCircle}
                  >
                    <Text style={styles.scoreValue}>{results.overall_score}</Text>
                    <Text style={styles.scoreLabel}>/100</Text>
                  </MotiView>
                </View>
              </FadeInView>

              <FadeInView delay={100}>
                <View style={styles.scoresGrid}>
                  <View style={styles.scoreCard}>
                    <Text style={styles.scoreCardValue}>{results.tone_variety_score}</Text>
                    <Text style={styles.scoreCardLabel}>Tone Variety</Text>
                  </View>
                  <View style={styles.scoreCard}>
                    <Text style={styles.scoreCardValue}>{results.emotional_expression_score}</Text>
                    <Text style={styles.scoreCardLabel}>Emotional Expression</Text>
                  </View>
                  <View style={styles.scoreCard}>
                    <Text style={styles.scoreCardValue}>{results.clarity_score}</Text>
                    <Text style={styles.scoreCardLabel}>Clarity</Text>
                  </View>
                  <View style={styles.scoreCard}>
                    <Text style={styles.scoreCardValue}>{results.engagement_score}</Text>
                    <Text style={styles.scoreCardLabel}>Engagement</Text>
                  </View>
                </View>
              </FadeInView>

              <FadeInView delay={200}>
                <View style={styles.toneBreakdown}>
                  <Text style={styles.insightTitle}>Tone Breakdown</Text>
                  <View style={styles.toneBar}>
                    <View style={[styles.toneSegment, { flex: results.tone_breakdown?.positive || 65, backgroundColor: colors.teal }]} />
                    <View style={[styles.toneSegment, { flex: results.tone_breakdown?.neutral || 25, backgroundColor: colors.gray }]} />
                    <View style={[styles.toneSegment, { flex: results.tone_breakdown?.negative || 10, backgroundColor: colors.error }]} />
                  </View>
                  <View style={styles.toneLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: colors.teal }]} />
                      <Text style={styles.legendText}>Positive {results.tone_breakdown?.positive || 65}%</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: colors.gray }]} />
                      <Text style={styles.legendText}>Neutral {results.tone_breakdown?.neutral || 25}%</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                      <Text style={styles.legendText}>Negative {results.tone_breakdown?.negative || 10}%</Text>
                    </View>
                  </View>
                </View>
              </FadeInView>

              <FadeInView delay={300}>
                <View style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightIcon}>💡</Text>
                    <Text style={styles.insightTitle}>Growth Suggestions</Text>
                  </View>
                  {results.growth_suggestions?.map((suggestion: string, index: number) => (
                    <View key={index} style={styles.insightItem}>
                      <Text style={styles.insightNumber}>{index + 1}</Text>
                      <Text style={styles.insightText}>{suggestion}</Text>
                    </View>
                  ))}
                </View>
              </FadeInView>

              <FadeInView delay={400}>
                <ScaleButton onPress={resetAnalysis} variant="secondary" style={{ marginTop: spacing.md }}>
                  <Text style={styles.resetButtonText}>Analyze New Messages</Text>
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
  messagesList: { minHeight: 180, maxHeight: 250, marginBottom: spacing.md },
  emptyState: { backgroundColor: colors.white, borderRadius: 16, padding: spacing.xl, alignItems: 'center', ...shadows.soft },
  emptyText: { fontSize: 16, color: colors.gray },
  messageBubble: { borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm, maxWidth: '80%' },
  messageSent: { backgroundColor: colors.accent, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  messageReceived: { backgroundColor: colors.white, alignSelf: 'flex-start', borderBottomLeftRadius: 4, ...shadows.soft },
  messageSender: { fontSize: 12, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xs / 2 },
  messageContent: { fontSize: 14, color: colors.primary, lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: spacing.md, gap: spacing.sm },
  textInput: { flex: 1, backgroundColor: colors.white, borderRadius: 16, padding: spacing.md, fontSize: 14, color: colors.primary, minHeight: 48, ...shadows.soft },
  addButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { fontSize: 24, color: colors.white, fontWeight: 'bold' },
  actionButtons: { flexDirection: 'row', gap: spacing.sm },
  demoButtonText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  analyzeButtonInner: { padding: spacing.md, borderRadius: 16, alignItems: 'center' },
  analyzeButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  overallScore: { alignItems: 'center', marginBottom: spacing.lg },
  overallLabel: { fontSize: 16, fontWeight: '600', color: colors.primary, marginBottom: spacing.md },
  scoreCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  scoreValue: { fontSize: 32, fontWeight: 'bold', color: colors.white },
  scoreLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  scoresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  scoreCard: { width: '48%', backgroundColor: colors.white, borderRadius: 16, padding: spacing.md, alignItems: 'center', ...shadows.soft },
  scoreCardValue: { fontSize: 24, fontWeight: 'bold', color: colors.accent },
  scoreCardLabel: { fontSize: 11, color: colors.gray, textAlign: 'center', marginTop: spacing.xs },
  toneBreakdown: { backgroundColor: colors.white, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, ...shadows.soft },
  insightTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.md },
  toneBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: spacing.md },
  toneSegment: { height: 12 },
  toneLegend: { flexDirection: 'row', justifyContent: 'space-around' },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.xs },
  legendText: { fontSize: 12, color: colors.gray },
  insightCard: { backgroundColor: colors.white, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, ...shadows.soft },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  insightIcon: { fontSize: 20, marginRight: spacing.sm },
  insightItem: { flexDirection: 'row', marginBottom: spacing.sm },
  insightNumber: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.blush, textAlign: 'center', lineHeight: 20, fontSize: 11, fontWeight: 'bold', color: colors.accent, marginRight: spacing.sm },
  insightText: { flex: 1, fontSize: 14, color: colors.gray, lineHeight: 20 },
  resetButtonText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
});