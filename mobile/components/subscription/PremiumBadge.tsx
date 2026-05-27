import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../constants/theme';

interface PremiumBadgeProps {
  size?: 'small' | 'medium' | 'large';
}

export default function PremiumBadge({ size = 'medium' }: PremiumBadgeProps) {
  const sizeStyles = {
    small: { fontSize: 10, padding: 4 },
    medium: { fontSize: 12, padding: 6 },
    large: { fontSize: 14, padding: 8 },
  };

  return (
    <View style={[styles.badge, { padding: sizeStyles[size].padding }]}>
      <Text style={[styles.text, { fontSize: sizeStyles[size].fontSize }]}>
        ⭐ PREMIUM
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
  },
  text: {
    color: colors.white,
    fontWeight: '700',
  },
});
