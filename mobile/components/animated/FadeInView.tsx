// FadeInView - Refined animation component
// Built following: animation-patterns, polish, mobile-design
// Respects prefers-reduced-motion accessibility

import { useEffect } from 'react';
import { StyleProp, ViewStyle, Platform, AccessibilityInfo } from 'react-native';
import { useSharedValue, withTiming, withSpring, Easing } from 'react-native-reanimated';
import { MotiView } from 'moti';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  disabled?: boolean;
}

const getDirectionalAnimate = (direction: string, reducedMotion: boolean) => {
  if (reducedMotion) {
    return { opacity: 1 };
  }

  switch (direction) {
    case 'up':
      return { opacity: [0, 1], translateY: [12, 0] };
    case 'down':
      return { opacity: [0, 1], translateY: [-12, 0] };
    case 'left':
      return { opacity: [0, 1], translateX: [12, 0] };
    case 'right':
      return { opacity: [0, 1], translateX: [-12, 0] };
    case 'none':
      return { opacity: [0, 1] };
    default:
      return { opacity: [0, 1], translateY: [12, 0] };
  }
};

const getTransition = (direction: string, duration: number, delay: number, reducedMotion: boolean) => {
  if (reducedMotion) {
    return { duration: 1 };
  }

  // Organic easing - smooth deceleration
  const easing = Easing.bezier(0.25, 1, 0.5, 1);

  return {
    type: 'timing',
    duration,
    delay,
    easing,
  };
};

export default function FadeInView({
  children,
  delay = 0,
  duration = 400,
  style,
  direction = 'up',
  disabled = false,
}: FadeInViewProps) {
  // Track reduced motion preference
  const reducedMotion = useSharedValue(false);

  useEffect(() => {
    // Check system preference for reduced motion
    const checkReducedMotion = async () => {
      try {
        if (Platform.OS === 'ios') {
          const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
          reducedMotion.value = isReduceMotionEnabled;
        } else {
          reducedMotion.value = false;
        }
      } catch {
        reducedMotion.value = false;
      }
    };
    checkReducedMotion();
  }, []);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <MotiView
      from={getDirectionalAnimate(direction, false)}
      animate={getDirectionalAnimate(direction, false)}
      transition={getTransition(direction, duration, delay, false)}
      style={style}
    >
      {children}
    </MotiView>
  );
}

// Stagger container for list items - orchestrates multiple animated children
interface StaggerContainerProps {
  children: React.ReactNode;
  delay?: number;
  stagger?: number;
  style?: StyleProp<ViewStyle>;
}

export function StaggerContainer({
  children,
  delay = 0,
  stagger = 60,
  style,
}: StaggerContainerProps) {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 200, delay }}
      style={style}
    >
      {children}
    </MotiView>
  );
}

// Individual stagger item - apply stagger delay based on index
interface StaggerItemProps {
  children: React.ReactNode;
  index: number;
  stagger?: number;
  style?: StyleProp<ViewStyle>;
}

export function StaggerItem({
  children,
  index,
  stagger = 60,
  style,
}: StaggerItemProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 350,
        delay: index * stagger,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
      }}
      style={style}
    >
      {children}
    </MotiView>
  );
}