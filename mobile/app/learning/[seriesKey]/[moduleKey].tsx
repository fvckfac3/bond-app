import { useMemo } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Button, Divider, Chip } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows, typography } from '../../../../constants/theme';
import { learningSeriesBannerMap, learningSeriesIndex, learningSeriesCatalog } from '../../../../content/series';

export default function LearningModuleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ seriesKey: string; moduleKey: string }>();
  const seriesKey = params.seriesKey || 'connection-series';
  const moduleKey = params.moduleKey || '';

  const series = learningSeriesIndex[seriesKey] || learningSeriesIndex['connection-series'];
  const module = useMemo(() => series.find((item) => item.id === moduleKey) || series[0], [series, moduleKey]);
  const seriesMeta = learningSeriesCatalog.find((item) => item.key === seriesKey) || learningSeriesCatalog[0];
  const banner = learningSeriesBannerMap[seriesKey] || learningSeriesBannerMap['connection-series'];

  const heroSource = banner ? { uri: banner } : undefined;

  if (!module) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Lesson not found</Text>
          <Button mode="contained" onPress={() => router.back()}>Go back</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <ImageBackground
            source={heroSource}
            style={styles.heroImage}
            imageStyle={styles.heroImageInner}
          >
            <View style={styles.heroOverlay}>
              <Text style={styles.kicker}>{seriesMeta.title}</Text>
              <Text style={styles.heroTitle}>{module.title}</Text>
              <Text style={styles.heroDescription}>{module.description}</Text>
              <View style={styles.metaRow}>
                <Chip style={styles.goldChip} textStyle={styles.goldChipText}>{module.duration}</Chip>
                <Chip style={styles.roseChip} textStyle={styles.roseChipText}>{seriesMeta.key.replace(/-/g, ' ')}</Chip>
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

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Key Takeaways</Text>
            {module.keyTakeaways.map((item) => (
              <Text key={item} style={styles.step}>• {item}</Text>
            ))}
          </Card.Content>
        </Card>

        {module.exercises?.map((exercise) => (
          <Card key={exercise.title} style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{exercise.title}</Text>
              <Text style={styles.body}>{exercise.description}</Text>
              <Text style={styles.sourceText}>{exercise.duration}</Text>
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
              <Text style={styles.researchText}>{module.reflection.followUp}</Text>
            </Card.Content>
          </Card>
        ) : null}

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            <Text style={styles.body}>Return to the series hub to keep moving through the lessons at your own pace.</Text>
            <Button mode="contained" style={styles.cta} contentStyle={styles.ctaContent} onPress={() => router.push('/(tabs)/activities')}>
              Back to Series Hub
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
});
