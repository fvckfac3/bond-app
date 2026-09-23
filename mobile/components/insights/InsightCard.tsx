// One card for every AI insight (individual, couple, relationship summary): loading, limit,
// failure and retry states, then the content. A safety note, when present, always comes first.

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows, typography } from '../../constants/theme';
import UpgradeButton from '../subscription/UpgradeButton';
import type { InsightState } from '../../hooks/useInsight';
import type { CoupleInsight, IndividualInsight, RelationshipSummary } from '../../services/insights';

type Kind = 'individual' | 'couple' | 'summary';

interface Props {
  kind: Kind;
  title: string;
  state: InsightState<any>;
  onRetry: () => void;
  onUpgrade?: () => void;
}

function List({ label, items }: { label: string; items?: string[] | null }) {
  if (!items?.length) return null;
  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      {items.map((item) => (
        <Text key={item} style={styles.bullet}>• {item}</Text>
      ))}
    </View>
  );
}

function Paragraph({ label, text }: { label?: string; text?: string | null }) {
  if (!text) return null;
  return (
    <View style={styles.block}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}

function Content({ kind, content }: { kind: Kind; content: any }) {
  if (kind === 'individual') {
    const c = content as IndividualInsight;
    return (
      <>
        <Paragraph text={c.summary} />
        <List label="Your strengths" items={c.strengths} />
        <List label="Where you can grow" items={c.growth_edges} />
        <Paragraph label="How it connects" text={c.connections} />
        <List label="Try this week" items={c.try_this_week} />
        <Paragraph label="To reflect on" text={c.reflection_question} />
      </>
    );
  }
  if (kind === 'couple') {
    const c = content as CoupleInsight;
    return (
      <>
        <Paragraph text={c.narrative} />
        {c.strength_affirmation ? (
          <View style={styles.affirmation}>
            <Text style={styles.affirmationText}>{c.strength_affirmation}</Text>
          </View>
        ) : null}
        <List label="What works between you" items={c.shared_strengths} />
        <List label="Growing together" items={c.growth_opportunities} />
        <Paragraph label="Where you differ" text={c.how_you_differ} />
        <List label="Conversation starters" items={c.conversation_starters} />
        <List label="Try together this week" items={c.try_together} />
      </>
    );
  }
  const c = content as RelationshipSummary;
  return (
    <>
      <Paragraph text={c.overview} />
      <List label="Highlights" items={c.highlights} />
      <List label="Patterns to notice" items={c.patterns} />
      <List label="Focus for next month" items={c.focus_for_next_month} />
      {c.strength_affirmation ? (
        <View style={styles.affirmation}>
          <Text style={styles.affirmationText}>{c.strength_affirmation}</Text>
        </View>
      ) : null}
    </>
  );
}

export default function InsightCard({ kind, title, state, onRetry, onUpgrade }: Props) {
  const content = state.status === 'ready' ? state.content : null;
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.kicker}>✨ {title}</Text>

        {state.status === 'idle' || state.status === 'pending' ? (
          <View style={styles.row}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.muted}>Writing your insight… this usually takes under a minute.</Text>
          </View>
        ) : null}

        {state.status === 'limit' ? (
          <>
            <Text style={styles.body}>{state.message || 'You’ve used this month’s free AI insights.'}</Text>
            {onUpgrade ? (
              <View style={styles.action}>
                <UpgradeButton onPress={onUpgrade} text="See Premium" />
              </View>
            ) : null}
          </>
        ) : null}

        {state.status === 'not_ready' ? <Text style={styles.body}>{state.message}</Text> : null}

        {state.status === 'failed' || state.status === 'unavailable' ? (
          <>
            <Text style={styles.body}>
              {state.status === 'unavailable'
                ? 'AI insights aren’t available right now.'
                : 'We couldn’t write this insight just now.'}
            </Text>
            <Button mode="outlined" textColor={colors.accent} style={styles.action} onPress={onRetry}>
              Try again
            </Button>
          </>
        ) : null}

        {content ? (
          <>
            {content.safety_note ? (
              <View style={styles.safety}>
                <Text style={styles.safetyText}>{content.safety_note}</Text>
              </View>
            ) : null}
            {content.headline ? <Text style={styles.headline}>{content.headline}</Text> : null}
            <Content kind={kind} content={content} />
            <Text style={styles.disclaimer}>
              Written by AI from your results. It describes patterns, not diagnoses.
            </Text>
          </>
        ) : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.white, ...shadows.sm },
  kicker: { fontSize: typography.caption.fontSize, color: colors.accent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  headline: { fontSize: typography.h4.fontSize, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  block: { marginTop: spacing.sm },
  label: { fontSize: typography.caption.fontSize, fontWeight: '700', color: colors.gray, textTransform: 'uppercase', marginBottom: spacing.xs },
  body: { fontSize: typography.body.fontSize, color: colors.black, lineHeight: typography.body.lineHeight },
  bullet: { fontSize: typography.body.fontSize, color: colors.black, lineHeight: typography.body.lineHeight, marginTop: 2 },
  muted: { flex: 1, fontSize: typography.bodySmall.fontSize, color: colors.gray },
  action: { marginTop: spacing.md, alignSelf: 'flex-start' },
  affirmation: { marginTop: spacing.md, padding: spacing.md, borderRadius: borderRadius.sm, backgroundColor: colors.successLight },
  affirmationText: { fontSize: typography.body.fontSize, color: colors.teal, fontWeight: '600', lineHeight: typography.body.lineHeight },
  safety: { marginBottom: spacing.md, padding: spacing.md, borderRadius: borderRadius.sm, backgroundColor: colors.warningLight },
  safetyText: { fontSize: typography.body.fontSize, color: colors.black, lineHeight: typography.body.lineHeight },
  disclaimer: { marginTop: spacing.md, fontSize: typography.caption.fontSize, color: colors.gray },
});
