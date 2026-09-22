import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { colors, spacing } from '../../constants/theme';
import ScaleButton from '../../components/animated/ScaleButton';

export default function SubscriptionCancelScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[colors.blush, colors.white]} style={styles.gradient}>
        <View style={styles.content}>
          <MotiView
            from={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
          >
            <Text style={styles.emoji}>😔</Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200 }}
          >
            <Text style={styles.title}>Checkout Cancelled</Text>
            <Text style={styles.subtitle}>
              No worries! You can upgrade to premium anytime from your profile.
            </Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 400 }}
            style={styles.reminder}
          >
            <Text style={styles.reminderTitle}>Free Tier Includes:</Text>
            <View style={styles.reminderRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.reminderText}>1 assessment per month</Text>
            </View>
            <View style={styles.reminderRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.reminderText}>5 AI insights</Text>
            </View>
            <View style={styles.reminderRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.reminderText}>Basic features</Text>
            </View>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 600 }}
            style={styles.buttons}
          >
            <ScaleButton
              onPress={() => router.push('/subscription/plans')}
              style={{ marginBottom: spacing.md }}
            >
              <View style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </View>
            </ScaleButton>

            <ScaleButton onPress={() => router.push('/(tabs)/dashboard')}>
              <View style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Back to App</Text>
              </View>
            </ScaleButton>
          </MotiView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  reminder: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bullet: {
    fontSize: 16,
    color: colors.accent,
    marginRight: spacing.sm,
  },
  reminderText: {
    fontSize: 16,
    color: colors.gray,
  },
  buttons: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
});
