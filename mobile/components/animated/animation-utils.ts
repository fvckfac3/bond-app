// Animation Utilities - Refined
// Built following: animation-patterns, polish, mobile-design
// Purposeful motion only - no decorative bounce/elastic easing

import { Easing } from 'react-native-reanimated';
import { withSpring, withTiming, withRepeat, withSequence } from 'react-native-reanimated';

// Timing constants - purpose-driven durations
export const motion = {
  fast: 100,       // Instant feedback (button press, toggle)
  default: 200,    // Standard transitions (hover, menu open)
  smooth: 300,      // Layout changes (accordion, modal)
  complex: 400,    // Entrance animations (page load)
  page: 350,       // Page transitions
  stagger: 60,     // Stagger delay between list items
};

// Spring configs - organic deceleration, no bounce
export const springConfig = {
  gentle: { damping: 20, stiffness: 100 },
  default: { damping: 15, stiffness: 150 },
  snappy: { damping: 12, stiffness: 200 },
  stiff: { damping: 20, stiffness: 300 },
};

// Easing curves - organic, not bouncy
export const easing = {
  easeInOut: Easing.inOut(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeIn: Easing.in(Easing.ease),
  // Custom cubic beziers for organic feel
  easeOutQuart: Easing.bezier(0.25, 1, 0.5, 1),
  easeOutExpo: Easing.bezier(0.16, 1, 0.3, 1),
  easeOutQuint: Easing.bezier(0.22, 1, 0.36, 1),
};

// Stagger helper - returns delay for list items
export function getStaggerDelay(index: number, baseDelay = 60): number {
  'worklet';
  return index * baseDelay;
}

// Spring transition helper
export function withSpringTransition(spring = springConfig.default) {
  'worklet';
  return { type: 'spring', ...spring };
}

// Timing transition helper
export function withTimingTransition(timing = motion.default, easingFn = easing.easeOut) {
  'worklet';
  return { type: 'timing', duration: timing, easing: easingFn };
}

// Animation presets - entrance animations

// Slide up with fade - standard entrance
export function slideUpIn(delay = 0) {
  'worklet';
  return {
    opacity: withTiming(1, { duration: motion.complex, easing: easing.easeOut }),
    translateY: withSpring(0, springConfig.default),
  };
}

// Fade in - simple, fast
export function fadeIn(delay = 0) {
  'worklet';
  return {
    opacity: withTiming(1, { duration: motion.default, delay, easing: easing.easeOut }),
  };
}

// Scale in - for emphasis moments
export function scaleIn(delay = 0) {
  'worklet';
  return {
    opacity: withTiming(1, { duration: motion.default, delay }),
    scale: withSpring(1, springConfig.snappy),
  };
}

// Press feedback - scale down on press
export function pressFeedback() {
  'worklet';
  return {
    transform: [{ scale: withTiming(0.97, { duration: motion.fast }) }],
  };
}

// Shimmer animation - subtle, not distracting
export function shimmerAnimation() {
  'worklet';
  return {
    opacity: withRepeat(
      withSequence(
        withTiming(0.8, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1,
      true
    ),
  };
}

// Card hover lift - for interactive cards
export function cardLift() {
  'worklet';
  return {
    translateY: withSpring(-2, springConfig.gentle),
  };
}

// Success pulse - gentle confirmation
export function successPulse() {
  'worklet';
  return {
    transform: [{ scale: withSequence(
      withTiming(1.02, { duration: 150, easing: easing.easeOutQuart }),
      withTiming(1, { duration: 150, easing: easing.easeOut })
    ) }],
  };
}

// Reduced motion alternatives - respect accessibility
export function instantIn() {
  'worklet';
  return {
    opacity: 1,
    transform: [{ scale: 1 }],
  };
}

export function instantOut() {
  'worklet';
  return {
    opacity: 0,
    transform: [{ scale: 0.98 }],
  };
}