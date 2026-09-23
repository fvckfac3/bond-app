import { useCallback, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Button, Divider, Chip } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows, typography } from '../../../constants/theme';
import { supabase } from '../../../services/supabase';
import { trackEvent, AnalyticsEvents } from '../../../services/analytics';
import {
  fetchCompletedModules,
  fetchModule,
  fetchSeries,
  LearningModule,
  LearningSeries,
  markModuleComplete,
} from '../../../services/learning';

const wideBanner = require('../../../assets/bond-cover-wide-dark.png');
const cinematicBanner = require('../../../assets/bond-cover-cinematic-dark.png');

export default function LearningModuleScreen() {
  const router = useRouter();
  const { seriesKey, moduleKey } = useLocalSearchParams<{ seriesKey: string; moduleKey: string }>();
  const [series, setSeries] = useState<LearningSeries | null>(null);
  const [module, setModule] = useState<LearningModule | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      const [{ data: { user } }, seriesData, moduleData] = await Promise.all([
        supabase.auth.getUser(),
        fetchSeries(seriesKey),
        fetchModule(seriesKey, moduleKey),
      ]);
      setSeries(seriesData);
      setModule(moduleData);
      setUserId(user?.id ?? null);
      if (user) {
        const progress = await fetchCompletedModules(user.id, seriesKey);
        setCompleted(Boolean(progress[seriesKey]?.has(moduleKey)));
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [seriesKey, moduleKey]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleMarkComplete() {
    if (!userId) return;
    setSaving(true);
    setSaveFailed(false);
    try {
      await markModuleComplete(userId, seriesKey, moduleKey);
      setCompleted(true);
      trackEvent(AnalyticsEvents.LEARNING_MODULE_COMPLETED, { series_key: seriesKey, module_key: moduleKey });
    } catch (error) {
      console.error('Error saving progress:', error);
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>
      </SafeAreaView>
    );
  }

  if (!module?.content) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>{failed ? 'Could not load this lesson' : 'Lesson not found'}</Text>
          {failed ? <Button mode="contained" style={styles.cta} onPress={load}>Try again</Button> : null}
          <Button textColor={colors.gold} onPress={() => router.back()}>Go back</Button>
        </View>
      </SafeAreaView>
    );
  }

  const modules = series?.modules || [];
  const position = modules.findIndex((m) => m.module_key === moduleKey);
  const nextModule = position >= 0 ? modules[position + 1] : undefined;
  const banner = (series?.sort_order ?? 0) % 2 === 0 ? wideBanner : cinematicBanner;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <ImageBackground source={banner} style={styles.heroImage} imageStyle={styles.heroImageInner}>
            <View style={styles.heroOverlay}>
              <Text style={styles.kicker}>
                {series?.title}{position >= 0 ? ` · Lesson ${position + 1} of ${modules.length}` : ''}
              </Text>
              <Text style={styles.heroTitle}>{module.title}</Text>
              <Text style={styles.heroDescription}>{module.description || module.summary}</Text>
              <View style={styles.metaRow}>
                <Chip style={styles.goldChip} textStyle={styles.goldChipText}>{module.duration}</Chip>
                {module.frameworks.map((framework) => (
                  <Chip key={framework} style={styles.roseChip} textStyle={styles.roseChipText}>{framework}</Chip>
                ))}
              </View>
            </View>
          </ImageBackground>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Introduction</Text>
            <Text style={styles.body}>{module.content.introduction}</Text>
          </Card.Content>
        </Card>

        {module.content.sections.map((section, index) => (
          <Card key={index} style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.body}>{section.body}</Text>
              {section.research ? (
                <>
                  <Divider style={styles.divider} />
                  <Text style={styles.badgeLabel}>Research</Text>
                  <Text style={styles.researchText}>{section.research.text}</Text>
                  <Text style={styles.sourceText}>{section.research.source} · {section.research.year}</Text>
                </>
              ) : null}
              {section.example ? (
                <>
                  <Divider style={styles.divider} />
                  <Text style={styles.badgeLabel}>Example</Text>
                  <Text style={styles.researchText}>{section.example.scenario}</Text>
                  {section.example.dialogue ? <Text style={styles.dialogue}>{section.example.dialogue}</Text> : null}
                  {section.example.analysis ? <Text style={styles.researchText}>{section.example.analysis}</Text> : null}
                </>
              ) : null}
              {section.tip ? (
                <>
                  <Divider style={styles.divider} />
                  <Text style={styles.badgeLabel}>{section.tip.title}</Text>
                  {section.tip.steps.map((step) => (
                    <Text key={step} style={styles.step}>• {step}</Text>
                  ))}
                </>
              ) : null}
            </Card.Content>
          </Card>
        ))}

        {module.content.conclusion ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.body}>{module.content.conclusion}</Text>
            </Card.Content>
          </Card>
        ) : null}

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Key Takeaways</Text>
            {module.key_takeaways.map((item) => (
              <Text key={item} style={styles.step}>• {item}</Text>
            ))}
          </Card.Content>
        </Card>

        {module.exercises.map((exercise) => (
          <Card key={exercise.title} style={styles.card}>
            <Card.Content>
              <Text style={styles.badgeLabel}>Try it together</Text>
              <Text style={styles.sectionTitle}>{exercise.title}</Text>
              {exercise.description ? <Text style={styles.body}>{exercise.description}</Text> : null}
              {exercise.duration ? <Text style={styles.sourceText}>{exercise.duration}</Text> : null}
              {exercise.instructions.map((step) => (
                <Text key={step} style={styles.step}>• {step}</Text>
              ))}
            </Card.Content>
          </Card>
        ))}

        {module.reflection ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Reflection</Text>
              <Text style={styles.body}>{module.reflection.question}</Text>
              {module.reflection.followUp ? <Text style={styles.researchText}>{module.reflection.followUp}</Text> : null}
            </Card.Content>
          </Card>
        ) : null}

        <Card style={styles.card}>
          <Card.Content>
            {completed ? (
              <Text style={styles.completedText}>✓ Lesson completed</Text>
            ) : (
              <Button
                mode="contained"
                style={styles.cta}
                contentStyle={styles.ctaContent}
                loading={saving}
                disabled={saving || !userId}
                onPress={handleMarkComplete}
              >
                Mark lesson complete
              </Button>
            )}
            {saveFailed ? <Text style={styles.errorText}>Could not save your progress. Please try again.</Text> : null}
            {nextModule ? (
              <Button
                mode="outlined"
                style={styles.secondaryButton}
                textColor={colors.gold}
                onPress={() => router.replace({ pathname: '/learning/[seriesKey]/[moduleKey]', params: { seriesKey, moduleKey: nextModule.module_key } })}
              >
                Next: {nextModule.title}
              </Button>
            ) : null}
            <Button
              textColor={colors.gold}
              style={styles.secondaryButton}
              onPress={() => router.replace({ pathname: '/learning/[seriesKey]', params: { seriesKey } })}
            >
              All lessons in this series
            </Button>
          </Card.Content>
        </Card>
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
  },
  heroCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#121B17',
    ...shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 147, 60, 0.18)',
  },
  heroImage: {
    minHeight: 220,
    justifyContent: 'flex-end',
  },
  heroImageInner: {
    borderRadius: borderRadius.xl,
  },
  heroOverlay: {
    padding: spacing.lg,
    backgroundColor: 'rgba(10, 14, 12, 0.76)',
  },
  kicker: {
    fontSize: typography.caption.fontSize,
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontSize: typography.h1.fontSize,
    fontWeight: '800',
    color: '#F8F1E6',
    marginBottom: spacing.sm,
  },
  heroDescription: {
    fontSize: typography.body.fontSize,
    color: '#D8C7B6',
    lineHeight: typography.body.lineHeight,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  goldChip: {
    backgroundColor: 'rgba(201, 147, 60, 0.14)',
  },
  roseChip: {
    backgroundColor: 'rgba(194, 96, 122, 0.15)',
  },
  goldChipText: {
    color: colors.gold,
    fontWeight: '700',
  },
  roseChipText: {
    color: colors.accent,
    fontWeight: '700',
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.md,
    backgroundColor: '#151D19',
    borderWidth: 1,
    borderColor: 'rgba(201, 147, 60, 0.12)',
  },
  sectionTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: '#F7EAD7',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: typography.body.fontSize,
    color: '#E8DACC',
    lineHeight: typography.body.lineHeight,
  },
  badgeLabel: {
    marginTop: spacing.sm,
    fontSize: typography.caption.fontSize,
    textTransform: 'uppercase',
    color: colors.gold,
    fontWeight: '700',
  },
  researchText: {
    marginTop: spacing.xs,
    fontSize: typography.bodySmall.fontSize,
    color: '#D3C5B5',
    lineHeight: typography.body.lineHeight,
  },
  sourceText: {
    marginTop: spacing.xs,
    fontSize: typography.caption.fontSize,
    color: '#B59F88',
  },
  dialogue: {
    marginTop: spacing.sm,
    fontSize: typography.bodySmall.fontSize,
    color: colors.blush,
    fontStyle: 'italic',
    lineHeight: typography.body.lineHeight,
  },
  divider: {
    marginVertical: spacing.sm,
    backgroundColor: 'rgba(201, 147, 60, 0.14)',
  },
  step: {
    marginTop: spacing.xs,
    fontSize: typography.body.fontSize,
    color: '#E8DACC',
    lineHeight: typography.body.lineHeight,
  },
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.gold,
  },
  ctaContent: {
    paddingVertical: 6,
  },
  seriesBadge: {
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  completedText: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: colors.gold,
    textAlign: 'center',
  },
  errorText: {
    marginTop: spacing.sm,
    fontSize: typography.bodySmall.fontSize,
    color: colors.blush,
  },
  secondaryButton: {
    marginTop: spacing.sm,
    borderColor: 'rgba(201, 147, 60, 0.4)',
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: '800',
    color: '#F8F1E6',
    marginBottom: spacing.sm,
  },
});
