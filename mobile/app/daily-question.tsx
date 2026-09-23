import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect } from 'expo-router';
import { Button, Card, Chip, TextInput } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows, typography } from '../constants/theme';
import { supabase } from '../services/supabase';
import { getCoupleContext, CoupleContext } from '../services/couple';
import { trackEvent, AnalyticsEvents } from '../services/analytics';
import { localDateString, pickDailyQuestion } from '../utils/dailyQuestion';

interface Question { id: string; question: string; category: string | null; depth: string }
interface PastDay { date: string; question: string; mine?: string; partner?: string }

const HISTORY_DAYS = 14;

// The partner's answer is only returned by the database once you've answered the same
// question yourself (RLS in migration 011), so nothing here needs to hide it.
export default function DailyQuestionScreen() {
  const [ctx, setCtx] = useState<CoupleContext | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [myAnswer, setMyAnswer] = useState<string | null>(null);
  const [partnerAnswer, setPartnerAnswer] = useState<string | null>(null);
  const [history, setHistory] = useState<PastDay[]>([]);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = localDateString();

  const load = useCallback(async () => {
    try {
      setError(null);
      const context = await getCoupleContext();
      setCtx(context);
      if (!context) return;

      const { data: questions, error: qError } = await supabase
        .from('daily_questions')
        .select('id, question, category, depth')
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });
      if (qError) throw qError;
      const todays = pickDailyQuestion(questions, today) as Question | null;
      setQuestion(todays);

      let mine: string | null = null;
      let theirs: string | null = null;
      if (todays) {
        const { data: rows, error: rError } = await supabase
          .from('daily_question_responses')
          .select('user_id, answer')
          .eq('question_id', todays.id)
          .eq('response_date', today);
        if (rError) throw rError;
        mine = rows?.find((r) => r.user_id === context.userId)?.answer ?? null;
        theirs = rows?.find((r) => r.user_id === context.partnerId)?.answer ?? null;
      }
      setMyAnswer(mine);
      setPartnerAnswer(theirs);
      setDraft(mine ?? '');
      setEditing(false);

      const since = new Date();
      since.setDate(since.getDate() - HISTORY_DAYS);
      const { data: past, error: hError } = await supabase
        .from('daily_question_responses')
        .select('user_id, answer, response_date, daily_questions(question)')
        .lt('response_date', today)
        .gte('response_date', localDateString(since))
        .order('response_date', { ascending: false });
      if (hError) throw hError;
      const byDate = new Map<string, PastDay>();
      for (const row of past || []) {
        const entry: PastDay = byDate.get(row.response_date) || {
          date: row.response_date,
          question: (row as any).daily_questions?.question ?? '',
        };
        // Only the current partner: RLS also admits members of a past couple unit.
        if (row.user_id === context.userId) entry.mine = row.answer;
        else if (row.user_id === context.partnerId) entry.partner = row.answer;
        byDate.set(row.response_date, entry);
      }
      setHistory([...byDate.values()].filter((d) => d.mine));
    } catch (e) {
      console.error('Error loading daily question:', e);
      setError('Could not load today’s question. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [today]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function submit() {
    if (!ctx || !question || !draft.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const { error: saveError } = await supabase.from('daily_question_responses').upsert(
        {
          user_id: ctx.userId,
          couple_unit_id: ctx.coupleUnitId,
          question_id: question.id,
          response_date: today,
          answer: draft.trim(),
        },
        { onConflict: 'user_id,question_id,response_date' }
      );
      if (saveError) throw saveError;
      trackEvent(AnalyticsEvents.DAILY_QUESTION_ANSWERED, { depth: question.depth, paired: Boolean(ctx.coupleUnitId) });
      await load();
    } catch (e) {
      console.error('Error saving answer:', e);
      setError('Could not save your answer. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
      </SafeAreaView>
    );
  }

  const answered = myAnswer !== null && !editing;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: 'Daily Question', headerBackTitle: 'Back' }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        >
          {!question ? (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.body}>{error || 'There’s no question today. Check back tomorrow.'}</Text>
              </Card.Content>
            </Card>
          ) : (
            <>
              <Card style={styles.questionCard}>
                <Card.Content>
                  <Text style={styles.kicker}>Today&apos;s question</Text>
                  <Text style={styles.question}>{question.question}</Text>
                  <View style={styles.chipRow}>
                    {question.category ? <Chip compact style={styles.chip}>{question.category}</Chip> : null}
                    <Chip compact style={styles.chip}>{question.depth}</Chip>
                  </View>
                </Card.Content>
              </Card>

              {answered ? (
                <Card style={styles.card}>
                  <Card.Content>
                    <Text style={styles.label}>Your answer</Text>
                    <Text style={styles.body}>{myAnswer}</Text>
                    <Button compact mode="text" textColor={colors.accent} style={styles.editButton} onPress={() => setEditing(true)}>
                      Edit
                    </Button>
                  </Card.Content>
                </Card>
              ) : (
                <Card style={styles.card}>
                  <Card.Content>
                    <TextInput
                      mode="outlined"
                      multiline
                      numberOfLines={4}
                      placeholder="Write your answer…"
                      value={draft}
                      onChangeText={setDraft}
                      outlineColor={colors.lightGray}
                      activeOutlineColor={colors.accent}
                      style={styles.input}
                    />
                    <Text style={styles.hint}>
                      {ctx?.coupleUnitId
                        ? 'You’ll see your partner’s answer once you’ve both answered.'
                        : 'Pair with your partner to see each other’s answers.'}
                    </Text>
                    <Button
                      mode="contained"
                      buttonColor={colors.accent}
                      style={styles.submit}
                      loading={saving}
                      disabled={saving || !draft.trim()}
                      onPress={submit}
                    >
                      {myAnswer !== null ? 'Save answer' : 'Share my answer'}
                    </Button>
                  </Card.Content>
                </Card>
              )}

              {answered && ctx?.coupleUnitId ? (
                <Card style={styles.card}>
                  <Card.Content>
                    <Text style={styles.label}>Your partner&apos;s answer</Text>
                    <Text style={partnerAnswer ? styles.body : styles.muted}>
                      {partnerAnswer || 'Your partner hasn’t answered yet. Their answer will appear here.'}
                    </Text>
                  </Card.Content>
                </Card>
              ) : null}

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </>
          )}

          {history.length > 0 ? (
            <View style={styles.history}>
              <Text style={styles.sectionTitle}>Past two weeks</Text>
              {history.map((day) => (
                <Card key={day.date} style={styles.card}>
                  <Card.Content>
                    <Text style={styles.date}>{day.date}</Text>
                    <Text style={styles.pastQuestion}>{day.question}</Text>
                    <Text style={styles.label}>You</Text>
                    <Text style={styles.body}>{day.mine}</Text>
                    {ctx?.coupleUnitId ? (
                      <>
                        <Text style={styles.label}>Your partner</Text>
                        <Text style={day.partner ? styles.body : styles.muted}>{day.partner || 'No answer that day'}</Text>
                      </>
                    ) : null}
                  </Card.Content>
                </Card>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  questionCard: { marginBottom: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.primary, ...shadows.md },
  kicker: { fontSize: typography.caption.fontSize, color: colors.blush, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing.sm },
  question: { fontSize: typography.h3.fontSize, fontWeight: '700', color: colors.white, lineHeight: 30 },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  chip: { backgroundColor: colors.blush },
  card: { marginBottom: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.white, ...shadows.sm },
  label: { fontSize: typography.caption.fontSize, color: colors.accent, fontWeight: '700', textTransform: 'uppercase', marginTop: spacing.sm, marginBottom: spacing.xs },
  body: { fontSize: typography.body.fontSize, color: colors.black, lineHeight: typography.body.lineHeight },
  muted: { fontSize: typography.body.fontSize, color: colors.gray, fontStyle: 'italic' },
  hint: { fontSize: typography.bodySmall.fontSize, color: colors.gray, marginTop: spacing.sm },
  input: { backgroundColor: colors.white, minHeight: 110 },
  submit: { marginTop: spacing.md },
  editButton: { alignSelf: 'flex-start', marginTop: spacing.xs },
  error: { color: colors.error, marginBottom: spacing.md },
  history: { marginTop: spacing.md },
  sectionTitle: { fontSize: typography.h4.fontSize, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  date: { fontSize: typography.caption.fontSize, color: colors.gray },
  pastQuestion: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
});
