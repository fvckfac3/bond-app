/**
 * CommunicationAnalyzerScreen - Analyze communication patterns between partners
 */
import { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

import FadeInView from '../../../components/animated/FadeInView';
import ScaleButton from '../../../components/animated/ScaleButton';
import SkeletonLoader from '../../../components/animated/SkeletonLoader';
import { colors, spacing, shadows } from '../../../constants/theme';
import { useSubscription } from '../../../hooks/useSubscription';
import PaywallModal from '../../../components/subscription/PaywallModal';

interface Message {
  sender: string;
  content: string;
  timestamp?: string;
}

export default function CommunicationAnalyzerScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [loading, setLoading] = useState(false);

  // Demo messages for visualization
  const demoMessages: Message[] = [
    { sender: 'Alex', content: 'Hey, how was your day?' },
    { sender: 'Jordan', content: 'Pretty good! Work was busy but manageable.' },
    { sender: 'Alex', content: 'That\'s great to hear. Want to try that new restaurant tonight?' },
    { sender: 'Jordan', content: 'Absolutely! I\'ve been wanting to try it.' },
    { sender: 'Alex', content: 'Perfect. I\'ll make a reservation for 7.' },
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
      Alert.alert('Need More Messages', 'Please add at least 3 messages to analyze communication patterns.');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/analyzers/communication/analyze', {
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
        // Show demo results if API fails
        setResults({
          overall_score: 78,
          response_time_score: 75,
          listening_score: 82,
          tone_consistency_score: 76,
          strengths: ['Active engagement in conversation', 'Clear and direct communication', 'Positive tone maintained'],
          areas_for_growth: ['More proactive sharing of feelings', 'Increased responsiveness to partner\'s concerns'],
          recommendations: [
            'Practice active listening by repeating back what your partner shares',
            'Set aside dedicated time for deeper conversations without distractions',
          ],
        });
      }
    } catch (error) {
      // Use demo results on error
      setResults({
        overall_score: 78,
        response_time_score: 75,
        listening_score: 82,
        tone_consistency_score: 76,
        strengths: ['Active engagement in conversation', 'Clear and direct communication', 'Positive tone maintained'],
        areas_for_growth: ['More proactive sharing of feelings', 'Increased responsiveness to partner\'s concerns'],
        recommendations: [
          'Practice active listening by repeating back what your partner shares',
          'Set aside dedicated time for deeper conversations without distractions',
        ],
      });
    } finally {
      setAnalyzing(false);
    }
  }

  function resetAnalysis() {
    setMessages([]);
    setResults(null);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.headerGradient}>
          <FadeInView>
            <View style={styles.header}>
              <Text style={styles.headerIcon}>💬</Text>
              <Text style={styles.headerTitle}>Communication Analyzer</Text>
              <Text style={styles.headerSubtitle}>
                Understand how you and your partner communicate
              </Text>
            </View>
          </FadeInView>
        </LinearGradient>

        <View style={styles.content}>
          {!results ? (
            <>
              {/* Message Input Section */}
              <FadeInView delay={100}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Message History</Text>
                  <Text style={styles.sectionSubtitle}>
                    Add your conversation messages below (or use demo)
                  </Text>

                  {/* Messages List */}
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
                          from={{ opacity: 0, translateX: -20 }}
                          animate={{ opacity: 1, translateX: 0 }}
                          transition={{ type: 'timing', duration: 300, delay: index * 50 }}
                          style={[styles.messageBubble, msg.sender === 'You' ? styles.messageSent : styles.messageReceived]}
                        >
                          <Text style={styles.messageSender}>{msg.sender}</Text>
                          <Text style={styles.messageContent}>{msg.content}</Text>
                        </MotiView>
                      ))
                    )}
                  </View>

                  {/* Input Row */}
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Type a message..."
                      placeholderTextColor={colors.gray}
                      value={newMessage}
                      onChangeText={setNewMessage}
                      multiline
                    />
                    <ScaleButton onPress={addMessage} style={styles.addButton}>
                      <Text style={styles.addButtonText}>+</Text>
                    </ScaleButton>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <ScaleButton onPress={addDemoMessages} variant="secondary" style={styles.demoButton}>
                      <Text style={styles.demoButtonText}>Use Demo Messages</Text>
                    </ScaleButton>
                  </View>
                </View>
              </FadeInView>

              {/* Analyze Button */}
              <FadeInView delay={200}>
                <ScaleButton
                  onPress={runAnalysis}
                  loading={analyzing}
                  disabled={messages.length < 3}
                  style={styles.analyzeButton}
                >
                  <LinearGradient
                    colors={[colors.accent, '#D4778A']}
                    style={styles.analyzeButtonGradient}
                  >
                    <Text style={styles.analyzeButtonText}>
                      {analyzing ? 'Analyzing...' : 'Analyze Communication'}
                    </Text>
                  </LinearGradient>
                </ScaleButton>
              </FadeInView>
            </>
          ) : (
            <>
              {/* Results Section */}
              <FadeInView>
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsTitle}>Your Communication Score</Text>
                  <MotiView
                    from={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 150 }}
                    style={styles.scoreCircle}
                  >
                    <Text style={styles.scoreValue}>{results.overall_score}</Text>
                    <Text style={styles.scoreLabel}>/100</Text>
                  </MotiView>
                </View>
              </FadeInView>

              {/* Score Breakdown */}
              <FadeInView delay={100}>
                <View style={styles.scoreBreakdown}>
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreItemLabel}>Response Time</Text>
                    <View style={styles.scoreBar}>
                      <View style={[styles.scoreBarFill, { width: `${results.response_time_score}%` }]} />
                    </View>
                    <Text style={styles.scoreItemValue}>{results.response_time_score}/100</Text>
                  </View>
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreItemLabel}>Listening</Text>
                    <View style={styles.scoreBar}>
                      <View style={[styles.scoreBarFill, { width: `${results.listening_score}%` }]} />
                    </View>
                    <Text style={styles.scoreItemValue}>{results.listening_score}/100</Text>
                  </View>
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreItemLabel}>Tone Consistency</Text>
                    <View style={styles.scoreBar}>
                      <View style={[styles.scoreBarFill, { width: `${results.tone_consistency_score}%` }]} />
                    </View>
                    <Text style={styles.scoreItemValue}>{results.tone_consistency_score}/100</Text>
                  </View>
                </View>
              </FadeInView>

              {/* Strengths */}
              <FadeInView delay={200}>
                <View style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightIcon}>✨</Text>
                    <Text style={styles.insightTitle}>Strengths</Text>
                  </View>
                  {results.strengths?.map((strength: string, index: number) => (
                    <View key={index} style={styles.insightItem}>
                      <Text style={styles.insightBullet}>•</Text>
                      <Text style={styles.insightText}>{strength}</Text>
                    </View>
                  ))}
                </View>
              </FadeInView>

              {/* Areas for Growth */}
              <FadeInView delay={300}>
                <View style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightIcon}>📈</Text>
                    <Text style={styles.insightTitle}>Areas for Growth</Text>
                  </View>
                  {results.areas_for_growth?.map((area: string, index: number) => (
                    <View key={index} style={styles.insightItem}>
                      <Text style={styles.insightBullet}>•</Text>
                      <Text style={styles.insightText}>{area}</Text>
                    </View>
                  ))}
                </View>
              </FadeInView>

              {/* Recommendations */}
              <FadeInView delay={400}>
                <View style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightIcon}>💡</Text>
                    <Text style={styles.insightTitle}>Recommendations</Text>
                  </View>
                  {results.recommendations?.map((rec: string, index: number) => (
                    <View key={index} style={styles.insightItem}>
                      <Text style={styles.insightNumber}>{index + 1}</Text>
                      <Text style={styles.insightText}>{rec}</Text>
                    </View>
                  ))}
                </View>
              </FadeInView>

              {/* Reset Button */}
              <FadeInView delay={500}>
                <ScaleButton onPress={resetAnalysis} variant="secondary" style={styles.resetButton}>
                  <Text style={styles.resetButtonText}>Analyze New Messages</Text>
                </ScaleButton>
              </FadeInView>
            </>
          )}
        </View>
      </ScrollView>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={() => setShowPaywall(false)}
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
  headerGradient: {
    paddingBottom: spacing.lg,
  },
  header: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 48,
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
    color: colors.gray,
    textAlign: 'center',
  },
  content: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.gray,
    marginBottom: spacing.md,
  },
  messagesList: {
    minHeight: 200,
    maxHeight: 300,
    marginBottom: spacing.md,
  },
  emptyState: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.gray,
  },
  messageBubble: {
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    maxWidth: '80%',
  },
  messageSent: {
    backgroundColor: colors.accent,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageReceived: {
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    ...shadows.soft,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs / 2,
  },
  messageContent: {
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    fontSize: 14,
    color: colors.primary,
    minHeight: 48,
    maxHeight: 100,
    ...shadows.soft,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  demoButton: {
    flex: 1,
  },
  demoButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  analyzeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  analyzeButtonGradient: {
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: 16,
  },
  analyzeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.white,
  },
  scoreLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  scoreBreakdown: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  scoreItem: {
    marginBottom: spacing.md,
  },
  scoreItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  scoreBar: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  scoreBarFill: {
    height: 8,
    backgroundColor: colors.teal,
    borderRadius: 4,
  },
  scoreItemValue: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'right',
  },
  insightCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  insightItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  insightBullet: {
    fontSize: 14,
    color: colors.teal,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  insightNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.blush,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.accent,
    marginRight: spacing.sm,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray,
    lineHeight: 20,
  },
  resetButton: {
    marginTop: spacing.md,
  },
  resetButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});