// ScaleButton - Refined touch feedback component
// Built following: animation-patterns, polish, mobile-design, ui-ux-patterns
// Purposeful press feedback with accessibility

import { StyleProp, ViewStyle, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { MotiView } from 'moti';
import { useState } from 'react';
import { colors, spacing, borderRadius, shadows, motion, easing, touchTargets } from '../../constants/theme';

interface ScaleButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  testID?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  accessibilityLabel?: string;
}

const sizeStyles = {
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: touchTargets.minimum },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: touchTargets.recommended },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, minHeight: touchTargets.comfortable },
};

const variantStyles = {
  primary: {
    backgroundColor: colors.accent,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.error,
    borderWidth: 0,
    borderColor: 'transparent',
  },
};

export default function ScaleButton({
  children,
  onPress,
  style,
  disabled = false,
  testID,
  variant = 'primary',
  size = 'md',
  loading = false,
  accessibilityLabel,
}: ScaleButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onLongPress={() => {}}
      activeOpacity={1}
      disabled={disabled || loading}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      <MotiView
        animate={{
          scale: pressed ? 0.97 : disabled ? 0.95 : 1,
          opacity: disabled ? 0.5 : 1,
        }}
        transition={{
          type: 'timing',
          duration: motion.fast,
          easing: easing.easeOut,
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
          <ActivityIndicator
            color={variant === 'primary' ? colors.white : colors.accent}
            size="small"
          />
        ) : (
          children
        )}
      </MotiView>
    </TouchableOpacity>
  );
}

// Bounce animation wrapper for success states - subtle, not bouncy
interface BounceInProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  trigger?: boolean;
}

export function BounceIn({ children, style, trigger = true }: BounceInProps) {
  return (
    <MotiView
      from={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: trigger ? 1 : 0.8, opacity: trigger ? 1 : 0 }}
      transition={{
        type: 'spring',
        damping: 14,
        stiffness: 180,
      }}
      style={style}
    >
      {children}
    </MotiView>
  );
}

// Pulse animation for loading/attention states - subtle, not distracting
interface PulseViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  duration?: number;
}

export function PulseView({ children, style, duration = 1200 }: PulseViewProps) {
  return (
    <MotiView
      from={{ scale: 1, opacity: 0.7 }}
      animate={{ scale: [1, 1.03, 1], opacity: [0.7, 1, 0.7] }}
      transition={{
        type: 'timing',
        duration,
        loop: true,
        repeatReverse: true,
      }}
      style={style}
    >
      {children}
    </MotiView>
  );
}

// Shimmer effect for skeleton loaders - smooth, not harsh
interface ShimmerViewProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function ShimmerView({ width, height, borderRadius = borderRadius.sm, style }: ShimmerViewProps) {
  return (
    <MotiView
      from={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{
        type: 'timing',
        duration: 1400,
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

// Slide up modal - smooth entrance
interface SlideUpModalProps {
  children: React.ReactNode;
  visible: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SlideUpModal({ children, visible, style }: SlideUpModalProps) {
  return (
    <MotiView
      from={{ translateY: visible ? 400 : 0, opacity: visible ? 1 : 0 }}
      animate={{ translateY: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        damping: 18,
        stiffness: 140,
      }}
      style={[{ position: 'absolute', bottom: 0, left: 0, right: 0 }, style]}
    >
      {children}
    </MotiView>
  );
}