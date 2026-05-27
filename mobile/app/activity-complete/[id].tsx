import { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert } from 'react-native';
import { Card, Button, TextInput, Switch, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import { colors, spacing } from '../../constants/theme';

export default function ActivityCompleteScreen() {
  const { id, title, type, content } = useLocalSearchParams();
  const router = useRouter();
  const [response, setResponse] = useState('');
  const [shareWithPartner, setShareWithPartner] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Parse content if it's a string
  const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;

  async function handleComplete() {
    if (!response.trim() && type !== 'challenge') {
      Alert.alert('Response Required', 'Please share your thoughts before completing.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get couple unit
      const { data: coupleData } = await supabase
        .from('couple_units')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'active')
        .single();

      // Save activity completion
      await supabase
        .from('activity_completions')
        .insert([{
          activity_id: id,
          user_id: user.id,
          couple_unit_id: coupleData?.id || null,
          response: {
            text: response.trim(),
            completedAt: new Date().toISOString(),
          },
          shared_with_partner: shareWithPartner,
        }]);

      Alert.alert(
        'Complete! ✨',
        shareWithPartner 
          ? 'Your response has been shared with your partner.'
          : 'Activity completed! You can share it later if you want.',
        [{
          text: 'Done',
          onPress: () => router.back()
        }]
      );
    } catch (error) {
      console.error('Error completing activity:', error);
      Alert.alert('Error', 'Failed to save your response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.type}>{type?.replace('_', ' ')}</Text>
        </View>

        {/* Activity Prompt/Instructions */}
        {parsedContent?.prompt && (
          <Card style={styles.card}>
            <Card.Content}>
              <Text style={styles.promptLabel}>Prompt:</Text>
              <Text style={styles.promptText}>{parsedContent.prompt}</Text>
            </Card.Content>
          </Card>
        )}

        {parsedContent?.instructions && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.promptLabel}>Instructions:</Text>
              <Text style={styles.promptText}>{parsedContent.instructions}</Text>
            </Card.Content>
          </Card>
        )}

        {parsedContent?.prompts && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.promptLabel}>Reflection Questions:</Text>
              {parsedContent.prompts.map((prompt, index) => (
                <Text key={index} style={styles.bulletPoint}>
                  {index + 1}. {prompt}
                </Text>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Response Input */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Your Response</Text>
            <TextInput
              label={type === 'journal' ? "Your reflection..." : "Share your thoughts..."}
              value={response}
              onChangeText={setResponse}
              mode="outlined"
              multiline
              numberOfLines={8}
              style={styles.textArea}
              placeholder={
                type === 'journal' 
                  ? "Take your time to reflect on these questions..."
                  : type === 'conversation_starter'
                  ? "What did you discuss? How did it go?"
                  : type === 'challenge'
                  ? "How was the experience?"
                  : "Share your insights..."
              }
              data-testid="activity-response-input"
            />
            <Text style={styles.hint}>
              {response.length}/1000 characters
            </Text>
          </Card.Content>
        </Card>

        {/* Share with Partner Toggle */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.shareContainer}>
              <View style={styles.shareText}>
                <Text style={styles.shareLabel}>Share with Partner</Text>
                <Text style={styles.shareHint}>
                  {shareWithPartner 
                    ? "Your partner will see your response"
                    : "Keep this private for now"
                  }
                </Text>
              </View>
              <Switch
                value={shareWithPartner}
                onValueChange={setShareWithPartner}
                color={colors.accent}
                data-testid="share-toggle"
              />
            </View>
          </Card.Content>
        </Card>

        {/* Complete Button */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleComplete}
            loading={submitting}
            disabled={submitting}
            style={styles.completeButton}
            labelStyle={styles.buttonLabel}
            data-testid="complete-activity-btn"
          >
            Complete Activity
          </Button>
          <Button
            mode="text"
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
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
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: spacing.xs,
  },
});
