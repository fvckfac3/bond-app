import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert } from 'react-native';
import { Card, Button, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import { colors, spacing } from '../../constants/theme';
import { useSubscription } from '../../hooks/useSubscription';
import PremiumBadge from '../../components/subscription/PremiumBadge';
import UpgradeButton from '../../components/subscription/UpgradeButton';
import FadeInView from '../../components/animated/FadeInView';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get subscription status
  const { isPremium, subscription, usage } = useSubscription(user?.id);

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      setUser({ ...authUser, ...userData });
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <Text style={styles.name}>{user?.name}</Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Subscription Section */}
        <FadeInView delay={200}>
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.subscriptionHeader}>
                <Text style={styles.sectionTitle}>Subscription</Text>
                {isPremium && <PremiumBadge size="small" />}
              </View>
              
              {isPremium ? (
                <>
                  <Text style={styles.subscriptionStatus}>
                    {subscription?.is_trial ? '✨ Free Trial Active' : '⭐ Premium Active'}
                  </Text>
                  <View style={styles.subscriptionDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Plan:</Text>
                      <Text style={styles.detailValue}>
                        {subscription?.plan === 'premium_annual' ? 'Annual' : 'Monthly'}
                      </Text>
                    </View>
                    {subscription?.is_trial && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Trial ends:</Text>
                        <Text style={styles.detailValue}>
                          {new Date(subscription.trial_ends_at!).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Renews:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(subscription?.expires_at!).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.subscriptionStatus}>Free Plan</Text>
                  <View style={styles.usageContainer}>
                    <View style={styles.usageRow}>
                      <Text style={styles.usageLabel}>Assessments:</Text>
                      <Text style={styles.usageValue}>
                        {usage?.assessments_remaining || 0}/{usage?.assessments_limit || 1} remaining
                      </Text>
                    </View>
                    <View style={styles.usageRow}>
                      <Text style={styles.usageLabel}>AI Insights:</Text>
                      <Text style={styles.usageValue}>
                        {usage?.ai_insights_remaining || 0}/{usage?.ai_insights_limit || 5} remaining
                      </Text>
                    </View>
                  </View>
                  <UpgradeButton 
                    onPress={() => router.push('/subscription/plans')}
                    variant="secondary"
                    text="Upgrade to Premium"
                  />
                </>
              )}
            </Card.Content>
          </Card>
        </FadeInView>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Account</Text>
          </Card.Content>
          <List.Item
            title="Edit Profile"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <List.Item
            title="Notifications"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <List.Item
            title="Privacy Settings"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Support</Text>
          </Card.Content>
          <List.Item
            title="Help Center"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <List.Item
            title="About BOND"
            left={(props) => <List.Icon {...props} icon="information" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <List.Item
            title="Terms & Privacy"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Onboarding Assessment</Text>
            <Text style={styles.onboardingText}>Get a personalized starting point for your relationship by taking the intake assessment.</Text>
            <Button
              mode="contained"
              onPress={() => router.push('/assessment/onboarding-assessment')}
              style={styles.onboardingButton}
            >
              Take onboarding assessment
            </Button>
          </Card.Content>
        </Card>

        <Text style={styles.version}>Version 1.0.0 (MVP)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: spacing.md,
    borderRadius: 16,
    elevation: 2,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.white,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: 14,
    color: colors.gray,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  logoutContainer: {
    padding: spacing.lg,
  },
  logoutButton: {
    borderColor: colors.error,
    borderRadius: 8,
  },
  version: {
    textAlign: 'center',
    color: colors.gray,
    fontSize: 12,
    marginBottom: spacing.xl,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  subscriptionStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
  },
  subscriptionDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.gray,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  usageContainer: {
    backgroundColor: colors.blush,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  usageLabel: {
    fontSize: 14,
    color: colors.primary,
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
});