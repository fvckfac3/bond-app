// CheckInTopicsScreen - Refined with Design System
// Built following: animation-patterns, polish, mobile-design, shadows, ui-ux-patterns
// Clean, purposeful interaction

import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import FadeInView, { StaggerContainer, StaggerItem } from '../../../components/animated/FadeInView';
import ScaleButton from '../../../components/animated/ScaleButton';
import SkeletonLoader from '../../../components/animated/SkeletonLoader';
import { colors, spacing, borderRadius, shadows, motion, typography, touchTargets } from '../../../constants/theme';

interface CheckInTopic {
  id: string;
  title: string;
  prompts: string[];
  category: string;
}

const SAMPLE_TOPICS: CheckInTopic[] = [
  { id: 'cit001', title: 'Work & Career', prompts: ['How are you feeling about work lately?', "What's stressing you out professionally?", 'What accomplishment are you proud of?'], category: 'life' },
  { id: 'cit002', title: 'Family & Friends', prompts: ["How's your relationship with your family?", 'Any social obligations feeling overwhelming?', 'Who in your life deserves more attention from us?'], category: 'social' },
  { id: 'cit003', title: 'Finances', prompts: ["How are you feeling about our financial situation?", 'Any spending concerns?', 'What financial goal excites you most?'], category: 'practical' },
  { id: 'cit004', title: 'Health & Wellness', prompts: ["How's your physical health?", 'Any health worries on your mind?', 'What would help you feel more energized?'], category: 'wellness' },
  { id: 'cit005', title: 'Personal Growth', prompts: ['What skill are you developing?', "Any personal goals you're working toward?", "What's challenging you right now?"], category: 'growth' },
  { id: 'cit006', title: 'Intimacy & Romance', prompts: ["How's our romantic life?", 'What would make you feel more connected?', 'Any desires you\'d like to explore?'], category: 'intimacy' },
  { id: 'cit007', title: 'Communication', prompts: ['How do you feel about our conversations?', 'Is there anything unsaid between us?', 'What topic feels hardest to bring up?'], category: 'relationship' },
  { id: 'cit008', title: 'Future & Goals', prompts: ['What do you want our life to look like in 5 years?', 'Any decisions we\'re putting off?', 'What excites you most about our future?'], category: 'vision' },
];

const CATEGORY_INFO = {
  life: { icon: '💼', color: '#4A90D9' },
  social: { icon: '👥', color: '#9B59B6' },
  practical: { icon: '💰', color: '#27AE60' },
  wellness: { icon: '🌿', color: '#1ABC9C' },
  growth: { icon: '📈', color: '#E67E22' },
  intimacy: { icon: '💕', color: colors.accent },
  relationship: { icon: '💬', color: '#E74C8C' },
  vision: { icon: '🔮', color: colors.primary },
};

export default function CheckInTopicsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topics, setTopics] = useState<CheckInTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<CheckInTopic | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      // In production, fetch from API
      setTopics(SAMPLE_TOPICS);
      setHistory([]);
    } catch {
      setTopics(SAMPLE_TOPICS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  function openTopic(topic: CheckInTopic) {
    setSelectedTopic(topic);
    setResponses({});
    setCurrentPromptIndex(0);
    setShowResponseModal(true);
  }

  function nextPrompt() {
    if (selectedTopic && currentPromptIndex < selectedTopic.prompts.length - 1) {
      setCurrentPromptIndex(currentPromptIndex + 1);
    }
  }

  function prevPrompt() {
    if (currentPromptIndex > 0) {
      setCurrentPromptIndex(currentPromptIndex - 1);
    }
  }

  function submitResponses() {
    // In production, save to API
    setShowResponseModal(false);
    setSelectedTopic(null);
    setResponses({});
  }

  const currentPrompt = selectedTopic?.prompts[currentPromptIndex];
  const catInfo = selectedTopic ? (CATEGORY_INFO[selectedTopic.category as keyof typeof CATEGORY_INFO] || CATEGORY_INFO.relationship) : null;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.headerGradient}>
          <View style={styles.header}>
            <SkeletonLoader height={32} width="60%" style={{ marginBottom: spacing.sm }} />
            <SkeletonLoader height={16} width="80%" />
          </View>
        </LinearGradient>
        <View style={{ padding: spacing.md }}>
          {[1, 2, 3, 4].map(i => (
            <SkeletonLoader key={i} height={90} style={{ marginBottom: spacing.md, borderRadius: borderRadius.md }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.headerGradient}>
          <FadeInView>
            <View style={styles.header}>
              <Text style={styles.greeting}>Check-In Topics</Text>
              <Text style={styles.subgreeting}>Meaningful conversations to strengthen your bond</Text>
            </View>
          </FadeInView>
        </LinearGradient>

        <View style={styles.content}>
          {/* Info Card */}
          <FadeInView delay={60}>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>💡</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>How it works</Text>
                <Text style={styles.infoText}>
                  Choose a topic, answer prompts, then discuss with your partner
                </Text>
              </View>
            </View>
          </FadeInView>

          {/* Topics List */}
          <StaggerContainer stagger={motion.stagger}>
            {topics.map((topic, index) => {
              const info = CATEGORY_INFO[topic.category as keyof typeof CATEGORY_INFO] || CATEGORY_INFO.relationship;
              return (
                <StaggerItem key={topic.id} index={index}>
                  <ScaleButton
                    onPress={() => openTopic(topic)}
                    style={styles.topicCard}
                  >
                    <View style={[styles.topicIcon, { backgroundColor: info.color + '15' }]}>
                      <Text style={styles.topicIconText}>{info.icon}</Text>
                    </View>
                    <View style={styles.topicContent}>
                      <Text style={styles.topicTitle}>{topic.title}</Text>
                      <Text style={styles.topicMeta}>{topic.prompts.length} prompts</Text>
                    </View>
                    <Text style={styles.topicArrow}>→</Text>
                  </ScaleButton>
                </StaggerItem>
              );
            })}
          </StaggerContainer>

          {/* Recent Check-ins */}
          {history.length > 0 && (
            <FadeInView delay={300}>
              <View style={styles.historySection}>
                <Text style={styles.historyTitle}>Recent Check-ins</Text>
                {history.slice(0, 3).map((item, index) => {
                  const topic = topics.find(t => t.id === item.topic_id);
                  return (
                    <View key={index} style={styles.historyItem}>
                      <Text style={styles.historyCheck}>✓</Text>
                      <View style={styles.historyContent}>
                        <Text style={styles.historyTopic}>{topic?.title || 'Topic'}</Text>
                        <Text style={styles.historyDate}>
                          {item.responded_at ? new Date(item.responded_at).toLocaleDateString() : 'Recently'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </FadeInView>
          )}
        </View>
      </ScrollView>

      {/* Response Modal */}
      <Modal
        visible={showResponseModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowResponseModal(false)}
              style={styles.closeButton}
              accessibilityLabel="Close"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedTopic?.title}</Text>
            <View style={styles.progressDots}>
              {selectedTopic?.prompts.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    i === currentPromptIndex && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Modal Content */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <Text style={styles.promptCounter}>
              Prompt {currentPromptIndex + 1} of {selectedTopic?.prompts.length || 0}
            </Text>
            <Text style={styles.promptText}>{currentPrompt}</Text>

            <TextInput
              style={styles.responseInput}
              placeholder="Share your thoughts..."
              placeholderTextColor={colors.gray}
              value={responses[currentPromptIndex] || ''}
              onChangeText={text => setResponses({ ...responses, [currentPromptIndex]: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              accessibilityLabel="Your response"
            />
          </KeyboardAvoidingView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={prevPrompt}
              disabled={currentPromptIndex === 0}
              style={[styles.navButton, currentPromptIndex === 0 && styles.navButtonDisabled]}
              accessibilityLabel="Previous prompt"
            >
              <Text style={styles.navButtonText}>← Back</Text>
            </TouchableOpacity>

            {currentPromptIndex < (selectedTopic?.prompts.length || 0) - 1 ? (
              <TouchableOpacity
                onPress={nextPrompt}
                style={styles.nextButton}
                accessibilityLabel="Next prompt"
              >
                <Text style={styles.nextButtonText}>Next →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={submitResponses}
                style={styles.submitButton}
                accessibilityLabel="Complete check-in"
              >
                <Text style={styles.submitButtonText}>Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerGradient: { paddingBottom: spacing.lg },
  header: { padding: spacing.lg },
  greeting: {
    fontSize: typography.h1.fontSize,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
    letterSpacing: typography.h1.letterSpacing,
  },
  subgreeting: {
    fontSize: typography.body.fontSize,
    color: colors.gray,
  },
  scrollContent: { paddingBottom: spacing.xl },
  content: { padding: spacing.md },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.teal + '30',
  },
  infoIcon: { fontSize: 22, marginRight: spacing.md },
  infoContent: { flex: 1 },
  infoTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs / 2,
  },
  infoText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.gray,
    lineHeight: typography.bodySmall.lineHeight,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  topicIcon: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  topicIconText: { fontSize: 22 },
  topicContent: { flex: 1 },
  topicTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  topicMeta: {
    fontSize: typography.caption.fontSize,
    color: colors.gray,
  },
  topicArrow: { fontSize: 18, color: colors.accent },
  historySection: { marginTop: spacing.lg },
  historyTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.xs,
  },
  historyCheck: { fontSize: 14, color: colors.teal, marginRight: spacing.md },
  historyContent: { flex: 1 },
  historyTopic: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500',
    color: colors.primary,
  },
  historyDate: {
    fontSize: typography.caption.fontSize,
    color: colors.gray,
  },
  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  closeButton: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: { fontSize: 18, color: colors.gray },
  modalTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '600',
    color: colors.primary,
  },
  progressDots: { flexDirection: 'row', gap: 4 },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.lightGray,
  },
  progressDotActive: { backgroundColor: colors.accent },
  modalContent: { flex: 1, padding: spacing.lg },
  promptCounter: {
    fontSize: typography.caption.fontSize,
    color: colors.gray,
    marginBottom: spacing.sm,
  },
  promptText: {
    fontSize: typography.h2.fontSize,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.lg,
    lineHeight: typography.h2.lineHeight,
  },
  responseInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.primary,
    minHeight: 150,
    ...shadows.sm,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  navButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: touchTargets.minimum,
    minHeight: touchTargets.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: { opacity: 0.4 },
  navButtonText: { fontSize: typography.body.fontSize, color: colors.gray },
  nextButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    minHeight: touchTargets.minimum,
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: typography.body.fontSize,
    color: colors.white,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.teal,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    minHeight: touchTargets.minimum,
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: typography.body.fontSize,
    color: colors.white,
    fontWeight: '600',
  },
});