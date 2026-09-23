import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Button, Card, Checkbox, TextInput } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows, typography } from '../constants/theme';
import { supabase } from '../services/supabase';
import { getCoupleContext, CoupleContext } from '../services/couple';
import { trackEvent, AnalyticsEvents } from '../services/analytics';
import { useSubscription } from '../hooks/useSubscription';
import PaywallModal from '../components/subscription/PaywallModal';
import UpgradeButton from '../components/subscription/UpgradeButton';

interface Theme {
  theme_key: string;
  title: string;
  summary: string;
  framework: string | null;
  focus_questions: string[];
  weekly_activities: { week: number; title: string; description: string }[];
}
interface DeepDive {
  id: string;
  theme_key: string;
  month: string;
  completed_weeks: number[];
  reflection: string | null;
  status: 'active' | 'completed';
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

// One deep dive per couple per month (couple_deep_dives, couple-scoped RLS). Premium feature.
export default function DeepDiveScreen() {
  const router = useRouter();
  const [ctx, setCtx] = useState<CoupleContext | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [current, setCurrent] = useState<DeepDive | null>(null);
  const [past, setPast] = useState<DeepDive[]>([]);
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const { isPremium, loading: subscriptionLoading, packages, refresh } = useSubscription(ctx?.userId);

  const month = currentMonth();

  const load = useCallback(async () => {
    try {
      setError(null);
      const [context, { data: themeRows, error: tError }] = await Promise.all([
        getCoupleContext(),
        supabase.from('deep_dive_themes').select('*').order('sort_order', { ascending: true }),
      ]);
      if (tError) throw tError;
      setCtx(context);
      setThemes(themeRows || []);

      if (context?.coupleUnitId) {
        const { data: dives, error: dError } = await supabase
          .from('couple_deep_dives')
          .select('id, theme_key, month, completed_weeks, reflection, status')
          .eq('couple_unit_id', context.coupleUnitId)
          .order('month', { ascending: false })
          .limit(12);
        if (dError) throw dError;
        const thisMonth = (dives || []).find((d) => d.month === month) || null;
        setCurrent(thisMonth);
        setReflection(thisMonth?.reflection || '');
        setPast((dives || []).filter((d) => d.month !== month));
      }
    } catch (e) {
      console.error('Error loading deep dive:', e);
      setError('Could not load your deep dive. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function run(action: () => Promise<void>, failure: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (e) {
      console.error(failure, e);
      setError(failure);
    } finally {
      setBusy(false);
    }
  }

  const startTheme = (themeKey: string) =>
    run(async () => {
      if (!ctx?.coupleUnitId) return;
      if (current) {
        const { error: e } = await supabase
          .from('couple_deep_dives')
          .update({ theme_key: themeKey, updated_at: new Date().toISOString() })
          .eq('id', current.id);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from('couple_deep_dives').insert({
          couple_unit_id: ctx.coupleUnitId,
          theme_key: themeKey,
          month,
          created_by: ctx.userId,
        });
        // 23505: your partner started this month's deep dive at the same moment; show theirs.
        if (e && e.code !== '23505') throw e;
      }
      trackEvent(AnalyticsEvents.DEEP_DIVE_STARTED, { theme_key: themeKey });
      await load();
    }, 'Could not start this deep dive. Please try again.');

  const toggleWeek = (week: number) =>
    run(async () => {
      if (!current) return;
      const weeks = current.completed_weeks.includes(week)
        ? current.completed_weeks.filter((w) => w !== week)
        : [...current.completed_weeks, week].sort();
      const { error: e } = await supabase
        .from('couple_deep_dives')
        .update({ completed_weeks: weeks, updated_at: new Date().toISOString() })
        .eq('id', current.id);
      if (e) throw e;
      setCurrent({ ...current, completed_weeks: weeks });
    }, 'Could not update this week. Please try again.');

  const saveReflection = (complete: boolean) =>
    run(async () => {
      if (!current) return;
      const changes: Partial<DeepDive> & { updated_at: string } = {
        reflection: reflection.trim() || null,
        updated_at: new Date().toISOString(),
      };
      if (complete) changes.status = 'completed';
      const { error: e } = await supabase.from('couple_deep_dives').update(changes).eq('id', current.id);
      if (e) throw e;
      if (complete) trackEvent(AnalyticsEvents.DEEP_DIVE_COMPLETED, { theme_key: current.theme_key });
      setNotice(complete ? 'Deep dive completed. See you next month.' : 'Reflection saved.');
      await load();
    }, 'Could not save. Please try again.');

  if (loading || subscriptionLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
      </SafeAreaView>
    );
  }

  const themeFor = (key: string) => themes.find((t) => t.theme_key === key);
  const theme = current ? themeFor(current.theme_key) : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: 'Monthly Deep Dive', headerBackTitle: 'Back' }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.month}>{monthLabel(month)}</Text>
          <Text style={styles.intro}>
            Each month, choose one theme to explore together: four questions to talk about and one activity a week.
          </Text>

          {!isPremium ? (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>A Premium feature</Text>
                <Text style={styles.body}>
                  Monthly deep dives are part of Premium. If either of you subscribes, you both get access.
                </Text>
                <View style={styles.upgrade}>
                  <UpgradeButton onPress={() => setShowPaywall(true)} />
                </View>
              </Card.Content>
            </Card>
          ) : !ctx?.coupleUnitId ? (
            <Text style={styles.notice}>Pair with your partner to start a deep dive together.</Text>
          ) : theme && current ? (
            <>
              <Card style={styles.heroCard}>
                <Card.Content>
                  <Text style={styles.kicker}>This month{current.status === 'completed' ? ' · completed' : ''}</Text>
                  <Text style={styles.heroTitle}>{theme.title}</Text>
                  <Text style={styles.heroBody}>{theme.summary}</Text>
                </Card.Content>
              </Card>

              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.cardTitle}>Talk about</Text>
                  {theme.focus_questions.map((q) => (
                    <Text key={q} style={styles.bullet}>• {q}</Text>
                  ))}
                </Card.Content>
              </Card>

              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.cardTitle}>Weekly activities</Text>
                  {theme.weekly_activities.map((w) => (
                    <TouchableOpacity key={w.week} style={styles.week} onPress={() => toggleWeek(w.week)} disabled={busy}>
                      <Checkbox.Android
                        status={current.completed_weeks.includes(w.week) ? 'checked' : 'unchecked'}
                        color={colors.teal}
                        onPress={() => toggleWeek(w.week)}
                        disabled={busy}
                      />
                      <View style={styles.weekText}>
                        <Text style={styles.weekTitle}>Week {w.week}: {w.title}</Text>
                        <Text style={styles.body}>{w.description}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </Card.Content>
              </Card>

              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.cardTitle}>Our reflection</Text>
                  <Text style={styles.hint}>Shared between you. What did you notice or learn this month?</Text>
                  <TextInput
                    mode="outlined"
                    multiline
                    value={reflection}
                    onChangeText={setReflection}
                    outlineColor={colors.lightGray}
                    activeOutlineColor={colors.accent}
                    style={styles.input}
                  />
                  <View style={styles.actions}>
                    <Button mode="outlined" textColor={colors.accent} onPress={() => saveReflection(false)} disabled={busy}>
                      Save
                    </Button>
                    {current.status !== 'completed' ? (
                      <Button mode="contained" buttonColor={colors.accent} onPress={() => saveReflection(true)} disabled={busy}>
                        Complete month
                      </Button>
                    ) : null}
                  </View>
                </Card.Content>
              </Card>

              {current.completed_weeks.length === 0 && current.status === 'active' ? (
                <Button textColor={colors.gray} onPress={() => setCurrent({ ...current, theme_key: '' })}>
                  Choose a different theme
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Choose this month&apos;s theme</Text>
              {themes.map((t) => (
                <Card key={t.theme_key} style={styles.card}>
                  <Card.Content>
                    <Text style={styles.cardTitle}>{t.title}</Text>
                    <Text style={styles.body}>{t.summary}</Text>
                    <Button
                      mode="contained"
                      buttonColor={colors.accent}
                      style={styles.choose}
                      disabled={busy}
                      onPress={() => startTheme(t.theme_key)}
                    >
                      Start this theme
                    </Button>
                  </Card.Content>
                </Card>
              ))}
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {notice ? <Text style={styles.noticeOk}>{notice}</Text> : null}

          {isPremium && past.length > 0 ? (
            <View style={styles.history}>
              <Text style={styles.sectionTitle}>Past months</Text>
              {past.map((d) => (
                <Card key={d.id} style={styles.card}>
                  <Card.Content>
                    <Text style={styles.date}>{monthLabel(d.month)} · {d.status === 'completed' ? 'completed' : `${d.completed_weeks.length} of 4 weeks`}</Text>
                    <Text style={styles.cardTitle}>{themeFor(d.theme_key)?.title || d.theme_key}</Text>
                    {d.reflection ? <Text style={styles.body}>{d.reflection}</Text> : null}
                  </Card.Content>
                </Card>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        packages={packages}
        onSuccess={() => {
          setShowPaywall(false);
          refresh();
          router.push('/subscription/success');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  month: { fontSize: typography.h3.fontSize, fontWeight: '700', color: colors.primary },
  intro: { fontSize: typography.body.fontSize, color: colors.gray, marginVertical: spacing.sm, lineHeight: typography.body.lineHeight },
  notice: { fontSize: typography.body.fontSize, color: colors.accent, marginVertical: spacing.md },
  noticeOk: { color: colors.teal, marginVertical: spacing.sm },
  error: { color: colors.error, marginVertical: spacing.sm },
  heroCard: { marginVertical: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.primary, ...shadows.md },
  kicker: { fontSize: typography.caption.fontSize, color: colors.blush, textTransform: 'uppercase', letterSpacing: 1.2 },
  heroTitle: { fontSize: typography.h2.fontSize, fontWeight: '800', color: colors.white, marginVertical: spacing.xs },
  heroBody: { fontSize: typography.body.fontSize, color: colors.blush, lineHeight: typography.body.lineHeight },
  card: { marginBottom: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.white, ...shadows.sm },
  cardTitle: { fontSize: typography.h4.fontSize, fontWeight: '700', color: colors.primary, marginBottom: spacing.xs },
  body: { fontSize: typography.body.fontSize, color: colors.black, lineHeight: typography.body.lineHeight },
  bullet: { fontSize: typography.body.fontSize, color: colors.black, lineHeight: typography.body.lineHeight, marginTop: spacing.xs },
  hint: { fontSize: typography.bodySmall.fontSize, color: colors.gray, marginBottom: spacing.sm },
  week: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.sm },
  weekText: { flex: 1, marginLeft: spacing.xs },
  weekTitle: { fontSize: typography.body.fontSize, fontWeight: '700', color: colors.primary },
  input: { backgroundColor: colors.white, minHeight: 100 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  upgrade: { marginTop: spacing.md },
  sectionTitle: { fontSize: typography.h4.fontSize, fontWeight: '700', color: colors.primary, marginVertical: spacing.sm },
  choose: { marginTop: spacing.md, alignSelf: 'flex-start' },
  history: { marginTop: spacing.md },
  date: { fontSize: typography.caption.fontSize, color: colors.gray, marginBottom: spacing.xs },
});
