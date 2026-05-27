import { View, StyleSheet, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import FadeInView from '../../components/animated/FadeInView';
import ScaleButton from '../../components/animated/ScaleButton';
import PulseView from '../../components/animated/PulseView';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[colors.blush, colors.white, colors.background]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <PulseView duration={3000}>
            <Text style={styles.logo}>❤️</Text>
          </PulseView>
          
          <FadeInView delay={200}>
            <Text style={styles.title}>Welcome to BOND</Text>
          </FadeInView>
          
          <FadeInView delay={400}>
            <Text style={styles.subtitle}>
              A science-backed platform to deepen your connection and build a stronger relationship
            </Text>
          </FadeInView>
          
          <View style={styles.features}>
            <FadeInView delay={600}>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>📊</Text>
                <Text style={styles.featureText}>Validated Assessments</Text>
              </View>
            </FadeInView>
            
            <FadeInView delay={700}>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>❤️</Text>
                <Text style={styles.featureText}>Personalized Insights</Text>
              </View>
            </FadeInView>
            
            <FadeInView delay={800}>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>🎯</Text>
                <Text style={styles.featureText}>Track Your Growth</Text>
              </View>
            </FadeInView>
          </View>
        </View>
        
        <FadeInView delay={1000} style={styles.footer}>
          <ScaleButton 
            onPress={() => router.push('/(auth)/signup')}
            testID="get-started-btn"
          >
            <View style={styles.primaryButton}>
              <Text style={styles.buttonLabel}>Get Started</Text>
            </View>
          </ScaleButton>
          
          <Button
            mode="text"
            onPress={() => router.push('/(auth)/login')}
            labelStyle={styles.secondaryButtonLabel}
            data-testid="login-btn"
          >
            Already have an account? Log In
          </Button>
        </FadeInView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  logo: {
    fontSize: 100,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  features: {
    width: '100%',
    marginTop: spacing.xl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  featureText: {
    fontSize: 17,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  secondaryButtonLabel: {
    color: colors.primary,
    fontSize: 15,
  },
});