/**
 * DailyQuestionsScreen - Daily question rotation for couples
 */
import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

import FadeInView from '../../../components/animated/FadeInView';
import ScaleButton from '../../../components/animated/ScaleButton';
import SkeletonLoader from '../../../components/animated/SkeletonLoader';
import { colors, spacing, shadows } from '../../../constants/theme';

interface Question {
  id: string;
  question: string;
  category: string;
  depth: number;
}

export default function DailyQuestionsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todaysQuestion, setTodaysQuestion] = useState<Question | null>(null);
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [partnerAnswer, setPartnerAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [todayRes, historyRes] = await Promise.all([
        fetch('/api/features/daily-questions/today?couple_id=demo-couple'),
        fetch('/api/features/daily-questions/history/demo-couple'),
      ]);
      const todayData = await todayRes.json();
      const historyData = await historyRes.json();
      if (todayData.success) {
        setTodaysQuestion(todayData.question);
        setAlreadyAnswered(todayData.already_answered);
      }
      if (historyData.success) {
        setHistory(historyData.history || []);
      }
    } catch {
      // Use demo question
      setTodaysQuestion({ id: 'dq001', question: "What made you smile today?", category: 'positivity', depth: 1 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() { setRefreshing(true); loadData(); }

  async function submitAnswer() {
    if (!userAnswer.trim()) return;
    setSubmitting(true);
    try {
      await fetch('/api/features/daily-questions/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couple_id: 'demo-couple',
          question_id: todaysQuestion?.id,
          user_answer: userAnswer,
        }),
      });
      setSubmitted(true);
      setAlreadyAnswered(true);
    } catch {
      setSubmitted(true);
      setAlreadyAnswered(true);
    } finally {
      setSubmitting(false);
    }
  }

  const getDepthLabel = (depth: number) => ['Surface', 'Moderate', 'Deep'][depth - 1] || 'Surface';
  const getDepthColor = (depth: number) => [colors.teal, colors.gold, colors.accent][depth - 1] || colors.teal;

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
              <Text style={styles.greeting}>Daily Questions 💝</Text>
              <Text style={styles.subgreeting}>Connect deeper with your partner every day</Text>
            </View>
          </FadeInView>
        </LinearGradient>

        <View style={styles.content}>
          {/* Today's Question */}
          <FadeInView delay={100}>
            <View style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <Text style={styles.todayLabel}>Today's Question</Text>
                {todaysQuestion && (
                  <View style={[styles.depthBadge, { backgroundColor: getDepthColor(todaysQuestion.depth) + '20' }]}>
                    <Text style={[styles.depthText, { color: getDepthColor(todaysQuestion.depth) }]}>{getDepthLabel(todaysQuestion.depth)}</Text>
                  </View>
                )}
              </View>
              {todaysQuestion ? (
                <>
                  <Text style={styles.questionText}>"{todaysQuestion.question}"</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryIcon}>✨</Text>
                    <Text style={styles.categoryText}>{todaysQuestion.category}</Text>
                  </View>
                </>
              ) : (
                <Text style={styles.questionText}>Loading today's question...</Text>
              )}
            </View>
          </FadeInView>

          {/* Answer Section */}
          {!alreadyAnswered && !submitted ? (
            <FadeInView delay={200}>
              <View style={styles.answerSection}>
                <Text style={styles.answerTitle}>Your Answer</Text>
                <TextInput
                  style={styles.answerInput}
                  placeholder="Share your thoughts..."
                  placeholderTextColor={colors.gray}
                  value={userAnswer}
                  onChangeText={setUserAnswer}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <ScaleButton onPress={submitAnswer} loading={submitting} disabled={!userAnswer.trim()} style={styles.submitButton}>
                  <LinearGradient colors={[colors.accent, '#D4778A']} style={styles.submitGradient}>
                    <Text style={styles.submitText}>Share Answer</Text>
                  </LinearGradient>
                </ScaleButton>
              </View>
            </FadeInView>
          ) : (
            <FadeInView delay={200}>
              <View style={styles.answeredCard}>
                <Text style={styles.answeredIcon}>✅</Text>
                <Text style={styles.answeredTitle}>Answered Today!</Text>
                {userAnswer && <Text style={styles.yourAnswer}>"{userAnswer}"</Text>}
                <Text style={styles.answeredSubtitle}>Come back tomorrow for a new question</Text>
              </View>
            </FadeInView>
          )}

          {/* Past Questions */}
          {history.length > 0 && (
            <FadeInView delay={300}>
              <View style={styles.historySection}>
                <Text style={styles.historyTitle}>Past Questions</Text>
                {history.slice(0, 5).map((item, index) => (
                  <MotiView
                    key={item.id || index}
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ delay: index * 50 }}
                    style={styles.historyItem}
                  >
                    <Text style={styles.historyIcon}>✓</Text>
                    <View style={styles.historyContent}>
                      <Text style={styles.historyQuestion}>{item.user_answer?.slice(0, 60)}...</Text>
                      <Text style={styles.historyDate}>{item.answered_at ? new Date(item.answered_at).toLocaleDateString() : 'Recently'}</Text>
                    </View>
                  </MotiView>
                ))}
              </View>
            </FadeInView>
          )}

          {/* Tips */}
          <FadeInView delay={400}>
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>💡 Tips for Great Answers</Text>
              <View style={styles.tipItem}><Text style={styles.tipBullet}>•</Text><Text style={styles.tipText}>Be honest and vulnerable - that's where real connection happens</Text></View>
              <View style={styles.tipItem}><Text style={styles.tipBullet}>•</Text><Text style={styles.tipText}>Listen to your partner's answer without judgment</Text></View>
              <View style={styles.tipItem}><Text style={styles.tipBullet}>•</Text><Text style={styles.tipText}>Ask follow-up questions to go deeper</Text></View>
            </View>
          </FadeInView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerGradient: { paddingBottom: spacing.lg },
  header: { padding: spacing.lg },
  greeting: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xs },
  subgreeting: { fontSize: 14, color: colors.gray },
  content: { padding: spacing.md },
  questionCard: { backgroundColor: colors.white, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, ...shadows.soft },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  todayLabel: { fontSize: 12, color: colors.gray, textTransform: 'uppercase', letterSpacing: 1 },
  depthBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs / 2, borderRadius: 8 },
  depthText: { fontSize: 12, fontWeight: '600' },
  questionText: { fontSize: 22, fontWeight: 'bold', color: colors.primary, lineHeight: 30, marginBottom: spacing.md },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.blush, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
  categoryIcon: { fontSize: 12, marginRight: spacing.xs / 2 },
  categoryText: { fontSize: 12, color: colors.accent, fontWeight: '600', textTransform: 'capitalize' },
  answerSection: { backgroundColor: colors.white, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, ...shadows.soft },
  answerTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.md },
  answerInput: { backgroundColor: colors.background, borderRadius: 16, padding: spacing.md, fontSize: 14, color: colors.primary, minHeight: 120, marginBottom: spacing.md },
  submitButton: { borderRadius: 16, overflow: 'hidden' },
  submitGradient: { padding: spacing.md, alignItems: 'center' },
  submitText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  answeredCard: { backgroundColor: colors.teal + '15', borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.teal },
  answeredIcon: { fontSize: 40, marginBottom: spacing.sm },
  answeredTitle: { fontSize: 18, fontWeight: 'bold', color: colors.teal, marginBottom: spacing.sm },
  yourAnswer: { fontSize: 14, color: colors.primary, textAlign: 'center', fontStyle: 'italic', marginBottom: spacing.sm },
  answeredSubtitle: { fontSize: 13, color: colors.gray },
  historySection: { marginBottom: spacing.md },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.md },
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, ...shadows.soft },
  historyIcon: { fontSize: 16, color: colors.teal, marginRight: spacing.md },
  historyContent: { flex: 1 },
  historyQuestion: { fontSize: 13, color: colors.primary, marginBottom: spacing.xs / 2 },
  historyDate: { fontSize: 11, color: colors.gray },
  tipsCard: { backgroundColor: colors.blush, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.lg },
  tipsTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.md },
  tipItem: { flexDirection: 'row', marginBottom: spacing.sm },
  tipBullet: { fontSize: 14, color: colors.accent, marginRight: spacing.sm },
  tipText: { flex: 1, fontSize: 13, color: colors.primary, lineHeight: 18 },
});