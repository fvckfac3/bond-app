// BOND App UI Components - Refined with Animation Patterns & Polish
// Built following: animation-patterns, shadows, polish, mobile-design, ui-ux-patterns

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, ActivityIndicator, Dimensions } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows, motion, easing, typography, touchTargets } from '../../constants/theme';

// ============================================================================
// BUTTON - Refined with proper touch feedback
// ============================================================================

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);

  const variantStyles = {
    primary: {
      backgroundColor: colors.accent,
      borderColor: 'transparent',
    },
    secondary: {
      backgroundColor: colors.white,
      borderColor: colors.accent,
      borderWidth: 2,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
    },
    danger: {
      backgroundColor: colors.error,
      borderColor: 'transparent',
    },
  };

  const sizeStyles = {
    sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
    lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
  };

  const textColors = {
    primary: colors.white,
    secondary: colors.accent,
    ghost: colors.accent,
    danger: colors.white,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onLongPress={() => {}} // Improves touch feel on iOS
      activeOpacity={1}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <MotiView
        from={{ scale: 1, opacity: 1 }}
        animate={{
          scale: pressed ? 0.97 : disabled ? 0.95 : 1,
          opacity: disabled ? 0.5 : 1,
        }}
        transition={{
          type: 'timing',
          duration: motion.fast,
          easing: easing.easeOutQuad,
        }}
        style={[
          styles.buttonBase,
          {
            borderRadius: borderRadius.sm,
            ...sizeStyles[size],
            ...(variantStyles[variant] as ViewStyle),
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColors[variant]} size="small" />
        ) : (
          <Text
            style={[
              styles.buttonText,
              { color: textColors[variant] },
              size === 'sm' && styles.buttonTextSmall,
              size === 'lg' && styles.buttonTextLarge,
              textStyle,
            ]}
          >
            {children}
          </Text>
        )}
      </MotiView>
    </TouchableOpacity>
  );
}

// ============================================================================
// CARD - Clean card with purposeful animation
// ============================================================================

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  onPress?: () => void;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function Card({
  children,
  style,
  delay = 0,
  onPress,
  elevation = 'md',
  animated = true,
}: CardProps) {
  const elevationStyles = {
    none: {},
    sm: shadows.sm,
    md: shadows.md,
    lg: shadows.lg,
  };

  const content = animated ? (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: motion.complex,
        delay,
        easing: easing.easeOut,
      }}
      style={[
        styles.cardBase,
        elevation !== 'none' && elevationStyles[elevation],
        style,
      ]}
    >
      {children}
    </MotiView>
  ) : (
    <View style={[styles.cardBase, elevationStyles[elevation], style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.92}
        accessibilityRole="button"
        style={{ minWidth: touchTargets.minimum, minHeight: touchTargets.minimum }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// ============================================================================
// CHIP / BADGE - Clean status indicator
// ============================================================================

interface ChipProps {
  children: React.ReactNode;
  variant?: 'filled' | 'outlined';
  color?: string;
  style?: ViewStyle;
  delay?: number;
}

export function Chip({
  children,
  variant = 'outlined',
  color = colors.accent,
  style,
  delay = 0,
}: ChipProps) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'timing',
        duration: motion.default,
        delay,
        easing: easing.easeOut,
      }}
      style={[
        styles.chipBase,
        {
          borderRadius: borderRadius.round,
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
          backgroundColor: variant === 'filled' ? color : 'transparent',
          borderWidth: 1.5,
          borderColor: color,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: variant === 'filled' ? colors.white : color },
        ]}
      >
        {children}
      </Text>
    </MotiView>
  );
}

// ============================================================================
// PROGRESS BAR - Smooth, purposeful animation
// ============================================================================

interface ProgressBarProps {
  progress: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  style?: ViewStyle;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  color = colors.accent,
  backgroundColor = colors.lightGray,
  height = 8,
  style,
  animated = true,
}: ProgressBarProps) {
  return (
    <View
      style={[
        {
          height,
          borderRadius: height / 2,
          backgroundColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <MotiView
        from={{ width: '0%' }}
        animate={{ width: `${Math.min(Math.max(progress * 100, 0), 100)}%` }}
        transition={
          animated
            ? { type: 'timing', duration: motion.smooth, easing: easing.easeOut }
            : { duration: 0 }
        }
        style={[
          {
            height: '100%',
            borderRadius: height / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

// ============================================================================
// SKELETON LOADER - Subtle, non-distracting
// ============================================================================

interface SkeletonProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height,
  borderRadius = borderRadius.sm,
  style,
}: SkeletonProps) {
  return (
    <MotiView
      from={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{
        type: 'timing',
        duration: 1200,
        loop: true,
        repeatReverse: true,
      }}
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.lightGray,
        },
        style,
      ]}
    />
  );
}

// ============================================================================
// LIST ITEM - Clean, accessible row
// ============================================================================

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: string;
  rightIcon?: string;
  onPress?: () => void;
  style?: ViewStyle;
  delay?: number;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  rightIcon = '→',
  onPress,
  style,
  delay = 0,
}: ListItemProps) {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: motion.default, delay }}
      style={styles.listItemWrapper}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
        style={[
          styles.listItemBase,
          shadows.sm,
          style,
        ]}
      >
        {leftIcon && (
          <Text style={styles.listItemIcon}>{leftIcon}</Text>
        )}
        <View style={styles.listItemContent}>
          <Text style={styles.listItemTitle} numberOfLines={1}>{title}</Text>
          {subtitle && (
            <Text style={styles.listItemSubtitle} numberOfLines={2}>{subtitle}</Text>
          )}
        </View>
        {rightIcon && (
          <Text style={styles.listItemArrow}>{rightIcon}</Text>
        )}
      </TouchableOpacity>
    </MotiView>
  );
}

// ============================================================================
// STEP INDICATOR - Clean progress dots
// ============================================================================

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  style?: ViewStyle;
}

export function StepIndicator({ currentStep, totalSteps, style }: StepIndicatorProps) {
  return (
    <View style={[styles.stepIndicatorContainer, style]}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <MotiView
          key={index}
          from={{ scale: 1, backgroundColor: colors.lightGray }}
          animate={{
            scale: index === currentStep ? 1.25 : 1,
            backgroundColor: index <= currentStep ? colors.accent : colors.lightGray,
          }}
          transition={{
            type: 'spring',
            damping: 15,
            stiffness: 200,
          }}
          style={[
            styles.stepDot,
            index === currentStep && styles.stepDotActive,
          ]}
        />
      ))}
    </View>
  );
}

// ============================================================================
// ICON BUTTON - Clean touch target
// ============================================================================

interface IconButtonProps {
  icon: string;
  onPress: () => void;
  size?: number;
  backgroundColor?: string;
  style?: ViewStyle;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function IconButton({
  icon,
  onPress,
  size = touchTargets.minimum,
  backgroundColor = colors.blush,
  style,
  disabled = false,
  accessibilityLabel,
}: IconButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={1}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <MotiView
        from={{ scale: 1 }}
        animate={{ scale: pressed ? 0.92 : 1 }}
        transition={{ type: 'timing', duration: motion.fast, easing: easing.easeOutQuad }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
      >
        <Text style={{ fontSize: size * 0.5 }}>{icon}</Text>
      </MotiView>
    </TouchableOpacity>
  );
}

// ============================================================================
// GRADIENT CARD - With purpose
// ============================================================================

interface GradientCardProps {
  children: React.ReactNode;
  gradientColors?: string[];
  style?: ViewStyle;
  delay?: number;
}

export function GradientCard({
  children,
  gradientColors = [colors.blush, colors.white],
  style,
  delay = 0,
}: GradientCardProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: motion.complex, delay, easing: easing.easeOut }}
      style={[styles.gradientCardBase, style]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
        style={styles.gradientCardInner}
      >
        {children}
      </LinearGradient>
    </MotiView>
  );
}

// ============================================================================
// EMPTY STATE - Purposeful messaging
// ============================================================================

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export function EmptyState({ icon, title, message, action, style }: EmptyStateProps) {
  return (
    <View style={[styles.emptyStateContainer, style]}>
      <Text style={styles.emptyStateIcon}>{icon}</Text>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateMessage}>{message}</Text>
      {action && (
        <TouchableOpacity onPress={action.onPress} style={styles.emptyStateAction}>
          <Text style={styles.emptyStateActionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Button
  buttonBase: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: touchTargets.minimum,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: typography.body.fontSize,
    letterSpacing: 0.2,
  },
  buttonTextSmall: {
    fontSize: typography.bodySmall.fontSize,
  },
  buttonTextLarge: {
    fontSize: typography.h4.fontSize,
  },

  // Card
  cardBase: {
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    padding: spacing.lg,
  },

  // Chip
  chipBase: {
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },

  // List Item
  listItemWrapper: {
    marginBottom: spacing.sm,
  },
  listItemBase: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    minHeight: touchTargets.minimum,
  },
  listItemIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    color: colors.black,
  },
  listItemSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.gray,
    marginTop: 2,
  },
  listItemArrow: {
    color: colors.gray,
    fontSize: 16,
    marginLeft: spacing.sm,
  },

  // Step Indicator
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  stepDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Gradient Card
  gradientCardBase: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  gradientCardInner: {
    padding: spacing.lg,
  },

  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: typography.body.fontSize,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight,
    marginBottom: spacing.lg,
  },
  emptyStateAction: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  emptyStateActionText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: typography.body.fontSize,
  },
});