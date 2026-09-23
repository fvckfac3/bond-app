import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Button, Card, TextInput } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows, typography } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { getCoupleContext, CoupleContext } from '../../services/couple';
import { trackEvent, AnalyticsEvents } from '../../services/analytics';

interface Topic { id: string; topic_name: string; description: string | null; prompt_questions: string[] }
interface PastResponse {
  id: string;
  user_id: string;
  created_at: string;
  mood_score: number | null;
  response: { answers?: { prompt: string; answer: string }[] } | null;
}

const MOODS = ['😟', '😕', '😐', '🙂', '😊'];

export default function CheckInTopicScreen() {
  const { topicKey } = useLocalSearchParams<{ topicKey: string }>();
  const [ctx, setCtx] = useState<CoupleContext | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [mood, setMood] = useState<number | null>(null);
  const [past, setPast] = useState<PastResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [context, { data, error: tError }] = await Promise.all([
        getCoupleContext(),
        supabase
          .from('check_in_topics')
          .select('id, topic_name, description, prompt_questions')
          .eq('topic_key', topicKey)
          .maybeSingle(),
      ]);
      if (tError) throw tError;
      setCtx(context);
      setTopic(data);
      setAnswers((data?.prompt_questions || []).map(() => ''));

      if (data && context?.coupleUnitId) {
        const { data: rows, error: pError } = await supabase
          .from('check_in_responses')
          .select('id, user_id, created_at, mood_score, response')
          .eq('couple_unit_id', context.coupleUnitId)
          .eq('topic_id', data.id)
          .order('created_at', { ascending: false })
          .limit(10);
        if (pError) throw pError;
        setPast(rows || []);
      }
    } catch (e) {
      console.error('Error loading check-in topic:', e);
      setError('Could not load this topic. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [topicKey]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function save() {
    if (!ctx?.coupleUnitId || !topic) return;
    setSaving(true);
    setError(null);
    try {
      const { error: saveError } = await supabase.from('check_in_responses').insert({
        user_id: ctx.userId,
        couple_unit_id: ctx.coupleUnitId,
        topic_id: topic.id,
        mood_score: mood,
        response: {
          answers: topic.prompt_questions
            .map((prompt, i) => ({ prompt, answer: answers[i]?.trim() || '' }))
            .filter((a) => a.answer),
        },
      });
      if (saveError) throw saveError;
      trackEvent(AnalyticsEvents.CHECK_IN_TOPIC_COMPLETED, { topic_key: topicKey });
      setSaved(true);
      setMood(null);
      await load();
    } catch (e) {
      console.error('Error saving check-in:', e);
      setError('Could not save your check-in. Please try again.');
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

  const hasAnswer = answers.some((a) => a.trim());

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: topic?.topic_name || 'Check-in', headerBackTitle: 'Topics' }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!topic ? (
            <Text style={styles.body}>{error || 'This topic isn’t available.'}</Text>
          ) : (
            <>
              {topic.description ? <Text style={styles.intro}>{topic.description}</Text> : null}

              {!ctx?.coupleUnitId ? (
                <Text style={styles.notice}>Pair with your partner to save check-ins together.</Text>
              ) : (
                <Card style={styles.card}>
                  <Card.Content>
                    {topic.prompt_questions.map((prompt, i) => (
                      <View key={prompt} style={styles.prompt}>
                        <Text style={styles.promptText}>{prompt}</Text>
                        <TextInput
                          mode="outlined"
                          multiline
                          placeholder="Your thoughts (optional)"
                          value={answers[i]}
                          onChangeText={(text) => setAnswers(answers.map((a, j) => (j === i ? text : a)))}
                          outlineColor={colors.lightGray}
                          activeOutlineColor={colors.accent}
                          style={styles.input}
                        />
                      </View>
                    ))}
                    <Text style={styles.promptText}>How do you feel about this area right now?</Text>
                    <View style={styles.moodRow}>
                      {MOODS.map((emoji, i) => (
                        <TouchableOpacity
                          key={emoji}
                          onPress={() => setMood(mood === i + 1 ? null : i + 1)}
                          style={[styles.mood, mood === i + 1 && styles.moodSelected]}
                          accessibilityLabel={`Mood ${i + 1} of 5`}
                        >
                          <Text style={styles.moodEmoji}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    {saved ? <Text style={styles.saved}>Saved. Talk it through together when you&apos;re both ready.</Text> : null}
                    <Button
                      mode="contained"
                      buttonColor={colors.accent}
                      style={styles.submit}
                      loading={saving}
                      disabled={saving || (!hasAnswer && mood === null)}
                      onPress={save}
                    >
                      Save my check-in
                    </Button>
                  </Card.Content>
                </Card>
              )}

              {past.length > 0 ? (
                <View style={styles.history}>
                  <Text style={styles.sectionTitle}>Your check-ins on this topic</Text>
                  {past.map((row) => (
                    <Card key={row.id} style={styles.card}>
                      <Card.Content>
                        <Text style={styles.who}>
                          {row.user_id === ctx?.userId ? 'You' : 'Your partner'} · {new Date(row.created_at).toLocaleDateString()}
                          {row.mood_score ? `  ${MOODS[row.mood_score - 1]}` : ''}
                        </Text>
                        {(row.response?.answers || []).map((a) => (
                          <View key={a.prompt} style={styles.pastAnswer}>
                            <Text style={styles.pastPrompt}>{a.prompt}</Text>
                            <Text style={styles.body}>{a.answer}</Text>
                          </View>
                        ))}
                      </Card.Content>
                    </Card>
                  ))}
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  intro: { fontSize: typography.body.fontSize, color: colors.gray, marginBottom: spacing.md, lineHeight: typography.body.lineHeight },
  notice: { fontSize: typography.body.fontSize, color: colors.accent, marginBottom: spacing.md },
  card: { marginBottom: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.white, ...shadows.sm },
  prompt: { marginBottom: spacing.md },
  promptText: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.primary, marginBottom: spacing.xs },
  input: { backgroundColor: colors.white },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.sm },
  mood: { padding: spacing.sm, borderRadius: borderRadius.round, borderWidth: 1, borderColor: colors.lightGray },
  moodSelected: { borderColor: colors.accent, backgroundColor: colors.blush },
  moodEmoji: { fontSize: 24 },
  submit: { marginTop: spacing.md },
  error: { color: colors.error, marginTop: spacing.sm },
  saved: { color: colors.teal, marginTop: spacing.sm },
  history: { marginTop: spacing.sm },
  sectionTitle: { fontSize: typography.h4.fontSize, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  who: { fontSize: typography.caption.fontSize, color: colors.accent, fontWeight: '700', marginBottom: spacing.xs },
  pastAnswer: { marginTop: spacing.sm },
  pastPrompt: { fontSize: typography.bodySmall.fontSize, color: colors.gray, marginBottom: 2 },
  body: { fontSize: typography.body.fontSize, color: colors.black, lineHeight: typography.body.lineHeight },
});
