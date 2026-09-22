import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { colors, spacing } from '../../constants/theme';
import subscriptionService from '../../services/subscription';
import ScaleButton from '../../components/animated/ScaleButton';

export default function SubscriptionSuccessScreen() {
  const router = useRouter();
  const { session_id } = useLocalSearchParams<{ session_id: string }>();
  const [status, setStatus] = useState<'checking' | 'success' | 'pending' | 'error'>('checking');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (session_id) {
      pollPaymentStatus();
    }
  }, [session_id]);

  const pollPaymentStatus = async () => {
    const maxAttempts = 10;
    const interval = 2000;

    for (let i = 0; i < maxAttempts; i++) {
      setAttempts(i + 1);

      const paymentStatus = await subscriptionService.getPaymentStatus(session_id);

      if (paymentStatus?.payment_status === 'paid') {
        setStatus('success');
        return;
      }

      if (paymentStatus?.status === 'expired') {
        setStatus('error');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    setStatus('pending');
  };

  if (status === 'checking') {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.gradient}>
          <View style={styles.content}>
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'timing',
                duration: 400,
                loop: true,
              }}
            >
              <ActivityIndicator size="large" color={colors.accent} />
            </MotiView>
            <Text style={styles.title}>Verifying Payment...</Text>
            <Text style={styles.subtitle}>Attempt {attempts} of 10</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (status === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.gradient}>
          <View style={styles.content}>
            <MotiView
              from={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
            >
              <Text style={styles.successEmoji}>✨</Text>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 300 }}
            >
              <Text style={styles.title}>Welcome to Premium!</Text>
              <Text style={styles.subtitle}>
                Your 7-day free trial has started. Enjoy unlimited access to all features.
              </Text>
            </MotiView>

            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 600 }}
              style={styles.features}
            >
              <View style={styles.featureRow}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.featureText}>Unlimited assessments</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.featureText}>Full AI insights</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.featureText}>All activities</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.featureText}>Priority support</Text>
              </View>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 900 }}
              style={styles.buttonContainer}
            >
              <ScaleButton onPress={() => router.push('/(tabs)/dashboard')}>
                <View style={styles.button}>
                  <Text style={styles.buttonText}>Start Exploring</Text>
                </View>
              </ScaleButton>
            </MotiView>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (status === 'pending') {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[colors.blush, colors.white]} style={styles.gradient}>
          <View style={styles.content}>
            <Text style={styles.emoji}>⏳</Text>
            <Text style={styles.title}>Payment Processing</Text>
            <Text style={styles.subtitle}>
              Your payment is being processed. This may take a few minutes. You’ll receive a
              confirmation email soon.
            </Text>
            <ScaleButton onPress={() => router.push('/(tabs)/dashboard')} style={styles.buttonContainer}>
              <View style={styles.button}>
                <Text style={styles.buttonText}>Back to App</Text>
              </View>
            </ScaleButton>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[colors.blush, colors.white]} style={styles.gradient}>
        <View style={styles.content}>
          <Text style={styles.emoji}>❌</Text>
          <Text style={styles.title}>Payment Issue</Text>
          <Text style={styles.subtitle}>
            There was a problem verifying your payment. Please contact support or try again.
          </Text>
          <ScaleButton onPress={() => router.push('/(tabs)/dashboard')} style={styles.buttonContainer}>
            <View style={styles.button}>
              <Text style={styles.buttonText}>Back to App</Text>
            </View>
          </ScaleButton>
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
  successEmoji: {
    fontSize: 100,
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
  features: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  checkmark: {
    fontSize: 24,
    color: colors.teal,
    marginRight: spacing.md,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
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
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
