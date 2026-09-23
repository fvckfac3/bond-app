import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, ProgressBar } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows, typography } from '../../../constants/theme';
import { supabase } from '../../../services/supabase';
import { fetchCompletedModules, fetchSeries, LearningSeries } from '../../../services/learning';

export default function LearningSeriesScreen() {
  const router = useRouter();
  const { seriesKey } = useLocalSearchParams<{ seriesKey: string }>();
  const [series, setSeries] = useState<LearningSeries | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      const [{ data: { user } }, seriesData] = await Promise.all([supabase.auth.getUser(), fetchSeries(seriesKey)]);
      setSeries(seriesData);
      if (user && seriesData) {
        const progress = await fetchCompletedModules(user.id, seriesKey);
        setCompleted(progress[seriesKey] || new Set());
      }
    } catch (error) {
      console.error('Error loading series:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [seriesKey]);

  // Reload on focus so "mark complete" on a lesson shows up when coming back.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openModule = (moduleKey: string) =>
    router.push({ pathname: '/learning/[seriesKey]/[moduleKey]', params: { seriesKey, moduleKey } });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>
      </SafeAreaView>
    );
  }

  if (!series) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>{failed ? 'Could not load this series' : 'Series not found'}</Text>
          {failed ? <Button mode="contained" onPress={load} style={styles.cta}>Try again</Button> : null}
          <Button onPress={() => router.back()} textColor={colors.gold}>Go back</Button>
        </View>
      </SafeAreaView>
    );
  }

  const doneCount = series.modules.filter((m) => completed.has(m.module_key)).length;
  const total = series.modules.length;
  const nextModule = series.modules.find((m) => !completed.has(m.module_key)) || series.modules[0];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: series.title, headerBackTitle: 'Back' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <Card.Content>
            <Text style={styles.icon}>{series.icon}</Text>
            <Text style={styles.title}>{series.title}</Text>
            <Text style={styles.body}>{series.description || series.summary}</Text>
            <Text style={styles.progressLabel}>{doneCount} of {total} lessons completed</Text>
            <ProgressBar progress={total ? doneCount / total : 0} color={colors.gold} style={styles.progressBar} />
            {nextModule ? (
              <Button mode="contained" style={styles.cta} onPress={() => openModule(nextModule.module_key)}>
                {doneCount === 0 ? 'Start the series' : doneCount === total ? 'Review from the start' : 'Continue'}
              </Button>
            ) : null}
          </Card.Content>
        </Card>

        {series.modules.map((module, index) => {
          const done = completed.has(module.module_key);
          return (
            <TouchableOpacity key={module.module_key} activeOpacity={0.9} onPress={() => openModule(module.module_key)}>
              <Card style={styles.card}>
                <Card.Content style={styles.moduleRow}>
                  <View style={[styles.badge, done && styles.badgeDone]}>
                    <Text style={styles.badgeText}>{done ? '✓' : index + 1}</Text>
                  </View>
                  <View style={styles.moduleText}>
                    <Text style={styles.moduleTitle}>{module.title}</Text>
                    <Text style={styles.moduleSummary}>{module.summary}</Text>
                    <Text style={styles.duration}>{module.duration}</Text>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1512',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heroCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: '#121B17',
    ...shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 147, 60, 0.18)',
  },
  icon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: '800',
    color: '#F8F1E6',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: typography.body.fontSize,
    color: '#E8DACC',
    lineHeight: typography.body.lineHeight,
  },
  progressLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontSize: typography.caption.fontSize,
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(201, 147, 60, 0.18)',
  },
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.gold,
  },
  card: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: '#151D19',
    borderWidth: 1,
    borderColor: 'rgba(201, 147, 60, 0.12)',
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  badgeDone: {
    backgroundColor: colors.gold,
  },
  badgeText: {
    color: '#F8F1E6',
    fontWeight: '700',
  },
  moduleText: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: '#F7EAD7',
    marginBottom: spacing.xs,
  },
  moduleSummary: {
    fontSize: typography.bodySmall.fontSize,
    color: '#D3C5B5',
    lineHeight: typography.body.lineHeight,
  },
  duration: {
    marginTop: spacing.xs,
    fontSize: typography.caption.fontSize,
    color: '#B59F88',
  },
});
