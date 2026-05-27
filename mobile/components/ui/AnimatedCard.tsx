// Enhanced Gradient Card with animated entrance
import { StyleProp, ViewStyle, View, Text } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, shadows } from '../../constants/theme';

interface GradientCardProps {
  children: React.ReactNode;
  gradientColors?: string[];
  style?: StyleProp<ViewStyle>;
  delay?: number;
  onPress?: () => void;
  height?: number;
}

export default function GradientCard({
  children,
  gradientColors = [colors.blush, colors.white],
  style,
  delay = 0,
  onPress,
  height,
}: GradientCardProps) {
  const content = (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 500,
        delay,
      }}
      style={[
        {
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: gradientColors[1] || colors.white,
          ...shadows.card,
        },
        height ? { height } : {},
        style,
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
        style={{ flex: 1, padding: spacing.lg }}
      >
        {children}
      </LinearGradient>
    </MotiView>
  );

  if (onPress) {
    return <TouchableWrapper onPress={onPress}>{content}</TouchableWrapper>;
  }

  return content;
}

// Touchable wrapper to avoid importing TouchableOpacity separately
import { TouchableOpacity } from 'react-native';

function TouchableWrapper({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      {children}
    </TouchableOpacity>
  );
}

// Feature Card with icon and animated checkmark
interface FeatureCardProps {
  icon: string;
  title: string;
  subtitle?: string;
  completed?: boolean;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  onPress?: () => void;
}

export function FeatureCard({
  icon,
  title,
  subtitle,
  completed = false,
  style,
  delay = 0,
  onPress,
}: FeatureCardProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{
        type: 'timing',
        duration: 400,
        delay,
      }}
      style={{ marginBottom: spacing.md }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={onPress ? 0.9 : 1}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.white,
            padding: spacing.lg,
            borderRadius: 16,
            ...shadows.soft,
          },
          style,
        ]}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: completed ? colors.teal + '20' : colors.blush,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
          }}
        >
          <Text style={{ fontSize: 24 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.primary,
              marginBottom: 2,
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                fontSize: 13,
                color: colors.gray,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {completed && (
          <MotiView
            from={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: colors.teal,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.white, fontSize: 14 }}>✓</Text>
          </MotiView>
        )}
      </TouchableOpacity>
    </MotiView>
  );
}

// Animated Stat Card for Dashboard
interface StatCardProps {
  value: string | number;
  label: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  style?: StyleProp<ViewStyle>;
  delay?: number;
}

export function StatCard({
  value,
  label,
  icon,
  trend = 'neutral',
  style,
  delay = 0,
}: StatCardProps) {
  const trendColors = {
    up: colors.success,
    down: colors.error,
    neutral: colors.gray,
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20, scale: 0.9 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{
        type: 'spring',
        damping: 15,
        stiffness: 150,
        delay,
      }}
      style={[
        {
          backgroundColor: colors.white,
          borderRadius: 16,
          padding: spacing.lg,
          ...shadows.card,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: colors.accent,
              marginBottom: 4,
            }}
          >
            {value}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.gray,
            }}
          >
            {label}
          </Text>
        </View>
        {icon && (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: colors.blush,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 22 }}>{icon}</Text>
          </View>
        )}
      </View>
      {trend !== 'neutral' && (
        <View
          style={{
            position: 'absolute',
            top: spacing.sm,
            right: spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 12, color: trendColors[trend], marginRight: 2 }}>
            {trend === 'up' ? '↑' : '↓'}
          </Text>
          <Text style={{ fontSize: 12, color: trendColors[trend] }}>
            {trend === 'up' ? '+' : '-'}
          </Text>
        </View>
      )}
    </MotiView>
  );
}

// Animated Progress Ring
interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  color = colors.accent,
  backgroundColor = colors.lightGray,
  children,
  style,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={[{ width: size, height: size }, style]}>
      {/* Background circle */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: backgroundColor,
        }}
      />
      {/* Progress arc - simplified, would use SVG in production */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 500, delay: 300 }}
        style={{
          position: 'absolute',
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Center content */}
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {children || (
            <Text style={{ fontSize: size * 0.25, fontWeight: 'bold', color: colors.primary }}>
              {Math.round(progress * 100)}%
            </Text>
          )}
        </View>
      </MotiView>
    </View>
  );
}