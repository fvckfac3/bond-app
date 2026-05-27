import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { colors, spacing } from '../../constants/theme';
import ScaleButton from '../animated/ScaleButton';
import subscriptionService, { SubscriptionPackage } from '../../services/subscription';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  packages: SubscriptionPackage[];
  onSuccess?: () => void;
}

export default function PaywallModal({
  visible,
  onClose,
  packages,
  onSuccess,
}: PaywallModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>('premium_annual');
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const session = await subscriptionService.createCheckoutSession(selectedPackage);

      if (session?.url) {
        // Open Stripe checkout in browser
        const supported = await Linking.canOpenURL(session.url);
        if (supported) {
          await Linking.openURL(session.url);
          onClose();
          if (onSuccess) onSuccess();
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthlyPackage = packages.find(p => p.id === 'premium_monthly');
  const annualPackage = packages.find(p => p.id === 'premium_annual');

  if (!monthlyPackage || !annualPackage) {
    return null;
  }

  const savings = Math.round(
    (1 - annualPackage.amount / (monthlyPackage.amount * 12)) * 100
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <LinearGradient colors={[colors.blush, colors.white]} style={styles.container}>
        <ScrollView>
          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.header}
          >
            <Text style={styles.emoji}>💜</Text>
            <Text style={styles.title}>Upgrade to Premium</Text>
            <Text style={styles.subtitle}>
              Unlock unlimited assessments, AI insights, and exclusive features
            </Text>
          </MotiView>

          {/* Trial Badge */}
          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 200 }}
            style={styles.trialBadge}
          >
            <Text style={styles.trialText}>✨ 7-Day Free Trial</Text>
          </MotiView>

          {/* Pricing Options */}
          <View style={styles.packagesContainer}>
            {/* Annual Plan */}
            <MotiView
              from={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', delay: 300 }}
            >
              <ScaleButton
                onPress={() => setSelectedPackage('premium_annual')}
                style={{ marginBottom: spacing.md }}
              >
                <View
                  style={[
                    styles.packageCard,
                    selectedPackage === 'premium_annual' && styles.selectedCard,
                  ]}
                >
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>SAVE {savings}%</Text>
                  </View>
                  <View style={styles.checkmark}>
                    {selectedPackage === 'premium_annual' && (
                      <Text style={styles.checkmarkText}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.packageName}>Annual</Text>
                  <Text style={styles.packagePrice}>
                    ${annualPackage.amount}
                    <Text style={styles.packageInterval}>/year</Text>
                  </Text>
                  <Text style={styles.packageEquivalent}>
                    ${(annualPackage.amount / 12).toFixed(2)}/month
                  </Text>
                </View>
              </ScaleButton>
            </MotiView>

            {/* Monthly Plan */}
            <MotiView
              from={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', delay: 400 }}
            >
              <ScaleButton onPress={() => setSelectedPackage('premium_monthly')}>
                <View
                  style={[
                    styles.packageCard,
                    selectedPackage === 'premium_monthly' && styles.selectedCard,
                  ]}
                >
                  <View style={styles.checkmark}>
                    {selectedPackage === 'premium_monthly' && (
                      <Text style={styles.checkmarkText}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.packageName}>Monthly</Text>
                  <Text style={styles.packagePrice}>
                    ${monthlyPackage.amount}
                    <Text style={styles.packageInterval}>/month</Text>
                  </Text>
                  <Text style={styles.packageEquivalent}>Billed monthly</Text>
                </View>
              </ScaleButton>
            </MotiView>
          </View>

          {/* Features List */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 500 }}
            style={styles.featuresContainer}
          >
            <Text style={styles.featuresTitle}>Premium includes:</Text>
            {annualPackage.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </MotiView>

          {/* CTA Button */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 600 }}
            style={styles.ctaContainer}
          >
            <ScaleButton onPress={handleUpgrade} disabled={loading}>
              <View style={styles.ctaButton}>
                <Text style={styles.ctaText}>
                  {loading ? 'Loading...' : 'Start Free Trial'}
                </Text>
              </View>
            </ScaleButton>
            <Text style={styles.disclaimer}>
              Cancel anytime during trial. No charges until trial ends.
            </Text>
          </MotiView>

          {/* Close Button */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Maybe Later</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  trialBadge: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    alignSelf: 'center',
    marginTop: spacing.xl,
  },
  trialText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  packagesContainer: {
    padding: spacing.lg,
  },
  packageCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 3,
    borderColor: colors.lightGray,
    position: 'relative',
  },
  selectedCard: {
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  savingsBadge: {
    position: 'absolute',
    top: -12,
    right: spacing.lg,
    backgroundColor: colors.teal,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
  },
  savingsText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  checkmark: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  packageName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  packagePrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  packageInterval: {
    fontSize: 18,
    fontWeight: 'normal',
    color: colors.gray,
  },
  packageEquivalent: {
    fontSize: 14,
    color: colors.gray,
  },
  featuresContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureIcon: {
    fontSize: 20,
    color: colors.teal,
    marginRight: spacing.md,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 16,
    color: colors.primary,
    flex: 1,
  },
  ctaContainer: {
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  ctaButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
  closeButton: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: colors.gray,
    fontWeight: '600',
  },
});
