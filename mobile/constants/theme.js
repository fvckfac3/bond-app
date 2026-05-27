// BOND App Theme - Refined with Design System
// Built following: animation-patterns, shadows, polish, mobile-design, ui-ux-patterns

export const colors = {
  // Core palette - warm romantic theme
  primary: '#3D1A4F',      // Deep Plum - Headings, primary buttons
  accent: '#C2607A',       // Rose - CTAs, highlights, interactive
  blush: '#F4C6CC',        // Blush - Backgrounds, cards
  gold: '#C9933C',         // Gold - Achievement badges, premium
  teal: '#1E8C8C',         // Teal - Positive insights, success states

  // Neutrals - warm-tinted
  white: '#FFFFFF',
  black: '#1A1A1A',
  gray: '#6B7280',
  grayWarm: '#8B7B8B',     // Warm gray for subtle text
  lightGray: '#E8E4E6',    // Warm light gray
  background: '#FAFAFA',
  surface: '#FDF9FA',       // Slightly warm white

  // Semantic
  error: '#D94F4F',         // Softer red (not harsh)
  errorLight: '#FDEAEA',
  success: '#1E8C8C',       // Same as teal
  successLight: '#E6F4F4',
  warning: '#D4933C',
  warningLight: '#FEF3E2',

  // Shadows - tinted to match warm background
  shadowColor: '#3D1A4F',
};

export const fonts = {
  heading: 'System',
  body: 'System',
};

// Spacing - 8pt grid system
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius - limited options for consistency
export const borderRadius = {
  xs: 4,      // Small badges, chips
  sm: 8,      // Buttons, inputs
  md: 12,     // Cards, modals
  lg: 16,     // Large cards
  xl: 20,     // Hero cards
  round: 9999, // Pills, avatars
};

// Typography scale - for mobile readability
export const typography = {
  // Display - for hero text
  display: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  // Headings
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  },
  h4: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  // Body
  body: {
    fontSize: 16,
    lineHeight: 24,        // 1.5 ratio for readability
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
};

// Shadow scale - layered for depth
export const shadows = {
  // Subtle - for cards at rest
  xs: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  // Medium - for cards on hover/focus
  md: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  // Large - for floating elements
  lg: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  // Glow effect for accent elements
  glow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Animation timing - purposeful, not decorative
export const motion = {
  // Quick feedback
  fast: 100,
  // Standard transitions
  default: 200,
  // Smooth state changes
  smooth: 300,
  // Complex animations
  complex: 400,
  // Page transitions
  page: 350,
  // Stagger delay between list items
  stagger: 60,
};

// Easing curves - organic, not bouncy
export const easing = {
  // Smooth deceleration - enter animations
  easeOut: 'cubic-bezier(0.25, 1, 0.5, 1)',
  // Confident, decisive
  easeOutExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  // Quick snap
  easeOutQuad: 'cubic-bezier(0.25, 1, 0.5, 1)',
};

// Touch targets - mobile accessibility minimums
export const touchTargets = {
  minimum: 44,
  recommended: 48,
  comfortable: 56,
};