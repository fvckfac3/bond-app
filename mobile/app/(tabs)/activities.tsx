// Activities Screen - Refined
// Built following: animation-patterns, polish, mobile-design, shadows, ui-ux-patterns

import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Card, Chip, Button, Portal, Modal, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../services/supabase';
import { colors, spacing, borderRadius, shadows, typography, touchTargets, motion } from '../../constants/theme';
import FadeInView from '../../components/animated/FadeInView';
import ScaleButton from '../../components/animated/ScaleButton';
import { learningSeriesCatalog } from '../../content/series';
import { useSubscription } from '../../hooks/useSubscription';
import PaywallModal from '../../components/subscription/PaywallModal';

export default function ActivitiesScreen() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [learningSeries, setLearningSeries] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedSeriesModule, setSelectedSeriesModule] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPaywall, setShowPaywall] = useState(false);


  // Get subscription status
  const { canUseFeature, packages } = useSubscription(user?.id);

  useEffect(() => {
    fetchActivities();
    fetchUser();
  }, []);

  async function fetchUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    setUser(authUser);
  }

  async function fetchActivities() {
    try {
      const [{ data: activityData, error: activityError }, { data: seriesData, error: seriesError }] = await Promise.all([
        supabase.from('activities').select('*').order('created_at', { ascending: false }),
        supabase.from('learning_series').select('*, learning_series_modules(*)').order('sort_order', { ascending: true }),
      ]);

      if (activityError) throw activityError;
      if (seriesError) throw seriesError;

      setActivities(activityData || []);
      setLearningSeries(seriesData || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter chips come from the categories the activities actually use.
  const categories = ['all', ...new Set(activities.map((a) => a.category).filter(Boolean))];

  const filteredActivities = selectedCategory === 'all'
    ? activities
    : activities.filter(a => a.category === selectedCategory);

  function getIconForType(type) {
    const icons = {
      conversation_starter: '💬',
      journal: '📔',
      challenge: '🎯',
      learning_module: '📚',
      scenario: '🎭',
    };
    return icons[type] || '📝';
  }

  const openSeriesModule = (module) => {
    router.push({
      pathname: '/learning/[seriesKey]/[moduleKey]',
      params: {
        seriesKey: module.series_key || module.seriesKey || 'relationship-foundations',
        moduleKey: module.module_key || module.moduleKey || module.id,
      },
    });
  };

  const renderLearningModule = (module, index) => (
    <FadeInView key={module.id} delay={index * motion.stagger}>
      <TouchableOpacity
        onPress={() => openSeriesModule(module)}
        activeOpacity={0.92}
      >
        <Card style={styles.seriesModuleCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.icon}>📚</Text>
              <View style={styles.headerText}>
                <Text style={styles.activityTitle}>{module.title}</Text>
                <Chip mode="outlined" style={styles.typeChip} textStyle={styles.chipText}>
                  {module.duration}
                </Chip>
              </View>
            </View>
            <Text style={styles.description}>{module.summary}</Text>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </FadeInView>
  );

  const renderSeriesCard = (series, index) => (
    <FadeInView key={series.key} delay={index * motion.stagger}>
      <Card style={styles.seriesCard}>
        <Card.Content>
          <Text style={styles.seriesBadge}>Series</Text>
          <Text style={styles.seriesTitle}>{series.title}</Text>
          <Text style={styles.seriesSummary}>{series.summary}</Text>
          <View style={styles.seriesMetaRow}>
            <Chip style={styles.goldChip} textStyle={styles.goldChipText}>{series.modules.length} lessons</Chip>
            <Chip style={styles.roseChip} textStyle={styles.roseChipText}>{series.icon}</Chip>
          </View>
          <ScaleButton onPress={() => openSeriesModule(series.modules[0])} style={styles.seriesButton}>
            <Text style={styles.seriesButtonText}>Open Series</Text>
          </ScaleButton>
        </Card.Content>
      </Card>
    </FadeInView>
  );

  const renderSeriesSection = () => (
    <View style={styles.seriesSection}>
      <Text style={styles.sectionTitle}>Learning Series</Text>
      {learningSeriesCatalog.map(renderSeriesCard)}
    </View>
  );

  const renderActivityCard = ({ item, index }) => (
    <FadeInView delay={index * motion.stagger}>
      <TouchableOpacity
        onPress={() => setSelectedActivity(item)}
        activeOpacity={0.92}
        data-testid={`activity-${item.id}`}
      >
        <Card style={styles.activityCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.icon}>{getIconForType(item.type)}</Text>
              <View style={styles.headerText}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Chip
                  mode="outlined"
                  style={styles.typeChip}
                  textStyle={styles.chipText}
                >
                  {item.type.replace('_', ' ')}
                </Chip>
              </View>
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <View style={styles.metaInfo}>
              <Text style={styles.metaText}>{item.duration}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{item.difficulty}</Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </FadeInView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <LinearGradient colors={[colors.blush, colors.white]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Activity Library</Text>
          <Text style={styles.headerSubtitle}>
            Strengthen your bond through meaningful activities
          </Text>
        </View>
      </LinearGradient>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map(cat => (
          <Chip
            key={cat}
            selected={selectedCategory === cat}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.categoryChip,
              selectedCategory === cat && styles.selectedChip,
            ]}
            textStyle={[
              styles.categoryChipText,
              selectedCategory === cat && styles.selectedChipText,
            ]}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Chip>
        ))}
      </ScrollView>

      {/* Activities List */}
      <FlatList
        data={filteredActivities}
        renderItem={renderActivityCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderSeriesSection}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>No Activities Found</Text>
            <Text style={styles.emptyText}>
              Check back soon for new activities
            </Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: spacing.xl }} />}
      />

      {/* Activity Detail Modal */}
      <Portal>
        <Modal
          visible={!!selectedActivity}
          onDismiss={() => setSelectedActivity(null)}
          contentContainerStyle={styles.modalContent}
        >
          <Card style={styles.modalCard}>
            <Card.Content>
              <Text style={styles.modalIcon}>{getIconForType(selectedActivity?.type)}</Text>
              <Text style={styles.modalTitle}>{selectedActivity?.title}</Text>
              <Text style={styles.modalDescription}>{selectedActivity?.description}</Text>

              <Divider style={styles.divider} />

              {selectedActivity?.content && (
                <View style={styles.contentSection}>
                  {selectedActivity.content.prompt && (
                    <Text style={styles.contentText}>{selectedActivity.content.prompt}</Text>
                  )}
                  {[].concat(selectedActivity.content.instructions || []).map((line, index) => (
                    <Text key={`i${index}`} style={styles.contentText}>• {line}</Text>
                  ))}
                  {selectedActivity.content.rules && (
                    <Text style={styles.contentText}>{selectedActivity.content.rules}</Text>
                  )}
                  {selectedActivity.content.followUp && (
                    <Text style={styles.contentText}>Afterwards: {selectedActivity.content.followUp}</Text>
                  )}
                </View>
              )}

              <ScaleButton
                onPress={() => {
                  const activity = selectedActivity;
                  setSelectedActivity(null);

                  if (!canUseFeature('activity')) {
                    setShowPaywall(true);
                    return;
                  }

                  router.push({
                    pathname: '/activity-complete/[id]',
                    params: {
                      id: activity.id,
                      title: activity.title,
                      type: activity.type,
                      content: JSON.stringify(activity.content),
                    }
                  });
                }}
                style={styles.startButton}
              >
                <Text style={styles.startButtonText}>Start Activity</Text>
              </ScaleButton>

              <TouchableOpacity
                onPress={() => setSelectedActivity(null)}
                style={styles.closeButton}
                accessibilityLabel="Close modal"
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* Series Module Detail Modal */}
      <Portal>
        <Modal
          visible={!!selectedSeriesModule}
          onDismiss={() => setSelectedSeriesModule(null)}
          contentContainerStyle={styles.modalContent}
        >
          <Card style={styles.modalCard}>
            <Card.Content>
              <Text style={styles.modalIcon}>📚</Text>
              <Text style={styles.modalTitle}>{selectedSeriesModule?.title}</Text>
              <Text style={styles.modalDescription}>{selectedSeriesModule?.summary}</Text>
              <Divider style={styles.divider} />
              {selectedSeriesModule?.description && (
                <Text style={styles.contentText}>{selectedSeriesModule.description}</Text>
              )}
              <Text style={styles.contentText}>{selectedSeriesModule?.title} is part of the Relationship Foundations series.</Text>
              <ScaleButton
                onPress={() => setSelectedSeriesModule(null)}
                style={styles.startButton}
              >
                <Text style={styles.startButtonText}>Close</Text>
              </ScaleButton>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        packages={packages}
        onSuccess={() => {
          setShowPaywall(false);
          router.push('/subscription/success');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1512',
  },
  header: {
    padding: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.h1.fontSize,
    fontWeight: '700',
    color: '#F7EAD7',
    marginBottom: spacing.xs,
    letterSpacing: typography.h1.letterSpacing,
  },
  headerSubtitle: {
    fontSize: typography.body.fontSize,
    color: '#D3C5B5',
    lineHeight: typography.body.lineHeight,
  },
  categoryScroll: {
    maxHeight: 52,
  },
  categoryContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  categoryChip: {
    backgroundColor: '#151D19',
    borderColor: 'rgba(201, 147, 60, 0.18)',
  },
  selectedChip: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  categoryChipText: {
    fontSize: typography.bodySmall.fontSize,
    color: '#D3C5B5',
  },
  selectedChipText: {
    color: '#0F1512',
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.md,
  },
  activityCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.md,
    backgroundColor: '#151D19',
    borderWidth: 1,
    borderColor: 'rgba(201, 147, 60, 0.12)',
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 42,
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: '#F7EAD7',
    marginBottom: spacing.xs,
  },
  typeChip: {
    alignSelf: 'flex-start',
    height: 26,
    borderColor: 'rgba(201, 147, 60, 0.18)',
    backgroundColor: 'rgba(201, 147, 60, 0.10)',
  },
  chipText: {
    fontSize: typography.caption.fontSize - 1,
    textTransform: 'capitalize',
    color: colors.gold,
  },
  description: {
    fontSize: typography.body.fontSize,
    color: '#D8C7B6',
    marginBottom: spacing.md,
    lineHeight: typography.body.lineHeight,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: typography.caption.fontSize,
    color: '#B59F88',
    textTransform: 'capitalize',
  },
  metaDot: {
    fontSize: typography.caption.fontSize,
    color: '#B59F88',
    marginHorizontal: spacing.xs,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
    color: '#F7EAD7',
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.body.fontSize,
    color: '#D3C5B5',
    textAlign: 'center',
  },
  modalContent: {
    padding: spacing.md,
  },
  modalCard: {
    maxHeight: '85%',
    borderRadius: borderRadius.md,
    ...shadows.lg,
    backgroundColor: '#151D19',
  },
  modalIcon: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    color: '#F7EAD7',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalDescription: {
    fontSize: typography.body.fontSize,
    color: '#D3C5B5',
    textAlign: 'center',
    lineHeight: typography.body.lineHeight,
    marginBottom: spacing.lg,
  },
  divider: {
    marginVertical: spacing.lg,
    backgroundColor: 'rgba(201, 147, 60, 0.12)',
  },
  contentSection: {
    marginBottom: spacing.lg,
  },
  contentText: {
    fontSize: typography.body.fontSize,
    color: '#E8DACC',
    lineHeight: typography.body.lineHeight,
    marginBottom: spacing.md,
  },
  startButton: {
    backgroundColor: colors.gold,
    marginBottom: spacing.sm,
  },
  startButtonText: {
    color: '#0F1512',
    fontWeight: '700',
    fontSize: typography.body.fontSize,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    minHeight: touchTargets.minimum,
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#D3C5B5',
    fontSize: typography.body.fontSize,
  },
  seriesSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  seriesCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.md,
    backgroundColor: '#151D19',
    borderWidth: 1,
    borderColor: 'rgba(201, 147, 60, 0.12)',
  },
  seriesBadge: {
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: typography.caption.fontSize,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  seriesTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: '#F7EAD7',
    marginBottom: spacing.xs,
  },
  seriesSummary: {
    fontSize: typography.bodySmall.fontSize,
    color: '#D3C5B5',
    lineHeight: typography.bodySmall.lineHeight,
    marginBottom: spacing.md,
  },
  seriesMetaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
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
  seriesButton: {
    backgroundColor: colors.gold,
  },
  seriesButtonText: {
    color: '#0F1512',
    fontWeight: '700',
    fontSize: typography.body.fontSize,
  },
  seriesModuleCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
    backgroundColor: '#151D19',
    borderWidth: 1,
    borderColor: 'rgba(201, 147, 60, 0.12)',
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: '#F7EAD7',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
});