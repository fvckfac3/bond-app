import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import ScaleButton from '../animated/ScaleButton';

interface UpgradeButtonProps {
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  text?: string;
}

export default function UpgradeButton({
  onPress,
  variant = 'primary',
  text = 'Upgrade to Premium',
}: UpgradeButtonProps) {
  if (variant === 'text') {
    return (
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.textButton}>{text} →</Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <ScaleButton onPress={onPress}>
        <View style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>⭐ {text}</Text>
        </View>
      </ScaleButton>
    );
  }

  return (
    <ScaleButton onPress={onPress}>
      <View style={styles.primaryButton}>
        <Text style={styles.primaryText}>⭐ {text}</Text>
      </View>
    </ScaleButton>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: colors.gold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
  },
  textButton: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
});
