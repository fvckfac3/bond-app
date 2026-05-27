/**
 * EmotionalPatternAnalyzerScreen - Track long-term emotional trends and relationship growth
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

export default function EmotionalPatternAnalyzerScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const demoMessages: Message[] = [
    { sender: 'You', content: 'I love how we always laugh together', timestamp: '2024-01-15' },
    { sender: 'Partner', content: 'Yeah! Remember our first date? So awkward but so sweet', timestamp: '2024-01-15' },
    { sender: 'You', content: 'Best decision I ever made was asking you out', timestamp: '2024-01-18' },
    { sender: 'Partner', content: 'I\'m so grateful for you. You make me feel safe', timestamp: '2024-01-20' },
    { sender: 'You', content: 'Had a rough day but thinking about you makes it better', timestamp: '2024-01-22' },
    { sender: 'Partner', content: 'I\'ve been stressed too. We should take that trip soon', timestamp: '2024-01-25' },
    { sender: 'You', content: 'I\'m nervous about the talk we need to have', timestamp: '2024-01-28' },
    { sender: 'Partner', content: 'Me too but I think we\'ll figure it out. We always do', timestamp: '2024-01-28' },
    { sender: 'You', content: 'Today was really hard but I feel lucky to have you', timestamp: '2024-02-01' },
    { sender: 'Partner', content: 'Same here. We\'ve grown so much together', timestamp: '2024-02-03' },
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
    if (messages.length < 5) {
      Alert.alert('Need More Messages', 'Add at least 5 messages to analyze patterns.');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/analyzers/emotional/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couple_id: 'demo-couple',
          messages: messages,
          time_range: 'last_month',
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
      pattern_summary: 'Overall positive emotional trajectory with healthy range of expressions',
      emotional_trends: [
        { month: 'Month 1', score: 72, trend: 'stable', highlight: 'Strong foundation of appreciation' },
        { month: 'Month 2', score: 76, trend: 'up', highlight: 'Increased emotional vulnerability' },
        { month: 'Month 3', score: 81, trend: 'up', highlight: 'Deeper intimacy and trust' },
      ],
      trigger_maps: {
        positive: [
          { triggers: ['shared laughter', 'nostalgia', 'physical affection'], impact: 'strong' },
          { triggers: ['mutual support', 'quality time'], impact: 'moderate' },
        ],
        negative: [
          { triggers: ['stress discussions', 'unresolved conflicts'], impact: 'moderate' },
        ],
      },
      growth_trajectory: {
        overall: 'improving',
        intimacy_level: 'deep',
        communication_quality: 'strong',
        conflict_resolution: 'developing',
      },
      significant_shifts: [
        { type: 'positive', shift: 'Emotional vulnerability increased', date: 'Month 2' },
        { type: 'growth', shift: 'Better conflict awareness', date: 'Month 3' },
      ],
      recommendations: [
        'Continue the pattern of expressing appreciation daily',
        'Work on addressing stressful topics earlier before they accumulate',
        'Consider couples activities that reinforce your bond',
        'The increased vulnerability is a great sign - keep it up!',
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
              <Text style={styles.headerIcon}>💭</Text>
              <Text style={styles.headerTitle}>Emotional Pattern Analyzer</Text>
              <Text style={styles.headerSubtitle}>
                Track long-term emotional trends and relationship growth
              </Text>
            </View>
          </FadeInView>
        </LinearGradient>

        <View style={styles.content}>
          {!results ? (
            <>
              <FadeInView delay={100}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Message History</Text>
                  <Text style={styles.sectionSubtitle}>
                    Add messages from the past weeks/months to analyze patterns
                  </Text>

                  <View style={styles.messagesList}>
                    {messages.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No messages yet</Text>
                        <Text style={styles.emptySubtext}>Add messages or try the demo</Text>
                      </View>
                    ) : (
                      messages.map((msg, index) => (
                        <MotiView
                          key={index}
                          from={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
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
                      <Text style={styles.demoButtonText}>Use Demo Messages</Text>
                    </ScaleButton>
                  </View>
                </View>
              </FadeInView>

              <FadeInView delay={200}>
                <ScaleButton onPress={runAnalysis} loading={analyzing} disabled={messages.length < 5}>
                  <LinearGradient colors={[colors.accent, '#D4778A']} style={styles.analyzeButtonInner}>
                    <Text style={styles.analyzeButtonText}>
                      {analyzing ? 'Analyzing Patterns...' : 'Analyze Emotional Patterns'}
                    </Text>
                  </LinearGradient>
                </ScaleButton>
              </FadeInView>
            </>
          ) : (
            <>
              <FadeInView>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Pattern Summary</Text>
                  <Text style={styles.summaryText}>{results.pattern_summary}</Text>
                </View>
              </FadeInView>

              <FadeInView delay={100}>
                <View style={styles.trendsCard}>
                  <Text style={styles.trendsTitle}>Emotional Trends</Text>
                  {results.emotional_trends?.map((trend: any, index: number) => (
                    <MotiView
                      key={index}
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ delay: 100 + index * 50 }}
                      style={styles.trendItem}
                    >
                      <View style={styles.trendHeader}>
                        <Text style={styles.trendMonth}>{trend.month}</Text>
                        <View style={[styles.trendScore, { backgroundColor: trend.trend === 'up' ? colors.teal : trend.trend === 'down' ? colors.error : colors.gray }]}>
                          <Text style={styles.trendScoreText}>{trend.score}</Text>
                        </View>
                        <Text style={styles.trendIndicator}>{trend.trend === 'up' ? '↑' : trend.trend === 'down' ? '↓' : '→'}</Text>
                      </View>
                      <Text style={styles.trendHighlight}>{trend.highlight}</Text>
                    </MotiView>
                  ))}
                </View>
              </FadeInView>

              <FadeInView delay={200}>
                <View style={styles.growthCard}>
                  <Text style={styles.growthTitle}>Growth Trajectory</Text>
                  <View style={styles.growthGrid}>
                    <View style={styles.growthItem}>
                      <Text style={styles.growthLabel}>Overall</Text>
                      <View style={[styles.growthBadge, { backgroundColor: colors.teal + '30' }]}>
                        <Text style={[styles.growthValue, { color: colors.teal }]}>{results.growth_trajectory?.overall?.charAt(0).toUpperCase() + results.growth_trajectory?.overall?.slice(1)}</Text>
                      </View>
                    </View>
                    <View style={styles.growthItem}>
                      <Text style={styles.growthLabel}>Intimacy</Text>
                      <View style={[styles.growthBadge, { backgroundColor: colors.accent + '30' }]}>
                        <Text style={[styles.growthValue, { color: colors.accent }]}>{results.growth_trajectory?.intimacy_level?.charAt(0).toUpperCase() + results.growth_trajectory?.intimacy_level?.slice(1)}</Text>
                      </View>
                    </View>
                    <View style={styles.growthItem}>
                      <Text style={styles.growthLabel}>Communication</Text>
                      <View style={[styles.growthBadge, { backgroundColor: colors.teal + '30' }]}>
                        <Text style={[styles.growthValue, { color: colors.teal }]}>{results.growth_trajectory?.communication_quality?.charAt(0).toUpperCase() + results.growth_trajectory?.communication_quality?.slice(1)}</Text>
                      </View>
                    </View>
                    <View style={styles.growthItem}>
                      <Text style={styles.growthLabel}>Conflict Resolution</Text>
                      <View style={[styles.growthBadge, { backgroundColor: colors.gold + '30' }]}>
                        <Text style={[styles.growthValue, { color: colors.gold }]}>{results.growth_trajectory?.conflict_resolution?.charAt(0).toUpperCase() + results.growth_trajectory?.conflict_resolution?.slice(1)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </FadeInView>

              <FadeInView delay={300}>
                <View style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightIcon}>✨</Text>
                    <Text style={styles.insightTitle}>Emotional Triggers</Text>
                  </View>
                  <View style={styles.triggerSection}>
                    <Text style={styles.triggerTitle}>Positive Triggers</Text>
                    {results.trigger_maps?.positive?.map((trigger: any, index: number) => (
                      <View key={index} style={styles.triggerItem}>
                        <View style={[styles.triggerBadge, { backgroundColor: colors.teal + '30' }]}>
                          <Text style={[styles.triggerBadgeText, { color: colors.teal }]}>{trigger.impact}</Text>
                        </View>
                        <Text style={styles.triggerText}>{trigger.triggers.join(', ')}</Text>
                      </View>
                    ))}
                  </View>
                  {results.trigger_maps?.negative && results.trigger_maps.negative.length > 0 && (
                    <View style={styles.triggerSection}>
                      <Text style={styles.triggerTitle}>Areas of Challenge</Text>
                      {results.trigger_maps?.negative?.map((trigger: any, index: number) => (
                        <View key={index} style={styles.triggerItem}>
                          <View style={[styles.triggerBadge, { backgroundColor: colors.error + '30' }]}>
                            <Text style={[styles.triggerBadgeText, { color: colors.error }]}>{trigger.impact}</Text>
                          </View>
                          <Text style={styles.triggerText}>{trigger.triggers.join(', ')}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </FadeInView>

              {results.significant_shifts && results.significant_shifts.length > 0 && (
                <FadeInView delay={350}>
                  <View style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                      <Text style={styles.insightIcon}>📊</Text>
                      <Text style={styles.insightTitle}>Significant Shifts</Text>
                    </View>
                    {results.significant_shifts?.map((shift: any, index: number) => (
                      <View key={index} style={styles.shiftItem}>
                        <Text style={styles.shiftType}>{shift.type === 'positive' ? '✨' : '🌱'}</Text>
                        <View style={styles.shiftContent}>
                          <Text style={styles.shiftText}>{shift.shift}</Text>
                          <Text style={styles.shiftDate}>{shift.date}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </FadeInView>
              )}

              <FadeInView delay={400}>
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

              <FadeInView delay={500}>
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
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  emptySubtext: { fontSize: 13, color: colors.gray },
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
  summaryCard: { backgroundColor: colors.teal + '20', borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.teal },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.sm },
  summaryText: { fontSize: 14, color: colors.gray, lineHeight: 22 },
  trendsCard: { backgroundColor: colors.white, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, ...shadows.soft },
  trendsTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.md },
  trendItem: { backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm },
  trendHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  trendMonth: { fontSize: 14, fontWeight: '600', color: colors.primary, flex: 1 },
  trendScore: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs / 2, borderRadius: 8 },
  trendScoreText: { fontSize: 14, fontWeight: 'bold', color: colors.white },
  trendIndicator: { fontSize: 16, marginLeft: spacing.sm },
  trendHighlight: { fontSize: 12, color: colors.gray },
  growthCard: { backgroundColor: colors.white, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, ...shadows.soft },
  growthTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.md },
  growthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  growthItem: { width: '48%' },
  growthLabel: { fontSize: 11, color: colors.gray, marginBottom: spacing.xs },
  growthBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8, alignSelf: 'flex-start' },
  growthValue: { fontSize: 13, fontWeight: '600' },
  insightCard: { backgroundColor: colors.white, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, ...shadows.soft },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  insightIcon: { fontSize: 20, marginRight: spacing.sm },
  insightTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  triggerSection: { marginBottom: spacing.md },
  triggerTitle: { fontSize: 13, fontWeight: '600', color: colors.primary, marginBottom: spacing.sm },
  triggerItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  triggerBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6, marginRight: spacing.sm },
  triggerBadgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  triggerText: { flex: 1, fontSize: 13, color: colors.gray },
  shiftItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  shiftType: { fontSize: 20, marginRight: spacing.sm },
  shiftContent: { flex: 1 },
  shiftText: { fontSize: 14, color: colors.gray },
  shiftDate: { fontSize: 11, color: colors.gray, marginTop: 2 },
  indicatorItem: { flexDirection: 'row', marginBottom: spacing.sm },
  indicatorNumber: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.blush, textAlign: 'center', lineHeight: 20, fontSize: 11, fontWeight: 'bold', color: colors.accent, marginRight: spacing.sm },
  indicatorText: { flex: 1, fontSize: 14, color: colors.gray, lineHeight: 20 },
  resetButtonText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
});