// Assessment Card Component - shadcn-style with animations
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';
import { Chip } from './ui-components';

interface Assessment {
  id: string;
  name: string;
  framework: string;
  description: string;
  estimatedTime: string;
  questionsCount: number;
  icon: string;
  category: string;
}

interface AssessmentCardProps {
  assessment: Assessment;
  index: number;
  status: 'available' | 'completed' | 'locked';
  onPress: () => void;
  onViewResults?: () => void;
}

export default function AssessmentCard({
  assessment,
  index,
  status,
  onPress,
  onViewResults,
}: AssessmentCardProps) {
  const statusColors = {
    available: colors.accent,
    completed: colors.teal,
    locked: colors.gray,
  };

  const statusLabels = {
    available: 'Available',
    completed: 'Completed',
    locked: 'Locked',
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'spring',
        damping: 15,
        stiffness: 100,
        delay: index * 80,
      }}
      style={{ marginBottom: spacing.lg }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        disabled={status === 'locked'}
      >
        <View style={[styles.card, status === 'locked' && styles.lockedCard]}>
          {/* Gradient accent bar */}
          <LinearGradient
            colors={status === 'completed' ? [colors.teal, colors.teal + '80'] : [colors.blush, colors.white]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBg}
          >
            {/* Main content */}
            <View style={styles.content}>
              {/* Icon and header */}
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: status === 'completed' ? colors.teal + '20' : colors.blush }]}>
                  <Text style={styles.icon}>{assessment.icon}</Text>
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.name}>{assessment.name}</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: statusColors[status] }]} />
                    <Text style={[styles.statusText, { color: statusColors[status] }]}>
                      {statusLabels[status]}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Framework */}
              <Text style={styles.framework}>{assessment.framework}</Text>

              {/* Description */}
              <Text style={styles.description} numberOfLines={2}>
                {assessment.description}
              </Text>

              {/* Meta info */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>⏱</Text>
                  <Text style={styles.metaText}>{assessment.estimatedTime}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>📝</Text>
                  <Text style={styles.metaText}>{assessment.questionsCount} questions</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>🏷</Text>
                  <Text style={styles.metaText}>{assessment.category}</Text>
                </View>
              </View>

              {/* Results button (if completed) */}
              {status === 'completed' && onViewResults && (
                <TouchableOpacity
                  onPress={onViewResults}
                  style={styles.resultsButton}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.teal, colors.teal + 'CC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.resultsGradient}
                  >
                    <Text style={styles.resultsText}>View Insights →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Lock overlay */}
              {status === 'locked' && (
                <View style={styles.lockOverlay}>
                  <Text style={styles.lockIcon}>🔒</Text>
                  <Text style={styles.lockText}>Unlock with Premium</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  lockedCard: {
    opacity: 0.7,
  },
  gradientBg: {
    padding: spacing.lg,
  },
  content: {},
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs / 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  framework: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 14,
    color: colors.gray,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  metaText: {
    fontSize: 13,
    color: colors.gray,
    fontWeight: '500',
  },
  resultsButton: {
    marginTop: spacing.md,
  },
  resultsGradient: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  resultsText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.card,
  },
  lockIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  lockText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray,
  },
});