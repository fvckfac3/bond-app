import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert } from 'react-native';
import { TextInput, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';
import { Button, Card, Chip, GradientCard } from '../../components/ui/ui-components';

function parseContent(content) {
  if (typeof content !== 'string') return content;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export default function ActivityCompleteScreen() {
  const { id, title, type, content } = useLocalSearchParams();
  const router = useRouter();
  const [response, setResponse] = useState('');
  const [shareWithPartner, setShareWithPartner] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(null);

  const parsedContent = parseContent(content);
  const typeLabel = typeof type === 'string' ? type.replace('_', ' ') : '';

  // The same route is reused when jumping to the next activity — start fresh.
  useEffect(() => {
    setResponse('');
    setShareWithPartner(true);
    setCompleted(null);
  }, [id]);

  async function handleComplete() {
    if (!response.trim() && type !== 'challenge') {
      Alert.alert('Response Required', 'Please share your thoughts before completing.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: coupleData } = await supabase
        .from('couple_units')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'active')
        .maybeSingle();

      const { error } = await supabase.from('activity_completions').insert([{
        activity_id: id,
        user_id: user.id,
        couple_unit_id: coupleData?.id || null,
        response: {
          text: response.trim(),
          completedAt: new Date().toISOString(),
        },
        shared_with_partner: shareWithPartner,
      }]);
      if (error) throw error;

      setCompleted({
        shared: shareWithPartner,
        excerpt: response.trim(),
        ...(await loadNextActivity(user.id)),
      });
    } catch (error) {
      console.error('Error completing activity:', error);
      Alert.alert('Error', 'Failed to save your response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function loadNextActivity(userId) {
    try {
      const [{ data: done }, { data: all }] = await Promise.all([
        supabase.from('activity_completions').select('activity_id').eq('user_id', userId),
        supabase.from('activities').select('*').order('created_at', { ascending: false }),
      ]);
      const doneIds = new Set([...(done || []).map((d) => d.activity_id), id]);
      return {
        totalCompleted: new Set((done || []).map((d) => d.activity_id)).size,
        nextActivity: (all || []).find((a) => !doneIds.has(a.id)) || null,
      };
    } catch (error) {
      console.error('Error loading next activity:', error);
      return { totalCompleted: null, nextActivity: null };
    }
  }

  function openNextActivity(next) {
    router.replace({
      pathname: '/activity-complete/[id]',
      params: {
        id: next.id,
        title: next.title,
        type: next.type,
        content: JSON.stringify(next.content),
      },
    });
  }

  if (completed) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.summaryContent}>
          <GradientCard style={styles.summaryHero}>
            <View style={styles.summaryHeroInner}>
              <View style={styles.badge} accessibilityLabel="Activity completed">
                <Text style={styles.badgeIcon}>✓</Text>
              </View>
              <Text style={styles.summaryHeading}>Activity complete</Text>
              <Text style={styles.summaryTitle}>{title}</Text>
              <View style={styles.summaryChips}>
                <Chip>{typeLabel}</Chip>
                <Chip color={colors.teal}>{completed.shared ? 'Shared with partner' : 'Private'}</Chip>
              </View>
              {completed.totalCompleted != null && (
                <Text style={styles.summaryCount}>
                  {completed.totalCompleted} {completed.totalCompleted === 1 ? 'activity' : 'activities'} completed so far
                </Text>
              )}
            </View>
          </GradientCard>

          {!!completed.excerpt && (
            <Card style={styles.card} animated={false}>
              <Text style={styles.promptLabel}>Your response</Text>
              <Text style={styles.promptText} numberOfLines={6}>{completed.excerpt}</Text>
            </Card>
          )}

          <View style={styles.buttonContainer}>
            {completed.nextActivity ? (
              <>
                <Card style={styles.card} animated={false}>
                  <Text style={styles.promptLabel}>Up next</Text>
                  <Text style={styles.nextTitle}>{completed.nextActivity.title}</Text>
                  {!!completed.nextActivity.description && (
                    <Text style={styles.promptText} numberOfLines={3}>
                      {completed.nextActivity.description}
                    </Text>
                  )}
                </Card>
                <Button onPress={() => openNextActivity(completed.nextActivity)} style={styles.completeButton}>
                  Start next activity
                </Button>
                <Button variant="ghost" onPress={() => router.replace('/(tabs)/activities')}>
                  Back to activities
                </Button>
              </>
            ) : (
              <>
                <Text style={styles.allDone}>
                  You’ve completed every activity in the library for now. Check back soon for more.
                </Text>
                <Button onPress={() => router.replace('/(tabs)/activities')} style={styles.completeButton}>
                  Back to activities
                </Button>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.type}>{typeLabel}</Text>
        </View>

        {parsedContent?.prompt && (
          <Card style={styles.card} animated={false}>
            <Text style={styles.promptLabel}>Prompt:</Text>
            <Text style={styles.promptText}>{parsedContent.prompt}</Text>
          </Card>
        )}

        {parsedContent?.instructions && (
          <Card style={styles.card} animated={false}>
            <Text style={styles.promptLabel}>Instructions:</Text>
            {[].concat(parsedContent.instructions).map((line, index) => (
              <Text key={index} style={styles.promptText}>• {line}</Text>
            ))}
          </Card>
        )}

        {parsedContent?.prompts && (
          <Card style={styles.card} animated={false}>
            <Text style={styles.promptLabel}>Reflection Questions:</Text>
            {parsedContent.prompts.map((prompt, index) => (
              <Text key={index} style={styles.bulletPoint}>
                {index + 1}. {prompt}
              </Text>
            ))}
          </Card>
        )}

        <Card style={styles.card} animated={false}>
          <Text style={styles.sectionTitle}>Your Response</Text>
          <TextInput
            label={type === 'journal' ? 'Your reflection...' : 'Share your thoughts...'}
            value={response}
            onChangeText={setResponse}
            mode="outlined"
            multiline
            numberOfLines={8}
            maxLength={1000}
            style={styles.textArea}
            placeholder={
              type === 'journal'
                ? 'Take your time to reflect on these questions...'
                : type === 'conversation_starter'
                ? 'What did you discuss? How did it go?'
                : type === 'challenge'
                ? 'How was the experience?'
                : 'Share your insights...'
            }
            data-testid="activity-response-input"
          />
          <Text style={styles.hint}>{response.length}/1000 characters</Text>
        </Card>

        <Card style={styles.card} animated={false}>
          <View style={styles.shareContainer}>
            <View style={styles.shareText}>
              <Text style={styles.shareLabel}>Share with Partner</Text>
              <Text style={styles.shareHint}>
                {shareWithPartner ? 'Your partner will see your response' : 'Keep this private for now'}
              </Text>
            </View>
            <Switch
              value={shareWithPartner}
              onValueChange={setShareWithPartner}
              color={colors.accent}
              data-testid="share-toggle"
            />
          </View>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            onPress={handleComplete}
            loading={submitting}
            disabled={submitting}
            style={styles.completeButton}
            accessibilityLabel="Complete activity"
          >
            Complete Activity
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            Cancel
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.blush,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  type: {
    fontSize: 14,
    color: colors.gray,
    textTransform: 'capitalize',
  },
  card: {
    margin: spacing.md,
    borderRadius: 16,
    elevation: 2,
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.teal,
    marginBottom: spacing.sm,
  },
  promptText: {
    fontSize: 16,
    color: colors.black,
    lineHeight: 24,
  },
  bulletPoint: {
    fontSize: 15,
    color: colors.black,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  textArea: {
    backgroundColor: colors.white,
    minHeight: 150,
  },
  hint: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  shareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareText: {
    flex: 1,
    marginRight: spacing.md,
  },
  shareLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  shareHint: {
    fontSize: 14,
    color: colors.gray,
  },
  buttonContainer: {
    padding: spacing.lg,
  },
  completeButton: {
    marginBottom: spacing.sm,
  },
  summaryContent: {
    padding: spacing.md,
  },
  summaryHero: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  summaryHeroInner: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  badgeIcon: {
    fontSize: 36,
    color: colors.white,
    fontWeight: '700',
  },
  summaryHeading: {
    fontSize: typography.overline.fontSize,
    color: colors.teal,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  summaryTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  summaryChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  summaryCount: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.gray,
  },
  nextTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  allDone: {
    fontSize: typography.body.fontSize,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: typography.body.lineHeight,
  },
});
