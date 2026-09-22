import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../../constants/theme';
import { useSubscription } from '../../hooks/useSubscription';
import PaywallModal from '../../components/subscription/PaywallModal';
import FadeInView from '../../components/animated/FadeInView';
import ScaleButton from '../../components/animated/ScaleButton';

export default function SubscriptionPlansScreen() {
  const router = useRouter();
  const { packages, subscription, isPremium, loading } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.gradient}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <FadeInView style={styles.header}>
              <Text style={styles.emoji}>✨</Text>
              <Text style={styles.title}>You’re Premium!</Text>
              <Text style={styles.subtitle}>
                Thank you for supporting BOND. You have access to all features.
              </Text>
            </FadeInView>

            <FadeInView delay={200} style={styles.statusCard}>
              <Text style={styles.statusTitle}>Subscription Details</Text>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Plan:</Text>
                <Text style={styles.statusValue}>
                  {subscription?.plan === 'premium_annual' ? 'Annual' : 'Monthly'}
                </Text>
              </View>
              {subscription?.is_trial && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Trial ends:</Text>
                  <Text style={styles.statusValue}>
                    {new Date(subscription.trial_ends_at!).toLocaleDateString()}
                  </Text>
                </View>
              )}
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Renews:</Text>
                <Text style={styles.statusValue}>
                  {new Date(subscription?.expires_at!).toLocaleDateString()}
                </Text>
              </View>
            </FadeInView>

            <ScaleButton onPress={() => router.back()}>
              <View style={styles.backButton}>
                <Text style={styles.backButtonText}>Back to App</Text>
              </View>
            </ScaleButton>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PaywallModal
        visible={true}
        onClose={() => router.back()}
        packages={packages}
        onSuccess={() => router.push('/subscription/success')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statusLabel: {
    fontSize: 16,
    color: colors.gray,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  backButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
