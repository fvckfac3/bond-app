import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, SegmentedButtons, TextInput } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows, typography } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { getCoupleContext, CoupleContext } from '../../services/couple';
import { backendPost } from '../../services/insights';
import { logError } from '../../services/sentry';
import { useSubscription } from '../../hooks/useSubscription';
import AnalyzerResult, { ANALYZERS, AnalyzerKind } from '../../components/analyzers/AnalyzerResult';
import PaywallModal from '../../components/subscription/PaywallModal';
import UpgradeButton from '../../components/subscription/UpgradeButton';

// Run one analyzer, or (with ?analysisId=) show a past analysis. The backend loads the couple's
// Bond messages itself; a pasted conversation is sent once and never stored.
export default function AnalyzerScreen() {
  const router = useRouter();
  const { kind: kindParam, analysisId } = useLocalSearchParams<{ kind: string; analysisId?: string }>();
  const kind = (kindParam in ANALYZERS ? kindParam : 'communication') as AnalyzerKind;
  const config = ANALYZERS[kind];
  const [ctx, setCtx] = useState<CoupleContext | null>(null);
  const [source, setSource] = useState<'messages' | 'transcript'>(kind === 'argument' ? 'transcript' : 'messages');
  const [transcript, setTranscript] = useState('');
  const [note, setNote] = useState('');
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(Boolean(analysisId));
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { packages, refresh } = useSubscription(ctx?.userId);

  const load = useCallback(async () => {
    const context = await getCoupleContext();
    setCtx(context);
    if (analysisId) {
      const { data } = await supabase.from(config.table).select('result').eq('id', analysisId).maybeSingle();
      setResult(data?.result ?? null);
      setLoading(false);
    }
  }, [analysisId, config.table]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function run() {
    if (!ctx?.coupleUnitId) return;
    setRunning(true);
    setError(null);
    setLimitReached(false);
    try {
      const { status, data } = await backendPost(`/api/analyzers/${kind}/analyze`, {
        couple_id: ctx.coupleUnitId,
        source,
        transcript: source === 'transcript' ? transcript.trim() : undefined,
        context: note.trim() || undefined,
      });
      if (status === 200) {
        setResult(data.result);
        setTranscript('');
      } else if (status === 402) {
        setLimitReached(true);
        setError(data?.detail);
      } else if (status === 422) {
        setError(typeof data?.detail === 'string' ? data.detail : 'Please share a bit more of the conversation.');
      } else {
        setError(status === 503 ? 'Analysis isn’t available right now.' : 'We couldn’t complete this analysis. Please try again.');
        logError(new Error(`Analyzer ${kind} failed with ${status}`), { tags: { feature: 'analyzers' } });
      }
    } catch (e) {
      logError(e, { tags: { feature: 'analyzers' } });
      setError('We couldn’t complete this analysis. Please try again.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: `${config.icon} ${config.title}`, headerBackTitle: 'Analyzers' }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {loading ? <ActivityIndicator color={colors.accent} /> : null}

          {!analysisId ? (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.body}>{config.description}</Text>
                <SegmentedButtons
                  style={styles.segment}
                  value={source}
                  onValueChange={(v) => setSource(v as 'messages' | 'transcript')}
                  buttons={[
                    { value: 'messages', label: 'Our Bond messages' },
                    { value: 'transcript', label: kind === 'argument' ? 'Describe it' : 'Paste a chat' },
                  ]}
                />
                {source === 'messages' ? (
                  <Text style={styles.hint}>Uses your Bond messages from the last {config.days} days. The messages themselves aren&apos;t stored.</Text>
                ) : (
                  <>
                    <Text style={styles.hint}>
                      {kind === 'argument'
                        ? 'Describe the disagreement, or paste the messages. What you type isn’t stored; you both see the analysis.'
                        : 'Paste a conversation between you. It’s analyzed once and never stored; you both see the analysis.'}
                    </Text>
                    <TextInput
                      mode="outlined"
                      multiline
                      value={transcript}
                      onChangeText={setTranscript}
                      placeholder={kind === 'argument' ? 'What happened, and how did it go?' : 'Paste the conversation here…'}
                      outlineColor={colors.lightGray}
                      activeOutlineColor={colors.accent}
                      style={styles.input}
                    />
                  </>
                )}
                <TextInput
                  mode="outlined"
                  value={note}
                  onChangeText={setNote}
                  placeholder="Anything to keep in mind? (optional)"
                  outlineColor={colors.lightGray}
                  activeOutlineColor={colors.accent}
                  style={styles.note}
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {limitReached ? (
                  <View style={styles.action}>
                    <UpgradeButton onPress={() => setShowPaywall(true)} text="See Premium" />
                  </View>
                ) : null}
                <Button
                  mode="contained"
                  buttonColor={colors.accent}
                  style={styles.action}
                  loading={running}
                  disabled={running || !ctx?.coupleUnitId || (source === 'transcript' && transcript.trim().length < 80)}
                  onPress={run}
                >
                  {running ? 'Analyzing…' : 'Analyze'}
                </Button>
                {!ctx?.coupleUnitId ? <Text style={styles.hint}>Pair with your partner to use the analyzers.</Text> : null}
              </Card.Content>
            </Card>
          ) : null}

          <AnalyzerResult kind={kind} result={result} />
          {analysisId && !loading && !result ? <Text style={styles.body}>This analysis isn&apos;t available.</Text> : null}
          {analysisId ? (
            <Button textColor={colors.accent} onPress={() => router.replace({ pathname: '/ai/[kind]', params: { kind } })}>
              Run a new {config.title.toLowerCase()} analysis
            </Button>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        packages={packages}
        onSuccess={() => {
          setShowPaywall(false);
          setLimitReached(false);
          setError(null);
          refresh();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  card: { marginBottom: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.white, ...shadows.sm },
  body: { fontSize: typography.body.fontSize, color: colors.black, lineHeight: typography.body.lineHeight },
  segment: { marginTop: spacing.md },
  hint: { fontSize: typography.bodySmall.fontSize, color: colors.gray, marginTop: spacing.sm },
  input: { marginTop: spacing.sm, minHeight: 140, backgroundColor: colors.white },
  note: { marginTop: spacing.sm, backgroundColor: colors.white },
  error: { color: colors.error, marginTop: spacing.sm },
  action: { marginTop: spacing.md },
});
