// Shared config for the four AI analyzers and the view of one analysis result.

import { StyleSheet, Text, View } from 'react-native';
import { Card, ProgressBar } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows, typography } from '../../constants/theme';

export type AnalyzerKind = 'communication' | 'text' | 'argument' | 'emotional';

export const ANALYZERS: Record<AnalyzerKind, {
  title: string;
  icon: string;
  table: string;
  description: string;
  days: number;
}> = {
  communication: {
    title: 'Communication',
    icon: '💬',
    table: 'communication_analyses',
    description: 'How you take turns, listen, and respond to each other.',
    days: 14,
  },
  text: {
    title: 'Text Tone',
    icon: '📱',
    table: 'text_analyses',
    description: 'The tone, warmth and clarity of your written messages.',
    days: 30,
  },
  argument: {
    title: 'Argument',
    icon: '⚡',
    table: 'argument_analyses',
    description: 'How a disagreement escalated or calmed, and where repair could land.',
    days: 7,
  },
  emotional: {
    title: 'Emotional Patterns',
    icon: '💭',
    table: 'emotional_pattern_analyses',
    description: 'Recurring emotional themes over time and how things are moving.',
    days: 90,
  },
};

function List({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      {items.map((item) => <Text key={item} style={styles.bullet}>• {item}</Text>)}
    </View>
  );
}

function Meter({ label, value }: { label: string; value?: number | null }) {
  if (value === null || value === undefined) return null;
  return (
    <View style={styles.meter}>
      <View style={styles.meterHeader}>
        <Text style={styles.meterLabel}>{label}</Text>
        <Text style={styles.meterValue}>{value}</Text>
      </View>
      <ProgressBar progress={value / 100} color={colors.accent} style={styles.bar} />
    </View>
  );
}

export default function AnalyzerResult({ kind, result }: { kind: AnalyzerKind; result: any }) {
  if (!result) return null;
  return (
    <Card style={styles.card}>
      <Card.Content>
        {result.safety_note ? (
          <View style={styles.safety}>
            <Text style={styles.body}>{result.safety_note}</Text>
          </View>
        ) : null}
        <Meter label="Overall" value={result.overall_score} />
        {kind === 'communication' ? (
          <>
            <Meter label="Listening" value={result.listening_score} />
            <Meter label="Engagement" value={result.engagement_score} />
            {result.sentiment ? <Text style={styles.chipText}>Overall feel: {result.sentiment}</Text> : null}
          </>
        ) : null}
        {kind === 'text' ? (
          <>
            <Meter label="Emotional depth" value={result.emotional_depth_score} />
            <Meter label="Clarity" value={result.clarity_score} />
            <Meter label="Tone variety" value={result.tone_variety_score} />
            {result.dominant_tones?.length ? <Text style={styles.chipText}>Tones: {result.dominant_tones.join(', ')}</Text> : null}
          </>
        ) : null}
        {kind === 'argument' && result.primary_concern ? (
          <Text style={styles.chipText}>Underlying need: {result.primary_concern}</Text>
        ) : null}

        <Text style={[styles.body, styles.block]}>{result.summary}</Text>
        {result.strength_affirmation ? (
          <View style={styles.affirmation}>
            <Text style={styles.affirmationText}>{result.strength_affirmation}</Text>
          </View>
        ) : null}
        <List label="What went well" items={result.strengths} />
        {result.patterns?.length ? (
          <View style={styles.block}>
            <Text style={styles.label}>Patterns</Text>
            {result.patterns.map((p) => (
              <Text key={p.pattern} style={styles.bullet}>• <Text style={styles.bold}>{p.pattern}.</Text> {p.detail}</Text>
            ))}
          </View>
        ) : null}
        <List label="Where things escalated" items={result.escalation_patterns} />
        <List label="Chances to repair" items={result.repair_opportunities} />
        <List label="Emotional themes" items={result.emotional_trends} />
        {result.growth_trajectory ? <Text style={[styles.body, styles.block]}>{result.growth_trajectory}</Text> : null}
        <List label="Try together" items={result.recommendations} />
        <List label="Words you could try" items={result.try_saying} />
        <Text style={styles.disclaimer}>Written by AI. It describes patterns between you, not who is right.</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.white, ...shadows.sm },
  block: { marginTop: spacing.md },
  label: { fontSize: typography.caption.fontSize, fontWeight: '700', color: colors.gray, textTransform: 'uppercase', marginBottom: spacing.xs },
  body: { fontSize: typography.body.fontSize, color: colors.black, lineHeight: typography.body.lineHeight },
  bullet: { fontSize: typography.body.fontSize, color: colors.black, lineHeight: typography.body.lineHeight, marginTop: 2 },
  bold: { fontWeight: '700' },
  meter: { marginBottom: spacing.sm },
  meterHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  meterLabel: { fontSize: typography.bodySmall.fontSize, color: colors.gray },
  meterValue: { fontSize: typography.bodySmall.fontSize, fontWeight: '700', color: colors.primary },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.lightGray },
  chipText: { fontSize: typography.bodySmall.fontSize, color: colors.primary, marginTop: spacing.xs },
  affirmation: { marginTop: spacing.md, padding: spacing.md, borderRadius: borderRadius.sm, backgroundColor: colors.successLight },
  affirmationText: { fontSize: typography.body.fontSize, color: colors.teal, fontWeight: '600' },
  safety: { marginBottom: spacing.md, padding: spacing.md, borderRadius: borderRadius.sm, backgroundColor: colors.warningLight },
  disclaimer: { marginTop: spacing.md, fontSize: typography.caption.fontSize, color: colors.gray },
});
